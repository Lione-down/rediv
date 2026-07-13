from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch

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
        self.response = response or {"data": [{"url": "https://example.com/generated-image.png"}]}
        self.error = error
        self.calls: list[dict] = []

    async def generate_image(self, model: str, prompt: str, image: list[str] | None = None, **kwargs) -> dict:
        self.calls.append({"model": model, "prompt": prompt, "image": image, "kwargs": kwargs})
        if self.error is not None:
            raise self.error
        return self.response


class ImageGenerateApiTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.mysql_database = MySQLTestDatabase("revid_test_image_generate")
        self.mysql_database.start()
        self.addCleanup(self.mysql_database.stop)
        configure_store(DatabaseStore())

        app = FastAPI()
        include_routers(app)
        self.client = TestClient(app)

        store.registration_settings["registration_mode"] = "open"
        auth_payload = self._register_user("image-generate-user").json()
        self.user = auth_payload["user"]
        self.project = store.create_project(self.user["id"], "Image Generation Project")
        self.canvas_id = store.get_first_canvas_id(self.project["id"])
        self.node = store.create_node(
            self.project["id"], self.user["id"], "generation", {}, 0, 0, 320, 180
        )

    def tearDown(self) -> None:
        self.client.close()

    def test_image_generate_success_creates_image_asset_and_deducts_quota(self) -> None:
        fake_provider = _FakeAgnesProvider()
        original_quota = store.quotas[self.user["id"]]["image"]

        with patch.object(backend_main, "_agnes", fake_provider):
            response = self.client.post(
                "/api/image-generate",
                json=self._payload("Create a cinematic cover frame"),
                headers=self._auth_headers(self.user["id"]),
            )

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual("https://example.com/generated-image.png", payload["url"])
        self.assertEqual("image", payload["asset"]["type"])
        self.assertEqual("generation", payload["asset"]["source"])
        self.assertEqual("agnes-image-2.1-flash", payload["asset"]["source_model"])
        self.assertEqual(payload["generation_task"]["id"], payload["asset"]["source_task_id"])
        self.assertEqual("succeeded", payload["generation_task"]["status"])
        self.assertEqual(payload["asset"]["id"], payload["generation_task"]["result_asset_id"])
        self.assertEqual("image", payload["generation_task"]["media_type"])
        self.assertEqual(self.project["id"], payload["asset"]["project_id"])
        self.assertEqual(self.canvas_id, payload["asset"]["origin_canvas_id"])
        self.assertEqual(self.node["id"], payload["asset"]["canvas_node_id"])
        self.assertEqual(original_quota - 1, payload["quotas"]["image"])
        self.assertEqual(original_quota - 1, store.quotas[self.user["id"]]["image"])
        self.assertEqual("agnes-image-2.1-flash", fake_provider.calls[0]["model"])
        self.assertEqual("Create a cinematic cover frame", fake_provider.calls[0]["prompt"])
        self.assertIsNone(fake_provider.calls[0]["image"])

    def test_image_generate_uses_input_asset_urls_for_image_to_image(self) -> None:
        fake_provider = _FakeAgnesProvider()
        source_asset = store.create_asset(
            self.user["id"],
            "image",
            "https://example.com/source-image.png",
            None,
            project_id=self.project["id"],
            origin_canvas_id=self.canvas_id,
            source="upload",
        )

        with patch.object(backend_main, "_agnes", fake_provider):
            response = self.client.post(
                "/api/image-generate",
                json=self._payload(
                    "Make this frame brighter", image_ids=[source_asset["id"]]
                ),
                headers=self._auth_headers(self.user["id"]),
            )

        self.assertEqual(200, response.status_code)
        self.assertEqual(["https://example.com/source-image.png"], fake_provider.calls[0]["image"])

    def test_image_generate_failure_does_not_deduct_quota(self) -> None:
        fake_provider = _FakeAgnesProvider(error=RuntimeError("provider failed"))
        original_quota = store.quotas[self.user["id"]]["image"]

        with patch.object(backend_main, "_agnes", fake_provider):
            response = self.client.post(
                "/api/image-generate",
                json=self._payload("Fail this image request"),
                headers=self._auth_headers(self.user["id"]),
            )

        self.assertEqual(500, response.status_code)
        self.assertEqual("Agnes image generation failed", response.json()["detail"])
        self.assertEqual(original_quota, store.quotas[self.user["id"]]["image"])
        tasks, total = store.list_generation_tasks(self.user["id"], media_type="image")
        self.assertEqual(1, total)
        self.assertEqual("failed", tasks[0]["status"])
        self.assertEqual("provider_error", tasks[0]["error_code"])

    def test_image_generate_asset_failure_is_not_charged(self) -> None:
        fake_provider = _FakeAgnesProvider()
        original_quota = store.quotas[self.user["id"]]["image"]

        def fail_generated_asset(_mapper, _connection, target: Asset) -> None:
            if target.source == "generation":
                raise RuntimeError("db write failed")

        event.listen(Asset, "before_insert", fail_generated_asset)
        try:
            with patch.object(backend_main, "_agnes", fake_provider):
                response = self.client.post(
                    "/api/image-generate",
                    json=self._payload("Generate then fail saving"),
                    headers=self._auth_headers(self.user["id"]),
                )
        finally:
            event.remove(Asset, "before_insert", fail_generated_asset)

        self.assertEqual(500, response.status_code)
        self.assertEqual("Failed to save generated asset", response.json()["detail"])
        self.assertEqual(original_quota, store.quotas[self.user["id"]]["image"])
        tasks, total = store.list_generation_tasks(self.user["id"], media_type="image")
        self.assertEqual(1, total)
        self.assertEqual("failed", tasks[0]["status"])
        self.assertEqual("asset_persistence_error", tasks[0]["error_code"])
        generation_records = [
            record
            for record in store.quota_ledger
            if record["user_id"] == self.user["id"]
            and record["reason"] in {"image_generate", "image_generate_refund"}
        ]
        self.assertEqual([], generation_records)

    def test_image_generate_requires_available_quota(self) -> None:
        store.grant_quota(self.user["id"], "image", -store.quotas[self.user["id"]]["image"], "drain_for_test", None)

        response = self.client.post(
            "/api/image-generate",
            json=self._payload("Try without quota"),
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(403, response.status_code)
        self.assertEqual("Insufficient image quota", response.json()["detail"])

    def _payload(self, prompt: str, *, image_ids: list[str] | None = None) -> dict:
        payload = {
            "project_id": self.project["id"],
            "origin_canvas_id": self.canvas_id,
            "canvas_node_id": self.node["id"],
            "prompt": prompt,
        }
        if image_ids is not None:
            payload["image_ids"] = image_ids
        return payload

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
