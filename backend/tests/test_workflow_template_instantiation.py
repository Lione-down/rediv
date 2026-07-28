from __future__ import annotations

import sys
import unittest
from pathlib import Path
from uuid import uuid4

from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from models.asset import Asset
from models.base import get_session
from models.canvas_revision import CanvasRevision
from models.workflow_template import WorkflowTemplateInstance
from models.workflow_template_lineage import (
    WorkflowTemplateBinding,
    WorkflowTemplateInstanceStep,
)
from services.workflow_templates.portable_classifier import asset_source_revision
from tests.workflow_template_instantiation_support import (
    WorkflowTemplateInstantiationSupport,
)


class WorkflowTemplateInstantiationTestCase(
    WorkflowTemplateInstantiationSupport
):
    def test_instantiate_commits_one_canvas_revision_and_complete_lineage(self) -> None:
        captured, template_id, preflight, request = self._published_preflight()
        before = self._side_effect_counts()

        response = self._instantiate(request)

        self.assertEqual(201, response.status_code, response.text)
        result = response.json()
        self.assertEqual("instantiated", result["state"])
        self.assertEqual(template_id, result["template_id"])
        self.assertEqual(1, result["template_version"])
        self.assertEqual(preflight["fingerprint"], result["preflight_fingerprint"])
        self.assertEqual(2, len(result["node_id_map"]))
        self.assertEqual(1, len(result["connection_id_map"]))
        self.assertEqual({"reference_image", "shot_count"}, set(result["binding_id_map"]))
        self.assertEqual({"create-images"}, set(result["step_id_map"]))
        self.assertEqual(request["base_revision"] + 1, result["mutation"]["revision"])

        after = self._side_effect_counts()
        self.assertEqual(before[0] + 1, after[0])
        self.assertEqual(before[1] + 1, after[1])
        self.assertEqual(before[2] + 2, after[2])
        self.assertEqual(before[3] + 1, after[3])
        self.assertEqual(before[4] + 1, after[4])
        self.assertEqual(before[5:], after[5:])

        with get_session() as session:
            instance = session.get(WorkflowTemplateInstance, result["instance_id"])
            self.assertIsNotNone(instance)
            self.assertEqual(result["node_id_map"], instance.node_id_map)
            self.assertEqual(preflight["fingerprint"], instance.preflight_fingerprint)
            bindings = list(
                session.scalars(
                    select(WorkflowTemplateBinding).where(
                        WorkflowTemplateBinding.instance_id == result["instance_id"]
                    )
                ).all()
            )
            self.assertEqual(2, len(bindings))
            asset_binding = next(item for item in bindings if item.binding_type == "asset")
            candidate = captured["binding_candidates"][0]
            self.assertEqual(candidate["asset_id"], asset_binding.asset_id)
            self.assertEqual(candidate["source_revision"], asset_binding.source_revision)
            value_binding = next(item for item in bindings if item.binding_type == "value")
            self.assertEqual({"value": 2}, value_binding.value_json)
            step = session.scalar(
                select(WorkflowTemplateInstanceStep).where(
                    WorkflowTemplateInstanceStep.instance_id == result["instance_id"]
                )
            )
            self.assertEqual("create-images", step.step_key)
            self.assertEqual(result["node_id_map"]["node-002"], step.canvas_node_id)
            revision = session.scalar(
                select(CanvasRevision).where(
                    CanvasRevision.canvas_id == self.canvas_id,
                    CanvasRevision.client_mutation_id == request["client_mutation_id"],
                )
            )
            metadata = revision.operations["workflow_template_instantiation"]
            self.assertEqual(result["instance_id"], metadata["instance_id"])
            self.assertEqual(result["connection_id_map"], metadata["connection_id_map"])

    def test_distinct_mutations_isolate_ids_but_preserve_logical_topology(self) -> None:
        _, _, _, first_request = self._published_preflight()
        first = self._instantiate(first_request)
        self.assertEqual(201, first.status_code, first.text)
        second_request = {
            **first_request,
            "base_revision": first.json()["mutation"]["revision"],
            "client_mutation_id": f"instantiate-{uuid4()}",
            "anchor": {"x": 1_400, "y": 300},
        }

        second = self._instantiate(second_request)

        self.assertEqual(201, second.status_code, second.text)
        first_result = first.json()
        second_result = second.json()
        self.assertNotEqual(first_result["instance_id"], second_result["instance_id"])
        self.assertTrue(
            set(first_result["node_id_map"].values()).isdisjoint(
                second_result["node_id_map"].values()
            )
        )
        self.assertTrue(
            set(first_result["connection_id_map"].values()).isdisjoint(
                second_result["connection_id_map"].values()
            )
        )
        self.assertEqual(
            set(first_result["node_id_map"]),
            set(second_result["node_id_map"]),
        )
        self.assertEqual(
            set(first_result["connection_id_map"]),
            set(second_result["connection_id_map"]),
        )

    def test_multi_item_asset_slot_persists_ordered_source_revision_lineage(self) -> None:
        captured = self._capture().json()
        manifest = captured["manifest"]
        manifest["asset_slots"][0]["minimum_items"] = 2
        manifest["asset_slots"][0]["maximum_items"] = 2
        template_id = self._persist_manifest(manifest)
        published = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/publish",
            headers=self.headers,
        )
        self.assertEqual(200, published.status_code, published.text)
        second_asset = self._create_owner_asset()
        with get_session() as session:
            first_model = session.get(Asset, self.asset["id"])
            second_model = session.get(Asset, second_asset["id"])
            asset_items = [
                {
                    "asset_id": first_model.id,
                    "source_revision": asset_source_revision(first_model),
                },
                {
                    "asset_id": second_model.id,
                    "source_revision": asset_source_revision(second_model),
                },
            ]
        preflight_request = {
            "project_id": self.project["id"],
            "canvas_id": self.canvas_id,
            "variable_bindings": {"shot_count": 2},
            "asset_bindings": {"reference_image": asset_items},
            "cost_confirmed": True,
        }
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
        from models.workflow_template_lineage import WorkflowTemplateAssetBindingItem

        with get_session() as session:
            binding = session.scalar(
                select(WorkflowTemplateBinding).where(
                    WorkflowTemplateBinding.instance_id == response.json()["instance_id"],
                    WorkflowTemplateBinding.binding_type == "asset",
                )
            )
            items = list(
                session.scalars(
                    select(WorkflowTemplateAssetBindingItem)
                    .where(
                        WorkflowTemplateAssetBindingItem.binding_id == binding.id
                    )
                    .order_by(WorkflowTemplateAssetBindingItem.position)
                ).all()
            )
            self.assertEqual([0, 1], [item.position for item in items])
            self.assertEqual(
                [item["asset_id"] for item in asset_items],
                [item.asset_id for item in items],
            )
            self.assertEqual(
                [item["source_revision"] for item in asset_items],
                [item.source_revision for item in items],
            )

    def test_optional_empty_asset_slot_records_no_false_asset_binding(self) -> None:
        captured = self._capture().json()
        manifest = captured["manifest"]
        manifest["asset_slots"][0]["required"] = False
        manifest["asset_slots"][0]["minimum_items"] = 0
        template_id = self._persist_manifest(manifest)
        published = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/publish",
            headers=self.headers,
        )
        self.assertEqual(200, published.status_code, published.text)
        preflight_request = {
            "project_id": self.project["id"],
            "canvas_id": self.canvas_id,
            "variable_bindings": {"shot_count": 2},
            "asset_bindings": {"reference_image": []},
            "cost_confirmed": True,
        }
        preflight = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/preflight",
            json=preflight_request,
            headers=self.headers,
        )
        self.assertEqual(200, preflight.status_code, preflight.text)
        response = self._instantiate(
            {
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
        )

        self.assertEqual(201, response.status_code, response.text)
        self.assertEqual([], response.json()["binding_id_map"]["reference_image"])
        with get_session() as session:
            asset_bindings = list(
                session.scalars(
                    select(WorkflowTemplateBinding).where(
                        WorkflowTemplateBinding.instance_id
                        == response.json()["instance_id"],
                        WorkflowTemplateBinding.binding_type == "asset",
                    )
                ).all()
            )
            self.assertEqual([], asset_bindings)


if __name__ == "__main__":
    unittest.main()
