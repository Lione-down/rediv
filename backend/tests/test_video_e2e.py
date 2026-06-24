from __future__ import annotations

import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import main as backend_main
from api import video_generate as video_generate_module
from controllers.store import DatabaseStore, configure_store, store
from database import close_db, init_db


class VideoGenerationE2ETestCase(unittest.TestCase):
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
    def test_video_generation_workflow_persists_asset_after_polling(self, mock_agnes) -> None:
        generated_url = "https://example.com/generated-video.mp4"
        mock_agnes.generate_video = AsyncMock(return_value={"video_id": "video-task-1"})
        mock_agnes.poll_video_result = AsyncMock(
            side_effect=[
                {"status": "processing"},
                {"status": "completed", "video_url": generated_url},
            ],
        )

        login_payload = self._login("video-e2e-success")
        token = login_payload["token"]
        user = login_payload["user"]
        original_quota = login_payload["quotas"]["video"]

        with patch.object(video_generate_module.asyncio, "sleep", new=self._fake_sleep):
            generate_response = self.client.post(
                "/api/video-generate",
                json={"prompt": "Create a high-energy product teaser"},
                headers=self._auth_headers(token),
            )

        self.assertEqual(200, generate_response.status_code)
        generate_payload = generate_response.json()
        asset = generate_payload["asset"]
        self.assertEqual("video-task-1", generate_payload["video_id"])
        self.assertEqual(generated_url, generate_payload["url"])
        self.assertEqual("video", asset["type"])
        self.assertEqual("generation", asset["source"])
        self.assertEqual("agnes-video-v2.0", asset["source_model"])
        self.assertEqual("video-task-1", asset["source_task_id"])
        self.assertEqual(user["id"], asset["user_id"])

        assets_response = self.client.get("/assets?asset_type=video", headers=self._auth_headers(token))
        self.assertEqual(200, assets_response.status_code)
        assets_payload = assets_response.json()
        self.assertEqual(1, assets_payload["total"])
        self.assertEqual(asset["id"], assets_payload["items"][0]["id"])
        self.assertEqual(generated_url, assets_payload["items"][0]["url"])

        me_response = self.client.get("/me", headers=self._auth_headers(token))
        self.assertEqual(200, me_response.status_code)
        self.assertEqual(original_quota - 1, me_response.json()["quotas"]["video"])

        video_quota_records = [
            record
            for record in store.quota_ledger
            if record["user_id"] == user["id"] and record["reason"] == "video_generate"
        ]
        self.assertEqual(1, len(video_quota_records))
        self.assertEqual(-1, video_quota_records[0]["change_amount"])

        persisted_asset = store.get_asset(asset["id"])
        self.assertIsNotNone(persisted_asset)
        self.assertEqual(generated_url, persisted_asset["url"])
        self.assertEqual("video-task-1", persisted_asset["source_task_id"])

        mock_agnes.generate_video.assert_awaited_once_with(
            model="agnes-video-v2.0",
            prompt="Create a high-energy product teaser",
        )
        self.assertEqual(2, mock_agnes.poll_video_result.await_count)
        mock_agnes.poll_video_result.assert_awaited_with("video-task-1")

    @patch.object(backend_main, "_agnes")
    def test_video_poll_failure_keeps_quota_and_assets_unchanged(self, mock_agnes) -> None:
        mock_agnes.generate_video = AsyncMock(return_value={"video_id": "video-task-fail"})
        mock_agnes.poll_video_result = AsyncMock(side_effect=RuntimeError("poll failed"))

        login_payload = self._login("video-e2e-failure")
        token = login_payload["token"]
        user = login_payload["user"]
        original_quota = login_payload["quotas"]["video"]

        generate_response = self.client.post(
            "/api/video-generate",
            json={"prompt": "Fail while polling"},
            headers=self._auth_headers(token),
        )
        self.assertEqual(500, generate_response.status_code)
        self.assertEqual("Agnes video generation failed", generate_response.json()["detail"])

        me_response = self.client.get("/me", headers=self._auth_headers(token))
        self.assertEqual(200, me_response.status_code)
        self.assertEqual(original_quota, me_response.json()["quotas"]["video"])

        assets_response = self.client.get("/assets?asset_type=video", headers=self._auth_headers(token))
        self.assertEqual(200, assets_response.status_code)
        self.assertEqual(0, assets_response.json()["total"])

        video_quota_records = [
            record
            for record in store.quota_ledger
            if record["user_id"] == user["id"] and record["reason"] == "video_generate"
        ]
        self.assertEqual([], video_quota_records)

    @patch.object(backend_main, "_agnes")
    def test_video_generation_timeout_keeps_quota_and_assets_unchanged(self, mock_agnes) -> None:
        mock_agnes.generate_video = AsyncMock(return_value={"video_id": "video-task-timeout"})
        mock_agnes.poll_video_result = AsyncMock(return_value={"status": "processing"})

        login_payload = self._login("video-e2e-timeout")
        token = login_payload["token"]
        user = login_payload["user"]
        original_quota = login_payload["quotas"]["video"]

        with patch.object(video_generate_module, "MAX_POLL_ATTEMPTS", 3):
            with patch.object(video_generate_module.asyncio, "sleep", new=self._fake_sleep):
                generate_response = self.client.post(
                    "/api/video-generate",
                    json={"prompt": "Keep polling until timeout"},
                    headers=self._auth_headers(token),
                )

        self.assertEqual(500, generate_response.status_code)
        self.assertEqual("Agnes video generation timed out", generate_response.json()["detail"])

        me_response = self.client.get("/me", headers=self._auth_headers(token))
        self.assertEqual(200, me_response.status_code)
        self.assertEqual(original_quota, me_response.json()["quotas"]["video"])
        self.assertEqual(3, mock_agnes.poll_video_result.await_count)

        assets_response = self.client.get("/assets?asset_type=video", headers=self._auth_headers(token))
        self.assertEqual(200, assets_response.status_code)
        self.assertEqual(0, assets_response.json()["total"])

    @patch.object(backend_main, "_agnes")
    def test_video_asset_persistence_failure_refunds_quota(self, mock_agnes) -> None:
        mock_agnes.generate_video = AsyncMock(return_value={"video_id": "video-task-refund"})
        mock_agnes.poll_video_result = AsyncMock(
            return_value={"status": "completed", "video_url": "https://example.com/generated-unsaved.mp4"},
        )

        login_payload = self._login("video-e2e-refund")
        token = login_payload["token"]
        user = login_payload["user"]
        original_quota = login_payload["quotas"]["video"]

        with patch.object(store, "create_asset", side_effect=RuntimeError("db write failed")):
            generate_response = self.client.post(
                "/api/video-generate",
                json={"prompt": "Generate and fail persistence"},
                headers=self._auth_headers(token),
            )

        self.assertEqual(500, generate_response.status_code)
        self.assertEqual("Failed to save generated asset", generate_response.json()["detail"])

        me_response = self.client.get("/me", headers=self._auth_headers(token))
        self.assertEqual(200, me_response.status_code)
        self.assertEqual(original_quota, me_response.json()["quotas"]["video"])

        refund_records = [
            record
            for record in store.quota_ledger
            if record["user_id"] == user["id"] and record["reason"] == "video_generate_refund"
        ]
        self.assertEqual(1, len(refund_records))
        self.assertEqual(1, refund_records[0]["change_amount"])

    def test_video_generation_rejects_when_quota_is_empty(self) -> None:
        login_payload = self._login("video-e2e-no-quota")
        token = login_payload["token"]
        user = login_payload["user"]
        store.grant_quota(user["id"], "video", -store.quotas[user["id"]]["video"], "drain_for_test", None)

        generate_response = self.client.post(
            "/api/video-generate",
            json={"prompt": "Try to generate without quota"},
            headers=self._auth_headers(token),
        )
        self.assertEqual(403, generate_response.status_code)
        self.assertEqual("Insufficient video quota", generate_response.json()["detail"])

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
    async def _fake_sleep(_seconds: int) -> None:
        return None

    @staticmethod
    def _auth_headers(token: str) -> dict[str, str]:
        return {"Authorization": f"Bearer {token}"}


if __name__ == "__main__":
    unittest.main()
