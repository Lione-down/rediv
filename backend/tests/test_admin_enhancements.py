from __future__ import annotations

import sys
import unittest
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.router import include_routers
from controllers.store import DatabaseStore, configure_store, store
from core.security import create_token, hash_password
from tests.mysql_test_database import MySQLTestDatabase


class AdminEnhancementsTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.mysql_database = MySQLTestDatabase("revid_test_admin_enhancements")
        self.mysql_database.start()
        self.addCleanup(self.mysql_database.stop)
        configure_store(DatabaseStore())
        self.admin_id = store.ensure_admin_user("test-admin", hash_password("StrongPass123!"))["id"]

        app = FastAPI()
        include_routers(app)
        self.client = TestClient(app)

        store.registration_settings["registration_mode"] = "open"

        self.user = self._register_user("admin-feature-user").json()["user"]
        self.second_user = self._register_user("admin-feature-second").json()["user"]
        self.project = store.create_project(self.user["id"], "Project One")
        self.second_project = store.create_project(self.second_user["id"], "Project Two")
        store.create_node(self.project["id"], self.user["id"], "text", {"text": "A"}, 10, 10, 320, 180)
        store.create_node(self.project["id"], self.user["id"], "image", {"url": "b.png"}, 30, 10, 320, 180)
        store.create_asset(self.user["id"], "image", "/uploads/a.png", None, project_id=self.project["id"])

    def tearDown(self) -> None:
        self.client.close()

    def test_list_all_projects(self) -> None:
        response = self.client.get("/admin/projects", headers=self._admin_headers())

        self.assertEqual(200, response.status_code)
        items = response.json()["items"]
        self.assertEqual(2, len(items))
        self.assertEqual(
            {self.project["id"], self.second_project["id"]},
            {item["id"] for item in items},
        )
        second_project_item = next(
            item for item in items if item["id"] == self.second_project["id"]
        )
        self.assertEqual(
            self.second_user["nickname"],
            second_project_item["user_nickname"],
        )
        project_item = next(item for item in items if item["id"] == self.project["id"])
        self.assertEqual(self.user["nickname"], project_item["user_nickname"])
        self.assertEqual(2, project_item["node_count"])

    def test_get_user_detail(self) -> None:
        response = self.client.get(f"/admin/users/{self.user['id']}", headers=self._admin_headers())

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual(self.user["id"], payload["id"])
        self.assertEqual(self.user["nickname"], payload["nickname"])
        self.assertEqual(100, payload["quotas"]["text"])
        self.assertEqual(20, payload["quotas"]["image"])
        self.assertEqual(3, payload["quotas"]["video"])
        self.assertEqual(1, payload["asset_count"])
        self.assertEqual(1, payload["project_count"])

    def test_get_user_detail_not_found(self) -> None:
        response = self.client.get("/admin/users/missing-user", headers=self._admin_headers())

        self.assertEqual(404, response.status_code)
        self.assertEqual("User not found", response.json()["detail"])

    def test_admin_log_ban(self) -> None:
        response = self.client.post(f"/admin/users/{self.user['id']}/ban", headers=self._admin_headers())

        self.assertEqual(200, response.status_code)
        self.assertEqual("banned", response.json()["status"])
        last_log = store.admin_logs[-1]
        self.assertEqual("ban", last_log["action"])
        self.assertEqual("user", last_log["target_type"])
        self.assertEqual(self.user["id"], last_log["target_id"])
        self.assertEqual(self.admin_id, last_log["admin_id"])

    def test_admin_log_grant(self) -> None:
        response = self.client.post(
            f"/admin/users/{self.user['id']}/quotas/grant",
            json={"quota_type": "text", "amount": 50, "reason": "manual topup"},
            headers=self._admin_headers(),
        )

        self.assertEqual(200, response.status_code)
        self.assertEqual(150, response.json()["quotas"]["text"])
        last_log = store.admin_logs[-1]
        self.assertEqual("grant_quota", last_log["action"])
        self.assertEqual(self.user["id"], last_log["target_id"])
        self.assertEqual("manual topup", last_log["detail"]["message"].split(": ", 1)[-1])

    def test_list_admin_logs(self) -> None:
        first = self.client.post(f"/admin/users/{self.user['id']}/ban", headers=self._admin_headers())
        second = self.client.post(
            f"/admin/users/{self.user['id']}/quotas/grant",
            json={"quota_type": "image", "amount": 1, "reason": "one image"},
            headers=self._admin_headers(),
        )
        self.assertEqual(200, first.status_code)
        self.assertEqual(200, second.status_code)

        response = self.client.get("/admin/logs", headers=self._admin_headers())

        self.assertEqual(200, response.status_code)
        items = response.json()["items"]
        self.assertGreaterEqual(len(items), 2)
        self.assertEqual(
            sorted((item["created_at"] for item in items), reverse=True),
            [item["created_at"] for item in items],
        )
        self.assertEqual("grant_quota", items[0]["action"])
        self.assertEqual("ban", items[1]["action"])

    def test_admin_log_persistence(self) -> None:
        response = self.client.post(f"/admin/users/{self.user['id']}/ban", headers=self._admin_headers())
        self.assertEqual(200, response.status_code)

        reloaded_store = DatabaseStore()

        self.assertTrue(any(log["action"] == "ban" and log["target_id"] == self.user["id"] for log in reloaded_store.admin_logs))

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

    def _admin_headers(self) -> dict[str, str]:
        token = create_token({"sub": self.admin_id, "role": "admin"})
        return {"Authorization": f"Bearer {token}"}


if __name__ == "__main__":
    unittest.main()
