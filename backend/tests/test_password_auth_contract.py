from __future__ import annotations

import os
import subprocess
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.router import include_routers
from controllers.store import DatabaseStore, configure_store, store
from core.security import verify_password
from settings.config import settings
from tests.mysql_test_database import MySQLTestDatabase


class PasswordAuthContractTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.mysql_database = MySQLTestDatabase("revid_test_password_auth")
        self.mysql_database.start()
        self.addCleanup(self.mysql_database.stop)
        configure_store(DatabaseStore())

        app = FastAPI()
        include_routers(app)
        self.client = TestClient(app)

        self.original_wechat_mock_enabled = settings.wechat_mock_enabled
        self.original_jwt_secret = settings.jwt_secret
        self.original_runtime_profile = settings.runtime_profile
        self.original_runtime_bind_host = settings.runtime_bind_host
        self.original_allow_mock_auth = settings.allow_mock_auth
        settings.runtime_profile = "development"
        settings.runtime_bind_host = "127.0.0.1"
        settings.allow_mock_auth = True
        settings.jwt_secret = "unit-test-password-auth-secret-minimum-32"
        settings.wechat_mock_enabled = True
        store.registration_settings["registration_mode"] = "open"

    def tearDown(self) -> None:
        settings.wechat_mock_enabled = self.original_wechat_mock_enabled
        settings.jwt_secret = self.original_jwt_secret
        settings.runtime_profile = self.original_runtime_profile
        settings.runtime_bind_host = self.original_runtime_bind_host
        settings.allow_mock_auth = self.original_allow_mock_auth
        self.client.close()

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

    def test_login_failures_share_one_database_throttle_window(self) -> None:
        first_client = self.client
        second_client = TestClient(first_client.app)
        try:
            responses = [
                (first_client if index % 2 == 0 else second_client).post(
                    "/auth/login",
                    json={"identifier": "missing-user", "password": "WrongPass123!"},
                )
                for index in range(6)
            ]
        finally:
            second_client.close()

        self.assertEqual([401] * 5, [response.status_code for response in responses[:5]])
        self.assertEqual(429, responses[5].status_code)
        self.assertEqual("Too many authentication attempts", responses[5].json()["detail"])
        self.assertGreaterEqual(int(responses[5].headers["Retry-After"]), 1)

    def test_successful_password_login_clears_its_throttle_window(self) -> None:
        registration = self._register("clear-window", "StrongPass123!", "clear@example.com")
        self.assertEqual(200, registration.status_code)

        for _index in range(4):
            self.assertEqual(401, self._login("clear-window", "WrongPass123!").status_code)

        self.assertEqual(200, self._login("clear-window", "StrongPass123!").status_code)

        for _index in range(4):
            self.assertEqual(401, self._login("clear-window", "WrongPass123!").status_code)

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

    def test_logout_requires_an_active_bearer_session(self) -> None:
        missing_token = self.client.post("/auth/logout")
        invalid_token = self.client.post(
            "/auth/logout",
            headers={"Authorization": "Bearer invalid-token"},
        )

        self.assertEqual(401, missing_token.status_code)
        self.assertEqual("Missing bearer token", missing_token.json()["detail"])
        self.assertEqual(401, invalid_token.status_code)
        self.assertEqual("Invalid token", invalid_token.json()["detail"])

        registration = self._register("logout-user", "StrongPass123!", "logout@example.com")
        self.assertEqual(200, registration.status_code)
        token = registration.json()["token"]

        active_logout = self.client.post(
            "/auth/logout",
            headers={"Authorization": f"Bearer {token}"},
        )

        self.assertEqual(200, active_logout.status_code)
        self.assertEqual(
            {"ok": True, "detail": "Bearer session acknowledged for client logout"},
            active_logout.json(),
        )

        user = store.get_user(registration.json()["user"]["id"])
        user["status"] = "banned"
        banned_logout = self.client.post(
            "/auth/logout",
            headers={"Authorization": f"Bearer {token}"},
        )

        self.assertEqual(403, banned_logout.status_code)
        self.assertEqual("User is banned", banned_logout.json()["detail"])

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
        self.original_admin_username = settings.admin_username
        self.original_admin_password = settings.admin_password
        self.original_dev_admin_key = settings.dev_admin_key
        self.original_jwt_secret = settings.jwt_secret
        self.original_runtime_profile = settings.runtime_profile
        self.original_runtime_bind_host = settings.runtime_bind_host
        self.original_allow_mock_auth = settings.allow_mock_auth
        self.mysql_database = MySQLTestDatabase("revid_test_runtime_admin")
        self.mysql_database.start()
        self.addCleanup(self.mysql_database.stop)
        settings.jwt_secret = "unit-test-runtime-admin-secret-minimum-32"

    def tearDown(self) -> None:
        settings.admin_username = self.original_admin_username
        settings.admin_password = self.original_admin_password
        settings.dev_admin_key = self.original_dev_admin_key
        settings.jwt_secret = self.original_jwt_secret
        settings.runtime_profile = self.original_runtime_profile
        settings.runtime_bind_host = self.original_runtime_bind_host
        settings.allow_mock_auth = self.original_allow_mock_auth

    def _enable_development_auth(self) -> None:
        settings.runtime_profile = "development"
        settings.runtime_bind_host = "127.0.0.1"
        settings.allow_mock_auth = True

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
        settings.dev_admin_key = "test-" * 8
        self._enable_development_auth()
        configure_store(DatabaseStore())

        app = FastAPI()
        include_routers(app)
        client = TestClient(app)
        try:
            response = client.post(
                "/admin/dev-login",
                headers={"X-Revid-Dev-Admin-Key": settings.dev_admin_key},
            )
        finally:
            client.close()

        self.assertEqual(503, response.status_code)
        self.assertEqual("Admin bootstrap user is not configured", response.json()["detail"])

    def test_dev_login_is_disabled_without_explicit_key(self) -> None:
        settings.dev_admin_key = ""
        self._enable_development_auth()

        app = FastAPI()
        include_routers(app)
        client = TestClient(app)
        try:
            response = client.post(
                "/admin/dev-login",
                headers={"X-Revid-Dev-Admin-Key": "test-" * 8},
            )
        finally:
            client.close()

        self.assertEqual(404, response.status_code)
        self.assertEqual("Not found", response.json()["detail"])

    def test_dev_login_rejects_query_secret_without_echoing_it(self) -> None:
        supplied_key = "query-secret-" * 3
        settings.admin_username = "runtime-admin"
        settings.admin_password = "StrongPass123!"
        settings.dev_admin_key = supplied_key
        self._enable_development_auth()
        configure_store(DatabaseStore())

        app = FastAPI()
        include_routers(app)
        client = TestClient(app)
        try:
            response = client.post("/admin/dev-login", params={"admin_key": supplied_key})
        finally:
            client.close()

        self.assertEqual(403, response.status_code)
        self.assertNotIn(supplied_key, response.text)

    def test_dev_login_accepts_only_explicit_header_contract(self) -> None:
        supplied_key = "header-secret-" * 3
        settings.admin_username = "runtime-admin"
        settings.admin_password = "StrongPass123!"
        settings.dev_admin_key = supplied_key
        self._enable_development_auth()
        configure_store(DatabaseStore())

        app = FastAPI()
        include_routers(app)
        client = TestClient(app)
        try:
            response = client.post(
                "/admin/dev-login",
                headers={"X-Revid-Dev-Admin-Key": supplied_key},
            )
        finally:
            client.close()

        self.assertEqual(200, response.status_code)
        self.assertEqual("admin", response.json()["user"]["role"])

    def test_invalid_dev_login_headers_share_database_throttle(self) -> None:
        settings.admin_username = "runtime-admin"
        settings.admin_password = "StrongPass123!"
        settings.dev_admin_key = "configured-admin-key-" * 2
        self._enable_development_auth()
        configure_store(DatabaseStore())

        app = FastAPI()
        include_routers(app)
        client = TestClient(app)
        try:
            responses = [
                client.post(
                    "/admin/dev-login",
                    headers={"X-Revid-Dev-Admin-Key": f"wrong-admin-key-{index}"},
                )
                for index in range(6)
            ]
        finally:
            client.close()

        self.assertEqual([403] * 5, [response.status_code for response in responses[:5]])
        self.assertEqual(429, responses[5].status_code)
        self.assertEqual("Too many authentication attempts", responses[5].json()["detail"])


if __name__ == "__main__":
    unittest.main()
