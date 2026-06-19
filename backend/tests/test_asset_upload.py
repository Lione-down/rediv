from __future__ import annotations

import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.router import include_routers
from controllers.store import DatabaseStore, configure_store, store
from core.security import create_token
from database import close_db, init_db
from settings.config import settings


class AssetFlowTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = TemporaryDirectory()
        self.original_storage_root = settings.storage_local_root
        settings.storage_local_root = str(Path(self.temp_dir.name) / "storage")

        db_path = str(Path(self.temp_dir.name) / "test-revid.db")
        init_db(db_path)
        configure_store(DatabaseStore())

        app = FastAPI()
        include_routers(app)
        self.client = TestClient(app)

        store.registration_settings["registration_mode"] = "open"
        self.user = self._register_user("asset-owner").json()["user"]
        self.other_user = self._register_user("asset-other").json()["user"]
        self.admin_id = next(user["id"] for user in store.users.values() if user["role"] == "admin")

    def tearDown(self) -> None:
        self.client.close()
        close_db()
        settings.storage_local_root = self.original_storage_root
        self.temp_dir.cleanup()

    def test_list_assets_basic(self) -> None:
        first = store.create_asset(self.user["id"], "image", "/uploads/a.png", None)
        second = store.create_asset(self.user["id"], "video", "/uploads/b.mp4", None)
        store.create_asset(self.other_user["id"], "image", "/uploads/c.png", None)

        response = self.client.get("/assets", headers=self._auth_headers(self.user["id"]))

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual(2, payload["total"])
        self.assertEqual(2, len(payload["items"]))
        self.assertEqual({first["id"], second["id"]}, {item["id"] for item in payload["items"]})

    def test_list_assets_filter_by_type(self) -> None:
        store.create_asset(self.user["id"], "image", "/uploads/a.png", None)
        store.create_asset(self.user["id"], "video", "/uploads/b.mp4", None)

        response = self.client.get(
            "/assets",
            params={"asset_type": "image"},
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual(1, payload["total"])
        self.assertTrue(all(item["type"] == "image" for item in payload["items"]))

    def test_list_assets_filter_by_project(self) -> None:
        store.create_asset(self.user["id"], "image", "/uploads/a.png", None, project_id="project-a")
        store.create_asset(self.user["id"], "image", "/uploads/b.png", None, project_id="project-b")

        response = self.client.get(
            "/assets",
            params={"project_id": "project-a"},
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual(1, payload["total"])
        self.assertEqual("project-a", payload["items"][0]["project_id"])

    def test_list_assets_pagination(self) -> None:
        for index in range(5):
            store.create_asset(self.user["id"], "image", f"/uploads/{index}.png", None)

        response = self.client.get(
            "/assets",
            params={"page": 2, "page_size": 2},
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual(5, payload["total"])
        self.assertEqual(2, payload["page"])
        self.assertEqual(2, payload["page_size"])
        self.assertEqual(2, len(payload["items"]))

    def test_upload_url_asset(self) -> None:
        response = self.client.post(
            "/assets/upload",
            json={
                "type": "image",
                "url": "https://example.com/image.png",
                "content_text": None,
                "project_id": "project-url",
            },
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual("image", payload["type"])
        self.assertEqual("https://example.com/image.png", payload["url"])
        self.assertEqual("project-url", payload["project_id"])

    def test_upload_multipart_file(self) -> None:
        response = self.client.post(
            "/assets/upload",
            data={"type": "image", "content_text": "cover", "project_id": "project-file"},
            files={"file": ("poster.png", b"fake-image-bytes", "image/png")},
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertTrue(payload["url"].startswith(f"/uploads/{self.user['id']}/"))
        saved_file = Path(settings.storage_local_root) / payload["url"].lstrip("/")
        self.assertTrue(saved_file.exists())
        self.assertEqual(b"fake-image-bytes", saved_file.read_bytes())

    def test_from_generation(self) -> None:
        response = self.client.post(
            "/assets/from_generation",
            json={
                "type": "video",
                "url": "https://example.com/video.mp4",
                "content_text": "generated clip",
                "source_model": "agnes-video-v2.0",
                "source_task_id": "task-123",
                "canvas_node_id": "node-1",
                "project_id": "project-gen",
            },
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual("generation", payload["source"])
        self.assertEqual("agnes-video-v2.0", payload["source_model"])
        self.assertEqual("task-123", payload["source_task_id"])
        self.assertEqual("node-1", payload["canvas_node_id"])

    def test_get_asset_own(self) -> None:
        asset = store.create_asset(self.user["id"], "prompt", None, "hello")

        response = self.client.get(f"/assets/{asset['id']}", headers=self._auth_headers(self.user["id"]))

        self.assertEqual(200, response.status_code)
        self.assertEqual(asset["id"], response.json()["id"])

    def test_get_asset_other(self) -> None:
        asset = store.create_asset(self.other_user["id"], "prompt", None, "private")

        response = self.client.get(f"/assets/{asset['id']}", headers=self._auth_headers(self.user["id"]))

        self.assertEqual(403, response.status_code)
        self.assertEqual("Forbidden", response.json()["detail"])

    def test_delete_asset_own(self) -> None:
        asset = store.create_asset(self.user["id"], "image", "/uploads/delete.png", None)

        response = self.client.delete(f"/assets/{asset['id']}", headers=self._auth_headers(self.user["id"]))

        self.assertEqual(200, response.status_code)
        self.assertEqual("deleted", response.json()["status"])
        self.assertEqual("deleted", store.get_asset(asset["id"])["status"])

    def test_delete_asset_other(self) -> None:
        asset = store.create_asset(self.other_user["id"], "image", "/uploads/other.png", None)

        response = self.client.delete(f"/assets/{asset['id']}", headers=self._auth_headers(self.user["id"]))

        self.assertEqual(403, response.status_code)
        self.assertEqual("Forbidden", response.json()["detail"])

    def test_admin_hide_asset(self) -> None:
        asset = store.create_asset(self.user["id"], "image", "/uploads/hide.png", None)

        response = self.client.patch(f"/admin/assets/{asset['id']}/hide", headers=self._admin_headers())

        self.assertEqual(200, response.status_code)
        self.assertEqual("hidden", response.json()["status"])
        self.assertEqual("hidden", store.get_asset(asset["id"])["status"])

    def test_guest_cannot_upload(self) -> None:
        response = self.client.post(
            "/assets/upload",
            json={"type": "image", "url": "https://example.com/image.png"},
        )

        self.assertEqual(401, response.status_code)
        self.assertEqual("Missing bearer token", response.json()["detail"])

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

    def _admin_headers(self) -> dict[str, str]:
        token = create_token({"sub": self.admin_id, "role": "admin"})
        return {"Authorization": f"Bearer {token}"}


if __name__ == "__main__":
    unittest.main()
