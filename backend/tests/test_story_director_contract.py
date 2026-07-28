from __future__ import annotations

import importlib
import unittest
from types import ModuleType

from pydantic import ValidationError


REVISION = "b" * 64


def production_document() -> dict[str, object]:
    shared_record = {
        "editable_fields": {},
        "locked_fields": {},
        "generation_revision": 1,
        "source_ids": ["story-event-1"],
        "validation_state": "valid",
    }
    return {
        "schema_id": "revid.story-production",
        "schema_version": 1,
        "skill_id": "revid.story-director",
        "skill_version": 1,
        "source_node_id": "script-node-1",
        "source_revision": REVISION,
        "model_id": "allowed-text-model",
        "story": {
            "summary": "摄影师在雨夜车站寻找失踪的胶卷。",
            "events": [{"event_id": "story-event-1", "summary": "摄影师进入车站。"}],
        },
        "references": [{
            "reference_id": "reference-photographer",
            "asset_id": "role-photographer",
            "node_id": "image-node-1",
            "source_revision": REVISION,
            "role": "identity",
            "instruction": "Preserve the photographer identity.",
            "must_not_transfer": ["wardrobe", "scene"],
            "order": 0,
        }],
        "continuity": {
            "canonical_revision": 1,
            "identity_locks": ["role-photographer"],
            "accepted_take_id": None,
            "accepted_result_node_id": None,
            "accepted_result_revision": None,
            "observed_end_state": None,
        },
        "assets": {
            "roles": [{
                "asset_id": "role-photographer",
                "name": "摄影师",
                "description": "穿深灰风衣的年轻摄影师",
                "image_prompt": "深灰风衣摄影师，雨夜电影光",
                **shared_record,
            }],
            "scenes": [{
                "asset_id": "scene-station",
                "name": "雨夜车站",
                "description": "潮湿的老车站站台",
                "image_prompt": "雨夜老车站，冷暖对比光",
                **shared_record,
            }],
            "props": [{
                "asset_id": "prop-film",
                "name": "胶卷",
                "description": "装在银色盒中的旧胶卷",
                "image_prompt": "银色胶卷盒，微距电影光",
                **shared_record,
            }],
        },
        "shots": [{
            "shot_id": "shot-1",
            "shot_number": 1,
            "duration_seconds": 5,
            "visual_description": "摄影师穿过雨幕进入车站。",
            "framing": "medium",
            "scene_id": "scene-station",
            "role_ids": ["role-photographer"],
            "prop_ids": ["prop-film"],
            "dialogue": "",
            "music_sfx": "雨声与远处列车声",
            "camera_movement": "缓慢推进",
            "image_prompt": "摄影师进入雨夜车站，中景",
            "video_prompt": "中景缓慢推进，摄影师穿过雨幕进入车站，保持深灰风衣与银色胶卷盒。",
            "reference_ids": ["reference-photographer"],
            "continuity_locks": ["role-photographer"],
            "reserved_beat_ids": [],
            **shared_record,
        }],
    }


