from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient
from sqlalchemy import event, select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import main as backend_main
from controllers.store import DatabaseStore, configure_store, store
from models.asset import Asset
from models.base import get_session
from models.generation_task import GenerationTask
from models.quota import QuotaLedger
from tests.mysql_test_database import MySQLTestDatabase


class ImageGenerationE2ETestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_image_e2e")
        cls.mysql_database.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    def setUp(self) -> None:
        configure_store(DatabaseStore())
        store.registration_settings["registration_mode"] = "open"
        self.client = TestClient(backend_main.app)
        self.login_payload = self._login(f"image-e2e-{self._testMethodName}")
        self.token = self.login_payload["token"]
        self.user = self.login_payload["user"]
        self.original_quotas = self.login_payload["quotas"]
        self.project = store.create_project(self.user["id"], "Image E2E Project")
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
    def test_text_to_image_workflow_persists_asset_and_deducts_quota(self, mock_agnes) -> None:
        generated_url = "https://example.com/generated-poster.png"
        mock_agnes.generate_image = AsyncMock(return_value={"data": [{"url": generated_url}]})

        generate_response = self.client.post(
            "/api/image-generate",
            json=self._generation_payload("Create a bright summer poster"),
            headers=self._auth_headers(self.token),
        )
        self.assertEqual(200, generate_response.status_code)
        generate_payload = generate_response.json()
        asset = generate_payload["asset"]
        self._assert_success_transaction(generate_payload, "image")
        self.assertEqual(generated_url, generate_payload["url"])
        self.assertEqual("image", asset["type"])
        self.assertEqual("generation", asset["source"])
        self.assertEqual("agnes-image-2.1-flash", asset["source_model"])
        self.assertEqual(self.user["id"], asset["user_id"])

        assets_response = self.client.get(
            "/assets",
            params={"asset_type": "image", "project_id": self.project["id"]},
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

        source_asset = store.create_asset(
            self.user["id"],
            "image",
            "https://example.com/source-frame.png",
            None,
            project_id=self.project["id"],
            origin_canvas_id=self.canvas_id,
            source="upload",
        )

        generate_response = self.client.post(
            "/api/image-generate",
            json=self._generation_payload(
                "Turn this into a neon night scene",
                image_ids=[source_asset["id"]],
            ),
            headers=self._auth_headers(self.token),
        )
        self.assertEqual(200, generate_response.status_code)
        generate_payload = generate_response.json()
        generated_asset = generate_payload["asset"]
        self._assert_success_transaction(generate_payload, "image")
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

        generate_response = self.client.post(
            "/api/image-generate",
            json=self._generation_payload("Fail this image request"),
            headers=self._auth_headers(self.token),
        )
        self.assertEqual(500, generate_response.status_code)
        self.assertEqual("Agnes image generation failed", generate_response.json()["detail"])

        me_response = self.client.get("/me", headers=self._auth_headers(self.token))
        self.assertEqual(200, me_response.status_code)
        self.assertEqual(self.original_quotas["image"], me_response.json()["quotas"]["image"])

        assets_response = self.client.get(
            "/assets",
            params={"asset_type": "image", "project_id": self.project["id"]},
            headers=self._auth_headers(self.token),
        )
        self.assertEqual(200, assets_response.status_code)
        self.assertEqual(0, assets_response.json()["total"])
        self.assertEqual([], self._generation_ledger("image"))

    @patch.object(backend_main, "_agnes")
    def test_image_asset_persistence_failure_creates_no_quota_ledger(self, mock_agnes) -> None:
        mock_agnes.generate_image = AsyncMock(
            return_value={"data": [{"url": "https://example.com/generated-but-unsaved.png"}]},
        )

        def fail_generated_asset(_mapper, _connection, target: Asset) -> None:
            if target.source == "generation":
                raise RuntimeError("forced asset persistence failure")

        event.listen(Asset, "before_insert", fail_generated_asset)
        try:
            generate_response = self.client.post(
                "/api/image-generate",
                json=self._generation_payload("Generate and fail persistence"),
                headers=self._auth_headers(self.token),
            )
        finally:
            event.remove(Asset, "before_insert", fail_generated_asset)

        self.assertEqual(500, generate_response.status_code)
        self.assertEqual("Failed to save generated asset", generate_response.json()["detail"])

        me_response = self.client.get("/me", headers=self._auth_headers(self.token))
        self.assertEqual(200, me_response.status_code)
        self.assertEqual(self.original_quotas["image"], me_response.json()["quotas"]["image"])
        self.assertEqual([], self._generation_ledger("image"))

    def test_image_generation_rejects_when_quota_is_empty(self) -> None:
        store.grant_quota(
            self.user["id"],
            "image",
            -store.quotas[self.user["id"]]["image"],
            "drain_for_test",
            None,
        )

        generate_response = self.client.post(
            "/api/image-generate",
            json=self._generation_payload("Try to generate without quota"),
            headers=self._auth_headers(self.token),
        )
        self.assertEqual(403, generate_response.status_code)
        self.assertEqual("Insufficient image quota", generate_response.json()["detail"])

    def _generation_payload(self, prompt: str, *, image_ids: list[str] | None = None) -> dict:
        payload = {
            "project_id": self.project["id"],
            "origin_canvas_id": self.canvas_id,
            "canvas_node_id": self.node["id"],
            "prompt": prompt,
        }
        if image_ids is not None:
            payload["image_ids"] = image_ids
        return payload

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
    def _auth_headers(token: str) -> dict[str, str]:
        return {"Authorization": f"Bearer {token}"}


if __name__ == "__main__":
    unittest.main()
