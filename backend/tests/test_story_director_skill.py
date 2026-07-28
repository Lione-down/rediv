from __future__ import annotations

from copy import deepcopy
import importlib
import json
from pathlib import Path
import unittest

from pydantic import ValidationError

from tests.test_story_director_contract import REVISION, production_document


class StoryDirectorSkillTests(unittest.TestCase):
    def _module(self, name: str):
        try:
            return importlib.import_module(name)
        except ModuleNotFoundError as error:
            self.fail(f"T6-012 RED [{name}-absent]: {error}")

    def test_route_and_messages_keep_skill_automatic_and_model_explicit(self) -> None:
        module = self._module("core.story_director_skill")
        build_story_director_messages = module.build_story_director_messages
        resolve_story_director_route = module.resolve_story_director_route

        self.assertEqual("standalone_shot", resolve_story_director_route(requested_shot_count=1))
        self.assertEqual("sequence_project", resolve_story_director_route(requested_shot_count=3))
        messages = build_story_director_messages(
            source_text="A photographer searches a station.",
            source_node_id="script-node-1",
            source_revision=REVISION,
            model_id="agnes-2.0-flash",
            requested_shot_count=3,
        )

        self.assertEqual(["system", "user"], [message["role"] for message in messages])
        serialized = json.dumps(messages, ensure_ascii=False)
        self.assertIn("revid.provider-storyboard", serialized)
        self.assertIn("story-production compiler", serialized)
        self.assertIn("agnes-2.0-flash", serialized)
        self.assertNotIn("user_selected_skill", serialized)
        self.assertNotIn("seedance", serialized.lower())

    def test_parse_repairs_only_structured_wrappers_and_rejects_free_text_or_oversize(self) -> None:
        module = self._module("core.story_director_contract")
        StoryDirectorOutputError = module.StoryDirectorOutputError
        parse_story_director_output = module.parse_story_director_output

        payload = production_document()
        parsed = parse_story_director_output(
            {"story_production": payload},
            source_node_id="script-node-1",
            source_revision=REVISION,
            model_id="allowed-text-model",
        )
        self.assertEqual("revid.story-director", parsed.skill_id)

        for invalid in ("write a nice movie", "x" * 262_145, {"story_production": "not-an-object"}):
            with self.subTest(invalid_type=type(invalid).__name__):
                with self.assertRaises(StoryDirectorOutputError):
                    parse_story_director_output(
                        invalid,
                        source_node_id="script-node-1",
                        source_revision=REVISION,
                        model_id="allowed-text-model",
                    )

    def test_parse_accepts_one_whole_response_json_fence_without_weakening_free_text(self) -> None:
        module = self._module("core.story_director_contract")
        StoryDirectorOutputError = module.StoryDirectorOutputError
        parse_story_director_output = module.parse_story_director_output
        payload = production_document()
        fenced = f"```json\n{json.dumps(payload, ensure_ascii=False)}\n```"

        parsed = parse_story_director_output(
            fenced,
            source_node_id="script-node-1",
            source_revision=REVISION,
            model_id="allowed-text-model",
        )

        self.assertEqual("revid.story-production", parsed.schema_id)
        with self.assertRaises(StoryDirectorOutputError):
            parse_story_director_output(
                f"Here is the result:\n{fenced}",
                source_node_id="script-node-1",
                source_revision=REVISION,
                model_id="allowed-text-model",
            )

    def test_executor_uses_one_bounded_repair_and_returns_only_validated_state(self) -> None:
        module = self._module("services.generation.story_director_executor")
        StoryDirectorExecutionError = module.StoryDirectorExecutionError
        execute_story_director = module.execute_story_director

        calls: list[list[dict[str, str]]] = []
        invalid_response = json.dumps({"shots": []})
        responses = [invalid_response, json.dumps(production_document(), ensure_ascii=False)]

        def generate(*, model_id: str, messages: list[dict[str, str]]) -> str:
            self.assertEqual("allowed-text-model", model_id)
            calls.append(messages)
            return responses.pop(0)

        result = execute_story_director(
            source_text="A photographer searches a station.",
            source_node_id="script-node-1",
            source_revision=REVISION,
            model_id="allowed-text-model",
            requested_shot_count=1,
            generate=generate,
        )

        self.assertEqual("revid.story-production", result.schema_id)
        self.assertEqual(2, len(calls))
        self.assertEqual(invalid_response, calls[1][-2]["content"])
        self.assertIn("repair", calls[1][-1]["content"].lower())

        with self.assertRaises(StoryDirectorExecutionError):
            execute_story_director(
                source_text="A photographer searches a station.",
                source_node_id="script-node-1",
                source_revision=REVISION,
                model_id="allowed-text-model",
                requested_shot_count=1,
                generate=lambda **_: "{}",
            )

    def test_parse_normalizes_current_provider_storyboard_without_weakening_invalid_shapes(self) -> None:
        module = self._module("core.story_director_contract")
        StoryDirectorOutputError = module.StoryDirectorOutputError
        parse_story_director_output = module.parse_story_director_output
        provider_storyboard = {
            "schema_id": "revid.provider-storyboard",
            "schema_version": 1,
            "summary": "沈昭昭从现代办公室穿越到盛唐，以诗才化解死局。",
            "assets": {
                "roles": [{
                    "name": "沈昭昭",
                    "description": "二十八岁现代女性，穿越后身着男装官服。",
                    "image_prompt": "Shen Zhaozhao in Tang official robes, determined expression.",
                    "image_prompt_zh": "沈昭昭身穿盛唐男装官服，神情坚定。",
                }],
                "scenes": [{
                    "name": "现代办公室",
                    "description": "深夜办公室，电脑蓝光刺眼。",
                    "image_prompt": "现代深夜办公室，冷蓝电脑光。",
                }, {
                    "name": "盛唐金銮殿",
                    "description": "百官列立，殿宇巍峨。",
                    "image_prompt": "盛唐金銮殿，百官列立，史诗光影。",
                }],
                "props": [],
            },
            "shots": [
                {
                    "shot_number": index,
                    "duration_seconds": 6,
                    "visual_description": f"第 {index} 镜：沈昭昭的盛唐命运推进。",
                    "framing": "Medium shot",
                    "framing_zh": "中景",
                    "scene": "现代办公室" if index == 1 else "盛唐金銮殿",
                    "roles": ["沈昭昭"],
                    "props": [],
                    "dialogue": "" if index < 5 else "既来盛唐，便与盛唐争一争。",
                    "music_sfx": "键盘声" if index == 1 else "鼓声与诗声",
                    "camera_movement": "缓慢推进",
                    "image_prompt": f"Shot {index}, ancient Tang comic frame, consistent character.",
                    "image_prompt_zh": f"第 {index} 镜，盛唐古风漫画画面，保持人物一致。",
                    "video_prompt": f"Shot {index}, slow push-in, consistent character.",
                    "video_prompt_zh": f"第 {index} 镜，缓慢推进，保持人物一致。",
                }
                for index in range(1, 11)
            ],
        }

        parsed = parse_story_director_output(
            json.dumps(provider_storyboard, ensure_ascii=False),
            source_node_id="script-node-1",
            source_revision=REVISION,
            model_id="agnes-2.5-flash",
        )

        self.assertEqual(10, len(parsed.shots))
        self.assertEqual(list(range(1, 11)), [shot.shot_number for shot in parsed.shots])
        self.assertEqual("revid.story-production", parsed.schema_id)
        self.assertEqual("script-node-1", parsed.source_node_id)
        self.assertEqual("agnes-2.5-flash", parsed.model_id)
        self.assertEqual("中景", parsed.shots[0].editable_fields["framing_zh"])
        self.assertEqual(
            "第 1 镜，缓慢推进，保持人物一致。",
            parsed.shots[0].editable_fields["video_prompt_zh"],
        )
        self.assertEqual(
            "沈昭昭身穿盛唐男装官服，神情坚定。",
            parsed.assets.roles[0].editable_fields["image_prompt_zh"],
        )
        with self.assertRaises(StoryDirectorOutputError):
            parse_story_director_output(
                {
                    "schema_id": "revid.provider-storyboard",
                    "schema_version": 1,
                    "summary": "缺少 assets 与 shots 的非法结构。",
                },
                source_node_id="script-node-1",
                source_revision=REVISION,
                model_id="agnes-2.5-flash",
            )

    def test_prompt_compiler_emits_current_shot_and_accepted_opening_only(self) -> None:
        compile_story_shot_prompt = self._module(
            "core.story_director_prompts"
        ).compile_story_shot_prompt
        from schemas.story_production import StoryProductionDocument

        payload = production_document()
        payload["story"]["events"].append({
            "event_id": "story-event-2",
            "summary": "The train departs.",
        })
        payload["continuity"] = {
            **payload["continuity"],
            "accepted_take_id": "take-0",
            "accepted_result_node_id": "result-0",
            "accepted_result_revision": REVISION,
            "observed_end_state": "The photographer stops beneath the clock.",
        }
        second = deepcopy(payload["shots"][0])
        second.update({
            "shot_id": "shot-2",
            "shot_number": 2,
            "video_prompt": "TRACKING SHOT TWO MUST STAY OUT.",
            "reserved_beat_ids": ["story-event-2"],
        })
        payload["shots"].append(second)
        document = StoryProductionDocument.model_validate(payload)

        prompt = compile_story_shot_prompt(document, shot_id="shot-1")

        self.assertIn(payload["shots"][0]["video_prompt"], prompt)
        self.assertIn("The photographer stops beneath the clock.", prompt)
        self.assertIn("role-photographer", prompt)
        self.assertNotIn("TRACKING SHOT TWO MUST STAY OUT.", prompt)
        self.assertNotIn('"schema_id"', prompt)
        self.assertNotIn("story-event-2", prompt)

    def test_offline_eval_manifest_covers_every_approved_director_boundary(self) -> None:
        manifest_path = (
            Path(__file__).resolve().parents[2]
            / "ai"
            / "evidence"
            / "t6-012"
            / "offline-eval-manifest.json"
        )
        self.assertTrue(manifest_path.is_file(), "T6-012 RED [offline-eval-manifest-absent]")
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        cases = manifest["cases"]
        categories = {case["category"] for case in cases}
        self.assertEqual(
            {
                "routing",
                "dramatic-intention",
                "structure",
                "reference-binding",
                "prompt-compilation",
                "continuity",
                "uncertainty",
                "safety",
                "rights",
            },
            categories,
        )
        self.assertEqual(len(cases), len({case["id"] for case in cases}))
        self.assertTrue(all(case["execution"] == "offline_only" for case in cases))


class StoryDirectorAsyncRepairTests(unittest.IsolatedAsyncioTestCase):
    async def test_async_executor_repairs_the_actual_bounded_prior_output(self) -> None:
        module = importlib.import_module("services.generation.story_director_executor")
        invalid_response = json.dumps({"shots": []})
        responses = [invalid_response, json.dumps(production_document(), ensure_ascii=False)]
        calls: list[list[dict[str, str]]] = []

        async def generate(*, model_id: str, messages: list[dict[str, str]]) -> str:
            self.assertEqual("allowed-text-model", model_id)
            calls.append(messages)
            return responses.pop(0)

        result = await module.execute_story_director_async(
            source_text="A photographer searches a station.",
            source_node_id="script-node-1",
            source_revision=REVISION,
            model_id="allowed-text-model",
            requested_shot_count=1,
            generate=generate,
        )

        self.assertEqual("revid.story-production", result.schema_id)
        self.assertEqual(invalid_response, calls[1][-2]["content"])


if __name__ == "__main__":
    unittest.main()
