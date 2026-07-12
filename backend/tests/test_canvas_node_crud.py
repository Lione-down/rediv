from __future__ import annotations

import sys
import unittest
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.router import include_routers
from controllers.store import DatabaseStore, InMemoryStore, configure_store, store
from core.security import create_token
from tests.mysql_test_database import MySQLTestDatabase


class CanvasNodeCrudTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_canvas_node_crud")
        cls.mysql_database.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    def setUp(self) -> None:
        configure_store(DatabaseStore())

        app = FastAPI()
        include_routers(app)
        self.client = TestClient(app)

        store.registration_settings["registration_mode"] = "open"
        test_id = self._testMethodName
        self.user = self._register_user(f"canvas-owner-{test_id}").json()["user"]
        self.other_user = self._register_user(f"canvas-other-{test_id}").json()["user"]
        self.project = store.create_project(self.user["id"], "Storyboard")
        self.other_project = store.create_project(self.other_user["id"], "Other Storyboard")

    def tearDown(self) -> None:
        self.client.close()

    def test_create_node(self) -> None:
        response = self.client.post(
            f"/projects/{self.project['id']}/nodes",
            json={
                "node_type": "text",
                "content": {"text": "Opening line"},
                "position_x": 120,
                "position_y": 40,
                "width": 320,
                "height": 180,
            },
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(201, response.status_code)
        payload = response.json()
        self.assertEqual(self.project["id"], payload["project_id"])
        self.assertEqual("text", payload["node_type"])
        self.assertEqual({"text": "Opening line"}, payload["content"])
        self.assertEqual(120, payload["position_x"])
        self.assertIn("created_at", payload)

    def test_list_nodes(self) -> None:
        middle = store.create_node(self.project["id"], self.user["id"], "text", {"text": "middle"}, 200, 10, 300, 200)
        left = store.create_node(self.project["id"], self.user["id"], "image", {"url": "left.png"}, 50, 0, 300, 200)
        store.create_node(self.other_project["id"], self.other_user["id"], "text", {"text": "other"}, 10, 0, 300, 200)

        response = self.client.get(
            f"/projects/{self.project['id']}/nodes",
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual(2, payload["total"])
        self.assertEqual([left["id"], middle["id"]], [item["id"] for item in payload["items"]])

    def test_get_node(self) -> None:
        node = store.create_node(self.project["id"], self.user["id"], "text", {"text": "detail"}, 100, 20, 300, 200)

        response = self.client.get(
            f"/projects/{self.project['id']}/nodes/{node['id']}",
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(200, response.status_code)
        self.assertEqual(node["id"], response.json()["id"])

    def test_update_node(self) -> None:
        node = store.create_node(self.project["id"], self.user["id"], "text", {"text": "before"}, 100, 20, 300, 200)

        response = self.client.put(
            f"/projects/{self.project['id']}/nodes/{node['id']}",
            json={
                "node_type": "image",
                "content": {"url": "after.png"},
                "position_x": 360,
                "position_y": 80,
                "width": 480,
                "height": 270,
                "status": "archived",
            },
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual("image", payload["node_type"])
        self.assertEqual({"url": "after.png"}, payload["content"])
        self.assertEqual(360, payload["position_x"])
        self.assertEqual("archived", payload["status"])

    def test_delete_node(self) -> None:
        node = store.create_node(self.project["id"], self.user["id"], "text", {"text": "delete"}, 0, 0, 300, 200)

        response = self.client.delete(
            f"/projects/{self.project['id']}/nodes/{node['id']}",
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(204, response.status_code)
        self.assertEqual("", response.text)
        self.assertIsNone(store.get_node(node["id"]))

    def test_create_node_wrong_project(self) -> None:
        response = self.client.post(
            f"/projects/{self.other_project['id']}/nodes",
            json={"node_type": "text", "content": {"text": "blocked"}},
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(403, response.status_code)
        self.assertEqual("Forbidden", response.json()["detail"])

    def test_get_node_wrong_project(self) -> None:
        node = store.create_node(self.project["id"], self.user["id"], "text", {"text": "private"}, 30, 10, 300, 200)
        another_project = store.create_project(self.user["id"], "Another")

        response = self.client.get(
            f"/projects/{another_project['id']}/nodes/{node['id']}",
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(403, response.status_code)
        self.assertEqual("Forbidden", response.json()["detail"])

    def test_node_persistence(self) -> None:
        node = store.create_node(self.project["id"], self.user["id"], "text", {"text": "persist"}, 90, 40, 300, 200)

        reloaded_store = DatabaseStore()
        loaded = reloaded_store.get_node(node["id"])

        self.assertIsNotNone(loaded)
        self.assertEqual(self.project["id"], loaded["project_id"])
        self.assertEqual({"text": "persist"}, loaded["content"])

    def test_inmemory_node_crud(self) -> None:
        memory_store = InMemoryStore()
        user = memory_store.create_user("Memory User", "")
        project = memory_store.create_project(user["id"], "Memory Project")

        created = memory_store.create_node(project["id"], user["id"], "text", {"text": "memory"}, 10, 20, 300, 200)
        listed = memory_store.list_nodes(project["id"], user["id"])
        updated = memory_store.update_node(created["id"], user["id"], position_x=30)
        deleted = memory_store.delete_node(created["id"], user["id"])

        self.assertEqual(1, len(listed))
        self.assertEqual(30, updated["position_x"])
        self.assertEqual(created["id"], deleted["id"])
        self.assertIsNone(memory_store.get_node(created["id"]))

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
