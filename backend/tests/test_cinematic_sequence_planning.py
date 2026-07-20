from __future__ import annotations

import json
import unittest
from unittest.mock import patch

from api.text_generate import text_generate
from controllers.generation_transactions import GenerationStartResult
from core.cinematic_skill_contract import build_cinematic_skill_preflight, cinematic_source_revision
from schemas.generation import TextGenerateRequest


class CinematicSequencePlanningTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.script = {
            "id": "script-1",
            "node_type": "script",
            "content": {
                "serialization_version": 1,
                "subtype": "script",
                "title": "雨夜车站",
                "text": "角色收到车票后走入雨夜站台。",
            },
            "parent_node_id": None,
            "status": "active",
        }
        revision = cinematic_source_revision(self.script)
        self.brief = {
            "contract_version": 1,
            "schema_id": "revid.cinematic-director-brief",
            "source_script_node_id": "script-1",
            "source_revision": revision,
            "intention": "让角色从迟疑转为行动",
            "visible_beat": "角色走入雨中并抵达列车门前",
            "camera": {"shot": "中景", "movement": "低机位跟随", "endpoint": "列车门正面"},
            "light": {"motivated_source": "站台灯", "transition": "由冷转暖"},
            "blocking_performance": "先停顿再迈步",
            "motion": "雨线稳定，衣摆延迟",
            "sound_intent": "雨声和一次呼吸",
            "continuity_anchors": ["深灰风衣"],
            "must_preserve": ["角色身份"],
            "allowed_changes": ["镜头距离"],
            "must_not_transfer": ["参考背景"],
            "safety_notes": [],
        }
        self.sequence = {
            "contract_version": 1,
            "schema_id": "revid.cinematic-sequence",
            "sequence_id": "sequence-1",
            "source_script_node_id": "script-1",
            "source_revision": revision,
            "story_objective": "角色离开熟悉的城市",
            "final_outcome": "角色登上清晨列车",
            "director_brief": self.brief,
            "ordered_beats": [
                {"beat_id": "beat-01", "summary": "收到车票", "state": "planned"},
                {"beat_id": "beat-02", "summary": "走入雨中", "state": "planned"},
            ],
            "clips": [
                {
                    "clip_id": "clip-01", "scene_id": "scene-01",
                    "narrative_job": "让离开的决定可见", "intention": "从迟疑转为行动",
                    "state": "planned", "accepted_result_node_id": None,
                    "accepted_result_revision": None, "observed_end_state": None,
                    "completed_beat_ids": [], "reserved_beat_ids": [],
                    "extension_depth": 0, "attempt_count": 0,
                },
                {
                    "clip_id": "clip-02", "scene_id": "scene-02",
                    "narrative_job": "完成离开", "intention": "登上列车",
                    "state": "planned", "accepted_result_node_id": None,
                    "accepted_result_revision": None, "observed_end_state": None,
                    "completed_beat_ids": [], "reserved_beat_ids": [],
                    "extension_depth": 0, "attempt_count": 0,
                },
            ],
            "canon_revision": 0,
        }
        arguments = {
            "skill_id": "revid.cinema-script",
            "skill_version": 2,
            "project_id": "project-1",
            "canvas_id": "canvas-1",
            "canvas_revision": 9,
            "provider_id": "agnes",
            "model_id": "agnes-2.0-flash",
            "user_instruction": "把明确导演 brief 规划成两个连续 clip，只返回严格 sequence JSON",
            "mentions": [{
                "node_id": "script-1", "role": "story", "instruction": "保持原始剧情顺序",
                "must_not_transfer": [], "source_revision": revision,
            }],
            "generation_parameters": {"image_ids": [], "requested_shot_count": 2, "aspect_ratio": "16:9"},
            "canvas_nodes": [self.script],
            "workflow_mode": "standalone_clip",
            "director_brief": self.brief,
            "sequence_context": None,
            "retake_context": None,
        }
        self.preflight = build_cinematic_skill_preflight(**arguments)
        self.payload = TextGenerateRequest.model_validate({
            "project_id": "project-1", "origin_canvas_id": "canvas-1", "canvas_node_id": "script-1",
            "prompt": self.preflight["canonical_request"]["optimized_prompt"],
            "cinematic_handoff": {
                "skill_id": "revid.cinema-script", "skill_version": 2, "canvas_revision": 9,
                "provider_id": "agnes", "model_id": "agnes-2.0-flash",
                "user_instruction": arguments["user_instruction"], "mentions": arguments["mentions"],
                "generation_parameters": arguments["generation_parameters"],
                "workflow_mode": "standalone_clip", "director_brief": self.brief,
                "sequence_context": None, "retake_context": None,
                "submitted_preflight": self.preflight,
            },
        })

    @patch("api.text_generate.generation_controller.complete_generation_task")
    @patch("api.text_generate.generation_controller.start_generation_request")
    @patch("api.generation_common.document_controller.get_document")
    async def test_v2_text_authority_returns_strict_sequence_without_canvas_mutation(
        self,
        get_document,
        start_task,
        complete_task,
    ):
        get_document.return_value = {"revision": 9, "nodes": [self.script]}
        start_task.return_value = GenerationStartResult(task={"id": "task-sequence"}, input_image_urls=None)
        complete_task.return_value = {
            "asset": {"id": "asset-sequence"},
            "generation_task": {"id": "task-sequence"},
        }

        class Provider:
            async def chat(_self, **_kwargs):
                return {"choices": [{"message": {"content": json.dumps(self.sequence)}}]}

        result = await text_generate(self.payload, user={"id": "user-1"}, provider=Provider())

        self.assertEqual(self.sequence, json.loads(result["content"]))
        snapshot = start_task.call_args.kwargs["request_parameters"]["cinematic_skill"]
        self.assertEqual(self.preflight["request_digest"], snapshot["request_digest"])
        complete_task.assert_called_once()


if __name__ == "__main__":
    unittest.main()
