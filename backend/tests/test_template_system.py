from __future__ import annotations

import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.router import include_routers
from controllers.store import DatabaseStore, InMemoryStore, configure_store, store
from core.security import create_token
from database import close_db, init_db


class TemplateSystemTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = TemporaryDirectory()
        self.db_path = str(Path(self.temp_dir.name) / "test-revid.db")
        init_db(self.db_path)
        configure_store(DatabaseStore())

        app = FastAPI()
        include_routers(app)
        self.client = TestClient(app)

        store.registration_settings["registration_mode"] = "open"
        self.user = self._register_user("template-owner").json()["user"]
        self.other_user = self._register_user("template-other").json()["user"]
        self.project = store.create_project(self.user["id"], "Storyboard")
        self.other_project = store.create_project(self.other_user["id"], "Private Board")
        self.node_a = store.create_node(
            self.project["id"],
            self.user["id"],
            "text",
            {"text": "Opening"},
            50,
            20,
            320,
            180,
        )
        self.node_b = store.create_node(
            self.project["id"],
            self.user["id"],
            "image",
            {"url": "cover.png"},
            260,
            40,
            480,
            270,
        )

    def tearDown(self) -> None:
        self.client.close()
        close_db()
        self.temp_dir.cleanup()

    def test_create_template(self) -> None:
        response = self.client.post(
            "/templates",
            json={"name": "Launch Template", "project_id": self.project["id"]},
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(201, response.status_code)
        payload = response.json()
        self.assertEqual("Launch Template", payload["name"])
        self.assertEqual(self.user["id"], payload["user_id"])
        self.assertEqual(2, payload["node_count"])
        self.assertEqual(2, len(payload["node_data"]))

    def test_create_template_wrong_project(self) -> None:
        response = self.client.post(
            "/templates",
            json={"name": "Blocked Template", "project_id": self.other_project["id"]},
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(403, response.status_code)
        self.assertEqual("Forbidden", response.json()["detail"])

    def test_list_templates(self) -> None:
        older = store.create_template(self.user["id"], "Older", self.project["id"])
        newer = store.create_template(self.user["id"], "Newer", self.project["id"])
        store.create_template(self.other_user["id"], "Other", self.other_project["id"])

        response = self.client.get("/templates", headers=self._auth_headers(self.user["id"]))

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual(2, payload["total"])
        self.assertEqual([newer["id"], older["id"]], [item["id"] for item in payload["items"]])

    def test_get_template(self) -> None:
        template = store.create_template(self.user["id"], "Detail", self.project["id"])

        response = self.client.get(f"/templates/{template['id']}", headers=self._auth_headers(self.user["id"]))

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual(template["id"], payload["id"])
        self.assertEqual(2, len(payload["node_data"]))

    def test_get_template_forbidden(self) -> None:
        template = store.create_template(self.other_user["id"], "Private", self.other_project["id"])

        response = self.client.get(f"/templates/{template['id']}", headers=self._auth_headers(self.user["id"]))

        self.assertEqual(403, response.status_code)
        self.assertEqual("Forbidden", response.json()["detail"])

    def test_delete_template(self) -> None:
        template = store.create_template(self.user["id"], "Delete", self.project["id"])

        response = self.client.delete(f"/templates/{template['id']}", headers=self._auth_headers(self.user["id"]))

        self.assertEqual(204, response.status_code)
        self.assertEqual("", response.text)
        self.assertIsNone(store.get_template(template["id"]))

    def test_use_template(self) -> None:
        template = store.create_template(self.user["id"], "Reuse Template", self.project["id"])

        response = self.client.post(
            f"/templates/{template['id']}/use",
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual(template["id"], payload["template"]["id"])
        self.assertEqual("Reuse Template", payload["project_name"])
        self.assertEqual(2, payload["nodes_created"])

        new_project = store.get_project(payload["project_id"])
        self.assertIsNotNone(new_project)
        cloned_nodes = store.list_nodes(payload["project_id"], self.user["id"])
        self.assertEqual(2, len(cloned_nodes))
        self.assertNotEqual(self.node_a["id"], cloned_nodes[0]["id"])
        self.assertEqual(self.node_a["content"], cloned_nodes[0]["content"])
        self.assertEqual(self.node_b["content"], cloned_nodes[1]["content"])

    def test_template_persistence(self) -> None:
        template = store.create_template(self.user["id"], "Persisted", self.project["id"])

        reloaded_store = DatabaseStore()
        loaded = reloaded_store.get_template(template["id"])

        self.assertIsNotNone(loaded)
        self.assertEqual("Persisted", loaded["name"])
        self.assertEqual(2, loaded["node_count"])
        self.assertEqual({"text": "Opening"}, loaded["node_data"][0]["content"])

    def test_inmemory_template_crud(self) -> None:
        memory_store = InMemoryStore()
        user = memory_store.create_user("Memory User", "")
        project = memory_store.create_project(user["id"], "Memory Project")
        memory_store.create_node(project["id"], user["id"], "text", {"text": "one"}, 10, 10, 300, 200)
        memory_store.create_node(project["id"], user["id"], "image", {"url": "two.png"}, 20, 10, 300, 200)

        created = memory_store.create_template(user["id"], "Memory Template", project["id"])
        listed = memory_store.list_templates(user["id"])
        used = memory_store.use_template(created["id"], user["id"])
        deleted = memory_store.delete_template(created["id"], user["id"])

        self.assertEqual(1, len(listed))
        self.assertEqual(2, used["nodes_created"])
        self.assertEqual("Memory Template", used["project_name"])
        self.assertEqual(created["id"], deleted["id"])
        self.assertIsNone(memory_store.get_template(created["id"]))

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


if __name__ == "__main__":
    unittest.main()
