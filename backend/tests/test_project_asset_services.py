from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import inspect

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.router import include_routers
from controllers.store import DatabaseStore, configure_store, store
from core.security import create_token
from models.base import init_engine
from tests.mysql_test_database import MySQLTestDatabase


class ProjectAssetServicesTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_project_asset_services")
        cls.mysql_database.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    def setUp(self) -> None:
        configure_store(DatabaseStore())
        self.client = self._new_client()
        store.registration_settings["registration_mode"] = "open"
        suffix = f"{self._testMethodName}-{uuid4()}"
        self.user = self._register_user(f"asset-owner-{suffix}")
        self.other_user = self._register_user(f"asset-other-{suffix}")
        self.headers = self._auth_headers(self.user["id"])
        self.project = store.create_project(self.user["id"], f"Asset Project {suffix}")
        self.first_canvas_id = store.get_first_canvas_id(self.project["id"])
        second = self.client.post(
            f"/api/projects/{self.project['id']}/canvases",
            json={"name": "Second", "base_order_revision": 0},
            headers=self.headers,
        )
        self.assertEqual(201, second.status_code)
        self.second_canvas_id = second.json()["item"]["id"]

    def tearDown(self) -> None:
        self.client.close()

    def test_audio_upload_is_project_shared_across_canvases_and_survives_restart(self) -> None:
        upload = self.client.post(
            "/assets/upload",
            json={
                "type": "audio",
                "url": "https://example.com/narration.mp3",
                "project_id": self.project["id"],
                "origin_canvas_id": self.first_canvas_id,
            },
            headers=self.headers,
        )

        self.assertEqual(200, upload.status_code)
        asset = upload.json()
        self.assertEqual("audio", asset["type"])
        self.assertEqual(self.project["id"], asset["project_id"])
        self.assertEqual(self.first_canvas_id, asset["origin_canvas_id"])

        from_other_canvas = self.client.get(
            "/assets",
            params={"project_id": self.project["id"], "asset_type": "audio"},
            headers=self.headers,
        )
        self.assertEqual(200, from_other_canvas.status_code)
        self.assertEqual([asset["id"]], [item["id"] for item in from_other_canvas.json()["items"]])

        self.client.close()
        restart = self.mysql_database.restart_runtime()
        self.assertEqual("a3b4c5d6e7f8", restart["current"])
        from database import close_db
        from main import app as production_app
        from settings.config import settings

        close_db()
        try:
            with patch.object(settings, "jwt_secret", "asset-restart-test-secret"):
                restarted_headers = self._auth_headers(self.user["id"])
                with TestClient(production_app) as restarted_client:
                    after_restart = restarted_client.get(
                        "/assets",
                        params={"project_id": self.project["id"], "asset_type": "audio"},
                        headers=restarted_headers,
                    )
            self.assertEqual(200, after_restart.status_code)
            self.assertEqual(
                [asset["id"]],
                [item["id"] for item in after_restart.json()["items"]],
            )
        finally:
            self.mysql_database.restart_runtime()
            configure_store(DatabaseStore())
            self.client = self._new_client()

    def test_asset_type_comment_documents_audio_support(self) -> None:
        type_column = next(
            column for column in inspect(init_engine()).get_columns("assets") if column["name"] == "type"
        )

        self.assertIn("audio", (type_column.get("comment") or "").lower())

    def test_project_filter_rejects_foreign_ownership(self) -> None:
        foreign_project = store.create_project(self.other_user["id"], "Foreign Assets")

        response = self.client.get(
            "/assets",
            params={"project_id": foreign_project["id"]},
            headers=self.headers,
        )

        self.assertEqual(403, response.status_code)
        self.assertEqual("Project does not belong to user", response.json()["detail"])

    def test_project_filter_returns_not_found_for_missing_project(self) -> None:
        response = self.client.get(
            "/assets",
            params={"project_id": str(uuid4())},
            headers=self.headers,
        )

        self.assertEqual(404, response.status_code)
        self.assertEqual("Project not found", response.json()["detail"])

    def test_origin_filter_returns_not_found_for_missing_canvas(self) -> None:
        response = self.client.get(
            "/assets",
            params={"origin_canvas_id": str(uuid4())},
            headers=self.headers,
        )

        self.assertEqual(404, response.status_code)
        self.assertEqual("Origin canvas not found", response.json()["detail"])

    def test_origin_filter_rejects_foreign_ownership(self) -> None:
        foreign_project = store.create_project(self.other_user["id"], "Foreign Origin")
        foreign_canvas_id = store.get_first_canvas_id(foreign_project["id"])

        response = self.client.get(
            "/assets",
            params={"origin_canvas_id": foreign_canvas_id},
            headers=self.headers,
        )

        self.assertEqual(403, response.status_code)
        self.assertEqual("Origin canvas does not belong to user", response.json()["detail"])

    def test_origin_filter_rejects_cross_project_scope(self) -> None:
        other_project = store.create_project(self.user["id"], "Other Owned Project")
        other_canvas_id = store.get_first_canvas_id(other_project["id"])

        response = self.client.get(
            "/assets",
            params={
                "project_id": self.project["id"],
                "origin_canvas_id": other_canvas_id,
            },
            headers=self.headers,
        )

        self.assertEqual(403, response.status_code)
        self.assertEqual("Origin canvas does not belong to project", response.json()["detail"])

    def test_archived_origin_remains_filterable(self) -> None:
        asset = store.create_asset(
            self.user["id"],
            "image",
            "https://example.com/archived-origin.png",
            None,
            project_id=self.project["id"],
            origin_canvas_id=self.first_canvas_id,
        )
        archived = self.client.patch(
            f"/api/projects/{self.project['id']}/canvases/{self.first_canvas_id}",
            json={"status": "archived", "base_order_revision": 1},
            headers=self.headers,
        )
        self.assertEqual(200, archived.status_code)

        response = self.client.get(
            "/assets",
            params={"origin_canvas_id": self.first_canvas_id},
            headers=self.headers,
        )

        self.assertEqual(200, response.status_code)
        self.assertEqual([asset["id"]], [item["id"] for item in response.json()["items"]])

    def test_audio_is_not_accepted_as_generated_media(self) -> None:
        response = self.client.post(
            "/assets/from_generation",
            json={
                "type": "audio",
                "url": "https://example.com/generated.mp3",
                "project_id": self.project["id"],
            },
            headers=self.headers,
        )

        self.assertEqual(422, response.status_code)

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