class StoryDirectorContractTests(unittest.TestCase):
    def _schema_module(self) -> ModuleType:
        try:
            return importlib.import_module("schemas.story_production")
        except ModuleNotFoundError as error:
            self.fail(
                "T6-007 RED [story-production-schema-module-absent]: "
                f"schemas.story_production is not implemented ({error})"
            )

    def _document_model(self):
        model = getattr(self._schema_module(), "StoryProductionDocument", None)
        if model is None:
            self.fail(
                "T6-007 RED [story-production-document-model-absent]: "
                "schemas.story_production.StoryProductionDocument is not implemented"
            )
        return model

    def test_document_stamps_the_project_owned_director_and_one_video_prompt_per_shot(self) -> None:
        model = self._document_model()
        payload = production_document()

        document = model.model_validate(payload)
        dumped = document.model_dump(mode="json")

        self.assertEqual("revid.story-production", dumped["schema_id"])
        self.assertEqual(1, dumped["schema_version"])
        self.assertEqual("revid.story-director", dumped["skill_id"])
        self.assertEqual(1, dumped["skill_version"])
        self.assertTrue(all(shot["video_prompt"].strip() for shot in dumped["shots"]))
        self.assertNotIn("user_selected_skill_id", dumped)
        with self.assertRaises(ValidationError):
            model.model_validate({**payload, "user_selected_skill_id": "external.skill"})

    def test_duplicate_display_names_do_not_replace_stable_asset_and_shot_ids(self) -> None:
        model = self._document_model()
        payload = production_document()
        assets = payload["assets"]
        assert isinstance(assets, dict)
        roles = assets["roles"]
        assert isinstance(roles, list)
        roles.append({**roles[0], "asset_id": "role-photographer-stunt"})

        document = model.model_validate(payload).model_dump(mode="json")

        self.assertEqual(
            ["role-photographer", "role-photographer-stunt"],
            [role["asset_id"] for role in document["assets"]["roles"]],
        )
        self.assertEqual(["摄影师", "摄影师"], [role["name"] for role in document["assets"]["roles"]])

    def test_document_rejects_empty_prompts_duplicate_ids_and_unresolved_references(self) -> None:
        model = self._document_model()

        empty_prompt = production_document()
        empty_prompt["shots"][0]["video_prompt"] = " "
        with self.assertRaises(ValidationError):
            model.model_validate(empty_prompt)

        duplicate_asset = production_document()
        duplicate_asset["assets"]["roles"].append({
            **duplicate_asset["assets"]["roles"][0],
        })
        with self.assertRaises(ValidationError):
            model.model_validate(duplicate_asset)

        unresolved_reference = production_document()
        unresolved_reference["references"][0]["asset_id"] = "missing-asset"
        with self.assertRaises(ValidationError):
            model.model_validate(unresolved_reference)

        unresolved_shot_reference = production_document()
        unresolved_shot_reference["shots"][0]["reference_ids"] = ["missing-reference"]
        with self.assertRaises(ValidationError):
            model.model_validate(unresolved_shot_reference)

    def test_document_rejects_duplicate_shot_ids_and_invalid_continuity_lineage(self) -> None:
        model = self._document_model()
        duplicate_shot = production_document()
        duplicate_shot["shots"].append({
            **duplicate_shot["shots"][0],
            "shot_number": 2,
        })
        with self.assertRaises(ValidationError):
            model.model_validate(duplicate_shot)

        incomplete_continuity = production_document()
        incomplete_continuity["continuity"]["accepted_take_id"] = "take-1"
        with self.assertRaises(ValidationError):
            model.model_validate(incomplete_continuity)

    def test_document_preserves_exact_template_instance_step_and_script_lineage(self) -> None:
        model = self._document_model()
        payload = production_document()
        payload["template_lineage"] = {
            "contract_version": 1,
            "template_id": "revid.product-ad",
            "template_version": 1,
            "instance_id": "instance-1",
            "instance_step_id": "instance-step-1",
            "step_id": "compile-story",
            "script_node_id": "script-node-1",
        }

        dumped = model.model_validate(payload).model_dump(mode="json")

        self.assertEqual(payload["template_lineage"], dumped["template_lineage"])
        mismatched = production_document()
        mismatched["template_lineage"] = {
            **payload["template_lineage"],
            "script_node_id": "other-script",
        }
        with self.assertRaises(ValidationError):
            model.model_validate(mismatched)

    def test_builtin_script_projection_carries_deterministic_instance_step_lineage(self) -> None:
        from core.builtin_workflow_templates import BUILTIN_WORKFLOW_TEMPLATES
        from schemas.workflow_template_instance import WorkflowTemplateInstantiateRequest
        from services.workflow_templates.instances import build_instance_projection
        from services.workflow_templates.lineage import workflow_template_lineage_id

        manifest = BUILTIN_WORKFLOW_TEMPLATES["revid.product-ad"]
        request = WorkflowTemplateInstantiateRequest.model_validate({
            "template_id": "revid.product-ad",
            "template_version": 1,
            "base_revision": 0,
            "client_mutation_id": "t6-023-lineage",
            "variable_bindings": {},
            "asset_bindings": {},
            "cost_confirmed": True,
            "preflight_fingerprint": "a" * 64,
        })

        mutation, node_map, _, instance_id = build_instance_projection(
            manifest=manifest,
            canvas_id="canvas-1",
            request=request,
        )

        script = next(
            node for node in mutation["node_upserts"]
            if node["id"] == node_map["script"]
        )
        self.assertEqual({
            "contract_version": 1,
            "template_id": "revid.product-ad",
            "template_version": 1,
            "instance_id": instance_id,
            "instance_step_id": workflow_template_lineage_id(
                instance_id,
                "step",
                "compile-story",
            ),
            "step_id": "compile-story",
            "script_node_id": node_map["script"],
        }, script["content"]["workflow_template_lineage"])

    def test_provider_output_cannot_author_template_lineage(self) -> None:
        from core.story_director_contract import parse_story_director_output

        payload = production_document()
        payload["template_lineage"] = {
            "contract_version": 1,
            "template_id": "provider.forged",
            "template_version": 1,
            "instance_id": "provider-instance",
            "instance_step_id": "provider-step",
            "step_id": "compile-story",
            "script_node_id": "script-node-1",
        }

        parsed = parse_story_director_output(
            payload,
            source_node_id="script-node-1",
            source_revision=REVISION,
            model_id="allowed-text-model",
        )

        self.assertIsNone(parsed.template_lineage)


if __name__ == "__main__":
    unittest.main()
