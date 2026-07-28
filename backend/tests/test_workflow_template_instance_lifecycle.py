from __future__ import annotations

import unittest
from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from uuid import uuid4

from sqlalchemy import func, select

from models.base import get_session
from models.canvas_node import CanvasNode
from models.canvas_revision import CanvasRevision
from models.workflow_template import (
    WorkflowTemplateDefinition,
    WorkflowTemplateInstance,
    WorkflowTemplateVersion,
)
from models.workflow_template_lineage import (
    WorkflowTemplateBinding,
    WorkflowTemplateInstanceCommit,
)
from schemas.workflow_template_instance import WorkflowTemplateCloneRequest
from tests.workflow_template_instance_lifecycle_support import (
    WorkflowTemplateInstanceLifecycleSupport,
)


class WorkflowTemplateInstanceLifecycleTestCase(
    WorkflowTemplateInstanceLifecycleSupport
):
    def test_diff_detects_local_override_and_compatible_upgrade_preserves_it(self) -> None:
        instance, _captured = self._instance_with_v2()
        node_id, local_content = self._local_script_override(instance)
        before = self._side_effect_counts()
        instance_path = self._instance_path(
            instance["instance_id"],
            "version-diff",
        ).removesuffix("/version-diff")
        state = self.client.get(instance_path, headers=self.headers)
        diff = self.client.post(
            self._instance_path(instance["instance_id"], "version-diff"),
            json={"target_version": 2},
            headers=self.headers,
        )

        self.assertEqual(200, state.status_code, state.text)
        self.assertEqual("locally_modified", state.json()["state"])
        self.assertIn(
            "canvas.nodes.node-002.content.script_document",
            [item["path"] for item in state.json()["local_overrides"]],
        )
        self.assertEqual(200, diff.status_code, diff.text)
        preview = diff.json()
        self.assertTrue(preview["compatible"])
        self.assertEqual(1, preview["source_version"])
        self.assertEqual(2, preview["target_version"])
        self.assertIn(
            "canvas.nodes.node-002.content.script_document",
            [item["path"] for item in preview["local_overrides"]],
        )
        script_override = next(
            item
            for item in preview["local_overrides"]
            if item["path"]
            == "canvas.nodes.node-002.content.script_document"
        )
        self.assertEqual("脚本内容", script_override["display_name"])
        self.assertEqual(before, self._side_effect_counts())

        request = {
            "target_version": 2,
            "base_revision": self._current_revision(),
            "client_mutation_id": f"upgrade-{uuid4()}",
            "diff_fingerprint": preview["fingerprint"],
        }
        upgraded = self.client.post(
            self._instance_path(instance["instance_id"], "upgrade"),
            json=request,
            headers=self.headers,
        )
        replay = self.client.post(
            self._instance_path(instance["instance_id"], "upgrade"),
            json=request,
            headers=self.headers,
        )

        self.assertEqual(200, upgraded.status_code, upgraded.text)
        self.assertEqual(200, replay.status_code, replay.text)
        self.assertEqual(upgraded.json(), replay.json())
        self.assertEqual(instance["instance_id"], upgraded.json()["instance_id"])
        self.assertEqual(2, upgraded.json()["template_version"])
        self.assertEqual(set(instance["node_id_map"].values()), set(upgraded.json()["node_id_map"].values()))
        with get_session() as session:
            node = session.get(CanvasNode, node_id)
            model = session.get(WorkflowTemplateInstance, instance["instance_id"])
            self.assertEqual(local_content["script_document"], node.content["script_document"])
            version = session.get(WorkflowTemplateVersion, model.version_id)
            self.assertEqual(2, version.version)
            bindings = list(
                session.scalars(
                    select(WorkflowTemplateBinding).where(
                        WorkflowTemplateBinding.instance_id == model.id
                    )
                ).all()
            )
            self.assertTrue(all(binding.version_id == version.id for binding in bindings))

    def test_incompatible_upgrade_fails_before_canvas_or_lineage_write(self) -> None:
        instance, _captured = self._instance_with_v2()
        with get_session() as session:
            definition = session.scalar(
                select(WorkflowTemplateDefinition).where(
                    WorkflowTemplateDefinition.id
                    == session.get(
                        WorkflowTemplateInstance,
                        instance["instance_id"],
                    ).definition_id
                )
            )
            version = session.scalar(
                select(WorkflowTemplateVersion).where(
                    WorkflowTemplateVersion.definition_id == definition.id,
                    WorkflowTemplateVersion.version == 2,
                )
            )
            manifest = deepcopy(version.manifest)
            manifest["variables"].append(
                {
                    "key": "required_new_fact",
                    "type": "text",
                    "required": True,
                    "label": "Required new fact",
                    "max_length": 120,
                }
            )
            manifest["variables"] = [
                variable
                for variable in manifest["variables"]
                if variable["key"] != "campaign_note"
            ]
            version.manifest = manifest
            from core.workflow_template_contract import workflow_template_fingerprint
            from schemas.workflow_template import WorkflowTemplateManifest

            version.fingerprint = workflow_template_fingerprint(
                WorkflowTemplateManifest.model_validate(manifest)
            )
            session.commit()
        before = self._side_effect_counts()
        diff = self.client.post(
            self._instance_path(instance["instance_id"], "version-diff"),
            json={"target_version": 2},
            headers=self.headers,
        )
        self.assertEqual(200, diff.status_code, diff.text)
        self.assertFalse(diff.json()["compatible"])
        rejected = self.client.post(
            self._instance_path(instance["instance_id"], "upgrade"),
            json={
                "target_version": 2,
                "base_revision": self._current_revision(),
                "client_mutation_id": f"upgrade-{uuid4()}",
                "diff_fingerprint": diff.json()["fingerprint"],
            },
            headers=self.headers,
        )
        self.assertEqual(409, rejected.status_code, rejected.text)
        self.assertEqual(
            "workflow_template_upgrade_incompatible",
            rejected.json()["detail"]["code"],
        )
        self.assertEqual(before, self._side_effect_counts())

    def test_upgrade_canvas_history_undo_and_redo_reconcile_exact_version(self) -> None:
        instance, _captured = self._instance_with_v2()
        node_id, local_content = self._local_script_override(instance)
        version_one_nodes = self._instance_node_payloads(instance)
        diff = self.client.post(
            self._instance_path(instance["instance_id"], "version-diff"),
            json={"target_version": 2},
            headers=self.headers,
        )
        upgraded = self.client.post(
            self._instance_path(instance["instance_id"], "upgrade"),
            json={
                "target_version": 2,
                "base_revision": self._current_revision(),
                "client_mutation_id": f"upgrade-{uuid4()}",
                "diff_fingerprint": diff.json()["fingerprint"],
            },
            headers=self.headers,
        )
        self.assertEqual(200, upgraded.status_code, upgraded.text)
        version_two_nodes = [
            self._node_patch_payload(node)
            for node in upgraded.json()["mutation"]["node_upserts"]
        ]

        undone = self.client.patch(
            (
                f"/api/projects/{self.project['id']}/canvases/{self.canvas_id}"
                "/document"
            ),
            json={
                "base_revision": self._current_revision(),
                "client_mutation_id": f"undo-upgrade-{uuid4()}",
                "node_upserts": version_one_nodes,
                "node_deletes": [],
                "connection_upserts": [],
                "connection_deletes": [],
            },
            headers=self.headers,
        )
        self.assertEqual(200, undone.status_code, undone.text)
        with get_session() as session:
            model = session.get(
                WorkflowTemplateInstance,
                instance["instance_id"],
            )
            version = session.get(WorkflowTemplateVersion, model.version_id)
            node = session.get(CanvasNode, node_id)
            self.assertEqual(1, version.version)
            self.assertEqual(
                local_content["script_document"],
                node.content["script_document"],
            )
            self.assertTrue(
                all(
                    binding.version_id == version.id
                    for binding in session.scalars(
                        select(WorkflowTemplateBinding).where(
                            WorkflowTemplateBinding.instance_id == model.id
                        )
                    ).all()
                )
            )

        redone = self.client.patch(
            (
                f"/api/projects/{self.project['id']}/canvases/{self.canvas_id}"
                "/document"
            ),
            json={
                "base_revision": self._current_revision(),
                "client_mutation_id": f"redo-upgrade-{uuid4()}",
                "node_upserts": version_two_nodes,
                "node_deletes": [],
                "connection_upserts": [],
                "connection_deletes": [],
            },
            headers=self.headers,
        )
        self.assertEqual(200, redone.status_code, redone.text)
        with get_session() as session:
            model = session.get(
                WorkflowTemplateInstance,
                instance["instance_id"],
            )
            version = session.get(WorkflowTemplateVersion, model.version_id)
            node = session.get(CanvasNode, node_id)
            self.assertEqual(2, version.version)
            self.assertEqual(
                local_content["script_document"],
                node.content["script_document"],
            )

    def test_clone_has_isolated_stable_lineage_and_strict_replay(self) -> None:
        source, _captured = self._instance_with_v2()
        _node_id, _content = self._local_script_override(source)
        request = {
            "base_revision": self._current_revision(),
            "client_mutation_id": f"clone-{uuid4()}",
            "anchor": {"x": 1_700, "y": 300},
        }
        cloned = self.client.post(
            self._instance_path(source["instance_id"], "clone"),
            json=request,
            headers=self.headers,
        )
        replay = self.client.post(
            self._instance_path(source["instance_id"], "clone"),
            json=request,
            headers=self.headers,
        )
        conflict = self.client.post(
            self._instance_path(source["instance_id"], "clone"),
            json={
                **request,
                "anchor": {"x": 1_800, "y": 300},
            },
            headers=self.headers,
        )

        self.assertEqual(201, cloned.status_code, cloned.text)
        self.assertEqual(200, replay.status_code, replay.text)
        self.assertEqual(409, conflict.status_code, conflict.text)
        self.assertEqual(
            "mutation_id_reused",
            conflict.json()["detail"]["code"],
        )
        self.assertEqual(cloned.json(), replay.json())
        result = cloned.json()
        self.assertNotEqual(source["instance_id"], result["instance_id"])
        self.assertIn(
            "canvas.nodes.node-002.content.script_document",
            [item["path"] for item in result["local_overrides"]],
        )
        self.assertTrue(
            set(source["node_id_map"].values()).isdisjoint(
                result["node_id_map"].values()
            )
        )
        with get_session() as session:
            source_model = session.get(
                WorkflowTemplateInstance,
                source["instance_id"],
            )
            clone_model = session.get(
                WorkflowTemplateInstance,
                result["instance_id"],
            )
            self.assertEqual(source_model.version_id, clone_model.version_id)
            cloned_script = session.get(
                CanvasNode,
                result["node_id_map"]["node-002"],
            )
            self.assertEqual(
                "Local protected title",
                cloned_script.content["script_document"]["title"],
            )
            source_script = session.get(
                CanvasNode,
                source["node_id_map"]["node-002"],
            )
            source_payload = self._node_patch_payload(source_script)
            source_payload["content"]["script_document"]["title"] = (
                "Source changed independently"
            )

        source_changed = self.client.patch(
            (
                f"/api/projects/{self.project['id']}/canvases/{self.canvas_id}"
                "/document"
            ),
            json={
                "base_revision": self._current_revision(),
                "client_mutation_id": f"source-change-{uuid4()}",
                "node_upserts": [source_payload],
                "node_deletes": [],
                "connection_upserts": [],
                "connection_deletes": [],
            },
            headers=self.headers,
        )
        self.assertEqual(200, source_changed.status_code, source_changed.text)
        with get_session() as session:
            cloned_script = session.get(
                CanvasNode,
                result["node_id_map"]["node-002"],
            )
            self.assertEqual(
                "Local protected title",
                cloned_script.content["script_document"]["title"],
            )
            revision = session.scalar(
                select(CanvasRevision).where(
                    CanvasRevision.canvas_id == self.canvas_id,
                    CanvasRevision.client_mutation_id
                    == request["client_mutation_id"],
                )
            )
            session.delete(revision)
            session.commit()

        replay_after_prune = self.client.post(
            self._instance_path(source["instance_id"], "clone"),
            json=request,
            headers=self.headers,
        )
        self.assertEqual(200, replay_after_prune.status_code, replay_after_prune.text)
        self.assertEqual(result, replay_after_prune.json())

    def test_concurrent_identical_clone_creates_one_stable_instance(self) -> None:
        source, _captured = self._instance_with_v2()
        mutation_id = f"clone-concurrent-{uuid4()}"
        typed_request = WorkflowTemplateCloneRequest.model_validate(
            {
                "base_revision": self._current_revision(),
                "client_mutation_id": mutation_id,
                "anchor": {"x": 1_700, "y": 300},
            }
        )
        from controllers.workflow_template_instance_clone import clone_instance

        def submit() -> dict:
            return clone_instance(
                project_id=self.project["id"],
                canvas_id=self.canvas_id,
                instance_id=source["instance_id"],
                owner_user_id=self.user["id"],
                request=typed_request,
            )

        with ThreadPoolExecutor(max_workers=2) as executor:
            results = list(executor.map(lambda _index: submit(), range(2)))

        for result in results:
            result.pop("_is_replay", None)
        self.assertEqual(results[0], results[1])
        clone_id = results[0]["instance_id"]
        with get_session() as session:
            self.assertEqual(
                2,
                session.scalar(
                    select(func.count())
                    .select_from(WorkflowTemplateInstance)
                    .where(
                        WorkflowTemplateInstance.canvas_id == self.canvas_id
                    )
                ),
            )
            self.assertEqual(
                1,
                session.scalar(
                    select(func.count())
                    .select_from(CanvasRevision)
                    .where(
                        CanvasRevision.canvas_id == self.canvas_id,
                        CanvasRevision.client_mutation_id == mutation_id,
                    )
                ),
            )
            self.assertIsNotNone(
                session.get(WorkflowTemplateInstanceCommit, clone_id)
            )

    def test_detach_preserves_canvas_typed_content_and_blocks_future_upgrade(self) -> None:
        instance, _captured = self._instance_with_v2()
        node_id, local_content = self._local_script_override(instance)
        request = {
            "base_revision": self._current_revision(),
            "client_mutation_id": f"detach-{uuid4()}",
        }
        detached = self.client.post(
            self._instance_path(instance["instance_id"], "detach"),
            json=request,
            headers=self.headers,
        )
        replay = self.client.post(
            self._instance_path(instance["instance_id"], "detach"),
            json=request,
            headers=self.headers,
        )

        self.assertEqual(200, detached.status_code, detached.text)
        self.assertEqual(200, replay.status_code, replay.text)
        self.assertEqual(detached.json(), replay.json())
        self.assertEqual("detached", detached.json()["state"])
        with get_session() as session:
            model = session.get(
                WorkflowTemplateInstance,
                instance["instance_id"],
            )
            node = session.get(CanvasNode, node_id)
            self.assertEqual("detached", model.status)
            self.assertIsNotNone(model.detached_at)
            self.assertEqual(local_content["script_document"], node.content["script_document"])
        rejected = self.client.post(
            self._instance_path(instance["instance_id"], "version-diff"),
            json={"target_version": 2},
            headers=self.headers,
        )
        self.assertEqual(409, rejected.status_code, rejected.text)
        self.assertEqual(
            "workflow_template_instance_detached",
            rejected.json()["detail"]["code"],
        )


if __name__ == "__main__":
    unittest.main()
