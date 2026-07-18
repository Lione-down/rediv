from __future__ import annotations

import unittest
from unittest.mock import patch

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from api.agent_skills import router
from api.generation_common import resolve_cinematic_generation_handoff
from api.text_generate import text_generate
from core.cinematic_skill_contract import (
    CinematicSkillContractError,
    build_cinematic_skill_preflight,
    cinematic_source_revision,
    validate_cinematic_generation_handoff,
)
from core.security import current_user
from schemas.generation import CinematicGenerationHandoff, TextGenerateRequest


class CinematicSkillExecutionTests(unittest.TestCase):
    def setUp(self):
        self.reference = {
            "id": "reference-a",
            "node_type": "asset",
            "content": {
                "serialization_version": 1,
                "subtype": "image",
                "title": "Reference",
                "asset_id": "asset-a",
            },
            "parent_node_id": None,
            "status": "active",
        }
        self.arguments = {
            "skill_id": "revid.cinema-image",
            "skill_version": 1,
            "project_id": "project-1",
            "canvas_id": "canvas-1",
            "canvas_revision": 3,
            "provider_id": "agnes",
            "model_id": "agnes-image-2.1-flash",
            "user_instruction": "生成一致的角色海报",
            "mentions": [{
                "node_id": "reference-a",
                "role": "identity",
                "instruction": "保持角色身份",
                "source_revision": cinematic_source_revision(self.reference),
            }],
            "generation_parameters": {"aspect_ratio": "4:3"},
            "canvas_nodes": [self.reference],
        }

    def test_exact_preview_hands_back_to_existing_generation_request(self):
        preflight = build_cinematic_skill_preflight(**self.arguments)
        handoff = validate_cinematic_generation_handoff(
            submitted_preflight=preflight,
            **self.arguments,
        )

        self.assertEqual(preflight["request_digest"], handoff["request_digest"])
        self.assertEqual(preflight["canonical_request"]["optimized_prompt"], handoff["prompt"])
        self.assertEqual(["asset-a"], handoff["image_ids"])
        self.assertEqual("agnes", handoff["provider_id"])
        self.assertEqual("agnes-image-2.1-flash", handoff["model_id"])
        self.assertEqual(preflight["canonical_request"], handoff["request_snapshot"]["canonical_request"])

    def test_preview_capability_model_and_source_drift_stop_before_handoff(self):
        preflight = build_cinematic_skill_preflight(**self.arguments)
        for overrides in [
            {"submitted_preflight": {**preflight, "request_digest": "0" * 64}},
            {"submitted_preflight": preflight, "model_id": "agnes-video-v2.0"},
            {
                "submitted_preflight": preflight,
                "canvas_nodes": [{
                    **self.reference,
                    "content": {**self.reference["content"], "asset_id": "asset-b"},
                }],
            },
        ]:
            with self.assertRaises(CinematicSkillContractError):
                validate_cinematic_generation_handoff(**{**self.arguments, **overrides})


