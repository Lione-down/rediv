from __future__ import annotations

import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from controllers.store import DatabaseStore
from core.security import hash_password
from database import close_db, init_db


class DatabaseStoreTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = TemporaryDirectory()
        self.db_path = str(Path(self.temp_dir.name) / "test-revid.db")
        init_db(self.db_path)
        self.store = DatabaseStore()
        self.admin = self.store.ensure_admin_user("test-admin", hash_password("StrongPass123!"))

    def tearDown(self) -> None:
        close_db()
        self.temp_dir.cleanup()

    def test_create_user_and_query(self) -> None:
        user = self.store.create_user("Alice", "avatar.png")
        loaded = self.store.get_user(user["id"])

        self.assertIsNotNone(loaded)
        self.assertEqual("Alice", loaded["nickname"])
        self.assertEqual({"text": 0, "image": 0, "video": 0}, dict(self.store.quotas[user["id"]]))

    def test_bind_identity_and_find(self) -> None:
        user = self.store.create_user("Bob", "")
        identity = self.store.bind_identity(user["id"], "wechat_open", "openid-1", "union-1", {"nickname": "Bob"})
        loaded = self.store.find_identity("wechat_open", "openid-1")

        self.assertEqual(identity["id"], loaded["id"])
        self.assertEqual(user["id"], loaded["user_id"])

    def test_create_guest(self) -> None:
        guest = self.store.create_guest()

        self.assertIn(guest["session_id"], self.store.guests)
        self.assertEqual({}, guest["local_project_snapshot"])

    def test_create_invitation_code_and_use(self) -> None:
        invitation = self.store.create_invitation_code("HELLO123", 2, None, None, self.admin["id"])

        self.assertTrue(self.store.use_invitation_code("HELLO123"))
        self.assertEqual(1, invitation["used_count"])

    def test_grant_quota(self) -> None:
        user = self.store.create_user("Quota User", "")
        record = self.store.grant_quota(user["id"], "text", 5, "admin_grant", None)

        self.assertEqual(5, self.store.quotas[user["id"]]["text"])
        self.assertEqual("text", record["quota_type"])

    def test_create_asset(self) -> None:
        user = self.store.create_user("Asset User", "")
        asset = self.store.create_asset(user["id"], "image", "https://example.com/image.png", None)

        self.assertEqual(asset["id"], self.store.assets[asset["id"]]["id"])
        self.assertEqual(user["id"], asset["user_id"])

    def test_generation_task_persists_after_reload(self) -> None:
        user = self.store.create_user("Task User", "")
        project = self.store.create_project(user["id"], "Task Project")
        node = self.store.create_node(project["id"], user["id"], "text", {}, 0, 0, 300, 200)
        task = self.store.create_generation_task(
            user["id"],
            "text",
            "agnes",
            "agnes-2.0-flash",
            project_id=project["id"],
            canvas_node_id=node["id"],
            status="running",
        )
        asset = self.store.create_asset(
            user["id"],
            "prompt",
            None,
            "generated",
            project_id=project["id"],
            canvas_node_id=node["id"],
            source="generation",
            source_model="agnes-2.0-flash",
            source_task_id=task["id"],
        )
        self.store.update_generation_task(task["id"], status="succeeded", result_asset_id=asset["id"], duration_ms=12)

        reloaded_store = DatabaseStore()
        loaded_task = reloaded_store.get_generation_task(task["id"])

        self.assertIsNotNone(loaded_task)
        self.assertEqual("succeeded", loaded_task["status"])
        self.assertEqual(asset["id"], loaded_task["result_asset_id"])
        self.assertEqual(project["id"], loaded_task["project_id"])

    def test_data_persists_after_reload(self) -> None:
        user = self.store.create_user("Persisted User", "")
        self.store.create_asset(user["id"], "prompt", None, "hello")
        self.store.grant_quota(user["id"], "image", 3, "default_grant", None)

        reloaded_store = DatabaseStore()

        self.assertEqual("Persisted User", reloaded_store.get_user(user["id"])["nickname"])
        self.assertEqual(3, reloaded_store.quotas[user["id"]]["image"])
        self.assertEqual(1, len([asset for asset in reloaded_store.assets.values() if asset["user_id"] == user["id"]]))


if __name__ == "__main__":
    unittest.main()
