from __future__ import annotations

import json
import sys
import unittest
from copy import deepcopy
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from models.asset import Asset
from models.base import get_session
from tests.workflow_template_capture_preflight_support import (
    WorkflowTemplateCapturePreflightSupport,
)


class WorkflowTemplateCapturePreflightTestCase(
    WorkflowTemplateCapturePreflightSupport
):
    def test_capture_promotes_assets_strips_runtime_state_and_is_deterministic(self) -> None:
        before = self._side_effect_counts()
        template_id = self._template_id("deterministic-capture")

        first = self._capture(template_id=template_id)
        second = self._capture(template_id=template_id)

        self.assertEqual(200, first.status_code, first.text)
        self.assertEqual(first.json(), second.json())
        payload = first.json()
        manifest = payload["manifest"]
        self.assertEqual("draft", manifest["lifecycle"])
        self.assertEqual("private", manifest["scope"])
        self.assertEqual(
            ["node-001", "node-002"],
            [node["local_id"] for node in manifest["graph"]["nodes"]],
        )
        self.assertEqual(
            "connection-001",
            manifest["graph"]["connections"][0]["local_id"],
        )
        self.assertEqual(
            ["reference_image"],
            [slot["slot_id"] for slot in manifest["asset_slots"]],
        )
        serialized_manifest = json.dumps(manifest, ensure_ascii=False).lower()
        for forbidden in (
            self.asset["id"].lower(),
            "job-runtime-only",
            "provider-task-runtime-only",
            "https://provider.example.test/result.png",
            "quota-ledger-runtime-only",
            "data:image/png;base64",
        ):
            self.assertNotIn(forbidden, serialized_manifest)
        self.assertEqual(
            [
                {
                    "slot_id": "reference_image",
                    "asset_id": self.asset["id"],
                    "source_revision": payload["binding_candidates"][0][
                        "source_revision"
                    ],
                }
            ],
            payload["binding_candidates"],
        )
        self.assertRegex(
            payload["binding_candidates"][0]["source_revision"],
            r"^[0-9a-f]{64}$",
        )
        self.assertEqual(before, self._side_effect_counts())

    def test_capture_fails_closed_for_missing_promotion_or_unknown_field(self) -> None:
        before = self._side_effect_counts()
        missing = self._capture(asset_promotions=[])

        self._replace_asset_node_content(
            {
                "asset_id": self.asset["id"],
                "unreviewed_runtime_extension": "must-fail-closed",
            }
        )
        unknown = self._capture()

        self.assertEqual(422, missing.status_code, missing.text)
        self.assertEqual(
            "workflow_template_asset_promotion_required",
            missing.json()["detail"]["code"],
        )
        self.assertEqual(422, unknown.status_code, unknown.text)
        self.assertEqual(
            "workflow_template_field_unclassified",
            unknown.json()["detail"]["code"],
        )
        self.assertNotIn("must-fail-closed", unknown.text)
        self.assertEqual(before, self._side_effect_counts())

    def test_preflight_success_is_deterministic_and_side_effect_free(self) -> None:
        captured = self._capture().json()
        template_id = captured["manifest"]["template_id"]
        created = self.client.post(
            "/api/workflow-templates",
            json={"manifest": captured["manifest"]},
            headers=self.headers,
        )
        self.assertEqual(201, created.status_code, created.text)
        before = self._side_effect_counts()
        request = self._preflight_request(captured)

        first = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/preflight",
            json=request,
            headers=self.headers,
        )
        second = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/preflight",
            json=deepcopy(request),
            headers=self.headers,
        )

        self.assertEqual(200, first.status_code, first.text)
        self.assertEqual(first.json(), second.json())
        result = first.json()
        self.assertTrue(result["executable"])
        self.assertEqual([], result["errors"])
        self.assertEqual(7, result["capability_snapshot"]["version"])
        self.assertEqual(
            {"text": 0, "image": 2, "video": 0},
            result["quota_estimate"],
        )
        self.assertEqual("requires_confirmation", result["cost_class"])
        self.assertRegex(result["fingerprint"], r"^[0-9a-f]{64}$")
        self.assertEqual(before, self._side_effect_counts())

    def test_preflight_uses_frozen_failure_order_for_variables_before_assets(self) -> None:
        captured = self._capture().json()
        template_id = self._persist_capture(captured)
        request = self._preflight_request(captured)
        request["variable_bindings"]["shot_count"] = "two"
        request["asset_bindings"]["reference_image"][0]["asset_id"] = self.other_asset[
            "id"
        ]

        response = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/preflight",
            json=request,
            headers=self.headers,
        )

        self.assertEqual(200, response.status_code, response.text)
        self.assertFalse(response.json()["executable"])
        self.assertEqual(
            "workflow_template_variable_type_invalid",
            response.json()["errors"][0]["code"],
        )

    def test_preflight_rejects_foreign_inactive_or_stale_asset_without_disclosure(self) -> None:
        captured = self._capture().json()
        template_id = self._persist_capture(captured)
        request = self._preflight_request(captured)
        request["asset_bindings"]["reference_image"][0]["asset_id"] = self.other_asset[
            "id"
        ]
        foreign = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/preflight",
            json=request,
            headers=self.headers,
        )
        request = self._preflight_request(captured)
        request["asset_bindings"]["reference_image"][0]["source_revision"] = "0" * 64
        stale = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/preflight",
            json=request,
            headers=self.headers,
        )
        with get_session() as session:
            asset = session.get(Asset, self.asset["id"])
            asset.status = "hidden"
            session.commit()
        inactive = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/preflight",
            json=self._preflight_request(captured),
            headers=self.headers,
        )

        self.assertEqual(200, foreign.status_code, foreign.text)
        self.assertEqual(
            "workflow_template_asset_unavailable",
            foreign.json()["errors"][0]["code"],
        )
        self.assertNotIn(self.other_user["id"], foreign.text)
        self.assertNotIn(self.other_project["id"], foreign.text)
        self.assertEqual(200, stale.status_code, stale.text)
        self.assertEqual(
            "workflow_template_asset_revision_stale",
            stale.json()["errors"][0]["code"],
        )
        self.assertEqual(200, inactive.status_code, inactive.text)
        self.assertEqual(
            "workflow_template_asset_unavailable",
            inactive.json()["errors"][0]["code"],
        )

    def test_preflight_graph_capability_quota_and_cost_stages_fail_closed(self) -> None:
        captured = self._capture().json()
        invalid_port = deepcopy(captured["manifest"])
        invalid_port["template_id"] = self._template_id("invalid-port")
        invalid_port["graph"]["connections"][0]["target_port"] = "unknown-port"
        graph_id = self._persist_manifest(invalid_port)
        graph_result = self.client.post(
            f"/api/workflow-templates/{graph_id}/versions/1/preflight",
            json=self._preflight_request({**captured, "manifest": invalid_port}),
            headers=self.headers,
        )

        over_capacity = deepcopy(captured["manifest"])
        over_capacity["template_id"] = self._template_id("over-capacity")
        base_connection = over_capacity["graph"]["connections"][0]
        over_capacity["graph"]["connections"] = [
            {**base_connection, "local_id": f"connection-{index:03d}"}
            for index in range(1, 11)
        ]
        capacity_id = self._persist_manifest(over_capacity)
        capacity_result = self.client.post(
            f"/api/workflow-templates/{capacity_id}/versions/1/preflight",
            json=self._preflight_request({**captured, "manifest": over_capacity}),
            headers=self.headers,
        )

        cyclic = deepcopy(captured["manifest"])
        cyclic["template_id"] = self._template_id("cycle")
        cyclic["graph"]["connections"].append(
            {
                "local_id": "connection-002",
                "source_node_local_id": "node-002",
                "source_port": "out",
                "target_node_local_id": "node-001",
                "target_port": "in",
            }
        )
        cycle_id = self._persist_manifest(cyclic)
        cycle_result = self.client.post(
            f"/api/workflow-templates/{cycle_id}/versions/1/preflight",
            json=self._preflight_request({**captured, "manifest": cyclic}),
            headers=self.headers,
        )

        unsupported = deepcopy(captured["manifest"])
        unsupported["template_id"] = self._template_id("unsupported")
        unsupported["steps"][0]["capability_requirements"] = [
            "video.semantic_multi_reference"
        ]
        capability_id = self._persist_manifest(unsupported)
        capability_result = self.client.post(
            f"/api/workflow-templates/{capability_id}/versions/1/preflight",
            json=self._preflight_request({**captured, "manifest": unsupported}),
            headers=self.headers,
        )

        template_id = self._persist_capture(captured)
        self._set_quota(text=0, image=0, video=0)
        quota_result = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/preflight",
            json=self._preflight_request(captured),
            headers=self.headers,
        )
        self._set_quota(text=50, image=50, video=50)
        cost_request = self._preflight_request(captured)
        cost_request["cost_confirmed"] = False
        cost_result = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/preflight",
            json=cost_request,
            headers=self.headers,
        )

        self.assertEqual(
            "workflow_template_graph_port_invalid",
            graph_result.json()["errors"][0]["code"],
        )
        self.assertEqual(
            "workflow_template_graph_capacity_invalid",
            capacity_result.json()["errors"][0]["code"],
        )
        self.assertEqual(
            "workflow_template_graph_cycle",
            cycle_result.json()["errors"][0]["code"],
        )
        self.assertEqual(
            "workflow_template_capability_unsupported",
            capability_result.json()["errors"][0]["code"],
        )
        self.assertEqual(
            "workflow_template_quota_insufficient",
            quota_result.json()["errors"][0]["code"],
        )
        self.assertEqual(
            "workflow_template_cost_confirmation_required",
            cost_result.json()["errors"][0]["code"],
        )

    def test_retired_version_is_readable_but_unavailable_for_new_preflight(self) -> None:
        captured = self._capture().json()
        template_id = self._persist_capture(captured)
        published = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/publish",
            headers=self.headers,
        )
        retired = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/retire",
            headers=self.headers,
        )
        exact = self.client.get(
            f"/api/workflow-templates/{template_id}/versions/1",
            headers=self.headers,
        )
        response = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/preflight",
            json=self._preflight_request(captured),
            headers=self.headers,
        )

        self.assertEqual(200, published.status_code, published.text)
        self.assertEqual(200, retired.status_code, retired.text)
        self.assertEqual(200, exact.status_code, exact.text)
        self.assertEqual("retired", exact.json()["lifecycle"])
        self.assertEqual(409, response.status_code, response.text)
        self.assertEqual(
            "workflow_template_version_unavailable",
            response.json()["detail"]["code"],
        )

    def test_rejected_capture_and_preflight_fields_use_bounded_errors(self) -> None:
        capture_payload = self._capture_payload()
        capture_payload["provider_endpoint"] = "https://rejected.example.test/private"
        capture = self.client.post(
            (
                f"/api/projects/{self.project['id']}/canvases/{self.canvas_id}"
                "/workflow-template-captures"
            ),
            json=capture_payload,
            headers=self.headers,
        )

        captured = self._capture().json()
        template_id = self._persist_capture(captured)
        preflight_payload = self._preflight_request(captured)
        preflight_payload["runtime_token"] = "rejected-dummy-token-value"
        preflight = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/preflight",
            json=preflight_payload,
            headers=self.headers,
        )

        self.assertEqual(422, capture.status_code, capture.text)
        self.assertNotIn("provider_endpoint", capture.text)
        self.assertNotIn("rejected.example.test", capture.text)
        self.assertEqual(422, preflight.status_code, preflight.text)
        self.assertNotIn("runtime_token", preflight.text)
        self.assertNotIn("rejected-dummy-token-value", preflight.text)


if __name__ == "__main__":
    unittest.main()
