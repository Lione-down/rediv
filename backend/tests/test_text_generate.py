from __future__ import annotations

import hashlib
import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

import httpx
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import event

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import main as backend_main
from api.router import include_routers
from controllers import quotas as quota_controller
from controllers.store import DatabaseStore, configure_store, store
from core.security import create_token
from models.asset import Asset
from tests.mysql_test_database import MySQLTestDatabase


class _FakeAgnesProvider:
    def __init__(self, response: dict | None = None, error: Exception | None = None) -> None:
        self.response = response or {"choices": [{"message": {"content": "Generated storyboard"}}]}
        self.error = error
        self.calls: list[dict] = []

    async def chat(self, model: str, messages: list[dict], **kwargs) -> dict:
        self.calls.append({"model": model, "messages": messages, "kwargs": kwargs})
        if self.error is not None:
            raise self.error
        return self.response


class TextGenerateApiTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.mysql_database = MySQLTestDatabase("revid_test_text_generate")
        self.mysql_database.start()
        self.addCleanup(self.mysql_database.stop)
        configure_store(DatabaseStore())

        app = FastAPI()
        include_routers(app)
        self.client = TestClient(app)

        store.registration_settings["registration_mode"] = "open"
        auth_payload = self._register_user("text-generate-user").json()
        self.user = auth_payload["user"]
        self.project = store.create_project(self.user["id"], "Text Generation Project")
        self.node = store.create_node(
            self.project["id"],
            self.user["id"],
            "text",
            {"text": "Node content"},
            100,
            200,
            320,
            180,
        )

    def tearDown(self) -> None:
        self.client.close()

    def test_text_generate_success_creates_prompt_asset_and_deducts_quota(self) -> None:
        fake_provider = _FakeAgnesProvider(
            response={"choices": [{"message": {"content": "Scene 1: Opening shot"}}]},
        )
        original_quota = store.quotas[self.user["id"]]["text"]

        with patch.object(backend_main, "_agnes", fake_provider):
            response = self.client.post(
                "/api/text-generate",
                json={
                    "project_id": self.project["id"],
                    "node_id": self.node["id"],
                    "prompt": "Write a short video script",
                },
                headers=self._auth_headers(self.user["id"]),
            )

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual("Scene 1: Opening shot", payload["content"])
        self.assertEqual("prompt", payload["asset"]["type"])
        self.assertEqual("generation", payload["asset"]["source"])
        self.assertEqual("agnes-2.0-flash", payload["asset"]["source_model"])
        self.assertEqual(self.project["id"], payload["asset"]["project_id"])
        self.assertEqual(self.node["canvas_id"], payload["asset"]["origin_canvas_id"])
        self.assertEqual(self.node["id"], payload["asset"]["canvas_node_id"])
        self.assertEqual(payload["generation_task"]["id"], payload["asset"]["source_task_id"])
        self.assertEqual("succeeded", payload["generation_task"]["status"])
        self.assertEqual(payload["asset"]["id"], payload["generation_task"]["result_asset_id"])
        self.assertEqual("text", payload["generation_task"]["media_type"])
        self.assertEqual(self.project["id"], payload["generation_task"]["project_id"])
        self.assertEqual(self.node["canvas_id"], payload["generation_task"]["origin_canvas_id"])
        self.assertEqual(self.node["id"], payload["generation_task"]["canvas_node_id"])
        self.assertEqual(original_quota - 1, payload["quotas"]["text"])
        self.assertEqual(original_quota - 1, store.quotas[self.user["id"]]["text"])
        self.assertEqual("agnes-2.0-flash", fake_provider.calls[0]["model"])
        self.assertEqual("Write a short video script", fake_provider.calls[0]["messages"][0]["content"])

        task_response = self.client.get(
            f"/api/generation-tasks/{payload['generation_task']['id']}",
            headers=self._auth_headers(self.user["id"]),
        )
        self.assertEqual(200, task_response.status_code)
        self.assertEqual(payload["asset"]["id"], task_response.json()["result_asset_id"])

    def test_script_draft_uses_backend_template_and_persists_lineage(self) -> None:
        source = store.create_node(
            self.project["id"], self.user["id"], "script",
            {"subtype": "script", "serialization_version": 1, "text": ""},
            420, 200, 320, 200,
        )
        fake_provider = _FakeAgnesProvider(
            response={"id": "request-script-draft", "choices": [{"message": {"content": "第一场：雨夜车站。"}}]},
        )

        with patch.object(backend_main, "_agnes", fake_provider):
            response = self.client.post(
                "/api/text-generate",
                json={
                    "project_id": self.project["id"],
                    "origin_canvas_id": source["canvas_id"],
                    "canvas_node_id": source["id"],
                    "intent": "script_draft",
                    "brief": "一名摄影师在雨夜寻找失踪的胶卷。",
                    "locale": "zh-CN",
                    "canvas_revision": 0,
                },
                headers=self._auth_headers(self.user["id"]),
            )

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual("第一场：雨夜车站。", payload["content"])
        self.assertEqual("script_draft", payload["script_authoring"]["intent"])
        self.assertEqual(source["id"], payload["script_authoring"]["source_node_id"])
        self.assertEqual("agnes-2.0-flash", payload["script_authoring"]["source_model"])
        self.assertEqual(payload["generation_task"]["id"], payload["script_authoring"]["source_task_id"])
        self.assertEqual("system", fake_provider.calls[0]["messages"][0]["role"])
        self.assertIn("editable script", fake_provider.calls[0]["messages"][0]["content"])
        self.assertNotEqual("一名摄影师在雨夜寻找失踪的胶卷。", fake_provider.calls[0]["messages"][0]["content"])

        task = self.client.get(
            f"/api/generation-tasks/{payload['generation_task']['id']}",
            headers=self._auth_headers(self.user["id"]),
        ).json()
        snapshot = task["request_parameters"]["script_authoring"]
        self.assertEqual("script_draft", snapshot["intent"])
        self.assertEqual(source["id"], snapshot["source_node_id"])
        self.assertEqual(0, snapshot["canvas_revision"])
        self.assertRegex(snapshot["brief_digest"], r"^[a-f0-9]{64}$")
        self.assertNotIn("brief", snapshot)

    def test_script_draft_uses_selected_capability_model_end_to_end(self) -> None:
        source = store.create_node(
            self.project["id"], self.user["id"], "script",
            {"subtype": "script", "serialization_version": 1, "text": ""},
            420, 200, 320, 200,
        )
        fake_provider = _FakeAgnesProvider(
            response={"id": "request-script-25", "choices": [{"message": {"content": "第一场：海边日出。"}}]},
        )

        with patch.object(backend_main, "_agnes", fake_provider):
            response = self.client.post(
                "/api/text-generate",
                json={
                    "project_id": self.project["id"],
                    "origin_canvas_id": source["canvas_id"],
                    "canvas_node_id": source["id"],
                    "model_id": "agnes-2.5-flash",
                    "intent": "script_draft",
                    "brief": "一名摄影师在海边等待日出。",
                    "locale": "zh-CN",
                    "canvas_revision": 0,
                },
                headers=self._auth_headers(self.user["id"]),
            )

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual("agnes-2.5-flash", fake_provider.calls[0]["model"])
        self.assertEqual("agnes-2.5-flash", payload["generation_task"]["model"])
        self.assertEqual("agnes-2.5-flash", payload["asset"]["source_model"])
        self.assertEqual("agnes-2.5-flash", payload["script_authoring"]["source_model"])

    def test_script_rejects_model_outside_capability_before_task_or_provider(self) -> None:
        source = store.create_node(
            self.project["id"], self.user["id"], "script",
            {"subtype": "script", "serialization_version": 1, "text": ""},
            420, 200, 320, 200,
        )
        fake_provider = _FakeAgnesProvider()

        with patch.object(backend_main, "_agnes", fake_provider):
            response = self.client.post(
                "/api/text-generate",
                json={
                    "project_id": self.project["id"],
                    "origin_canvas_id": source["canvas_id"],
                    "canvas_node_id": source["id"],
                    "model_id": "agnes-unknown",
                    "intent": "script_draft",
                    "brief": "生成一段短片脚本。",
                    "locale": "zh-CN",
                    "canvas_revision": 0,
                },
                headers=self._auth_headers(self.user["id"]),
            )

        self.assertEqual(422, response.status_code)
        self.assertEqual("text_model_unsupported", response.json()["detail"]["code"])
        self.assertEqual([], fake_provider.calls)
        _, total = store.list_generation_tasks(self.user["id"], media_type="text")
        self.assertEqual(0, total)

    def test_story_director_uses_connected_prompt_and_returns_validated_production(self) -> None:
        prompt_text = "一个女孩在暴雨后的城市寻找走失的机器狗。"
        prompt_source = store.create_node(
            self.project["id"], self.user["id"], "script",
            {"subtype": "prompt", "serialization_version": 1, "text": prompt_text},
            80, 420, 320, 180,
        )
        script_target = store.create_node(
            self.project["id"], self.user["id"], "script",
            {"subtype": "script", "serialization_version": 1, "text": ""},
            520, 420, 320, 200,
        )
        store.create_connection(
            self.project["id"], self.user["id"],
            prompt_source["id"], "out", script_target["id"], "in",
        )
        source_revision = hashlib.sha256(
            f"{prompt_source['id']}\n{prompt_text}".encode("utf-8")
        ).hexdigest()
        provider_storyboard = {
            "schema_id": "revid.provider-storyboard",
            "schema_version": 1,
            "summary": "A displaced writer survives the Tang court through poetry.",
            "assets": {
                "roles": [{
                    "name": "Shen Zhaozhao",
                    "description": "A modern writer wearing a Tang official robe.",
                    "image_prompt": "Shen Zhaozhao in a Tang official robe.",
                }],
                "scenes": [{
                    "name": "Tang throne hall",
                    "description": "A vast throne hall lined with court officials.",
                    "image_prompt": "Epic Tang throne hall with court officials.",
                }],
                "props": [],
            },
            "shots": [{
                "shot_number": index,
                "duration_seconds": 6,
                "visual_description": f"Shot {index} advances the court confrontation.",
                "framing": "medium",
                "scene": "Tang throne hall",
                "roles": ["Shen Zhaozhao"],
                "props": [],
                "dialogue": "I will contend with the Tang." if index == 5 else "",
                "music_sfx": "Court drums and rising score.",
                "camera_movement": "slow push in",
                "image_prompt": f"Tang court shot {index}, consistent character.",
                "video_prompt": f"Shot {index}, slow push in, consistent character.",
            } for index in range(1, 11)],
        }
        fake_provider = _FakeAgnesProvider(response={
            "id": "request-story-director",
            "choices": [{
                "message": {
                    "content": None,
                    "tool_calls": [{
                        "type": "function",
                        "function": {
                            "name": "submit_revid_storyboard",
                            "arguments": json.dumps(provider_storyboard),
                        },
                    }],
                },
            }],
        })

        with patch.object(backend_main, "_agnes", fake_provider):
            response = self.client.post(
                "/api/text-generate",
                json={
                    "project_id": self.project["id"],
                    "origin_canvas_id": script_target["canvas_id"],
                    "canvas_node_id": script_target["id"],
                    "intent": "script_draft",
                    "brief": "生成完整分镜，保持人物关系和结局。",
                    "locale": "zh-CN",
                    "canvas_revision": 0,
                    "story_director": {
                        "contract_version": 1,
                        "source_node_ids": [prompt_source["id"]],
                    },
                },
                headers=self._auth_headers(self.user["id"]),
            )

        self.assertEqual(200, response.status_code, response.text)
        payload = response.json()
        story_production = payload["story_production"]
        self.assertEqual("revid.story-production", story_production["schema_id"])
        self.assertEqual(script_target["id"], story_production["source_node_id"])
        self.assertEqual(source_revision, story_production["source_revision"])
        self.assertEqual(10, len(story_production["shots"]))
        self.assertEqual(
            list(range(1, 11)),
            [shot["shot_number"] for shot in story_production["shots"]],
        )
        self.assertEqual(provider_storyboard["summary"], payload["content"])
        self.assertIn(prompt_text, fake_provider.calls[0]["messages"][1]["content"])
        self.assertIn("生成完整分镜", fake_provider.calls[0]["messages"][1]["content"])
        tools = fake_provider.calls[0]["kwargs"]["tools"]
        self.assertEqual("submit_revid_storyboard", tools[0]["function"]["name"])
        self.assertEqual(
            {
                "type": "function",
                "function": {"name": "submit_revid_storyboard"},
            },
            fake_provider.calls[0]["kwargs"]["tool_choice"],
        )
        request_parameters = payload["generation_task"]["request_parameters"]
        snapshot = request_parameters["story_director"]
        self.assertEqual([prompt_source["id"]], snapshot["source_node_ids"])
        self.assertEqual(source_revision, snapshot["source_revision"])
        self.assertNotIn("source_text", snapshot)
        authoring_snapshot = request_parameters["script_authoring"]
        self.assertEqual(script_target["id"], authoring_snapshot["source_node_id"])
        self.assertEqual("script_draft", authoring_snapshot["intent"])

    def test_script_draft_resolves_owned_public_image_references(self) -> None:
        source = store.create_node(
            self.project["id"], self.user["id"], "script",
            {"subtype": "script", "serialization_version": 1, "text": ""},
            420, 200, 320, 200,
        )
        reference = store.create_asset(
            self.user["id"], "image", "https://media.revid.test/reference.png", "海边参考图",
            project_id=self.project["id"], origin_canvas_id=source["canvas_id"],
        )
        fake_provider = _FakeAgnesProvider(
            response={"choices": [{"message": {"content": "第一场：海边。"}}]},
        )

        with patch.object(backend_main, "_agnes", fake_provider):
            response = self.client.post(
                "/api/text-generate",
                json={
                    "project_id": self.project["id"],
                    "origin_canvas_id": source["canvas_id"],
                    "canvas_node_id": source["id"],
                    "intent": "script_draft",
                    "brief": "人物走向海边。",
                    "locale": "zh-CN",
                    "canvas_revision": 0,
                    "reference_asset_ids": [reference["id"]],
                },
                headers=self._auth_headers(self.user["id"]),
            )

        self.assertEqual(200, response.status_code)
        user_content = fake_provider.calls[0]["messages"][1]["content"]
        self.assertEqual("text", user_content[0]["type"])
        self.assertEqual("image_url", user_content[1]["type"])
        self.assertEqual(reference["url"], user_content[1]["image_url"]["url"])
        snapshot = response.json()["generation_task"]["request_parameters"]["script_authoring"]
        self.assertEqual([reference["id"]], snapshot["reference_asset_ids"])

    def test_script_draft_rejects_non_public_image_before_provider_or_task(self) -> None:
        source = store.create_node(
            self.project["id"], self.user["id"], "script",
            {"subtype": "script", "serialization_version": 1, "text": ""},
            420, 200, 320, 200,
        )
        reference = store.create_asset(
            self.user["id"], "image", "/uploads/local-reference.png", None,
            project_id=self.project["id"], origin_canvas_id=source["canvas_id"],
        )
        fake_provider = _FakeAgnesProvider()

        with patch.object(backend_main, "_agnes", fake_provider):
            response = self.client.post(
                "/api/text-generate",
                json={
                    "project_id": self.project["id"],
                    "origin_canvas_id": source["canvas_id"],
                    "canvas_node_id": source["id"],
                    "intent": "script_draft",
                    "brief": "人物走向海边。",
                    "locale": "zh-CN",
                    "canvas_revision": 0,
                    "reference_asset_ids": [reference["id"]],
                },
                headers=self._auth_headers(self.user["id"]),
            )

        self.assertEqual(422, response.status_code)
        self.assertEqual("script_reference_unavailable", response.json()["detail"]["code"])
        self.assertEqual([], fake_provider.calls)
        _, total = store.list_generation_tasks(self.user["id"], media_type="text")
        self.assertEqual(0, total)

    def test_script_refine_rejects_stale_source_before_task_or_provider(self) -> None:
        source = store.create_node(
            self.project["id"], self.user["id"], "script",
            {"subtype": "script", "serialization_version": 1, "text": "Current script"},
            420, 200, 320, 200,
        )
        fake_provider = _FakeAgnesProvider()

        with patch.object(backend_main, "_agnes", fake_provider):
            response = self.client.post(
                "/api/text-generate",
                json={
                    "project_id": self.project["id"],
                    "origin_canvas_id": source["canvas_id"],
                    "canvas_node_id": source["id"],
                    "intent": "script_refine",
                    "source_text": "Stale script",
                    "instruction": "Improve pacing",
                    "locale": "en-US",
                    "canvas_revision": 0,
                },
                headers=self._auth_headers(self.user["id"]),
            )

        self.assertEqual(409, response.status_code)
        self.assertEqual("script_source_stale", response.json()["detail"]["code"])
        self.assertEqual([], fake_provider.calls)
        _, total = store.list_generation_tasks(self.user["id"], media_type="text")
        self.assertEqual(0, total)

    def test_text_generate_failure_does_not_deduct_quota(self) -> None:
        fake_provider = _FakeAgnesProvider(error=RuntimeError("provider failed"))
        original_quota = store.quotas[self.user["id"]]["text"]

        with patch.object(backend_main, "_agnes", fake_provider):
            response = self.client.post(
                "/api/text-generate",
                json={
                    "project_id": self.project["id"],
                    "node_id": self.node["id"],
                    "prompt": "Fail this request",
                },
                headers=self._auth_headers(self.user["id"]),
            )

        self.assertEqual(500, response.status_code)
        self.assertEqual(
            {
                "code": "provider_error",
                "message": "脚本模型服务暂时不可用，请稍后重试。",
                "retryable": True,
            },
            response.json()["detail"],
        )
        self.assertEqual(original_quota, store.quotas[self.user["id"]]["text"])
        tasks, total = store.list_generation_tasks(self.user["id"], media_type="text")
        self.assertEqual(1, total)
        self.assertEqual("failed", tasks[0]["status"])
        self.assertEqual("provider_error", tasks[0]["error_code"])

    def test_script_invalid_provider_result_returns_actionable_structured_detail(self) -> None:
        source = store.create_node(
            self.project["id"], self.user["id"], "script",
            {"subtype": "script", "serialization_version": 1, "text": ""},
            420, 200, 320, 200,
        )
        fake_provider = _FakeAgnesProvider(response={"choices": []})

        with patch.object(backend_main, "_agnes", fake_provider):
            response = self.client.post(
                "/api/text-generate",
                json={
                    "project_id": self.project["id"],
                    "origin_canvas_id": source["canvas_id"],
                    "canvas_node_id": source["id"],
                    "intent": "script_draft",
                    "brief": "生成一段短片脚本。",
                    "locale": "zh-CN",
                    "canvas_revision": 0,
                },
                headers=self._auth_headers(self.user["id"]),
            )

        self.assertEqual(500, response.status_code)
        self.assertEqual(
            {
                "code": "provider_result_invalid",
                "message": "模型返回的脚本或分镜结构无效，请调整生成要求后重试。",
                "retryable": False,
                "diagnostic": {
                    "stage": "provider_response_validation",
                    "contract": "text-generation.v1",
                },
            },
            response.json()["detail"],
        )

    def test_text_generate_network_failure_records_failed_task(self) -> None:
        request = httpx.Request("POST", "https://apihub.agnes-ai.com/v1/chat/completions")
        fake_provider = _FakeAgnesProvider(error=httpx.ConnectError("network down", request=request))
        original_quota = store.quotas[self.user["id"]]["text"]

        with patch.object(backend_main, "_agnes", fake_provider):
            response = self.client.post(
                "/api/text-generate",
                json={
                    "project_id": self.project["id"],
                    "node_id": self.node["id"],
                    "prompt": "Fail on the network",
                },
                headers=self._auth_headers(self.user["id"]),
            )

        self.assertEqual(500, response.status_code)
        self.assertEqual(original_quota, store.quotas[self.user["id"]]["text"])
        tasks, total = store.list_generation_tasks(self.user["id"], media_type="text")
        self.assertEqual(1, total)
        self.assertEqual("failed", tasks[0]["status"])
        self.assertEqual("network_error", tasks[0]["error_code"])

    def test_text_generate_asset_failure_is_not_charged(self) -> None:
        fake_provider = _FakeAgnesProvider()
        original_quota = store.quotas[self.user["id"]]["text"]

        def fail_generated_asset(_mapper, _connection, target: Asset) -> None:
            if target.source == "generation":
                raise RuntimeError("db write failed")

        event.listen(Asset, "before_insert", fail_generated_asset)
        try:
            with patch.object(backend_main, "_agnes", fake_provider):
                response = self.client.post(
                    "/api/text-generate",
                    json={
                        "project_id": self.project["id"],
                        "node_id": self.node["id"],
                        "prompt": "Generate then fail saving",
                    },
                    headers=self._auth_headers(self.user["id"]),
                )
        finally:
            event.remove(Asset, "before_insert", fail_generated_asset)

        self.assertEqual(500, response.status_code)
        self.assertEqual("Failed to save generated asset", response.json()["detail"])
        self.assertEqual(original_quota, store.quotas[self.user["id"]]["text"])
        tasks, total = store.list_generation_tasks(self.user["id"], media_type="text")
        self.assertEqual(1, total)
        self.assertEqual("failed", tasks[0]["status"])
        self.assertEqual("asset_persistence_error", tasks[0]["error_code"])
        generation_records = [
            record
            for record in quota_controller.list_quota_ledger(self.user["id"])
            if record["user_id"] == self.user["id"]
            and record["reason"] in {"text_generate", "text_generate_refund"}
        ]
        self.assertEqual([], generation_records)

    def test_text_generate_requires_available_quota(self) -> None:
        store.grant_quota(self.user["id"], "text", -store.quotas[self.user["id"]]["text"], "drain_for_test", None)

        response = self.client.post(
            "/api/text-generate",
            json={
                "project_id": self.project["id"],
                "node_id": self.node["id"],
                "prompt": "Try without quota",
            },
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(403, response.status_code)
        self.assertEqual("Insufficient text quota", response.json()["detail"])

    def _register_user(self, openid: str):
        return self.client.post(
            "/auth/wechat/mock",
            json={
                "openid": openid,
                "nickname": f"user-{openid}",
                "avatar_url": "",
                "unionid": None,
                "invitation_code": None,
            },
        )

    @staticmethod
    def _auth_headers(user_id: str) -> dict[str, str]:
        token = create_token({"sub": user_id, "role": "user"})
        return {"Authorization": f"Bearer {token}"}


if __name__ == "__main__":
    unittest.main()
