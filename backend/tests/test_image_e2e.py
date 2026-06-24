from __future__ import annotations

import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import main as backend_main
from controllers.store import DatabaseStore, configure_store, store
from database import close_db, init_db


class ImageGenerationE2ETestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = TemporaryDirectory()
        db_path = str(Path(self.temp_dir.name) / "test-revid.db")
        init_db(db_path)
        configure_store(DatabaseStore())
        store.registration_settings["registration_mode"] = "open"
        self.client = TestClient(backend_main.app)

    def tearDown(self) -> None:
        self.client.close()
        close_db()
        self.temp_dir.cleanup()

    @patch.object(backend_main, "_agnes")
    def test_text_to_image_workflow_persists_asset_and_deducts_quota(self, mock_agnes) -> None:
        generated_url = "https://example.com/generated-poster.png"
        mock_agnes.generate_image = AsyncMock(return_value={"data": [{"url": generated_url}]})

        login_payload = self._login("image-e2e-text")
        token = login_payload["token"]
        user = login_payload["user"]
        original_quota = login_payload["quotas"]["image"]

        generate_response = self.client.post(
            "/api/image-generate",
            json={"prompt": "Create a bright summer poster"},
            headers=self._auth_headers(token),
        )
        self.assertEqual(200, generate_response.status_code)
        generate_payload = generate_response.json()
        asset = generate_payload["asset"]
        self.assertEqual(generated_url, generate_payload["url"])
        self.assertEqual("image", asset["type"])
        self.assertEqual("generation", asset["source"])
        self.assertEqual("agnes-image-2.1-flash", asset["source_model"])
        self.assertEqual(user["id"], asset["user_id"])

        assets_response = self.client.get("/assets?asset_type=image", headers=self._auth_headers(token))
        self.assertEqual(200, assets_response.status_code)
        assets_payload = assets_response.json()
        self.assertEqual(1, assets_payload["total"])
        self.assertEqual(asset["id"], assets_payload["items"][0]["id"])
        self.assertEqual(generated_url, assets_payload["items"][0]["url"])

        me_response = self.client.get("/me", headers=self._auth_headers(token))
        self.assertEqual(200, me_response.status_code)
        self.assertEqual(original_quota - 1, me_response.json()["quotas"]["image"])

        image_quota_records = [
            record
            for record in store.quota_ledger
            if record["user_id"] == user["id"] and record["reason"] == "image_generate"
        ]
        self.assertEqual(1, len(image_quota_records))
        self.assertEqual(-1, image_quota_records[0]["change_amount"])

        persisted_asset = store.get_asset(asset["id"])
        self.assertIsNotNone(persisted_asset)
        self.assertEqual(generated_url, persisted_asset["url"])
        self.assertEqual("agnes-image-2.1-flash", persisted_asset["source_model"])

        mock_agnes.generate_image.assert_awaited_once_with(
            model="agnes-image-2.1-flash",
            prompt="Create a bright summer poster",
            image=None,
        )

    @patch.object(backend_main, "_agnes")
    def test_image_to_image_workflow_uses_uploaded_asset_urls(self, mock_agnes) -> None:
        generated_url = "https://example.com/generated-remix.png"
        mock_agnes.generate_image = AsyncMock(return_value={"data": [{"url": generated_url}]})

        login_payload = self._login("image-e2e-remix")
        token = login_payload["token"]
        user = login_payload["user"]
        source_asset = store.create_asset(
            user["id"],
            "image",
            "https://example.com/source-frame.png",
            None,
            source="upload",
        )

        generate_response = self.client.post(
            "/api/image-generate",
            json={
                "prompt": "Turn this into a neon night scene",
                "image_ids": [source_asset["id"]],
            },
            headers=self._auth_headers(token),
        )
        self.assertEqual(200, generate_response.status_code)
        generated_asset = generate_response.json()["asset"]
        self.assertEqual("image", generated_asset["type"])
        self.assertEqual("generation", generated_asset["source"])

        mock_agnes.generate_image.assert_awaited_once_with(
            model="agnes-image-2.1-flash",
            prompt="Turn this into a neon night scene",
            image=["https://example.com/source-frame.png"],
        )

    @patch.object(backend_main, "_agnes")
    def test_image_generation_failure_keeps_quota_and_assets_unchanged(self, mock_agnes) -> None:
        mock_agnes.generate_image = AsyncMock(side_effect=RuntimeError("provider failed"))

        login_payload = self._login("image-e2e-failure")
        token = login_payload["token"]
        user = login_payload["user"]
        original_quota = login_payload["quotas"]["image"]

        generate_response = self.client.post(
            "/api/image-generate",
            json={"prompt": "Fail this image request"},
            headers=self._auth_headers(token),
        )
        self.assertEqual(500, generate_response.status_code)
        self.assertEqual("Agnes image generation failed", generate_response.json()["detail"])

        me_response = self.client.get("/me", headers=self._auth_headers(token))
        self.assertEqual(200, me_response.status_code)
        self.assertEqual(original_quota, me_response.json()["quotas"]["image"])

        assets_response = self.client.get("/assets?asset_type=image", headers=self._auth_headers(token))
        self.assertEqual(200, assets_response.status_code)
        self.assertEqual(0, assets_response.json()["total"])

        image_quota_records = [
            record
            for record in store.quota_ledger
            if record["user_id"] == user["id"] and record["reason"] == "image_generate"
        ]
        self.assertEqual([], image_quota_records)

    @patch.object(backend_main, "_agnes")
    def test_image_asset_persistence_failure_refunds_quota(self, mock_agnes) -> None:
        mock_agnes.generate_image = AsyncMock(
            return_value={"data": [{"url": "https://example.com/generated-but-unsaved.png"}]},
        )

        login_payload = self._login("image-e2e-refund")
        token = login_payload["token"]
        user = login_payload["user"]
        original_quota = login_payload["quotas"]["image"]

        with patch.object(store, "create_asset", side_effect=RuntimeError("db write failed")):
            generate_response = self.client.post(
                "/api/image-generate",
                json={"prompt": "Generate and fail persistence"},
                headers=self._auth_headers(token),
            )

        self.assertEqual(500, generate_response.status_code)
        self.assertEqual("Failed to save generated asset", generate_response.json()["detail"])

        me_response = self.client.get("/me", headers=self._auth_headers(token))
        self.assertEqual(200, me_response.status_code)
        self.assertEqual(original_quota, me_response.json()["quotas"]["image"])

        refund_records = [
            record
            for record in store.quota_ledger
            if record["user_id"] == user["id"] and record["reason"] == "image_generate_refund"
        ]
        self.assertEqual(1, len(refund_records))
        self.assertEqual(1, refund_records[0]["change_amount"])

    def test_image_generation_rejects_when_quota_is_empty(self) -> None:
        login_payload = self._login("image-e2e-no-quota")
        token = login_payload["token"]
        user = login_payload["user"]
        store.grant_quota(user["id"], "image", -store.quotas[user["id"]]["image"], "drain_for_test", None)

        generate_response = self.client.post(
            "/api/image-generate",
            json={"prompt": "Try to generate without quota"},
            headers=self._auth_headers(token),
        )
        self.assertEqual(403, generate_response.status_code)
        self.assertEqual("Insufficient image quota", generate_response.json()["detail"])

    def _login(self, openid: str) -> dict:
        response = self.client.post(
            "/auth/wechat/mock",
            json={
                "openid": openid,
                "nickname": f"user-{openid}",
                "avatar_url": "",
                "unionid": None,
                "invitation_code": None,
            },
        )
        self.assertEqual(200, response.status_code)
        return response.json()

    @staticmethod
    def _auth_headers(token: str) -> dict[str, str]:
        return {"Authorization": f"Bearer {token}"}


if __name__ == "__main__":
    unittest.main()
