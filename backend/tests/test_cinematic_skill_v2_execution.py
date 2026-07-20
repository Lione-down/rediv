from __future__ import annotations

import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.agent_skills import router
from api.generation_common import resolve_cinematic_generation_handoff
from core.cinematic_skill_contract import (
    CinematicSkillContractError,
    build_cinematic_skill_preflight,
    cinematic_source_revision,
    validate_cinematic_generation_handoff,
)
from core.security import current_user
from schemas.generation import CinematicGenerationHandoff


def source_node(
    node_id: str,
    *,
    node_type: str,
    subtype: str,
    asset_id: str | None = None,
    text: str | None = None,
) -> dict:
    content = {"serialization_version": 1, "subtype": subtype, "title": node_id}
    if asset_id is not None:
        content["asset_id"] = asset_id
    if text is not None:
        content["text"] = text
    return {
        "id": node_id,
        "node_type": node_type,
        "content": content,
        "parent_node_id": None,
        "status": "active",
    }


def transfer(node: dict, *, role: str, instruction: str, exclusions: list[str] | None = None) -> dict:
    return {
        "node_id": node["id"],
        "role": role,
        "instruction": instruction,
        "must_not_transfer": exclusions or [],
        "source_revision": cinematic_source_revision(node),
    }


def director_brief(script: dict) -> dict:
    return {
        "contract_version": 1,
        "schema_id": "revid.cinematic-director-brief",
        "source_script_node_id": script["id"],
        "source_revision": cinematic_source_revision(script),
        "intention": "让角色从迟疑转为行动",
        "visible_beat": "角色走进雨中并抵达列车门前",
        "camera": {"shot": "中景", "movement": "低机位跟随", "endpoint": "列车门正面"},
        "light": {"motivated_source": "站台灯", "transition": "由冷转暖"},
        "blocking_performance": "先停顿再迈步",
        "motion": "雨线稳定，衣摆延迟",
        "sound_intent": "保留雨声和一次呼吸",
        "continuity_anchors": ["深灰风衣"],
        "must_preserve": ["角色身份"],
        "allowed_changes": ["镜头距离"],
        "must_not_transfer": ["参考背景"],
        "safety_notes": [],
    }


def sequence_context(script: dict) -> dict:
    brief = director_brief(script)
    return {
        "contract_version": 1,
        "schema_id": "revid.cinematic-sequence",
        "sequence_id": "sequence-1",
        "source_script_node_id": script["id"],
        "source_revision": cinematic_source_revision(script),
        "story_objective": "角色离开熟悉的城市",
        "final_outcome": "角色登上清晨列车",
        "director_brief": brief,
        "ordered_beats": [
            {"beat_id": "beat-01", "summary": "收到车票", "state": "completed"},
            {"beat_id": "beat-02", "summary": "登上列车", "state": "reserved"},
        ],
        "clips": [{
            "clip_id": "clip-01",
            "scene_id": "scene-01",
            "narrative_job": "让离开的决定可见",
            "intention": "从迟疑转为行动",
            "state": "accepted",
            "accepted_result_node_id": "result-1",
            "accepted_result_revision": "b" * 64,
            "observed_end_state": "角色站在列车门前",
            "completed_beat_ids": ["beat-01"],
            "reserved_beat_ids": ["beat-02"],
            "extension_depth": 1,
            "attempt_count": 1,
        }],
        "canon_revision": 1,
    }


