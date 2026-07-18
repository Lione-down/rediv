from __future__ import annotations

import unittest

from core.agent_skill_contract import build_agent_skill_capabilities
from core.cinematic_skill_contract import (
    CinematicSkillContractError,
    build_cinematic_skill_capabilities,
    build_cinematic_skill_preflight,
    cinematic_source_revision,
)


def node(
    node_id: str,
    node_type: str,
    subtype: str,
    *,
    title: str,
    text: str | None = None,
    asset_id: str | None = None,
    parent_node_id: str | None = None,
    extra: dict | None = None,
) -> dict:
    content = {
        "serialization_version": 1,
        "subtype": subtype,
        "title": title,
    }
    if text is not None:
        content["text"] = text
    if asset_id is not None:
        content["asset_id"] = asset_id
    if extra:
        content.update(extra)
    return {
        "id": node_id,
        "node_type": node_type,
        "content": content,
        "parent_node_id": parent_node_id,
        "status": "active",
    }


class CinematicSkillContractTests(unittest.TestCase):
    def test_agent_skill_v1_remains_exact_and_v2_adds_only_three_cinematic_manifests(self):
        legacy = build_agent_skill_capabilities(contract_version=1)
        current = build_agent_skill_capabilities(contract_version=2)

        self.assertEqual(1, legacy["contract_version"])
        self.assertEqual(["revid.canvas-context"], [item["id"] for item in legacy["skills"]])
        self.assertEqual(["mock-only", "unavailable"], legacy["execution_modes"])
        self.assertEqual(2, current["contract_version"])
        self.assertEqual(
            [
                "revid.canvas-context",
                "revid.cinema-script",
                "revid.cinema-image",
                "revid.cinema-video",
            ],
            [item["id"] for item in current["skills"]],
        )
        self.assertEqual(
            ["revid.cinema-script", "revid.cinema-image", "revid.cinema-video"],
            [item["id"] for item in current["skills"] if item["intent"].startswith("cinema-")],
        )

    def test_provider_catalog_is_backend_owned_and_does_not_auto_route(self):
        capabilities = build_cinematic_skill_capabilities()

        self.assertEqual(1, capabilities["contract_version"])
        self.assertEqual(["agnes"], [provider["id"] for provider in capabilities["providers"]])
        models = capabilities["providers"][0]["models"]
        self.assertEqual(
            ["agnes-2.0-flash", "agnes-image-2.1-flash", "agnes-video-v2.0"],
            [model["id"] for model in models],
        )
        self.assertTrue(all(model["user_selectable"] for model in models))
        self.assertTrue(all(not model["automatic_routing"] for model in models))
        self.assertFalse(capabilities["providers"][0]["requires_acknowledgement"])

    def test_image_preflight_is_deterministic_rename_safe_and_exactly_serialized(self):
        reference = node(
            "reference-character",
            "asset",
            "image",
            title="角色参考",
            asset_id="asset-character",
        )
        source_revision = cinematic_source_revision(reference)
        mention = {
            "node_id": reference["id"],
            "role": "identity",
            "instruction": "保持脸型、发型和服装",
            "source_revision": source_revision,
        }
        kwargs = {
            "skill_id": "revid.cinema-image",
            "skill_version": 1,
            "project_id": "project-1",
            "canvas_id": "canvas-1",
            "canvas_revision": 7,
            "provider_id": "agnes",
            "model_id": "agnes-image-2.1-flash",
            "user_instruction": "在夜景街道中生成角色全身照",
            "mentions": [mention],
            "generation_parameters": {"aspect_ratio": "16:9"},
            "canvas_nodes": [reference],
        }
        first = build_cinematic_skill_preflight(**kwargs)
        second = build_cinematic_skill_preflight(**kwargs)

        self.assertEqual(first, second)
        self.assertEqual(first["canonical_request_json"], first["exact_request"])
        self.assertEqual(64, len(first["request_digest"]))
        self.assertEqual("agnes-image-2.1-flash", first["canonical_request"]["model_id"])
        self.assertEqual(["asset-character"], first["canonical_request"]["image_ids"])
        self.assertEqual("identity", first["canonical_request"]["references"][0]["role"])
        envelope = first["canonical_request"]["constraint_envelope"]
        self.assertEqual(["reference-character"], [item["node_id"] for item in envelope["locks"]["identity"]])
        self.assertEqual(["do-not-drift-identity"], envelope["negative_drift_constraints"])
        self.assertEqual([kwargs["user_instruction"]], envelope["explicit_change_authority"])
        self.assertNotIn("automatic_retry", first["canonical_request"])
        self.assertNotIn("automatic_model", first["canonical_request"])

        renamed = node(
            "reference-character",
            "asset",
            "image",
            title="重命名后的角色参考",
            asset_id="asset-character",
        )
        self.assertEqual(source_revision, cinematic_source_revision(renamed))
        renamed_preflight = build_cinematic_skill_preflight(**{**kwargs, "canvas_nodes": [renamed]})
        self.assertEqual(first["request_digest"], renamed_preflight["request_digest"])

    def test_stale_duplicate_cross_scope_and_unsupported_roles_fail_closed(self):
        reference = node(
            "reference-a",
            "asset",
            "image",
            title="参考图",
            asset_id="asset-a",
        )
        mention = {
            "node_id": "reference-a",
            "role": "first-frame",
            "instruction": "作为首帧",
            "source_revision": cinematic_source_revision(reference),
        }
        common = {
            "skill_id": "revid.cinema-video",
            "skill_version": 1,
            "project_id": "project-1",
            "canvas_id": "canvas-1",
            "canvas_revision": 8,
            "provider_id": "agnes",
            "model_id": "agnes-video-v2.0",
            "user_instruction": "镜头缓慢推进",
            "generation_parameters": {"duration_seconds": 5, "reference_mode": "image-to-video"},
            "canvas_nodes": [reference],
        }
        with self.assertRaisesRegex(CinematicSkillContractError, "source revision"):
            build_cinematic_skill_preflight(**common, mentions=[{**mention, "source_revision": "0" * 64}])
        with self.assertRaisesRegex(CinematicSkillContractError, "duplicate"):
            build_cinematic_skill_preflight(**common, mentions=[mention, mention])
        with self.assertRaisesRegex(CinematicSkillContractError, "unsupported"):
            build_cinematic_skill_preflight(
                **common,
                mentions=[{**mention, "role": "audio-reference", "instruction": "只参考音频"}],
            )
        with self.assertRaisesRegex(CinematicSkillContractError, "unavailable"):
            build_cinematic_skill_preflight(**{**common, "canvas_nodes": []}, mentions=[mention])

    def test_video_first_last_continuity_is_exact_and_unsupported_media_never_degrades(self):
        first = node("first", "asset", "image", title="首帧", asset_id="asset-first")
        last = node("last", "asset", "image", title="尾帧", asset_id="asset-last")
        mentions = [{
            "node_id": item["id"], "role": role, "instruction": instruction,
            "source_revision": cinematic_source_revision(item),
        } for item, role, instruction in [
            (first, "first-frame", "作为精确首帧"), (last, "last-frame", "作为精确尾帧"),
        ]]
        preflight = build_cinematic_skill_preflight(
            skill_id="revid.cinema-video", skill_version=1,
            project_id="project-1", canvas_id="canvas-1", canvas_revision=10,
            provider_id="agnes", model_id="agnes-video-v2.0",
            user_instruction="镜头缓慢推进，人物动作稳定",
            mentions=mentions,
            generation_parameters={"image_ids": [], "reference_mode": "keyframes", "duration_seconds": 5},
            canvas_nodes=[first, last],
        )
        self.assertEqual(["asset-first", "asset-last"], preflight["canonical_request"]["image_ids"])
        continuity = preflight["canonical_request"]["constraint_envelope"]["continuity"]
        self.assertEqual("first", continuity["first_frame"][0]["node_id"])
        self.assertEqual("last", continuity["last_frame"][0]["node_id"])
        video = node("motion", "asset", "video", title="动作参考", asset_id="asset-video")
        with self.assertRaisesRegex(CinematicSkillContractError, "media"):
            build_cinematic_skill_preflight(
                skill_id="revid.cinema-video", skill_version=1,
                project_id="project-1", canvas_id="canvas-1", canvas_revision=10,
                provider_id="agnes", model_id="agnes-video-v2.0", user_instruction="参考动作",
                mentions=[{
                    "node_id": "motion", "role": "action", "instruction": "只参考动作节奏",
                    "source_revision": cinematic_source_revision(video),
                }],
                generation_parameters={"image_ids": [], "reference_mode": "text-to-video", "duration_seconds": 5},
                canvas_nodes=[video],
            )

    def test_storyboard_group_expands_in_persisted_order_without_recursion(self):
        first = node("image-a", "asset", "image", title="A", asset_id="asset-a", parent_node_id="group-a")
        second = node("image-b", "result", "image", title="B", asset_id="asset-b", parent_node_id="group-a")
        group = node(
            "group-a",
            "group",
            "storyboard",
            title="分镜组",
            extra={"ordered_child_ids": ["image-b", "image-a"]},
        )
        mention = {
            "node_id": "group-a",
            "role": "style",
            "instruction": "保持分镜组的综合色彩",
            "source_revision": cinematic_source_revision(group),
        }
        preflight = build_cinematic_skill_preflight(
            skill_id="revid.cinema-image",
            skill_version=1,
            project_id="project-1",
            canvas_id="canvas-1",
            canvas_revision=9,
            provider_id="agnes",
            model_id="agnes-image-2.1-flash",
            user_instruction="生成统一风格海报",
            mentions=[mention],
            generation_parameters={"aspect_ratio": "4:3"},
            canvas_nodes=[group, first, second],
        )

        self.assertEqual(["image-b", "image-a"], [item["node_id"] for item in preflight["references"]])
        self.assertEqual(["asset-b", "asset-a"], preflight["canonical_request"]["image_ids"])


if __name__ == "__main__":
    unittest.main()
