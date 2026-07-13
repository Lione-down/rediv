from __future__ import annotations

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
        self.assertEqual("Agnes text generation failed", response.json()["detail"])
        self.assertEqual(original_quota, store.quotas[self.user["id"]]["text"])
        tasks, total = store.list_generation_tasks(self.user["id"], media_type="text")
        self.assertEqual(1, total)
        self.assertEqual("failed", tasks[0]["status"])
        self.assertEqual("provider_error", tasks[0]["error_code"])

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
            for record in store.quota_ledger
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
