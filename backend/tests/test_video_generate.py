from __future__ import annotations

import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import main as backend_main
from api import video_generate as video_generate_module
from api.router import include_routers
from controllers.store import DatabaseStore, configure_store, store
from core.security import create_token
from database import close_db, init_db


class _FakeAgnesProvider:
    def __init__(
        self,
        create_response: dict | None = None,
        poll_responses: list[dict] | None = None,
        create_error: Exception | None = None,
        poll_error: Exception | None = None,
    ) -> None:
        self.create_response = create_response or {"task_id": "task-1", "video_id": "video-1"}
        self.poll_responses = poll_responses or [{"status": "completed", "video_url": "https://example.com/generated-video.mp4"}]
        self.create_error = create_error
        self.poll_error = poll_error
        self.generate_calls: list[dict] = []
        self.poll_calls: list[str] = []

    async def generate_video(self, model: str, prompt: str, **kwargs) -> dict:
        self.generate_calls.append({"model": model, "prompt": prompt, "kwargs": kwargs})
        if self.create_error is not None:
            raise self.create_error
        return self.create_response

    async def poll_video_result(self, video_id: str) -> dict:
        self.poll_calls.append(video_id)
        if self.poll_error is not None:
            raise self.poll_error
        if self.poll_responses:
            return self.poll_responses.pop(0)
        return {"status": "processing"}


class VideoGenerateApiTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = TemporaryDirectory()
        db_path = str(Path(self.temp_dir.name) / "test-revid.db")
        init_db(db_path)
        configure_store(DatabaseStore())

        app = FastAPI()
        include_routers(app)
        self.client = TestClient(app)

        store.registration_settings["registration_mode"] = "open"
        auth_payload = self._register_user("video-generate-user").json()
        self.user = auth_payload["user"]

    def tearDown(self) -> None:
        self.client.close()
        close_db()
        self.temp_dir.cleanup()

    def test_video_generate_success_creates_video_asset_and_deducts_quota(self) -> None:
        fake_provider = _FakeAgnesProvider(
            poll_responses=[
                {"status": "processing"},
                {"status": "completed", "video_url": "https://example.com/generated-video.mp4"},
            ],
        )
        original_quota = store.quotas[self.user["id"]]["video"]

        with patch.object(backend_main, "_agnes", fake_provider):
            with patch.object(video_generate_module.asyncio, "sleep", new=self._fake_sleep):
                response = self.client.post(
                    "/api/video-generate",
                    json={"prompt": "Create a dramatic cinematic shot"},
                    headers=self._auth_headers(self.user["id"]),
                )

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual("video-1", payload["video_id"])
        self.assertEqual("https://example.com/generated-video.mp4", payload["url"])
        self.assertEqual("video", payload["asset"]["type"])
        self.assertEqual("generation", payload["asset"]["source"])
        self.assertEqual("agnes-video-v2.0", payload["asset"]["source_model"])
        self.assertEqual("video-1", payload["asset"]["source_task_id"])
        self.assertEqual("succeeded", payload["generation_task"]["status"])
        self.assertEqual("video-1", payload["generation_task"]["provider_request_id"])
        self.assertEqual(payload["asset"]["id"], payload["generation_task"]["result_asset_id"])
        self.assertEqual("video", payload["generation_task"]["media_type"])
        self.assertEqual(original_quota - 1, store.quotas[self.user["id"]]["video"])
        self.assertEqual("agnes-video-v2.0", fake_provider.generate_calls[0]["model"])
        self.assertEqual("Create a dramatic cinematic shot", fake_provider.generate_calls[0]["prompt"])
        self.assertEqual(["video-1", "video-1"], fake_provider.poll_calls)

    def test_video_generate_create_failure_does_not_deduct_quota(self) -> None:
        fake_provider = _FakeAgnesProvider(create_error=RuntimeError("provider failed"))
        original_quota = store.quotas[self.user["id"]]["video"]

        with patch.object(backend_main, "_agnes", fake_provider):
            response = self.client.post(
                "/api/video-generate",
                json={"prompt": "Fail this video request"},
                headers=self._auth_headers(self.user["id"]),
            )

        self.assertEqual(500, response.status_code)
        self.assertEqual("Agnes video generation failed", response.json()["detail"])
        self.assertEqual(original_quota, store.quotas[self.user["id"]]["video"])
        tasks, total = store.list_generation_tasks(self.user["id"], media_type="video")
        self.assertEqual(1, total)
        self.assertEqual("failed", tasks[0]["status"])
        self.assertEqual("provider_error", tasks[0]["error_code"])

    def test_video_generate_poll_failure_does_not_deduct_quota(self) -> None:
        fake_provider = _FakeAgnesProvider(poll_error=RuntimeError("poll failed"))
        original_quota = store.quotas[self.user["id"]]["video"]

        with patch.object(backend_main, "_agnes", fake_provider):
            response = self.client.post(
                "/api/video-generate",
                json={"prompt": "Fail while polling"},
                headers=self._auth_headers(self.user["id"]),
            )

        self.assertEqual(500, response.status_code)
        self.assertEqual("Agnes video generation failed", response.json()["detail"])
        self.assertEqual(original_quota, store.quotas[self.user["id"]]["video"])
        tasks, total = store.list_generation_tasks(self.user["id"], media_type="video")
        self.assertEqual(1, total)
        self.assertEqual("failed", tasks[0]["status"])

    def test_video_generate_timeout_does_not_deduct_quota(self) -> None:
        fake_provider = _FakeAgnesProvider(poll_responses=[{"status": "processing"}] * video_generate_module.MAX_POLL_ATTEMPTS)
        original_quota = store.quotas[self.user["id"]]["video"]

        with patch.object(backend_main, "_agnes", fake_provider):
            with patch.object(video_generate_module.asyncio, "sleep", new=self._fake_sleep):
                response = self.client.post(
                    "/api/video-generate",
                    json={"prompt": "Keep waiting forever"},
                    headers=self._auth_headers(self.user["id"]),
                )

        self.assertEqual(500, response.status_code)
        self.assertEqual("Agnes video generation timed out", response.json()["detail"])
        self.assertEqual(original_quota, store.quotas[self.user["id"]]["video"])
        tasks, total = store.list_generation_tasks(self.user["id"], media_type="video")
        self.assertEqual(1, total)
        self.assertEqual("timed_out", tasks[0]["status"])
        self.assertEqual("timeout", tasks[0]["error_code"])

    def test_video_generate_asset_failure_refunds_quota(self) -> None:
        fake_provider = _FakeAgnesProvider()
        original_quota = store.quotas[self.user["id"]]["video"]

        def failing_create_asset(*args, **kwargs):
            raise RuntimeError("db write failed")

        with patch.object(backend_main, "_agnes", fake_provider):
            with patch.object(store, "create_asset", side_effect=failing_create_asset):
                response = self.client.post(
                    "/api/video-generate",
                    json={"prompt": "Generate then fail saving"},
                    headers=self._auth_headers(self.user["id"]),
                )

        self.assertEqual(500, response.status_code)
        self.assertEqual("Failed to save generated asset", response.json()["detail"])
        self.assertEqual(original_quota, store.quotas[self.user["id"]]["video"])
        tasks, total = store.list_generation_tasks(self.user["id"], media_type="video")
        self.assertEqual(1, total)
        self.assertEqual("failed", tasks[0]["status"])
        self.assertEqual("asset_persistence_error", tasks[0]["error_code"])
        refund_records = [
            record
            for record in store.quota_ledger
            if record["user_id"] == self.user["id"] and record["reason"] == "video_generate_refund"
        ]
        self.assertEqual(1, len(refund_records))

    def test_video_generate_requires_available_quota(self) -> None:
        store.grant_quota(self.user["id"], "video", -store.quotas[self.user["id"]]["video"], "drain_for_test", None)

        response = self.client.post(
            "/api/video-generate",
            json={"prompt": "Try without quota"},
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(403, response.status_code)
        self.assertEqual("Insufficient video quota", response.json()["detail"])

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
    async def _fake_sleep(_seconds: int) -> None:
        return None

    @staticmethod
    def _auth_headers(user_id: str) -> dict[str, str]:
        token = create_token({"sub": user_id, "role": "user"})
        return {"Authorization": f"Bearer {token}"}


if __name__ == "__main__":
    unittest.main()
