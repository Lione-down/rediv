from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import main as backend_main
from api.router import include_routers
from controllers.store import DatabaseStore, configure_store, store
from core.security import create_token
from models.base import get_session
from models.quota import QuotaLedger
from tests.mysql_test_database import MySQLTestDatabase


class _RestartImageProvider:
    def __init__(self, *, error: Exception | None = None) -> None:
        self.error = error

    async def generate_image(self, **_kwargs) -> dict:
        if self.error is not None:
            raise self.error
        return {
            "id": "restart-provider-request",
            "data": [{"url": "https://example.com/restart-image.png"}],
        }


class GenerationTransactionRestartTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_generation_transaction_restart")
        cls.mysql_database.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    def setUp(self) -> None:
        configure_store(DatabaseStore())
        self.client = self._new_client()
        store.registration_settings["registration_mode"] = "open"
        suffix = str(uuid4())
        self.user = self._register_user(f"generation-restart-{suffix}")
        self.headers = self._auth_headers(self.user["id"])
        self.project = store.create_project(self.user["id"], "Restart Generation Project")
        self.canvas_id = store.get_first_canvas_id(self.project["id"])
        self.node = store.create_node(
            self.project["id"], self.user["id"], "generation", {}, 0, 0, 320, 180
        )

    def tearDown(self) -> None:
        self.client.close()

    def test_success_failure_links_and_quota_survive_production_restart(self) -> None:
        with patch.object(backend_main, "_agnes", _RestartImageProvider()):
            success = self.client.post(
                "/api/image-generate",
                json=self._payload("Persist this image"),
                headers=self.headers,
            )
        self.assertEqual(200, success.status_code)
        success_payload = success.json()

        with patch.object(
            backend_main,
            "_agnes",
            _RestartImageProvider(error=RuntimeError("restart failure")),
        ):
            failure = self.client.post(
                "/api/image-generate",
                json=self._payload("Persist this failure"),
                headers=self.headers,
            )
        self.assertEqual(500, failure.status_code)
        expected_quotas = success_payload["quotas"]
        asset_id = success_payload["asset"]["id"]
        task_id = success_payload["generation_task"]["id"]

        self.client.close()
        restart = self.mysql_database.restart_runtime()
        self.assertTrue(restart["match"])
        self.assertEqual(restart["head"], restart["current"])
        from database import close_db
        from main import app as production_app
        from settings.config import settings

        close_db()
        try:
            with patch.object(settings, "jwt_secret", "unit-test-generation-restart-secret-minimum-32"):
                restarted_headers = self._auth_headers(self.user["id"])
                with TestClient(production_app) as restarted_client:
                    tasks_response = restarted_client.get(
                        "/api/generation-tasks",
                        params={"project_id": self.project["id"]},
                        headers=restarted_headers,
                    )
                    asset_response = restarted_client.get(
                        f"/assets/{asset_id}",
                        headers=restarted_headers,
                    )
                    me_response = restarted_client.get(
                        "/me",
                        headers=restarted_headers,
                    )

            self.assertEqual(200, tasks_response.status_code)
            tasks = tasks_response.json()["items"]
            self.assertEqual({"succeeded", "failed"}, {task["status"] for task in tasks})
            succeeded = next(task for task in tasks if task["status"] == "succeeded")
            failed = next(task for task in tasks if task["status"] == "failed")
            self.assertEqual(task_id, succeeded["id"])
            self.assertEqual(asset_id, succeeded["result_asset_id"])
            self.assertEqual("provider_error", failed["error_code"])
            self.assertEqual(self.project["id"], failed["project_id"])
            self.assertEqual(self.canvas_id, failed["origin_canvas_id"])
            self.assertEqual(200, asset_response.status_code)
            self.assertEqual(task_id, asset_response.json()["source_task_id"])
            self.assertEqual(expected_quotas, me_response.json()["quotas"])
        finally:
            self.mysql_database.restart_runtime()
            configure_store(DatabaseStore())
            self.client = self._new_client()

        with get_session() as session:
            generation_ledger = list(
                session.scalars(
                    select(QuotaLedger).where(
                        QuotaLedger.user_id == self.user["id"],
                        QuotaLedger.reason == "image_generate",
                    )
                ).all()
            )
        self.assertEqual(1, len(generation_ledger))
        self.assertEqual(task_id, generation_ledger[0].related_task_id)

    def _payload(self, prompt: str) -> dict:
        return {
            "project_id": self.project["id"],
            "origin_canvas_id": self.canvas_id,
            "canvas_node_id": self.node["id"],
            "prompt": prompt,
        }

    @staticmethod
    def _new_client() -> TestClient:
        app = FastAPI()
        include_routers(app)
        return TestClient(app)

    def _register_user(self, openid: str) -> dict:
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
        return response.json()["user"]

    @staticmethod
    def _auth_headers(user_id: str) -> dict[str, str]:
        token = create_token({"sub": user_id, "role": "user"})
        return {"Authorization": f"Bearer {token}"}


if __name__ == "__main__":
    unittest.main()
