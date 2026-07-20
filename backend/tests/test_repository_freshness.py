from __future__ import annotations

import unittest

from controllers.store import DatabaseStore
from core.security import hash_password
from tests.mysql_test_database import MySQLTestDatabase


class RepositoryFreshnessTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_repository_freshness")
        cls.mysql_database.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    def setUp(self) -> None:
        self.first_worker = DatabaseStore()
        self.second_worker = DatabaseStore()
        self.admin = self.first_worker.ensure_admin_user(
            "freshness-admin",
            hash_password("StrongPass123!"),
        )

    def test_user_state_mutations_are_visible_to_an_existing_worker(self) -> None:
        user = self.first_worker.create_user("Fresh User", "")

        self.first_worker.get_user(user["id"])["status"] = "banned"
        self.first_worker.get_user(user["id"])["generation_status"] = "frozen"

        fresh_user = self.second_worker.get_user(user["id"])
        self.assertEqual("banned", fresh_user["status"])
        self.assertEqual("frozen", fresh_user["generation_status"])

    def test_settings_asset_and_invitation_reads_do_not_use_startup_snapshots(self) -> None:
        self.first_worker.registration_settings.update(
            {"registration_mode": "closed", "wechat_login_enabled": False}
        )
        asset_owner = self.first_worker.create_user("Asset Owner", "")
        asset = self.first_worker.create_asset(
            asset_owner["id"],
            "image",
            "https://example.com/fresh.png",
            None,
        )
        self.first_worker.create_invitation_code(
            "FRESH-CODE",
            2,
            None,
            None,
            self.admin["id"],
        )
        self.first_worker.user_repository.disable_invitation("FRESH-CODE")

        settings = self.second_worker.user_repository.get_registration_settings()
        self.assertEqual("closed", settings["registration_mode"])
        self.assertFalse(settings["wechat_login_enabled"])
        self.assertEqual(asset["id"], self.second_worker.asset_repository.get(asset["id"])["id"])
        self.assertEqual(
            "disabled",
            self.second_worker.user_repository.get_invitation("FRESH-CODE")["status"],
        )


if __name__ == "__main__":
    unittest.main()
