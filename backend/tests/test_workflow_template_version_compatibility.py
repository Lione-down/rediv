from __future__ import annotations

import json
import sys
import unittest
from copy import deepcopy
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from schemas.workflow_template import WorkflowTemplateManifest


FIXTURE_PATH = (
    Path(__file__).resolve().parents[2]
    / "ai"
    / "requirements"
    / "contracts"
    / "fixtures"
    / "workflow-template"
    / "portable-manifest.json"
)


class WorkflowTemplateVersionCompatibilityTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.source = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))

    def _compare(self, target_payload: dict):
        from services.workflow_templates.compatibility import (
            compare_workflow_template_manifests,
        )

        source = WorkflowTemplateManifest.model_validate(self.source)
        target = WorkflowTemplateManifest.model_validate(target_payload)
        return compare_workflow_template_manifests(source, target)

    def _target(self) -> dict:
        target = deepcopy(self.source)
        target["template_version"] = 2
        return target

    def test_optional_defaulted_variable_and_metadata_are_additive_compatible(self) -> None:
        target = self._target()
        target["metadata"]["description"] = "A wider non-executable description"
        target["variables"].append(
            {
                "key": "campaign_note",
                "type": "text",
                "required": False,
                "label": "Campaign note",
                "default": "",
                "max_length": 120,
            }
        )
        target["override_policy"]["allowed_fields"].append(
            "variables.campaign_note"
        )

        result = self._compare(target)

        self.assertTrue(result["compatible"])
        self.assertEqual(1, result["source_version"])
        self.assertEqual(2, result["target_version"])
        self.assertEqual(64, len(result["fingerprint"]))
        self.assertEqual(
            ["metadata", "override_policy.allowed_fields.campaign_note", "variables.campaign_note"],
            [change["path"] for change in result["changes"]],
        )
        self.assertEqual([], result["blocking_reasons"])

    def test_optional_empty_asset_slot_is_compatible_but_required_variable_is_not(self) -> None:
        optional_asset = self._target()
        optional_asset["asset_slots"].append(
            {
                "slot_id": "optional_style",
                "media_type": "image",
                "role": "style",
                "required": False,
                "minimum_items": 0,
                "maximum_items": 1,
                "revision_policy": "exact",
            }
        )
        compatible = self._compare(optional_asset)

        required_variable = self._target()
        required_variable["variables"].append(
            {
                "key": "required_new_fact",
                "type": "text",
                "required": True,
                "label": "Required new fact",
                "max_length": 120,
            }
        )
        incompatible = self._compare(required_variable)

        self.assertTrue(compatible["compatible"])
        self.assertFalse(incompatible["compatible"])
        self.assertIn(
            "required_variable_added",
            [reason["code"] for reason in incompatible["blocking_reasons"]],
        )

    def test_graph_step_lock_and_capability_changes_fail_closed_deterministically(self) -> None:
        target = self._target()
        target["graph"]["connections"][0]["target_port"] = "media"
        target["steps"][0]["capability_requirements"].append("text.new_contract")
        target["override_policy"]["locked_fields"] = ["schema_id", "security"]

        first = self._compare(target)
        second = self._compare(deepcopy(target))

        self.assertFalse(first["compatible"])
        self.assertEqual(first, second)
        self.assertEqual(
            {
                "graph_changed",
                "locked_field_removed",
                "step_changed",
            },
            {reason["code"] for reason in first["blocking_reasons"]},
        )


if __name__ == "__main__":
    unittest.main()
