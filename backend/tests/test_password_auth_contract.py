from __future__ import annotations

import os
import subprocess
import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import MagicMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.router import include_routers
from controllers.store import DatabaseStore, configure_store, store
from core.security import verify_password
from database import close_db, init_db
from settings.config import settings


class PasswordAuthContractTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = TemporaryDirectory()
        self.db_path = str(Path(self.temp_dir.name) / "test-revid.db")
        init_db(self.db_path)
        configure_store(DatabaseStore())

        app = FastAPI()
        include_routers(app)
        self.client = TestClient(app)

        self.original_wechat_mock_enabled = settings.wechat_mock_enabled
        settings.wechat_mock_enabled = True
        store.registration_settings["registration_mode"] = "open"

    def tearDown(self) -> None:
        settings.wechat_mock_enabled = self.original_wechat_mock_enabled
        self.client.close()
        close_db()
        self.temp_dir.cleanup()

    def test_public_registration_settings_expose_only_non_sensitive_fields(self) -> None:
        store.registration_settings["registration_mode"] = "closed"
        store.registration_settings["wechat_login_enabled"] = False

        response = self.client.get("/auth/registration-settings")

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual({"registration_mode", "wechat_login_enabled"}, set(payload.keys()))
        self.assertEqual("closed", payload["registration_mode"])
        self.assertFalse(payload["wechat_login_enabled"])

    def test_register_enforces_password_policy_and_unique_username_email(self) -> None:
        weak_password = self._register("alpha", "short", "alpha@example.com")

        self.assertEqual(400, weak_password.status_code)
        self.assertEqual("Password does not meet policy", weak_password.json()["detail"])

        first_registration = self._register("alpha", "StrongPass123!", "alpha@example.com")

        self.assertEqual(200, first_registration.status_code)
        first_payload = first_registration.json()
        self.assertEqual("alpha", first_payload["user"]["username"])
        self.assertEqual("alpha@example.com", first_payload["user"]["email"])
        self.assertNotIn("password_hash", first_payload["user"])

        duplicate_username = self._register("alpha", "StrongPass123!", "other@example.com")
        self.assertEqual(409, duplicate_username.status_code)
        self.assertEqual("Username already exists", duplicate_username.json()["detail"])

        duplicate_email = self._register("beta", "StrongPass123!", "alpha@example.com")
        self.assertEqual(409, duplicate_email.status_code)
        self.assertEqual("Email already exists", duplicate_email.json()["detail"])

    def test_closed_mode_blocks_new_registration_but_keeps_existing_login_working(self) -> None:
        first_registration = self._register("existing-user", "StrongPass123!", "existing@example.com")

        self.assertEqual(200, first_registration.status_code)

        store.registration_settings["registration_mode"] = "closed"

        blocked_registration = self._register("closed-user", "StrongPass123!", "closed@example.com")
        self.assertEqual(403, blocked_registration.status_code)
        self.assertEqual("Registration is closed", blocked_registration.json()["detail"])

        login_response = self._login("existing-user", "StrongPass123!")
        self.assertEqual(200, login_response.status_code)
        self.assertEqual(first_registration.json()["user"]["id"], login_response.json()["user"]["id"])

    def test_login_accepts_username_or_email_and_rejects_wrong_password(self) -> None:
        registration = self._register("login-user", "StrongPass123!", "login@example.com")

        self.assertEqual(200, registration.status_code)

        username_login = self._login("login-user", "StrongPass123!")
        self.assertEqual(200, username_login.status_code)
        self.assertEqual("login-user", username_login.json()["user"]["username"])
        self.assertNotIn("password_hash", username_login.json()["user"])

        email_login = self._login("login@example.com", "StrongPass123!")
        self.assertEqual(200, email_login.status_code)
        self.assertEqual(username_login.json()["user"]["id"], email_login.json()["user"]["id"])

        wrong_password = self._login("login-user", "WrongPass123!")
        self.assertEqual(401, wrong_password.status_code)
        self.assertEqual("Invalid credentials", wrong_password.json()["detail"])

    def test_banned_user_is_rejected_but_frozen_user_can_login(self) -> None:
        banned_registration = self._register("banned-user", "StrongPass123!", "banned@example.com")
        frozen_registration = self._register("frozen-user", "StrongPass123!", "frozen@example.com")

        self.assertEqual(200, banned_registration.status_code)
        self.assertEqual(200, frozen_registration.status_code)

        banned_user = store.get_user(banned_registration.json()["user"]["id"])
        frozen_user = store.get_user(frozen_registration.json()["user"]["id"])
        banned_user["status"] = "banned"
        frozen_user["generation_status"] = "frozen"

        banned_login = self._login("banned-user", "StrongPass123!")
        self.assertEqual(403, banned_login.status_code)
        self.assertEqual("User is banned", banned_login.json()["detail"])

        frozen_login = self._login("frozen-user", "StrongPass123!")
        self.assertEqual(200, frozen_login.status_code)
        self.assertEqual("frozen", frozen_login.json()["user"]["generation_status"])

    def test_legacy_wechat_user_has_nullable_username_and_email_without_hash_leak(self) -> None:
        response = self.client.post(
            "/auth/wechat/mock",
            json={
                "openid": "legacy-wechat-user",
                "nickname": "Legacy Wechat User",
                "avatar_url": "",
                "unionid": None,
                "invitation_code": None,
            },
        )

        self.assertEqual(200, response.status_code)
        user_payload = response.json()["user"]
        self.assertIn("username", user_payload)
        self.assertIsNone(user_payload["username"])
        self.assertIn("email", user_payload)
        self.assertIsNone(user_payload["email"])
        self.assertNotIn("password_hash", user_payload)

    def _register(self, username: str, password: str, email: str | None = None):
        payload = {"username": username, "password": password}
        if email is not None:
            payload["email"] = email
        return self.client.post("/auth/register", json=payload)

    def _login(self, identifier: str, password: str):
        return self.client.post("/auth/login", json={"identifier": identifier, "password": password})