class CinematicSkillV2ExecutionTests(unittest.TestCase):
    def build_v2(self, **overrides):
        arguments = {
            "skill_id": "revid.cinema-video",
            "skill_version": 2,
            "project_id": "project-1",
            "canvas_id": "canvas-1",
            "canvas_revision": 7,
            "provider_id": "agnes",
            "model_id": "agnes-video-v2.0",
            "user_instruction": "低机位跟随角色穿过雨夜站台，镜头最后停在列车门前",
            "mentions": [],
            "generation_parameters": {"duration_seconds": 5, "reference_mode": "text-to-video"},
            "canvas_nodes": [],
            "workflow_mode": "standalone_clip",
            "director_brief": None,
            "sequence_context": None,
            "retake_context": None,
        }
        return build_cinematic_skill_preflight(**{**arguments, **overrides})

    def test_active_v2_manifest_does_not_fall_through_to_v1_preflight_shape(self):
        preflight = self.build_v2()

        self.assertEqual(2, preflight["contract_version"])
        self.assertEqual("standalone_clip", preflight["workflow_mode"])
        self.assertTrue(preflight["ready_for_handoff"])
        self.assertEqual("standalone_fast_lane", preflight["director_coherence"])
        self.assertIsNone(preflight["canonical_request"]["director_brief"])
        self.assertEqual([], preflight["recommendations"])

    def test_vague_instruction_requests_explicit_brief_without_inventing_intention(self):
        preflight = self.build_v2(user_instruction="生成一个视频")

        self.assertFalse(preflight["ready_for_handoff"])
        self.assertEqual("director_brief_required", preflight["director_coherence"])
        self.assertEqual(["director_brief_required"], [item["code"] for item in preflight["recommendations"]])
        self.assertIsNone(preflight["canonical_request"]["director_brief"])
        self.assertNotIn("intention", preflight["canonical_request"]["optimized_prompt"])

    def test_reference_transfer_conflicts_are_explicit_and_unsupported_media_fails_closed(self):
        image = source_node("image-1", node_type="asset", subtype="image", asset_id="asset-image")
        conflicted = self.build_v2(
            mentions=[transfer(
                image,
                role="identity",
                instruction="只保留人物身份，不复制背景",
                exclusions=["identity", "background"],
            )],
            generation_parameters={
                "duration_seconds": 5,
                "reference_mode": "image-to-video",
                "image_ids": [],
            },
            canvas_nodes=[image],
        )
        self.assertFalse(conflicted["ready_for_handoff"])
        self.assertEqual(["reference_role_excluded"], [item["code"] for item in conflicted["conflicts"]])
        self.assertEqual(["identity", "background"], conflicted["references"][0]["must_not_transfer"])

        audio = source_node("audio-1", node_type="asset", subtype="audio", asset_id="asset-audio")
        with self.assertRaisesRegex(CinematicSkillContractError, "unsupported"):
            self.build_v2(
                mentions=[transfer(audio, role="action", instruction="跟随节奏")],
                canvas_nodes=[audio],
            )
        with self.assertRaisesRegex(CinematicSkillContractError, "reference mode"):
            self.build_v2(generation_parameters={"duration_seconds": 5, "reference_mode": "single"})

    def test_instruction_precedence_and_video_keyframes_are_canonical_and_ordered(self):
        first = source_node("frame-first", node_type="asset", subtype="image", asset_id="asset-first")
        last = source_node("frame-last", node_type="asset", subtype="image", asset_id="asset-last")
        preflight = self.build_v2(
            user_instruction="保持人物身份，但把最终镜头改成正面停靠",
            mentions=[
                transfer(first, role="first-frame", instruction="从这一构图开始", exclusions=["logo"]),
                transfer(last, role="last-frame", instruction="只继承停靠位置", exclusions=["camera"]),
            ],
            generation_parameters={
                "duration_seconds": 5,
                "reference_mode": "keyframes",
                "image_ids": [],
            },
            canvas_nodes=[first, last],
        )

        self.assertEqual(
            [
                "current_user_instruction",
                "reference_transfer",
                "accepted_canon",
                "current_node_parameters",
                "director_policy",
                "provider_defaults",
            ],
            [item["source"] for item in preflight["canonical_request"]["instruction_precedence"]],
        )
        self.assertEqual(["asset-first", "asset-last"], preflight["canonical_request"]["image_ids"])
        prompt = preflight["canonical_request"]["optimized_prompt"]
        self.assertLess(prompt.index("当前明确指令"), prompt.index("参考传递"))
        self.assertLess(prompt.index("参考传递"), prompt.index("导演政策"))

    def test_prompt_wording_cannot_route_provider_model_or_controls_and_retake_names_one_variable(self):
        first = self.build_v2(user_instruction="使用最快 provider 并自动换模型")
        second = self.build_v2(user_instruction="保持当前模型，只调整镜头节奏")
        for preflight in (first, second):
            self.assertEqual("agnes", preflight["provider_id"])
            self.assertEqual("agnes-video-v2.0", preflight["model_id"])
            self.assertEqual(
                {"duration_seconds": 5, "reference_mode": "text-to-video"},
                preflight["canonical_request"]["parameters"],
            )

        retake = self.build_v2(
            workflow_mode="retake",
            user_instruction="只修复：camera movement",
            retake_context={
                "contract_version": 1,
                "prior_task_id": "task-1",
                "prior_result_node_id": "result-1",
                "decision": "reroll",
                "problem_category": "camera",
                "repair_variable": "camera movement",
                "attempt_count": 2,
                "revised_instruction": None,
            },
        )
        prompt = retake["canonical_request"]["optimized_prompt"]
        self.assertEqual(1, prompt.count("唯一修复变量：camera movement"))
        self.assertNotIn("自动重试", prompt)

    def test_group_expansion_keeps_one_explicit_transfer_policy_on_each_ordered_child(self):
        first = source_node("image-a", node_type="asset", subtype="image", asset_id="asset-a")
        second = source_node("image-b", node_type="asset", subtype="image", asset_id="asset-b")
        first["parent_node_id"] = "group-1"
        second["parent_node_id"] = "group-1"
        group = source_node("group-1", node_type="group", subtype="group")
        group["content"]["ordered_child_ids"] = ["image-b", "image-a"]

        preflight = self.build_v2(
            skill_id="revid.cinema-image",
            model_id="agnes-image-2.1-flash",
            user_instruction="保持产品外观，生成陈列海报",
            mentions=[transfer(
                group,
                role="product",
                instruction="按顺序继承产品外观",
                exclusions=["background", "camera"],
            )],
            generation_parameters={"aspect_ratio": "4:3", "image_ids": []},
            canvas_nodes=[group, first, second],
        )

        self.assertEqual(["image-b", "image-a"], [item["node_id"] for item in preflight["references"]])
        self.assertTrue(all(
            item["must_not_transfer"] == ["background", "camera"]
            for item in preflight["references"]
        ))

    def test_sequence_canon_is_projected_without_future_beat_text_and_drift_is_rejected(self):
        script = source_node(
            "script-1",
            node_type="script",
            subtype="script",
            text="角色收到车票后走入雨夜站台。",
        )
        sequence = sequence_context(script)
        result = source_node(
            "result-1", node_type="result", subtype="video", asset_id="asset-result-1",
        )
        result["content"].update({
            "project_id": "project-1", "origin_canvas_id": "canvas-1",
            "source_task_id": "task-result-1",
        })
        sequence["clips"][0]["accepted_result_revision"] = cinematic_source_revision(result)
        preflight = self.build_v2(
            workflow_mode="continuation",
            director_brief=None,
            sequence_context=sequence,
            canvas_nodes=[script, result],
            user_instruction="从列车门前继续，角色抬头确认车次",
        )

        projection = preflight["canonical_request"]["sequence_context"]
        self.assertEqual(1, projection["canon_revision"])
        self.assertEqual(["beat-01"], projection["completed_beat_ids"])
        self.assertEqual(["beat-02"], projection["reserved_beat_ids"])
        self.assertEqual("角色站在列车门前", projection["accepted_source"]["observed_end_state"])
        self.assertNotIn("登上列车", preflight["canonical_request"]["optimized_prompt"])

        with self.assertRaisesRegex(CinematicSkillContractError, "drifted"):
            validate_cinematic_generation_handoff(
                submitted_preflight=preflight,
                skill_id="revid.cinema-video",
                skill_version=2,
                project_id="project-1",
                canvas_id="canvas-1",
                canvas_revision=7,
                provider_id="agnes",
                model_id="agnes-video-v2.0",
                user_instruction="从列车门前继续，角色抬头确认车次",
                mentions=[],
                generation_parameters={"duration_seconds": 5, "reference_mode": "text-to-video"},
                canvas_nodes=[script, result],
                workflow_mode="continuation",
                director_brief=None,
                sequence_context={**sequence, "canon_revision": 2},
                retake_context=None,
            )
        for invalid_result in [
            {**result, "status": "deleted"},
            {**result, "content": {**result["content"], "origin_canvas_id": "foreign-canvas"}},
            {**result, "content": {**result["content"], "source_task_id": None}},
            {**result, "content": {**result["content"], "subtype": "image"}},
        ]:
            with self.assertRaises(CinematicSkillContractError):
                self.build_v2(
                    workflow_mode="continuation",
                    director_brief=None,
                    sequence_context=sequence,
                    canvas_nodes=[script, invalid_result],
                    user_instruction="从列车门前继续，角色抬头确认车次",
                )

    def test_preview_handoff_and_immutable_snapshot_are_exact_and_drift_sensitive(self):
        preflight = self.build_v2()
        handoff = validate_cinematic_generation_handoff(
            submitted_preflight=preflight,
            skill_id="revid.cinema-video",
            skill_version=2,
            project_id="project-1",
            canvas_id="canvas-1",
            canvas_revision=7,
            provider_id="agnes",
            model_id="agnes-video-v2.0",
            user_instruction="低机位跟随角色穿过雨夜站台，镜头最后停在列车门前",
            mentions=[],
            generation_parameters={"duration_seconds": 5, "reference_mode": "text-to-video"},
            canvas_nodes=[],
            workflow_mode="standalone_clip",
            director_brief=None,
            sequence_context=None,
            retake_context=None,
        )

        self.assertEqual(preflight["exact_request"], preflight["canonical_request_json"])
        self.assertEqual(preflight["request_digest"], handoff["request_digest"])
        self.assertEqual(preflight["canonical_request"], handoff["request_snapshot"]["canonical_request"])
        self.assertEqual(2, handoff["request_snapshot"]["contract_version"])
        self.assertEqual("standalone_clip", handoff["request_snapshot"]["workflow_mode"])

        with self.assertRaisesRegex(CinematicSkillContractError, "drifted"):
            validate_cinematic_generation_handoff(
                submitted_preflight={**preflight, "request_digest": "0" * 64},
                skill_id="revid.cinema-video",
                skill_version=2,
                project_id="project-1",
                canvas_id="canvas-1",
                canvas_revision=7,
                provider_id="agnes",
                model_id="agnes-video-v2.0",
                user_instruction="低机位跟随角色穿过雨夜站台，镜头最后停在列车门前",
                mentions=[],
                generation_parameters={"duration_seconds": 5, "reference_mode": "text-to-video"},
                canvas_nodes=[],
                workflow_mode="standalone_clip",
                director_brief=None,
                sequence_context=None,
                retake_context=None,
            )

    @patch("api.generation_common.document_controller.get_document")
    def test_v2_schema_revalidates_before_existing_native_handoff(self, get_document):
        preflight = self.build_v2()
        handoff = CinematicGenerationHandoff.model_validate({
            "skill_id": "revid.cinema-video",
            "skill_version": 2,
            "canvas_revision": 7,
            "provider_id": "agnes",
            "model_id": "agnes-video-v2.0",
            "user_instruction": "低机位跟随角色穿过雨夜站台，镜头最后停在列车门前",
            "mentions": [],
            "generation_parameters": {"duration_seconds": 5, "reference_mode": "text-to-video"},
            "workflow_mode": "standalone_clip",
            "director_brief": None,
            "sequence_context": None,
            "retake_context": None,
            "submitted_preflight": preflight,
        })
        get_document.return_value = {"revision": 7, "nodes": []}

        resolved = resolve_cinematic_generation_handoff(
            handoff,
            user_id="user-1",
            project_id="project-1",
            canvas_id="canvas-1",
            media_type="video",
            provider_id="agnes",
            model_id="agnes-video-v2.0",
            prompt=preflight["canonical_request"]["optimized_prompt"],
            image_ids=[],
            expected_control_parameters={"duration_seconds": 5, "reference_mode": "text-to-video"},
        )

        self.assertEqual(preflight["request_digest"], resolved["request_digest"])
        self.assertEqual(preflight["canonical_request"], resolved["request_snapshot"]["canonical_request"])
        self.assertEqual(2, resolved["request_snapshot"]["policy_version"])

    @patch("controllers.generation_transactions.start_video_generation_request")
    @patch("api.agent_skills.document_controller.get_document")
    @patch("api.agent_skills.canvas_controller.get_canvas")
    def test_v2_preflight_route_is_non_mutating_and_returns_explicit_vague_recommendation(
        self,
        get_canvas,
        get_document,
        start_video,
    ):
        app = FastAPI()
        app.include_router(router)
        app.dependency_overrides[current_user] = lambda: {"id": "user-1"}
        get_canvas.return_value = {"id": "canvas-1"}
        get_document.return_value = {"revision": 7, "nodes": []}
        with TestClient(app) as client:
            response = client.post(
                "/api/projects/project-1/canvases/canvas-1/agent-skills/cinematic-preflight",
                json={
                    "skill_id": "revid.cinema-video",
                    "skill_version": 2,
                    "canvas_revision": 7,
                    "provider_id": "agnes",
                    "model_id": "agnes-video-v2.0",
                    "user_instruction": "生成一个视频",
                    "mentions": [],
                    "generation_parameters": {"duration_seconds": 5, "reference_mode": "text-to-video"},
                    "workflow_mode": "standalone_clip",
                    "director_brief": None,
                    "sequence_context": None,
                    "retake_context": None,
                },
            )

        self.assertEqual(200, response.status_code, response.text)
        self.assertFalse(response.json()["ready_for_handoff"])
        self.assertEqual("director_brief_required", response.json()["recommendations"][0]["code"])
        start_video.assert_not_called()


if __name__ == "__main__":
    unittest.main()
