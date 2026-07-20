from __future__ import annotations

import sys
import unittest
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.router import include_routers
from controllers.store import DatabaseStore, TestInMemoryStore, configure_store, store
from core.security import create_token
from tests.mysql_test_database import MySQLTestDatabase


class ProjectCrudTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_project_crud")
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
        self.user = self._register_user(f"project-owner-{test_id}").json()["user"]
        self.other_user = self._register_user(f"project-other-{test_id}").json()["user"]

    def tearDown(self) -> None:
        self.client.close()

    def test_create_project(self) -> None:
        response = self.client.post(
            "/projects",
            json={"name": "Storyboard A"},
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(201, response.status_code)
        payload = response.json()
        self.assertEqual(self.user["id"], payload["user_id"])
        self.assertEqual("Storyboard A", payload["name"])
        self.assertIn("created_at", payload)

    def test_list_projects(self) -> None:
        older = store.create_project(self.user["id"], "Older")
        newer = store.create_project(self.user["id"], "Newer")
        store.create_project(self.other_user["id"], "Other User Project")

        response = self.client.get("/projects", headers=self._auth_headers(self.user["id"]))

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual(2, payload["total"])
        items = payload["items"]
        self.assertCountEqual([newer["id"], older["id"]], [item["id"] for item in items])
        created_times = [item["created_at"] for item in items]
        self.assertEqual(sorted(created_times, reverse=True), created_times)

    def test_get_project_own(self) -> None:
        project = store.create_project(self.user["id"], "My Project")

        response = self.client.get(f"/projects/{project['id']}", headers=self._auth_headers(self.user["id"]))

        self.assertEqual(200, response.status_code)
        self.assertEqual(project["id"], response.json()["id"])

    def test_get_project_other(self) -> None:
        project = store.create_project(self.other_user["id"], "Private Project")

        response = self.client.get(f"/projects/{project['id']}", headers=self._auth_headers(self.user["id"]))

        self.assertEqual(403, response.status_code)
        self.assertEqual("Forbidden", response.json()["detail"])

    def test_delete_project_own(self) -> None:
        project = store.create_project(self.user["id"], "Delete Me")

        response = self.client.delete(f"/projects/{project['id']}", headers=self._auth_headers(self.user["id"]))

        self.assertEqual(204, response.status_code)
        self.assertEqual("", response.text)
        self.assertIsNone(store.get_project(project["id"]))

    def test_delete_project_other(self) -> None:
        project = store.create_project(self.other_user["id"], "Protected")

        response = self.client.delete(f"/projects/{project['id']}", headers=self._auth_headers(self.user["id"]))

        self.assertEqual(403, response.status_code)
        self.assertEqual("Forbidden", response.json()["detail"])

    def test_delete_project_with_resource_returns_conflict(self) -> None:
        project = store.create_project(self.user["id"], "Resource Project")
        asset = store.create_asset(
            self.user["id"],
            "image",
            "/uploads/protected.png",
            None,
            project_id=project["id"],
        )

        response = self.client.delete(
            f"/projects/{project['id']}",
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(409, response.status_code)
        self.assertEqual("Project has linked resources", response.json()["detail"])
        self.assertIsNotNone(store.get_project(project["id"]))
        self.assertEqual(asset["id"], store.get_asset(asset["id"])["id"])

    def test_project_persistence(self) -> None:
        project = store.create_project(self.user["id"], "Persisted Project")

        reloaded_store = DatabaseStore()
        loaded = reloaded_store.get_project(project["id"])

        self.assertIsNotNone(loaded)
        self.assertEqual("Persisted Project", loaded["name"])
        self.assertEqual(self.user["id"], loaded["user_id"])

    def test_inmemory_project_crud(self) -> None:
        memory_store = TestInMemoryStore()
        user = memory_store.create_user("Memory User", "")

        created = memory_store.create_project(user["id"], "Memory Project")
        listed = memory_store.list_projects(user["id"])
        loaded = memory_store.get_project(created["id"])
        deleted = memory_store.delete_project(created["id"], user["id"])

        self.assertEqual(1, len(listed))
        self.assertEqual(created["id"], loaded["id"])
        self.assertEqual(created["id"], deleted["id"])
        self.assertIsNone(memory_store.get_project(created["id"]))

    def test_inmemory_project_delete_rejects_linked_resources(self) -> None:
        memory_store = TestInMemoryStore()
        user = memory_store.create_user("Memory Resource User", "")
        project = memory_store.create_project(user["id"], "Memory Resource Project")
        memory_store.create_asset(
            user["id"],
            "image",
            "/uploads/memory.png",
            None,
            project_id=project["id"],
        )

        with self.assertRaisesRegex(RuntimeError, "linked resources"):
            memory_store.delete_project(project["id"], user["id"])

        self.assertIsNotNone(memory_store.get_project(project["id"]))

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
