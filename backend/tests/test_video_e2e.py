from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient
from sqlalchemy import event, select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import main as backend_main
from api import video_generate as video_generate_module
from controllers.store import DatabaseStore, configure_store, store
from models.asset import Asset
from models.base import get_session
from models.generation_task import GenerationTask
from models.quota import QuotaLedger
from tests.mysql_test_database import MySQLTestDatabase


class VideoGenerationE2ETestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_video_e2e")
        cls.mysql_database.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    def setUp(self) -> None:
        configure_store(DatabaseStore())
        store.registration_settings["registration_mode"] = "open"
        self.client = TestClient(backend_main.app)
        self.login_payload = self._login(f"video-e2e-{self._testMethodName}")
        self.token = self.login_payload["token"]
        self.user = self.login_payload["user"]
        self.original_quotas = self.login_payload["quotas"]
        self.project = store.create_project(self.user["id"], "Video E2E Project")
        self.canvas_id = store.get_first_canvas_id(self.project["id"])
        self.node = store.create_node(
            self.project["id"],
            self.user["id"],
            "generation",
            {"prompt": ""},
            100,
            200,
            320,
            180,
        )

    def tearDown(self) -> None:
        self.client.close()

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

        with patch.object(video_generate_module.asyncio, "sleep", new=self._fake_sleep):
            generate_response = self.client.post(
                "/api/video-generate",
                json=self._generation_payload("Create a high-energy product teaser"),
                headers=self._auth_headers(self.token),
            )

        self.assertEqual(200, generate_response.status_code)
        generate_payload = generate_response.json()
        asset = generate_payload["asset"]
        task = generate_payload["generation_task"]
        self._assert_success_transaction(generate_payload, "video")
        self.assertEqual("video-task-1", generate_payload["video_id"])
        self.assertEqual(generated_url, generate_payload["url"])
        self.assertEqual("video", asset["type"])
        self.assertEqual("generation", asset["source"])
        self.assertEqual("agnes-video-v2.0", asset["source_model"])
        self.assertEqual("video-task-1", task["provider_request_id"])
        self.assertEqual(self.user["id"], asset["user_id"])

        assets_response = self.client.get(
            "/assets",
            params={"asset_type": "video", "project_id": self.project["id"]},
            headers=self._auth_headers(self.token),
        )
        self.assertEqual(200, assets_response.status_code)
        assets_payload = assets_response.json()
        self.assertEqual(1, assets_payload["total"])
        self.assertEqual(asset["id"], assets_payload["items"][0]["id"])
        self.assertEqual(generated_url, assets_payload["items"][0]["url"])

        me_response = self.client.get("/me", headers=self._auth_headers(self.token))
        self.assertEqual(200, me_response.status_code)
        self.assertEqual(generate_payload["quotas"], me_response.json()["quotas"])

        persisted_asset = store.get_asset(asset["id"])
        self.assertIsNotNone(persisted_asset)
        self.assertEqual(generated_url, persisted_asset["url"])
        self.assertEqual(task["id"], persisted_asset["source_task_id"])

        mock_agnes.generate_video.assert_awaited_once_with(
            model="agnes-video-v2.0",
            prompt="Create a high-energy product teaser",
            width=1152,
            height=768,
            num_frames=121,
            frame_rate=24,
        )
        self.assertEqual(2, mock_agnes.poll_video_result.await_count)
        mock_agnes.poll_video_result.assert_awaited_with("video-task-1")

    @patch.object(backend_main, "_agnes")
    def test_video_poll_failure_keeps_quota_and_assets_unchanged(self, mock_agnes) -> None:
        mock_agnes.generate_video = AsyncMock(return_value={"video_id": "video-task-fail"})
        mock_agnes.poll_video_result = AsyncMock(side_effect=RuntimeError("poll failed"))

        generate_response = self.client.post(
            "/api/video-generate",
            json=self._generation_payload("Fail while polling"),
            headers=self._auth_headers(self.token),
        )
        self.assertEqual(500, generate_response.status_code)
        self.assertEqual("Agnes video generation failed", generate_response.json()["detail"])

        me_response = self.client.get("/me", headers=self._auth_headers(self.token))
        self.assertEqual(200, me_response.status_code)
        self.assertEqual(self.original_quotas["video"], me_response.json()["quotas"]["video"])

        assets_response = self.client.get(
            "/assets",
            params={"asset_type": "video", "project_id": self.project["id"]},
            headers=self._auth_headers(self.token),
        )
        self.assertEqual(200, assets_response.status_code)
        self.assertEqual(0, assets_response.json()["total"])
        self.assertEqual([], self._generation_ledger("video"))

    @patch.object(backend_main, "_agnes")
    def test_video_generation_timeout_keeps_quota_and_assets_unchanged(self, mock_agnes) -> None:
        mock_agnes.generate_video = AsyncMock(return_value={"video_id": "video-task-timeout"})
        mock_agnes.poll_video_result = AsyncMock(return_value={"status": "processing"})

        with patch.object(video_generate_module, "MAX_POLL_ATTEMPTS", 3):
            with patch.object(video_generate_module.asyncio, "sleep", new=self._fake_sleep):
                generate_response = self.client.post(
                    "/api/video-generate",
                    json=self._generation_payload("Keep polling until timeout"),
                    headers=self._auth_headers(self.token),
                )

        self.assertEqual(500, generate_response.status_code)
        self.assertEqual("Agnes video generation timed out", generate_response.json()["detail"])

        me_response = self.client.get("/me", headers=self._auth_headers(self.token))
        self.assertEqual(200, me_response.status_code)
        self.assertEqual(self.original_quotas["video"], me_response.json()["quotas"]["video"])
        self.assertEqual(3, mock_agnes.poll_video_result.await_count)

        assets_response = self.client.get(
            "/assets",
            params={"asset_type": "video", "project_id": self.project["id"]},
            headers=self._auth_headers(self.token),
        )
        self.assertEqual(200, assets_response.status_code)
        self.assertEqual(0, assets_response.json()["total"])
        self.assertEqual([], self._generation_ledger("video"))

    @patch.object(backend_main, "_agnes")
    def test_video_asset_persistence_failure_creates_no_quota_ledger(self, mock_agnes) -> None:
        mock_agnes.generate_video = AsyncMock(return_value={"video_id": "video-task-refund"})
        mock_agnes.poll_video_result = AsyncMock(
            return_value={"status": "completed", "video_url": "https://example.com/generated-unsaved.mp4"},
        )

        def fail_generated_asset(_mapper, _connection, target: Asset) -> None:
            if target.source == "generation":
                raise RuntimeError("forced asset persistence failure")

        event.listen(Asset, "before_insert", fail_generated_asset)
        try:
            generate_response = self.client.post(
                "/api/video-generate",
                json=self._generation_payload("Generate and fail persistence"),
                headers=self._auth_headers(self.token),
            )
        finally:
            event.remove(Asset, "before_insert", fail_generated_asset)

        self.assertEqual(500, generate_response.status_code)
        self.assertEqual("Failed to save generated asset", generate_response.json()["detail"])

        me_response = self.client.get("/me", headers=self._auth_headers(self.token))
        self.assertEqual(200, me_response.status_code)
        self.assertEqual(self.original_quotas["video"], me_response.json()["quotas"]["video"])
        self.assertEqual([], self._generation_ledger("video"))

    def test_video_generation_rejects_when_quota_is_empty(self) -> None:
        store.grant_quota(
            self.user["id"],
            "video",
            -store.quotas[self.user["id"]]["video"],
            "drain_for_test",
            None,
        )

        generate_response = self.client.post(
            "/api/video-generate",
            json=self._generation_payload("Try to generate without quota"),
            headers=self._auth_headers(self.token),
        )
        self.assertEqual(403, generate_response.status_code)
        self.assertEqual("Insufficient video quota", generate_response.json()["detail"])

    def _generation_payload(self, prompt: str) -> dict:
        return {
            "project_id": self.project["id"],
            "origin_canvas_id": self.canvas_id,
            "canvas_node_id": self.node["id"],
            "prompt": prompt,
        }

    def _assert_success_transaction(self, payload: dict, quota_type: str) -> None:
        asset = payload["asset"]
        task = payload["generation_task"]
        expected_quotas = {**self.original_quotas, quota_type: self.original_quotas[quota_type] - 1}
        self.assertEqual(expected_quotas, payload["quotas"])
        for resource in (asset, task):
            self.assertEqual(self.project["id"], resource["project_id"])
            self.assertEqual(self.canvas_id, resource["origin_canvas_id"])
            self.assertEqual(self.node["id"], resource["canvas_node_id"])
        self.assertEqual(task["id"], asset["source_task_id"])
        self.assertEqual(asset["id"], task["result_asset_id"])

        with get_session() as session:
            internal_task = session.get(GenerationTask, task["id"])
            internal_asset = session.get(Asset, asset["id"])
            ledger = list(
                session.scalars(
                    select(QuotaLedger).where(
                        QuotaLedger.user_id == self.user["id"],
                        QuotaLedger.reason == f"{quota_type}_generate",
                    )
                ).all()
            )
            self.assertIsNotNone(internal_task)
            self.assertIsNotNone(internal_asset)
            self.assertEqual(internal_task.id, internal_asset.source_task_id)
            self.assertEqual(internal_asset.id, internal_task.result_asset_id)
            self.assertEqual(1, len(ledger))
            self.assertEqual(internal_task.id, ledger[0].related_task_id)
            self.assertEqual(-1, ledger[0].change_amount)

    def _generation_ledger(self, quota_type: str) -> list[QuotaLedger]:
        with get_session() as session:
            return list(
                session.scalars(
                    select(QuotaLedger).where(
                        QuotaLedger.user_id == self.user["id"],
                        QuotaLedger.reason.in_(
                            [f"{quota_type}_generate", f"{quota_type}_generate_refund"]
                        ),
                    )
                ).all()
            )

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