class CinematicSkillApiTests(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        app.include_router(router)
        app.dependency_overrides[current_user] = lambda: {"id": "user-1"}
        self.client = TestClient(app)
        self.path = "/api/projects/project-1/canvases/canvas-1/agent-skills"
        self.reference = {
            "id": "reference-a",
            "node_type": "asset",
            "content": {
                "serialization_version": 1,
                "subtype": "image",
                "title": "Reference",
                "asset_id": "asset-a",
            },
            "parent_node_id": None,
            "status": "active",
        }

    def tearDown(self):
        self.client.close()

    @patch("api.agent_skills.document_controller.get_document")
    @patch("api.agent_skills.canvas_controller.get_canvas")
    def test_authenticated_v2_discovery_sources_and_preflight_share_canvas_scope(
        self,
        get_canvas,
        get_document,
    ):
        get_canvas.return_value = {"id": "canvas-1"}
        get_document.return_value = {"revision": 4, "nodes": [self.reference]}

        registry = self.client.get(self.path, params={"contract_version": 2})
        capabilities = self.client.get(self.path + "/cinematic-capabilities")
        sources = self.client.get(self.path + "/cinematic-sources")
        source_revision = sources.json()["items"][0]["source_revision"]
        preflight = self.client.post(self.path + "/cinematic-preflight", json={
            "skill_id": "revid.cinema-image",
            "skill_version": 1,
            "canvas_revision": 4,
            "provider_id": "agnes",
            "model_id": "agnes-image-2.1-flash",
            "user_instruction": "生成一致的角色海报",
            "mentions": [{
                "node_id": "reference-a",
                "role": "identity",
                "instruction": "保持角色身份",
                "source_revision": source_revision,
            }],
            "generation_parameters": {"aspect_ratio": "4:3"},
        })

        self.assertEqual(200, registry.status_code, registry.text)
        self.assertEqual(2, registry.json()["contract_version"])
        self.assertEqual(4, len(registry.json()["skills"]))
        self.assertEqual(200, capabilities.status_code, capabilities.text)
        self.assertEqual("agnes", capabilities.json()["providers"][0]["id"])
        self.assertEqual(200, sources.status_code, sources.text)
        self.assertEqual(200, preflight.status_code, preflight.text)
        self.assertEqual("revid.cinema-image", preflight.json()["skill"]["id"])
        self.assertEqual("asset-a", preflight.json()["references"][0]["asset_id"])
        self.assertEqual(404, self.client.post(self.path + "/execute", json={}).status_code)
        self.assertEqual(4, get_canvas.call_count)

    @patch("api.agent_skills.document_controller.get_document")
    @patch("api.agent_skills.canvas_controller.get_canvas")
    def test_revision_and_source_drift_fail_before_native_handoff(self, get_canvas, get_document):
        get_canvas.return_value = {"id": "canvas-1"}
        get_document.return_value = {"revision": 4, "nodes": [self.reference]}
        body = {
            "skill_id": "revid.cinema-image",
            "skill_version": 1,
            "canvas_revision": 3,
            "provider_id": "agnes",
            "model_id": "agnes-image-2.1-flash",
            "user_instruction": "生成一致的角色海报",
            "mentions": [{
                "node_id": "reference-a",
                "role": "identity",
                "instruction": "保持角色身份",
                "source_revision": "0" * 64,
            }],
            "generation_parameters": {"aspect_ratio": "4:3"},
        }
        revision_drift = self.client.post(self.path + "/cinematic-preflight", json=body)
        source_drift = self.client.post(
            self.path + "/cinematic-preflight",
            json={**body, "canvas_revision": 4},
        )

        self.assertEqual(409, revision_drift.status_code)
        self.assertEqual(422, source_drift.status_code)


class CinematicNativeHandoffBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.reference = {
            "id": "reference-a",
            "node_type": "asset",
            "content": {
                "serialization_version": 1,
                "subtype": "image",
                "title": "Reference",
                "asset_id": "asset-a",
            },
            "parent_node_id": None,
            "status": "active",
        }
        self.mention = {
            "node_id": "reference-a",
            "role": "identity",
            "instruction": "保持角色身份",
            "source_revision": cinematic_source_revision(self.reference),
        }
        self.arguments = {
            "skill_id": "revid.cinema-image",
            "skill_version": 1,
            "project_id": "project-1",
            "canvas_id": "canvas-1",
            "canvas_revision": 5,
            "provider_id": "agnes",
            "model_id": "agnes-image-2.1-flash",
            "user_instruction": "生成一致的角色海报",
            "mentions": [self.mention],
            "generation_parameters": {"image_ids": [], "aspect_ratio": "4:3"},
            "canvas_nodes": [self.reference],
        }
        self.preflight = build_cinematic_skill_preflight(**self.arguments)
        self.handoff = CinematicGenerationHandoff.model_validate({
            "skill_id": self.arguments["skill_id"],
            "skill_version": 1,
            "canvas_revision": 5,
            "provider_id": "agnes",
            "model_id": "agnes-image-2.1-flash",
            "user_instruction": self.arguments["user_instruction"],
            "mentions": [self.mention],
            "generation_parameters": self.arguments["generation_parameters"],
            "submitted_preflight": self.preflight,
        })

    @patch("api.generation_common.document_controller.get_document")
    def test_exact_native_handoff_revalidates_current_canvas_before_transaction(self, get_document):
        get_document.return_value = {"revision": 5, "nodes": [self.reference]}
        result = resolve_cinematic_generation_handoff(
            self.handoff,
            user_id="user-1",
            project_id="project-1",
            canvas_id="canvas-1",
            media_type="image",
            provider_id="agnes",
            model_id="agnes-image-2.1-flash",
            prompt=self.preflight["canonical_request"]["optimized_prompt"],
            image_ids=["asset-a"],
            expected_control_parameters={"aspect_ratio": "4:3"},
        )
        self.assertEqual(self.preflight["request_digest"], result["request_digest"])
        self.assertEqual(self.preflight["canonical_request"], result["request_snapshot"]["canonical_request"])

    @patch("api.generation_common.document_controller.get_document")
    def test_media_revision_and_provider_request_drift_fail_closed(self, get_document):
        cases = [
            {"media_type": "video"},
            {"prompt": "drifted prompt"},
            {"image_ids": []},
        ]
        for overrides in cases:
            get_document.return_value = {"revision": 5, "nodes": [self.reference]}
            call_arguments = {
                "user_id": "user-1",
                "project_id": "project-1",
                "canvas_id": "canvas-1",
                "media_type": "image",
                "provider_id": "agnes",
                "model_id": "agnes-image-2.1-flash",
                "prompt": self.preflight["canonical_request"]["optimized_prompt"],
                "image_ids": ["asset-a"],
                "expected_control_parameters": {"aspect_ratio": "4:3"},
                **overrides,
            }
            with self.assertRaises(HTTPException) as raised:
                resolve_cinematic_generation_handoff(self.handoff, **call_arguments)
            self.assertEqual(409, raised.exception.status_code)


class CinematicScriptGenerationTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.script = {
            "id": "script-a",
            "node_type": "script",
            "content": {
                "serialization_version": 1,
                "subtype": "script",
                "title": "Story",
                "text": "人物走入黄昏海岸。",
            },
            "parent_node_id": None,
            "status": "active",
        }
        source_revision = cinematic_source_revision(self.script)
        arguments = {
            "skill_id": "revid.cinema-script",
            "skill_version": 1,
            "project_id": "project-1",
            "canvas_id": "canvas-1",
            "canvas_revision": 7,
            "provider_id": "agnes",
            "model_id": "agnes-2.0-flash",
            "user_instruction": "拆成两个可生成镜头",
            "mentions": [{
                "node_id": "script-a", "role": "story", "instruction": "保持角色设定",
                "source_revision": source_revision,
            }],
            "generation_parameters": {"image_ids": [], "requested_shot_count": 2, "aspect_ratio": "16:9"},
            "canvas_nodes": [self.script],
        }
        preflight = build_cinematic_skill_preflight(**arguments)
        self.payload = TextGenerateRequest.model_validate({
            "project_id": "project-1", "origin_canvas_id": "canvas-1", "canvas_node_id": "script-a",
            "prompt": preflight["canonical_request"]["optimized_prompt"],
            "cinematic_handoff": {
                "skill_id": "revid.cinema-script", "skill_version": 1, "canvas_revision": 7,
                "provider_id": "agnes", "model_id": "agnes-2.0-flash",
                "user_instruction": arguments["user_instruction"], "mentions": arguments["mentions"],
                "generation_parameters": arguments["generation_parameters"], "submitted_preflight": preflight,
            },
        })
        self.document = {
            "contract_version": 2,
            "schema_id": "revid.shot-sequence",
            "skill_id": "revid.cinema-script",
            "skill_version": 1,
            "source_script_node_id": "script-a",
            "source_revision": source_revision,
            "aspect_ratio": "16:9",
            "shot_count": 2,
            "story_structure": "建立与推进",
            "character_consistency": "保持主角身份",
            "shots": [{
                "shot_id": f"shot-{index:02d}", "index": index, "title": f"镜头 {index:02d}",
                "narrative": "人物入画", "dialogue": None, "characters": ["主角"], "wardrobe": "深色外套",
                "scene": "黄昏海岸", "action": "稳定行走", "framing_camera": "中景推进",
                "duration_seconds": 5, "image_prompt": "黄昏海岸中景", "video_prompt": "稳定推进",
                "generatable": True, "generatability_reason": None,
            } for index in (1, 2)],
        }

    @patch("api.text_generate.generation_controller.complete_generation_task")
    @patch("api.text_generate.generation_controller.start_generation_task")
    @patch("api.generation_common.document_controller.get_document")
    async def test_strict_script_output_uses_existing_text_task_and_exact_snapshot(
        self, get_document, start_task, complete_task,
    ):
        get_document.return_value = {"revision": 7, "nodes": [self.script]}
        start_task.return_value = {"id": "task-script"}
        complete_task.return_value = {"asset": {"id": "asset-script"}, "generation_task": {"id": "task-script"}}

        class Provider:
            async def chat(inner_self, **kwargs):
                self.assertEqual(self.payload.prompt, kwargs["messages"][0]["content"])
                return {"choices": [{"message": {"content": __import__("json").dumps(self.document)}}], "id": "provider-script"}

        result = await text_generate(self.payload, user={"id": "user-1"}, provider=Provider())
        self.assertEqual(2, __import__("json").loads(result["content"])["contract_version"])
        snapshot = start_task.call_args.kwargs["request_parameters"]["cinematic_skill"]
        self.assertEqual(self.payload.cinematic_handoff.submitted_preflight["request_digest"], snapshot["request_digest"])
        complete_task.assert_called_once()

    @patch("api.text_generate.generation_controller.fail_generation_task")
    @patch("api.text_generate.generation_controller.start_generation_task")
    @patch("api.generation_common.document_controller.get_document")
    async def test_malformed_script_provider_output_never_mutates_canvas(self, get_document, start_task, fail_task):
        get_document.return_value = {"revision": 7, "nodes": [self.script]}
        start_task.return_value = {"id": "task-script"}

        class Provider:
            async def chat(_self, **_kwargs):
                return {"choices": [{"message": {"content": "not strict json"}}]}

        with self.assertRaises(HTTPException):
            await text_generate(self.payload, user={"id": "user-1"}, provider=Provider())
        fail_task.assert_called_once()


if __name__ == "__main__":
    unittest.main()