class AdminBootstrapContractTestCase(unittest.TestCase):
    def setUp(self) -> None:
        from scripts.seed_admin import settings as seed_settings

        self.seed_settings = seed_settings
        self.original_username = seed_settings.admin_username
        self.original_password = seed_settings.admin_password

    def tearDown(self) -> None:
        self.seed_settings.admin_username = self.original_username
        self.seed_settings.admin_password = self.original_password

    def test_seed_admin_requires_explicit_password_env(self) -> None:
        script_path = Path(__file__).resolve().parents[1] / "scripts" / "seed_admin.py"
        env = os.environ.copy()
        env["REVID_ADMIN_USERNAME"] = "seed-admin"
        env.pop("REVID_ADMIN_PASSWORD", None)

        result = subprocess.run(
            [sys.executable, str(script_path)],
            cwd=script_path.parent.parent,
            env=env,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertNotEqual(0, result.returncode)
        self.assertIn("REVID_ADMIN_PASSWORD is required", result.stderr)

    def test_seed_admin_orders_mysql_gates_and_is_idempotent(self) -> None:
        from scripts.seed_admin import main

        self.seed_settings.admin_username = "seed-admin"
        self.seed_settings.admin_password = "unit-test-password"
        admin = {"id": "admin-1", "username": "seed-admin", "role": "admin"}
        store = MagicMock()
        store.find_user_by_username.side_effect = [None, admin]
        store.ensure_admin_user.return_value = admin
        store.get_password_hash.return_value = "stored-hash"

        with (
            patch("scripts.seed_admin.init_mysql_engine") as init_mysql_engine,
            patch("scripts.seed_admin.check_alembic_revision") as check_revision,
            patch("scripts.seed_admin.DatabaseStore", return_value=store),
            patch("core.security.hash_password", return_value="new-hash"),
        ):
            self.assertEqual(0, main())
            self.assertEqual(0, main())

        self.assertEqual(2, init_mysql_engine.call_count)
        self.assertEqual(2, check_revision.call_count)
        store.ensure_admin_user.assert_called_once()


class RuntimeAdminBootstrapContractTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = TemporaryDirectory()
        self.db_path = str(Path(self.temp_dir.name) / "runtime-admin.db")
        self.original_admin_username = settings.admin_username
        self.original_admin_password = settings.admin_password
        init_db(self.db_path)

    def tearDown(self) -> None:
        settings.admin_username = self.original_admin_username
        settings.admin_password = self.original_admin_password
        close_db()
        self.temp_dir.cleanup()

    def test_database_store_skips_default_admin_without_env_credentials(self) -> None:
        settings.admin_username = ""
        settings.admin_password = ""

        runtime_store = DatabaseStore()

        admin_users = [user for user in runtime_store.users.values() if user["role"] == "admin"]
        self.assertEqual([], admin_users)

    def test_database_store_bootstraps_single_admin_from_env_credentials(self) -> None:
        settings.admin_username = "runtime-admin"
        settings.admin_password = "StrongPass123!"

        first_store = DatabaseStore()
        second_store = DatabaseStore()

        admin_users = [user for user in second_store.users.values() if user["role"] == "admin"]
        self.assertEqual(1, len(admin_users))
        self.assertEqual("runtime-admin", admin_users[0]["username"])
        self.assertTrue(verify_password("StrongPass123!", first_store.get_password_hash(admin_users[0]["id"])))

    def test_dev_login_fails_closed_without_bootstrapped_password_admin(self) -> None:
        settings.admin_username = ""
        settings.admin_password = ""
        configure_store(DatabaseStore())

        app = FastAPI()
        include_routers(app)
        client = TestClient(app)
        try:
            response = client.post("/admin/dev-login", params={"admin_key": settings.dev_admin_key})
        finally:
            client.close()

        self.assertEqual(503, response.status_code)
        self.assertEqual("Admin bootstrap user is not configured", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()
