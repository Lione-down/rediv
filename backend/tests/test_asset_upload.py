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
from core.security import create_token, hash_password
from settings.config import settings
from tests.media_fixtures import VALID_PNG_BYTES
from tests.mysql_test_database import MySQLTestDatabase


class AssetFlowTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_asset_upload")
        cls.mysql_database.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    def setUp(self) -> None:
        self.temp_dir = TemporaryDirectory()
        self.original_storage_root = settings.storage_local_root
        settings.storage_local_root = str(Path(self.temp_dir.name) / "storage")

        configure_store(DatabaseStore())

        app = FastAPI()
        include_routers(app)
        self.client = TestClient(app)

        store.registration_settings["registration_mode"] = "open"
        test_id = self._testMethodName
        self.admin_id = store.ensure_admin_user("test-admin", hash_password("StrongPass123!"))["id"]
        self.user = self._register_user(f"asset-owner-{test_id}").json()["user"]
        self.other_user = self._register_user(f"asset-other-{test_id}").json()["user"]

    def tearDown(self) -> None:
        self.client.close()
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
        project_a = store.create_project(self.user["id"], "Project A")
        project_b = store.create_project(self.user["id"], "Project B")
        store.create_asset(self.user["id"], "image", "/uploads/a.png", None, project_id=project_a["id"])
        store.create_asset(self.user["id"], "image", "/uploads/b.png", None, project_id=project_b["id"])

        response = self.client.get(
            "/assets",
            params={"project_id": project_a["id"]},
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual(1, payload["total"])
        self.assertEqual(project_a["id"], payload["items"][0]["project_id"])

    def test_list_assets_filter_by_origin_canvas(self) -> None:
        project = store.create_project(self.user["id"], "Origin Project")
        node = store.create_node(project["id"], self.user["id"], "text", {}, 0, 0, 300, 200)
        canvas_id = store.get_first_canvas_id(project["id"])
        linked = store.create_asset(
            self.user["id"],
            "image",
            "/uploads/linked.png",
            None,
            project_id=project["id"],
            canvas_node_id=node["id"],
        )
        store.create_asset(
            self.user["id"],
            "image",
            "/uploads/project-only.png",
            None,
            project_id=project["id"],
        )

        response = self.client.get(
            "/assets",
            params={"origin_canvas_id": canvas_id},
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(200, response.status_code)
        self.assertEqual([linked["id"]], [item["id"] for item in response.json()["items"]])

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
        project = store.create_project(self.user["id"], "URL Project")
        response = self.client.post(
            "/assets/upload",
            json={
                "type": "image",
                "url": "https://example.com/image.png",
                "content_text": None,
                "project_id": project["id"],
            },
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual("image", payload["type"])
        self.assertEqual("https://example.com/image.png", payload["url"])
        self.assertEqual(project["id"], payload["project_id"])

    def test_upload_rejects_foreign_project(self) -> None:
        project = store.create_project(self.other_user["id"], "Foreign Project")

        response = self.client.post(
            "/assets/upload",
            json={"type": "image", "url": "https://example.com/image.png", "project_id": project["id"]},
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(403, response.status_code)
        self.assertEqual("Project does not belong to user", response.json()["detail"])

    def test_upload_multipart_file(self) -> None:
        project = store.create_project(self.user["id"], "File Project")
        content = VALID_PNG_BYTES
        response = self.client.post(
            "/assets/upload",
            data={"type": "image", "content_text": "cover", "project_id": project["id"]},
            files={"file": ("cover.png", content, "image/png")},
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertTrue(payload["url"].startswith(f"/uploads/{self.user['id']}/"))
        saved_file = Path(settings.storage_local_root) / payload["url"].lstrip("/")
        self.assertTrue(saved_file.exists())
        self.assertEqual(content, saved_file.read_bytes())

    def test_from_generation(self) -> None:
        project = store.create_project(self.user["id"], "Generation Project")
        node = store.create_node(project["id"], self.user["id"], "text", {}, 0, 0, 300, 200)
        canvas_id = store.get_first_canvas_id(project["id"])
        response = self.client.post(
            "/assets/from_generation",
            json={
                "type": "video",
                "url": "https://example.com/video.mp4",
                "content_text": "generated clip",
                "source_model": "agnes-video-v2.0",
                "source_task_id": "task-123",
                "canvas_node_id": node["id"],
                "project_id": project["id"],
            },
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual("generation", payload["source"])
        self.assertEqual("agnes-video-v2.0", payload["source_model"])
        self.assertEqual("task-123", payload["source_task_id"])
        self.assertEqual(node["id"], payload["canvas_node_id"])
        self.assertEqual(canvas_id, payload["origin_canvas_id"])

    def test_from_generation_rejects_cross_project_node(self) -> None:
        project = store.create_project(self.user["id"], "Target Project")
        other_project = store.create_project(self.user["id"], "Other Project")
        other_node = store.create_node(other_project["id"], self.user["id"], "text", {}, 0, 0, 300, 200)

        response = self.client.post(
            "/assets/from_generation",
            json={
                "type": "image",
                "url": "https://example.com/generated.png",
                "project_id": project["id"],
                "canvas_node_id": other_node["id"],
            },
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(403, response.status_code)
        self.assertEqual("Canvas node does not belong to project", response.json()["detail"])

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

    def _stored_upload_files(self) -> list[Path]:
        upload_root = Path(settings.storage_local_root) / "uploads"
        return [path for path in upload_root.rglob("*") if path.is_file()] if upload_root.exists() else []


if __name__ == "__main__":
    unittest.main()
