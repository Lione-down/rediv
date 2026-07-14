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
from api import video_generate as video_generate_module
from api.router import include_routers
from controllers.store import DatabaseStore, configure_store, store
from core.security import create_token
from models.asset import Asset
from tests.mysql_test_database import MySQLTestDatabase


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
        self.mysql_database = MySQLTestDatabase("revid_test_video_generate")
        self.mysql_database.start()
        self.addCleanup(self.mysql_database.stop)
        configure_store(DatabaseStore())

        app = FastAPI()
        include_routers(app)
        self.client = TestClient(app)

        store.registration_settings["registration_mode"] = "open"
        auth_payload = self._register_user("video-generate-user").json()
        self.user = auth_payload["user"]
        self.project = store.create_project(self.user["id"], "Video Generation Project")
        self.canvas_id = store.get_first_canvas_id(self.project["id"])
        self.node = store.create_node(
            self.project["id"], self.user["id"], "generation", {}, 0, 0, 320, 180
        )

    def tearDown(self) -> None:
        self.client.close()

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
                    json=self._payload("Create a dramatic cinematic shot"),
                    headers=self._auth_headers(self.user["id"]),
                )

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual("video-1", payload["video_id"])
        self.assertEqual("https://example.com/generated-video.mp4", payload["url"])
        self.assertEqual("video", payload["asset"]["type"])
        self.assertEqual("generation", payload["asset"]["source"])
        self.assertEqual("agnes-video-v2.0", payload["asset"]["source_model"])
        self.assertEqual(payload["generation_task"]["id"], payload["asset"]["source_task_id"])
        self.assertEqual("succeeded", payload["generation_task"]["status"])
        self.assertEqual("video-1", payload["generation_task"]["provider_request_id"])
        self.assertEqual(payload["asset"]["id"], payload["generation_task"]["result_asset_id"])
        self.assertEqual("video", payload["generation_task"]["media_type"])
        self.assertEqual(self.project["id"], payload["asset"]["project_id"])
        self.assertEqual(self.canvas_id, payload["asset"]["origin_canvas_id"])
        self.assertEqual(original_quota - 1, payload["quotas"]["video"])
        self.assertEqual(original_quota - 1, store.quotas[self.user["id"]]["video"])
        self.assertEqual("agnes-video-v2.0", fake_provider.generate_calls[0]["model"])
        self.assertEqual("Create a dramatic cinematic shot", fake_provider.generate_calls[0]["prompt"])
        self.assertEqual(["video-1", "video-1"], fake_provider.poll_calls)

    def test_video_generate_maps_one_and_multiple_owned_images_to_provider_modes(self) -> None:
        source_a = store.create_asset(
            self.user["id"], "image", "https://example.com/source-a.png", None,
            project_id=self.project["id"], origin_canvas_id=self.canvas_id, source="upload",
        )
        source_b = store.create_asset(
            self.user["id"], "image", "https://example.com/source-b.png", None,
            project_id=self.project["id"], origin_canvas_id=self.canvas_id, source="upload",
        )
        single_provider = _FakeAgnesProvider()
        with patch.object(backend_main, "_agnes", single_provider):
            single_response = self.client.post(
                "/api/video-generate",
                json=self._payload("Animate one frame", image_ids=[source_a["id"]]),
                headers=self._auth_headers(self.user["id"]),
            )
        self.assertEqual(200, single_response.status_code)
        self.assertEqual(
            {"image": "https://example.com/source-a.png", "mode": "img2vid"},
            single_provider.generate_calls[0]["kwargs"],
        )

        multiple_provider = _FakeAgnesProvider()
        with patch.object(backend_main, "_agnes", multiple_provider):
            multiple_response = self.client.post(
                "/api/video-generate",
                json=self._payload("Connect keyframes", image_ids=[source_a["id"], source_b["id"]]),
                headers=self._auth_headers(self.user["id"]),
            )
        self.assertEqual(200, multiple_response.status_code)
        self.assertEqual(
            {
                "extra_images": ["https://example.com/source-a.png", "https://example.com/source-b.png"],
                "mode": "keyframes",
            },
            multiple_provider.generate_calls[0]["kwargs"],
        )

    def test_video_generate_rejects_unbounded_and_cross_project_image_references(self) -> None:
        provider = _FakeAgnesProvider()
        unbounded_response = self.client.post(
            "/api/video-generate",
            json=self._payload("Too many references", image_ids=[f"image-{index}" for index in range(9)]),
            headers=self._auth_headers(self.user["id"]),
        )
        self.assertEqual(422, unbounded_response.status_code)

        other_project = store.create_project(self.user["id"], "Other Video Project")
        foreign_asset = store.create_asset(
            self.user["id"], "image", "https://example.com/foreign.png", None,
            project_id=other_project["id"],
            origin_canvas_id=store.get_first_canvas_id(other_project["id"]),
            source="upload",
        )
        with patch.object(backend_main, "_agnes", provider):
            foreign_response = self.client.post(
                "/api/video-generate",
                json=self._payload("Reject foreign reference", image_ids=[foreign_asset["id"]]),
                headers=self._auth_headers(self.user["id"]),
            )
        self.assertEqual(403, foreign_response.status_code)
        self.assertEqual([], provider.generate_calls)

    def test_video_generate_create_failure_does_not_deduct_quota(self) -> None:
        fake_provider = _FakeAgnesProvider(create_error=RuntimeError("provider failed"))
        original_quota = store.quotas[self.user["id"]]["video"]

        with patch.object(backend_main, "_agnes", fake_provider):
            response = self.client.post(
                "/api/video-generate",
                json=self._payload("Fail this video request"),
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
                json=self._payload("Fail while polling"),
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
                    json=self._payload("Keep waiting forever"),
                    headers=self._auth_headers(self.user["id"]),
                )

        self.assertEqual(500, response.status_code)
        self.assertEqual("Agnes video generation timed out", response.json()["detail"])
        self.assertEqual(original_quota, store.quotas[self.user["id"]]["video"])
        tasks, total = store.list_generation_tasks(self.user["id"], media_type="video")
        self.assertEqual(1, total)
        self.assertEqual("timed_out", tasks[0]["status"])
        self.assertEqual("timeout", tasks[0]["error_code"])

    def test_video_generate_asset_failure_is_not_charged(self) -> None:
        fake_provider = _FakeAgnesProvider()
        original_quota = store.quotas[self.user["id"]]["video"]

        def fail_generated_asset(_mapper, _connection, target: Asset) -> None:
            if target.source == "generation":
                raise RuntimeError("db write failed")

        event.listen(Asset, "before_insert", fail_generated_asset)
        try:
            with patch.object(backend_main, "_agnes", fake_provider):
                response = self.client.post(
                    "/api/video-generate",
                    json=self._payload("Generate then fail saving"),
                    headers=self._auth_headers(self.user["id"]),
                )
        finally:
            event.remove(Asset, "before_insert", fail_generated_asset)

        self.assertEqual(500, response.status_code)
        self.assertEqual("Failed to save generated asset", response.json()["detail"])
        self.assertEqual(original_quota, store.quotas[self.user["id"]]["video"])
        tasks, total = store.list_generation_tasks(self.user["id"], media_type="video")
        self.assertEqual(1, total)
        self.assertEqual("failed", tasks[0]["status"])
        self.assertEqual("asset_persistence_error", tasks[0]["error_code"])
        generation_records = [
            record
            for record in store.quota_ledger
            if record["user_id"] == self.user["id"]
            and record["reason"] in {"video_generate", "video_generate_refund"}
        ]
        self.assertEqual([], generation_records)

    def test_video_generate_requires_available_quota(self) -> None:
        store.grant_quota(self.user["id"], "video", -store.quotas[self.user["id"]]["video"], "drain_for_test", None)

        response = self.client.post(
            "/api/video-generate",
            json=self._payload("Try without quota"),
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(403, response.status_code)
        self.assertEqual("Insufficient video quota", response.json()["detail"])

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
    async def _fake_sleep(_seconds: int) -> None:
        return None

    @staticmethod
    def _auth_headers(user_id: str) -> dict[str, str]:
        token = create_token({"sub": user_id, "role": "user"})
        return {"Authorization": f"Bearer {token}"}


if __name__ == "__main__":
    unittest.main()
