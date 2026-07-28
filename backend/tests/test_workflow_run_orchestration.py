from __future__ import annotations

import asyncio
import sys
from copy import deepcopy
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from pathlib import Path
from uuid import uuid4

from sqlalchemy import func, select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from models.asset import Asset
from models.base import get_session, utc_now
from models.canvas_node import CanvasNode
from models.generation_task import GenerationTask
from models.workflow_run import WorkflowRun, WorkflowRunStep
from services.generation.provider_dispatch import ProviderDispatchResult
from tests.workflow_template_instantiation_support import (
    WorkflowTemplateInstantiationSupport,
)


class _ProviderFreeDispatcher:
    async def dispatch(self, job, persist_provider_request_id, persist_progress):
        persist_provider_request_id(f"provider-{job['id']}")
        persist_progress(100)
        return ProviderDispatchResult(
            asset_type="image",
            content_text=None,
            url=f"https://assets.example.test/{job['id']}.png",
            provider_request_id=f"provider-{job['id']}",
            source_model=job["model"],
        )


class _FailingDispatcher:
    async def dispatch(self, job, persist_provider_request_id, persist_progress):
        raise RuntimeError("provider-free workflow failure")


class WorkflowRunOrchestrationTests(WorkflowTemplateInstantiationSupport):
    def _prepare_chained_instance(self) -> dict:
        captured = self._capture().json()
        manifest = deepcopy(captured["manifest"])
        second_node = deepcopy(manifest["graph"]["nodes"][1])
        second_node["local_id"] = "node-003"
        manifest["graph"]["nodes"].append(second_node)
        manifest["steps"].append(
            {
                "step_id": "refine-image",
                "node_local_id": "node-003",
                "intent": "shot-image",
                "model_policy": "agnes-image-quality-default",
                "input_bindings": ["shot_count"],
                "depends_on": ["create-images"],
                "capability_requirements": ["image.text_or_single_image"],
            }
        )
        template_id = self._persist_manifest(manifest)
        published = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/publish",
            headers=self.headers,
        )
        self.assertEqual(200, published.status_code, published.text)
        preflight_request = self._preflight_request(captured)
        preflight = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/preflight",
            json=preflight_request,
            headers=self.headers,
        )
        self.assertEqual(200, preflight.status_code, preflight.text)
        request = {
            "template_id": template_id,
            "template_version": 1,
            "base_revision": self._current_revision(),
            "client_mutation_id": f"instantiate-{uuid4()}",
            "anchor": {"x": 900, "y": 200},
            "variable_bindings": preflight_request["variable_bindings"],
            "asset_bindings": preflight_request["asset_bindings"],
            "cost_confirmed": True,
            "preflight_fingerprint": preflight.json()["fingerprint"],
        }
        response = self._instantiate(request)
        self.assertEqual(201, response.status_code, response.text)
        instance = response.json()
        self._configure_image_node(instance["node_id_map"]["node-002"], "First step")
        self._configure_image_node(instance["node_id_map"]["node-003"], "Second step")
        return instance

    def _prepare_instance(self) -> tuple[dict, dict]:
        _captured, _template_id, _preflight, request = self._published_preflight()
        response = self._instantiate(request)
        self.assertEqual(201, response.status_code, response.text)
        instance = response.json()
        self._configure_image_node(instance["node_id_map"]["node-002"])
        return instance, request

    def _configure_image_node(self, node_id: str, prompt: str = "Create the approved shot.") -> None:
        with get_session() as session:
            node = session.get(CanvasNode, node_id)
            self.assertIsNotNone(node)
            node.content = {
                **node.content,
                "template_placeholder": False,
                "text": prompt,
                "generation_parameters": {
                    "schema_version": 1,
                    "image": {
                        "aspect_ratio": "1:1",
                        "size": "2K",
                        "output_count": 1,
                    },
                },
            }
            session.commit()

    def _run_path(self, instance_id: str, suffix: str = "") -> str:
        return (
            f"/api/projects/{self.project['id']}/canvases/{self.canvas_id}"
            f"/workflow-template-instances/{instance_id}/runs{suffix}"
        )

    def _runtime_preflight(self, instance_id: str) -> dict:
        response = self.client.post(
            self._run_path(instance_id, "/preflight"),
            json={"cost_confirmed": True},
            headers=self.headers,
        )
        self.assertEqual(200, response.status_code, response.text)
        self.assertTrue(response.json()["executable"])
        return response.json()

    def _start_run(
        self,
        instance_id: str,
        *,
        client_run_id: str | None = None,
        preflight_fingerprint: str | None = None,
    ):
        preflight = self._runtime_preflight(instance_id)
        return self.client.post(
            self._run_path(instance_id),
            json={
                "client_run_id": client_run_id or f"workflow-run-{uuid4()}",
                "preflight_fingerprint": (
                    preflight_fingerprint or preflight["fingerprint"]
                ),
                "cost_confirmed": True,
            },
            headers=self.headers,
        )

    def test_instantiate_and_reload_never_start_until_explicit_run(self) -> None:
        instance, _request = self._prepare_instance()
        with get_session() as session:
            self.assertEqual(
                0,
                session.scalar(
                    select(func.count())
                    .select_from(WorkflowRun)
                    .where(WorkflowRun.instance_id == instance["instance_id"])
                ),
            )
            self.assertEqual(
                0,
                session.scalar(
                    select(func.count())
                    .select_from(GenerationTask)
                    .where(
                        GenerationTask.origin_canvas_id == self.canvas_id,
                        GenerationTask.canvas_node_id
                        == instance["node_id_map"]["node-002"],
                    )
                ),
            )

        latest = self.client.get(
            self._run_path(instance["instance_id"], "/latest"),
            headers=self.headers,
        )
        self.assertEqual(404, latest.status_code, latest.text)

        response = self._start_run(instance["instance_id"])
        self.assertEqual(202, response.status_code, response.text)
        body = response.json()
        self.assertEqual("queued", body["status"])
        self.assertEqual(1, len(body["steps"]))
        self.assertEqual("queued", body["steps"][0]["status"])
        self.assertEqual(instance["node_id_map"]["node-002"], body["steps"][0]["node_id"])
        self.assertIsNotNone(body["steps"][0]["generation_job_id"])
        with get_session() as session:
            self.assertEqual(
                1,
                session.scalar(
                    select(func.count())
                    .select_from(WorkflowRun)
                    .where(WorkflowRun.instance_id == instance["instance_id"])
                ),
            )
            self.assertEqual(
                1,
                session.scalar(
                    select(func.count())
                    .select_from(WorkflowRunStep)
                    .join(WorkflowRun, WorkflowRun.id == WorkflowRunStep.run_id)
                    .where(WorkflowRun.instance_id == instance["instance_id"])
                ),
            )
            self.assertEqual(
                1,
                session.scalar(
                    select(func.count())
                    .select_from(GenerationTask)
                    .where(
                        GenerationTask.origin_canvas_id == self.canvas_id,
                        GenerationTask.canvas_node_id
                        == instance["node_id_map"]["node-002"],
                    )
                ),
            )

    def test_client_run_replay_is_exact_and_changed_facts_conflict(self) -> None:
        instance, _request = self._prepare_instance()
        client_run_id = f"workflow-run-{uuid4()}"
        first = self._start_run(
            instance["instance_id"],
            client_run_id=client_run_id,
        )
        self.assertEqual(202, first.status_code, first.text)
        replay = self.client.post(
            self._run_path(instance["instance_id"]),
            json={
                "client_run_id": client_run_id,
                "preflight_fingerprint": first.json()["preflight_fingerprint"],
                "cost_confirmed": True,
            },
            headers=self.headers,
        )
        self.assertEqual(200, replay.status_code, replay.text)
        self.assertEqual(first.json(), replay.json())

        changed_confirmation = self.client.post(
            self._run_path(instance["instance_id"]),
            json={
                "client_run_id": client_run_id,
                "preflight_fingerprint": first.json()["preflight_fingerprint"],
                "cost_confirmed": False,
            },
            headers=self.headers,
        )
        self.assertEqual(409, changed_confirmation.status_code, changed_confirmation.text)
        self.assertEqual(
            "workflow_run_idempotency_conflict",
            changed_confirmation.json()["detail"]["code"],
        )

        conflict = self.client.post(
            self._run_path(instance["instance_id"]),
            json={
                "client_run_id": client_run_id,
                "preflight_fingerprint": "0" * 64,
                "cost_confirmed": True,
            },
            headers=self.headers,
        )
        self.assertEqual(409, conflict.status_code, conflict.text)
        self.assertEqual(
            "workflow_run_idempotency_conflict",
            conflict.json()["detail"]["code"],
        )
        with get_session() as session:
            self.assertEqual(
                1,
                session.scalar(
                    select(func.count())
                    .select_from(WorkflowRun)
                    .where(WorkflowRun.instance_id == instance["instance_id"])
                ),
            )
            self.assertEqual(
                1,
                session.scalar(
                    select(func.count())
                    .select_from(GenerationTask)
                    .where(
                        GenerationTask.origin_canvas_id == self.canvas_id,
                        GenerationTask.canvas_node_id
                        == instance["node_id_map"]["node-002"],
                    )
                ),
            )

    def test_stale_runtime_preflight_writes_no_run_job_or_quota_side_effect(self) -> None:
        instance, _request = self._prepare_instance()
        preflight = self._runtime_preflight(instance["instance_id"])
        with get_session() as session:
            asset = session.get(Asset, self.asset["id"])
            self.assertIsNotNone(asset)
            asset.updated_at = utc_now() + timedelta(seconds=1)
            session.commit()

        response = self.client.post(
            self._run_path(instance["instance_id"]),
            json={
                "client_run_id": f"workflow-run-{uuid4()}",
                "preflight_fingerprint": preflight["fingerprint"],
                "cost_confirmed": True,
            },
            headers=self.headers,
        )
        self.assertEqual(409, response.status_code, response.text)
        self.assertEqual(
            "workflow_run_preflight_stale",
            response.json()["detail"]["code"],
        )
        with get_session() as session:
            self.assertEqual(
                0,
                session.scalar(
                    select(func.count())
                    .select_from(WorkflowRun)
                    .where(WorkflowRun.instance_id == instance["instance_id"])
                ),
            )
            self.assertEqual(
                0,
                session.scalar(
                    select(func.count())
                    .select_from(GenerationTask)
                    .where(
                        GenerationTask.origin_canvas_id == self.canvas_id,
                        GenerationTask.canvas_node_id
                        == instance["node_id_map"]["node-002"],
                    )
                ),
            )

    def test_foreign_or_malformed_start_is_bounded_and_side_effect_free(self) -> None:
        instance, _request = self._prepare_instance()
        preflight = self._runtime_preflight(instance["instance_id"])
        with get_session() as session:
            before = (
                session.scalar(select(func.count()).select_from(WorkflowRun)),
                session.scalar(select(func.count()).select_from(GenerationTask)),
            )

        foreign = self.client.post(
            self._run_path(instance["instance_id"]),
            json={
                "client_run_id": f"workflow-run-{uuid4()}",
                "preflight_fingerprint": preflight["fingerprint"],
                "cost_confirmed": True,
            },
            headers=self.other_headers,
        )
        malformed = self.client.post(
            self._run_path(instance["instance_id"]),
            json={
                "client_run_id": f"workflow-run-{uuid4()}",
                "preflight_fingerprint": preflight["fingerprint"],
                "cost_confirmed": True,
                "runtime_token": "rejected-dummy-token-value",
            },
            headers=self.headers,
        )

        self.assertEqual(404, foreign.status_code, foreign.text)
        self.assertNotIn(instance["instance_id"], foreign.text)
        self.assertEqual(422, malformed.status_code, malformed.text)
        self.assertEqual(
            "workflow_run_start_invalid",
            malformed.json()["detail"]["code"],
        )
        self.assertNotIn("runtime_token", malformed.text)
        self.assertNotIn("rejected-dummy-token-value", malformed.text)
        with get_session() as session:
            after = (
                session.scalar(select(func.count()).select_from(WorkflowRun)),
                session.scalar(select(func.count()).select_from(GenerationTask)),
            )
        self.assertEqual(before, after)

    def test_existing_job_runner_reconciles_run_to_terminal_without_browser(self) -> None:
        instance, _request = self._prepare_instance()
        response = self._start_run(instance["instance_id"])
        self.assertEqual(202, response.status_code, response.text)

        from services.generation.job_runner import GenerationJobRunner

        runner = GenerationJobRunner(
            dispatcher=_ProviderFreeDispatcher(),
            owner_id=f"workflow-run-test-{uuid4()}",
            lease_seconds=30,
            poll_interval_seconds=0.01,
        )
        for _attempt in range(8):
            self.assertTrue(asyncio.run(runner.run_once()))
            with get_session() as session:
                run = session.get(WorkflowRun, response.json()["run_id"])
                if run.status == "succeeded":
                    break

        recovered = self.client.get(
            self._run_path(
                instance["instance_id"],
                f"/{response.json()['run_id']}",
            ),
            headers=self.headers,
        )
        self.assertEqual(200, recovered.status_code, recovered.text)
        self.assertEqual("succeeded", recovered.json()["status"])
        self.assertEqual("succeeded", recovered.json()["steps"][0]["status"])
        self.assertIsNotNone(recovered.json()["steps"][0]["result_asset_id"])

    def test_cancel_uses_existing_job_cancellation_and_blocks_dispatch(self) -> None:
        instance, _request = self._prepare_instance()
        response = self._start_run(instance["instance_id"])
        self.assertEqual(202, response.status_code, response.text)
        run_id = response.json()["run_id"]
        cancel = self.client.post(
            self._run_path(instance["instance_id"], f"/{run_id}/cancel"),
            headers=self.headers,
        )
        self.assertEqual(200, cancel.status_code, cancel.text)
        self.assertEqual("cancelled", cancel.json()["status"])
        self.assertEqual("cancelled", cancel.json()["steps"][0]["status"])
        with get_session() as session:
            task = session.get(
                GenerationTask,
                cancel.json()["steps"][0]["generation_job_id"],
            )
            self.assertEqual("cancelled", task.status)

    def test_failed_dependency_blocks_descendant_without_creating_its_job(self) -> None:
        instance = self._prepare_chained_instance()
        response = self._start_run(instance["instance_id"])
        self.assertEqual(202, response.status_code, response.text)
        run_id = response.json()["run_id"]

        from services.generation.job_runner import GenerationJobRunner

        runner = GenerationJobRunner(
            dispatcher=_FailingDispatcher(),
            owner_id=f"workflow-failure-test-{uuid4()}",
            lease_seconds=30,
            poll_interval_seconds=0.01,
        )
        for _attempt in range(16):
            self.assertTrue(asyncio.run(runner.run_once()))
            recovered = self.client.get(
                self._run_path(instance["instance_id"], f"/{run_id}"),
                headers=self.headers,
            )
            self.assertEqual(200, recovered.status_code, recovered.text)
            if recovered.json()["status"] == "failed":
                break
        self.assertEqual("failed", recovered.json()["status"])
        self.assertEqual(
            ["failed", "blocked"],
            [step["status"] for step in recovered.json()["steps"]],
        )
        self.assertIsNone(recovered.json()["steps"][1]["generation_job_id"])

    def test_concurrent_identical_start_serializes_to_one_exact_run_and_job(self) -> None:
        instance, _request = self._prepare_instance()
        preflight = self._runtime_preflight(instance["instance_id"])
        client_run_id = f"workflow-run-{uuid4()}"
        payload = {
            "client_run_id": client_run_id,
            "preflight_fingerprint": preflight["fingerprint"],
            "cost_confirmed": True,
        }

        def submit():
            return self.client.post(
                self._run_path(instance["instance_id"]),
                json=payload,
                headers=self.headers,
            )

        with ThreadPoolExecutor(max_workers=2) as executor:
            responses = list(executor.map(lambda _attempt: submit(), range(2)))
        self.assertEqual([200, 202], sorted(response.status_code for response in responses))
        self.assertEqual(responses[0].json(), responses[1].json())
        with get_session() as session:
            self.assertEqual(
                1,
                session.scalar(
                    select(func.count())
                    .select_from(WorkflowRun)
                    .where(
                        WorkflowRun.instance_id == instance["instance_id"],
                        WorkflowRun.client_run_id == client_run_id,
                    )
                ),
            )
            self.assertEqual(
                1,
                session.scalar(
                    select(func.count())
                    .select_from(GenerationTask)
                    .where(
                        GenerationTask.canvas_node_id
                        == instance["node_id_map"]["node-002"]
                    )
                ),
            )

    def test_dependency_completion_releases_one_downstream_job_after_restart(self) -> None:
        instance = self._prepare_chained_instance()
        response = self._start_run(instance["instance_id"])
        self.assertEqual(202, response.status_code, response.text)
        run_id = response.json()["run_id"]
        self.assertEqual(
            ["queued", "draft"],
            [step["status"] for step in response.json()["steps"]],
        )

        from services.generation.job_runner import GenerationJobRunner
        from services.workflow_templates.runs import reconcile_next_workflow_run

        runner = GenerationJobRunner(
            dispatcher=_ProviderFreeDispatcher(),
            owner_id=f"workflow-chain-test-{uuid4()}",
            lease_seconds=30,
            poll_interval_seconds=0.01,
        )
        for _attempt in range(16):
            self.assertTrue(asyncio.run(runner.run_once()))
            recovered = self.client.get(
                self._run_path(instance["instance_id"], f"/{run_id}"),
                headers=self.headers,
            )
            self.assertEqual(200, recovered.status_code, recovered.text)
            if recovered.json()["status"] == "succeeded":
                break
        self.assertEqual("succeeded", recovered.json()["status"])
        self.assertEqual(
            ["succeeded", "succeeded"],
            [step["status"] for step in recovered.json()["steps"]],
        )
        self.assertFalse(reconcile_next_workflow_run())
        with get_session() as session:
            self.assertEqual(
                2,
                session.scalar(
                    select(func.count())
                    .select_from(GenerationTask)
                    .where(
                        GenerationTask.origin_canvas_id == self.canvas_id,
                        GenerationTask.canvas_node_id.in_(
                            [
                                instance["node_id_map"]["node-002"],
                                instance["node_id_map"]["node-003"],
                            ]
                        ),
                    )
                ),
            )
            first_task = session.scalar(
                select(GenerationTask).where(
                    GenerationTask.canvas_node_id
                    == instance["node_id_map"]["node-002"]
                )
            )
            second_task = session.scalar(
                select(GenerationTask).where(
                    GenerationTask.canvas_node_id
                    == instance["node_id_map"]["node-003"]
                )
            )
            first_result = session.get(Asset, first_task.result_asset_id)
            self.assertEqual(
                [first_result.url],
                second_task.request_parameters["input"]["provider_request"]["request"][
                    "extra_body"
                ]["image"],
            )
