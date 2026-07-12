from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import main as backend_main
from api.router import include_routers
from controllers.store import DatabaseStore, configure_store, store
from core.security import create_token
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

    def tearDown(self) -> None:
        self.client.close()

    def test_image_generate_success_creates_image_asset_and_deducts_quota(self) -> None:
        fake_provider = _FakeAgnesProvider()
        original_quota = store.quotas[self.user["id"]]["image"]

        with patch.object(backend_main, "_agnes", fake_provider):
            response = self.client.post(
                "/api/image-generate",
                json={"prompt": "Create a cinematic cover frame"},
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
            source="upload",
        )

        with patch.object(backend_main, "_agnes", fake_provider):
            response = self.client.post(
                "/api/image-generate",
                json={
                    "prompt": "Make this frame brighter",
                    "image_ids": [source_asset["id"]],
                },
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
                json={"prompt": "Fail this image request"},
                headers=self._auth_headers(self.user["id"]),
            )

        self.assertEqual(500, response.status_code)
        self.assertEqual("Agnes image generation failed", response.json()["detail"])
        self.assertEqual(original_quota, store.quotas[self.user["id"]]["image"])
        tasks, total = store.list_generation_tasks(self.user["id"], media_type="image")
        self.assertEqual(1, total)
        self.assertEqual("failed", tasks[0]["status"])
        self.assertEqual("provider_error", tasks[0]["error_code"])

    def test_image_generate_asset_failure_refunds_quota(self) -> None:
        fake_provider = _FakeAgnesProvider()
        original_quota = store.quotas[self.user["id"]]["image"]

        def failing_create_asset(*args, **kwargs):
            raise RuntimeError("db write failed")

        with patch.object(backend_main, "_agnes", fake_provider):
            with patch.object(store, "create_asset", side_effect=failing_create_asset):
                response = self.client.post(
                    "/api/image-generate",
                    json={"prompt": "Generate then fail saving"},
                    headers=self._auth_headers(self.user["id"]),
                )

        self.assertEqual(500, response.status_code)
        self.assertEqual("Failed to save generated asset", response.json()["detail"])
        self.assertEqual(original_quota, store.quotas[self.user["id"]]["image"])
        tasks, total = store.list_generation_tasks(self.user["id"], media_type="image")
        self.assertEqual(1, total)
        self.assertEqual("failed", tasks[0]["status"])
        self.assertEqual("asset_persistence_error", tasks[0]["error_code"])
        refund_records = [
            record
            for record in store.quota_ledger
            if record["user_id"] == self.user["id"] and record["reason"] == "image_generate_refund"
        ]
        self.assertEqual(1, len(refund_records))

    def test_image_generate_requires_available_quota(self) -> None:
        store.grant_quota(self.user["id"], "image", -store.quotas[self.user["id"]]["image"], "drain_for_test", None)

        response = self.client.post(
            "/api/image-generate",
            json={"prompt": "Try without quota"},
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(403, response.status_code)
        self.assertEqual("Insufficient image quota", response.json()["detail"])

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
