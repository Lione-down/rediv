from __future__ import annotations

import sys
import unittest
from copy import deepcopy
from pathlib import Path
from uuid import uuid4

from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from models.asset import Asset
from models.base import get_session
from models.workflow_template import (
    WorkflowTemplateDefinition,
    WorkflowTemplateVersion,
)
from services.workflow_templates.instances import stable_instance_entity_id
from tests.workflow_template_instantiation_support import (
    WorkflowTemplateInstantiationSupport,
)


class WorkflowTemplateInstanceSecurityTestCase(
    WorkflowTemplateInstantiationSupport
):
    def test_stale_or_foreign_inputs_leave_zero_partial_write(self) -> None:
        _, template_id, _, request = self._published_preflight()
        before = self._side_effect_counts()

        stale_fingerprint = self._instantiate(
            {**request, "preflight_fingerprint": "0" * 64}
        )
        stale_revision = self._instantiate(
            {**request, "client_mutation_id": f"instantiate-{uuid4()}", "base_revision": 0}
        )
        foreign = self.client.post(
            (
                f"/api/projects/{self.project['id']}/canvases/{self.canvas_id}"
                "/workflow-template-instances"
            ),
            json=request,
            headers=self.other_headers,
        )

        self.assertEqual(409, stale_fingerprint.status_code, stale_fingerprint.text)
        self.assertEqual(
            "workflow_template_preflight_stale",
            stale_fingerprint.json()["detail"]["code"],
        )
        self.assertEqual(409, stale_revision.status_code, stale_revision.text)
        self.assertEqual(
            "stale_graph_revision",
            stale_revision.json()["detail"]["code"],
        )
        self.assertEqual(404, foreign.status_code, foreign.text)
        self.assertNotIn(template_id, foreign.text)
        self.assertEqual(before, self._side_effect_counts())

    def test_asset_revision_and_version_lifecycle_drift_fail_before_write(self) -> None:
        _, template_id, _, request = self._published_preflight()
        with get_session() as session:
            asset = session.get(Asset, self.asset["id"])
            asset.status = "hidden"
            session.commit()
        before_asset_drift = self._side_effect_counts()

        stale_asset = self._instantiate(request)

        self.assertEqual(409, stale_asset.status_code, stale_asset.text)
        self.assertEqual(
            "workflow_template_preflight_stale",
            stale_asset.json()["detail"]["code"],
        )
        self.assertEqual(before_asset_drift, self._side_effect_counts())

        with get_session() as session:
            asset = session.get(Asset, self.asset["id"])
            asset.status = "active"
            session.commit()
        fresh_preflight = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/preflight",
            json={
                "project_id": self.project["id"],
                "canvas_id": self.canvas_id,
                "variable_bindings": request["variable_bindings"],
                "asset_bindings": request["asset_bindings"],
                "cost_confirmed": True,
            },
            headers=self.headers,
        )
        self.assertEqual(200, fresh_preflight.status_code, fresh_preflight.text)
        retired = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/retire",
            headers=self.headers,
        )
        self.assertEqual(200, retired.status_code, retired.text)
        before_retired = self._side_effect_counts()

        unavailable = self._instantiate(
            {
                **request,
                "client_mutation_id": f"instantiate-{uuid4()}",
                "preflight_fingerprint": fresh_preflight.json()["fingerprint"],
            }
        )

        self.assertEqual(409, unavailable.status_code, unavailable.text)
        self.assertEqual(
            "workflow_template_version_unavailable",
            unavailable.json()["detail"]["code"],
        )
        self.assertEqual(before_retired, self._side_effect_counts())

    def test_deterministic_target_id_collision_fails_before_write(self) -> None:
        _, _, _, request = self._published_preflight()
        collision_id = stable_instance_entity_id(
            template_id=request["template_id"],
            template_version=request["template_version"],
            canvas_id=self.canvas_id,
            client_mutation_id=request["client_mutation_id"],
            entity_kind="node",
            local_id="node-001",
        )
        collision = self.client.patch(
            f"/api/projects/{self.project['id']}/canvases/{self.canvas_id}/document",
            json={
                "base_revision": request["base_revision"],
                "client_mutation_id": f"collision-seed-{uuid4()}",
                "node_upserts": [
                    {
                        "id": collision_id,
                        "node_type": "text",
                        "content": {"subtype": "text"},
                        "position_x": 0,
                        "position_y": 0,
                        "width": 240,
                        "height": 140,
                        "z_index": 20,
                        "parent_node_id": None,
                        "is_locked": False,
                        "is_collapsed": False,
                    }
                ],
                "node_deletes": [],
                "connection_upserts": [],
                "connection_deletes": [],
            },
            headers=self.headers,
        )
        self.assertEqual(200, collision.status_code, collision.text)
        request = {**request, "base_revision": collision.json()["revision"]}
        before = self._side_effect_counts()

        response = self._instantiate(request)

        self.assertEqual(409, response.status_code, response.text)
        self.assertEqual(
            "workflow_template_target_id_conflict",
            response.json()["detail"]["code"],
        )
        self.assertEqual(before, self._side_effect_counts())

    def test_draft_version_is_not_instantiable_even_after_pure_preflight(self) -> None:
        captured = self._capture().json()
        template_id = self._persist_capture(captured)
        preflight_request = self._preflight_request(captured)
        preflight = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/preflight",
            json=preflight_request,
            headers=self.headers,
        )
        self.assertEqual(200, preflight.status_code, preflight.text)
        before = self._side_effect_counts()

        response = self._instantiate(
            {
                "template_id": template_id,
                "template_version": 1,
                "base_revision": self._current_revision(),
                "client_mutation_id": f"instantiate-{uuid4()}",
                "variable_bindings": preflight_request["variable_bindings"],
                "asset_bindings": preflight_request["asset_bindings"],
                "cost_confirmed": True,
                "preflight_fingerprint": preflight.json()["fingerprint"],
            }
        )

        self.assertEqual(409, response.status_code, response.text)
        self.assertEqual(
            "workflow_template_version_unavailable",
            response.json()["detail"]["code"],
        )
        self.assertEqual(before, self._side_effect_counts())

    def test_manifest_fingerprint_drift_fails_before_write(self) -> None:
        _, _, _, request = self._published_preflight()
        with get_session() as session:
            version = session.scalar(
                select(WorkflowTemplateVersion)
                .join(
                    WorkflowTemplateDefinition,
                    WorkflowTemplateDefinition.id
                    == WorkflowTemplateVersion.definition_id,
                )
                .where(
                    WorkflowTemplateDefinition.template_key == request["template_id"],
                    WorkflowTemplateVersion.version == 1,
                    WorkflowTemplateVersion.lifecycle == "published",
                )
            )
            changed = deepcopy(version.manifest)
            changed["metadata"]["name"] = "Tampered immutable version"
            version.manifest = changed
            session.commit()
        before = self._side_effect_counts()

        response = self._instantiate(request)

        self.assertEqual(409, response.status_code, response.text)
        self.assertEqual(
            "workflow_template_version_conflict",
            response.json()["detail"]["code"],
        )
        self.assertEqual(before, self._side_effect_counts())

    def test_graph_port_capacity_and_cycle_are_revalidated_before_write(self) -> None:
        captured = self._capture().json()
        base_manifest = captured["manifest"]
        invalid_manifests: list[dict] = []

        invalid_port = deepcopy(base_manifest)
        invalid_port["template_id"] = self._template_id("instantiate-invalid-port")
        invalid_port["graph"]["connections"][0]["target_port"] = "unknown-port"
        invalid_manifests.append(invalid_port)

        over_capacity = deepcopy(base_manifest)
        over_capacity["template_id"] = self._template_id("instantiate-capacity")
        connection = over_capacity["graph"]["connections"][0]
        over_capacity["graph"]["connections"] = [
            {**connection, "local_id": f"connection-{index:03d}"}
            for index in range(1, 11)
        ]
        invalid_manifests.append(over_capacity)

        cyclic = deepcopy(base_manifest)
        cyclic["template_id"] = self._template_id("instantiate-cycle")
        cyclic["graph"]["connections"].append(
            {
                "local_id": "connection-002",
                "source_node_local_id": "node-002",
                "source_port": "out",
                "target_node_local_id": "node-001",
                "target_port": "in",
            }
        )
        invalid_manifests.append(cyclic)

        for manifest in invalid_manifests:
            with self.subTest(template_id=manifest["template_id"]):
                template_id = self._persist_manifest(manifest)
                published = self.client.post(
                    f"/api/workflow-templates/{template_id}/versions/1/publish",
                    headers=self.headers,
                )
                self.assertEqual(200, published.status_code, published.text)
                before = self._side_effect_counts()

                response = self._instantiate(
                    {
                        "template_id": template_id,
                        "template_version": 1,
                        "base_revision": self._current_revision(),
                        "client_mutation_id": f"instantiate-{uuid4()}",
                        "variable_bindings": {"shot_count": 2},
                        "asset_bindings": self._preflight_request(captured)[
                            "asset_bindings"
                        ],
                        "cost_confirmed": True,
                        "preflight_fingerprint": "a" * 64,
                    }
                )

                self.assertEqual(409, response.status_code, response.text)
                self.assertEqual(
                    "workflow_template_preflight_stale",
                    response.json()["detail"]["code"],
                )
                self.assertEqual(before, self._side_effect_counts())

    def test_quota_drift_invalidates_preflight_without_mutation(self) -> None:
        _, _, _, request = self._published_preflight()
        self._set_quota(text=0, image=0, video=0)
        before = self._side_effect_counts()

        response = self._instantiate(request)

        self.assertEqual(409, response.status_code, response.text)
        self.assertEqual(
            "workflow_template_preflight_stale",
            response.json()["detail"]["code"],
        )
        self.assertEqual(before, self._side_effect_counts())

    def test_unknown_request_field_is_bounded_and_side_effect_free(self) -> None:
        _, _, _, request = self._published_preflight()
        request["runtime_token"] = "rejected-dummy-token-value"
        before = self._side_effect_counts()

        response = self._instantiate(request)

        self.assertEqual(422, response.status_code, response.text)
        self.assertEqual(
            "workflow_template_instantiate_invalid",
            response.json()["detail"]["code"],
        )
        self.assertNotIn("runtime_token", response.text)
        self.assertNotIn("rejected-dummy-token-value", response.text)
        self.assertEqual(before, self._side_effect_counts())


if __name__ == "__main__":
    unittest.main()
