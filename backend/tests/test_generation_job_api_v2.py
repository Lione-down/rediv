from __future__ import annotations

import sys
import unittest
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.router import include_routers
from controllers.generation_transactions import update_generation_task_state
from controllers.store import DatabaseStore, configure_store, store
from core.security import create_token
from models.base import get_session
from models.user import User
from tests.mysql_test_database import MySQLTestDatabase


class GenerationJobApiV2Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_generation_job_api_v2")
        cls.mysql_database.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    def setUp(self) -> None:
        configure_store(DatabaseStore())
        app = FastAPI()
        include_routers(app)
        self.client = TestClient(app)
        store.registration_settings["registration_mode"] = "open"
        suffix = str(uuid4())
        register = self.client.post(
            "/auth/wechat/mock",
            json={
                "openid": f"generation-job-api-{suffix}",
                "nickname": f"job-api-{suffix}",
                "avatar_url": "",
                "unionid": None,
                "invitation_code": None,
            },
        )
        self.assertEqual(200, register.status_code)
        self.user = register.json()["user"]
        token = create_token({"sub": self.user["id"], "role": "user"})
        self.headers = {"Authorization": f"Bearer {token}"}
        self.project = store.create_project(self.user["id"], f"Job API {suffix}")
        self.canvas_id = store.get_first_canvas_id(self.project["id"])
        self.node = store.create_node(
            self.project["id"],
            self.user["id"],
            "generation",
            {},
            0,
            0,
            320,
            180,
        )

    def tearDown(self) -> None:
        self.client.close()

    def _payload(
        self,
        *,
        client_request_id: str,
        prompt: str = "雨夜车站",
        model_id: str = "agnes-2.0-flash",
    ) -> dict:
        return {
            "client_request_id": client_request_id,
            "project_id": self.project["id"],
            "canvas_id": self.canvas_id,
            "node_id": self.node["id"],
            "media_type": "text",
            "provider_id": "agnes",
            "model_id": model_id,
            "input": {"prompt": prompt},
        }

    def test_submit_allows_agnes_25_flash_but_still_rejects_unknown_text_models(self) -> None:
        allowed = self.client.post(
            "/api/v2/generation-jobs",
            json=self._payload(
                client_request_id=str(uuid4()),
                model_id="agnes-2.5-flash",
            ),
            headers=self.headers,
        )
        unknown = self.client.post(
            "/api/v2/generation-jobs",
            json=self._payload(
                client_request_id=str(uuid4()),
                model_id="agnes-2.6-unknown",
            ),
            headers=self.headers,
        )

        self.assertEqual(202, allowed.status_code, allowed.text)
        self.assertEqual("agnes-2.5-flash", allowed.json()["model_id"])
        self.assertEqual(422, unknown.status_code, unknown.text)
        self.assertEqual(
            "Generation job model is not allowed for text",
            unknown.json()["detail"],
        )

    def test_submit_is_compact_idempotent_and_conflicts_on_changed_fingerprint(self) -> None:
        client_request_id = str(uuid4())
        first = self.client.post(
            "/api/v2/generation-jobs",
            json=self._payload(client_request_id=client_request_id),
            headers=self.headers,
        )
        replay = self.client.post(
            "/api/v2/generation-jobs",
            json=self._payload(client_request_id=client_request_id),
            headers=self.headers,
        )
        conflict = self.client.post(
            "/api/v2/generation-jobs",
            json=self._payload(client_request_id=client_request_id, prompt="changed"),
            headers=self.headers,
        )

        self.assertEqual(202, first.status_code, first.text)
        self.assertEqual(202, replay.status_code, replay.text)
        self.assertEqual(first.json(), replay.json())
        self.assertEqual(
            {
                "job_id",
                "project_id",
                "canvas_id",
                "node_id",
                "media_type",
                "status",
                "model_id",
                "quota_revision",
                "version",
            },
            set(first.json()),
        )
        self.assertEqual("queued", first.json()["status"])
        self.assertEqual(409, conflict.status_code, conflict.text)
        self.assertEqual("generation_job_idempotency_conflict", conflict.json()["detail"]["code"])

    def test_idempotent_replay_precedes_new_admission_checks(self) -> None:
        client_request_id = str(uuid4())
        payload = self._payload(client_request_id=client_request_id)
        first = self.client.post(
            "/api/v2/generation-jobs",
            json=payload,
            headers=self.headers,
        )
        self.assertEqual(202, first.status_code, first.text)
        with get_session() as session:
            user = session.get(User, self.user["id"])
            user.generation_status = "frozen"
            session.commit()

        replay = self.client.post(
            "/api/v2/generation-jobs",
            json=payload,
            headers=self.headers,
        )

        self.assertEqual(202, replay.status_code, replay.text)
        self.assertEqual(first.json()["job_id"], replay.json()["job_id"])

    def test_status_delta_cancel_and_retry_never_return_internal_request_data(self) -> None:
        submit = self.client.post(
            "/api/v2/generation-jobs",
            json=self._payload(client_request_id=str(uuid4())),
            headers=self.headers,
        )
        self.assertEqual(202, submit.status_code, submit.text)
        job_id = submit.json()["job_id"]

        status_response = self.client.get(
            f"/api/v2/generation-jobs/{job_id}",
            headers=self.headers,
        )
        delta_response = self.client.get(
            f"/api/v2/projects/{self.project['id']}/generation-jobs",
            params={"canvas_id": self.canvas_id, "limit": 100},
            headers=self.headers,
        )
        cancelled = self.client.post(
            f"/api/v2/generation-jobs/{job_id}/cancel",
            headers=self.headers,
        )
        retried = self.client.post(
            f"/api/v2/generation-jobs/{job_id}/retry",
            headers=self.headers,
        )

        self.assertEqual(200, status_response.status_code, status_response.text)
        self.assertEqual(200, delta_response.status_code, delta_response.text)
        self.assertEqual(200, cancelled.status_code, cancelled.text)
        self.assertEqual("cancelled", cancelled.json()["status"])
        self.assertEqual(200, retried.status_code, retried.text)
        self.assertEqual("queued", retried.json()["status"])
        self.assertGreater(retried.json()["version"], status_response.json()["version"])
        self.assertEqual([job_id], [item["job_id"] for item in delta_response.json()["items"]])
        dumped = str(
            {
                "status": status_response.json(),
                "delta": delta_response.json(),
                "cancel": cancelled.json(),
                "retry": retried.json(),
            }
        )
        for forbidden in (
            "request_parameters",
            "request_fingerprint",
            "provider_raw_response",
            "provider_request_snapshot",
        ):
            self.assertNotIn(forbidden, dumped)

    def test_exact_status_exposes_persisted_provider_progress_with_monotonic_version(self) -> None:
        submit = self.client.post(
            "/api/v2/generation-jobs",
            json=self._payload(client_request_id=str(uuid4())),
            headers=self.headers,
        )
        self.assertEqual(202, submit.status_code, submit.text)
        job_id = submit.json()["job_id"]

        update_generation_task_state(
            job_id,
            status="running",
            progress_stage="provider",
            progress_percent=47,
        )
        status_response = self.client.get(
            f"/api/v2/generation-jobs/{job_id}",
            headers=self.headers,
        )

        self.assertEqual(200, status_response.status_code, status_response.text)
        self.assertEqual(47, status_response.json()["progress"])
        self.assertEqual("provider", status_response.json()["stage"])
        self.assertEqual(2, status_response.json()["version"])
        self.assertNotIn("request_parameters", status_response.json())

    def test_delta_rejects_invalid_cursor_as_unprocessable(self) -> None:
        for cursor in ("%%%", "a"):
            with self.subTest(cursor=cursor):
                response = self.client.get(
                    f"/api/v2/projects/{self.project['id']}/generation-jobs",
                    params={"canvas_id": self.canvas_id, "after": cursor},
                    headers=self.headers,
                )

                self.assertEqual(422, response.status_code, response.text)
                self.assertEqual("Invalid generation job cursor", response.json()["detail"])

    def test_submit_rejects_model_outside_media_capability_authority(self) -> None:
        payload = self._payload(client_request_id=str(uuid4()))
        payload["media_type"] = "image"

        response = self.client.post(
            "/api/v2/generation-jobs",
            json=payload,
            headers=self.headers,
        )

        self.assertEqual(422, response.status_code, response.text)
        self.assertEqual(
            "Generation job model is not allowed for image",
            response.json()["detail"],
        )

    def test_submit_accepts_compact_image_and_video_authoring_inputs(self) -> None:
        cases = (
            {
                "media_type": "image",
                "model_id": "agnes-image-2.1-flash",
                "input": {
                    "prompt": "雨夜车站",
                    "image_ids": [],
                    "size": "1K",
                    "aspect_ratio": "1:1",
                    "output_count": 1,
                },
            },
            {
                "media_type": "video",
                "model_id": "agnes-video-v2.0",
                "input": {
                    "prompt": "雨夜车站",
                    "image_ids": [],
                    "aspect_ratio": "16:9",
                    "resolution": "720p",
                    "reference_mode": "text-to-video",
                    "duration_seconds": 5,
                },
            },
        )

        for case in cases:
            with self.subTest(media_type=case["media_type"]):
                payload = self._payload(client_request_id=str(uuid4()))
                payload.update(case)
                response = self.client.post(
                    "/api/v2/generation-jobs",
                    json=payload,
                    headers=self.headers,
                )

                self.assertEqual(202, response.status_code, response.text)
                self.assertEqual(case["media_type"], response.json()["media_type"])
                self.assertNotIn("generation_task", response.json())

    def test_compact_media_submit_rejects_foreign_project_asset_before_job_mutation(self) -> None:
        foreign_project = store.create_project(self.user["id"], "Foreign project")
        foreign_canvas_id = store.get_first_canvas_id(foreign_project["id"])
        foreign_asset = store.create_asset(
            self.user["id"],
            "image",
            "https://assets.example.test/foreign.png",
            None,
            project_id=foreign_project["id"],
            origin_canvas_id=foreign_canvas_id,
        )
        _, before_total = store.list_generation_tasks(
            self.user["id"],
            media_type="image",
        )
        payload = self._payload(client_request_id=str(uuid4()))
        payload.update({
            "media_type": "image",
            "model_id": "agnes-image-2.1-flash",
            "input": {
                "prompt": "雨夜车站",
                "image_ids": [foreign_asset["id"]],
                "size": "1K",
                "aspect_ratio": "1:1",
                "output_count": 1,
            },
        })

        response = self.client.post(
            "/api/v2/generation-jobs",
            json=payload,
            headers=self.headers,
        )
        _, after_total = store.list_generation_tasks(
            self.user["id"],
            media_type="image",
        )

        self.assertEqual(403, response.status_code, response.text)
        self.assertEqual(before_total, after_total)

    def test_cinematic_lineage_is_compact_and_exactly_scoped_to_project_canvas_node(self) -> None:
        task = store.create_generation_task(
            self.user["id"],
            "video",
            "agnes",
            "agnes-video-1",
            project_id=self.project["id"],
            origin_canvas_id=self.canvas_id,
            canvas_node_id=self.node["id"],
            request_parameters={
                "prompt": "must stay backend-owned",
                "provider_payload": {"secret-shaped": "must-not-return"},
                "cinematic_skill": {
                    "canonical_request": {
                        "references": [
                            {"node_id": self.node["id"], "source_revision": "revision-1"},
                        ],
                    },
                },
            },
            status="succeeded",
        )
        path = (
            f"/api/v2/projects/{self.project['id']}/canvases/{self.canvas_id}"
            f"/nodes/{self.node['id']}/generation-jobs/{task['id']}/cinematic-lineage"
        )

        response = self.client.get(path, headers=self.headers)
        wrong_node = self.client.get(
            path.replace(self.node["id"], "same-user-foreign-node"),
            headers=self.headers,
        )

        self.assertEqual(200, response.status_code, response.text)
        self.assertEqual(
            {
                "job_id",
                "project_id",
                "canvas_id",
                "node_id",
                "cinematic_skill",
                "version",
            },
            set(response.json()),
        )
        self.assertNotIn("prompt", str(response.json()))
        self.assertNotIn("provider_payload", str(response.json()))
        self.assertIn("canonical_request", response.json()["cinematic_skill"])
        self.assertIn(wrong_node.status_code, {403, 404})

    def test_client_request_recovery_returns_only_the_exact_bound_job(self) -> None:
        client_request_id = str(uuid4())
        submitted = self.client.post(
            "/api/v2/generation-jobs",
            json=self._payload(client_request_id=client_request_id),
            headers=self.headers,
        )
        self.assertEqual(202, submitted.status_code, submitted.text)
        path = (
            f"/api/v2/projects/{self.project['id']}/canvases/{self.canvas_id}"
            f"/nodes/{self.node['id']}/generation-jobs/by-client-request/{client_request_id}"
        )

        recovered = self.client.get(path, headers=self.headers)
        wrong_node = self.client.get(
            path.replace(self.node["id"], "same-user-foreign-node"),
            headers=self.headers,
        )

        self.assertEqual(200, recovered.status_code, recovered.text)
        self.assertEqual(submitted.json()["job_id"], recovered.json()["job_id"])
        self.assertEqual(submitted.json()["project_id"], recovered.json()["project_id"])
        self.assertEqual(submitted.json()["canvas_id"], recovered.json()["canvas_id"])
        self.assertEqual(submitted.json()["node_id"], recovered.json()["node_id"])
        self.assertIn(wrong_node.status_code, {403, 404})


if __name__ == "__main__":
    unittest.main()
