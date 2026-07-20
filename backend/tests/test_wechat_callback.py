from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import Mock, patch
from urllib.parse import parse_qs, urlparse

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from controllers.store import DatabaseStore, configure_store, store
from main import app
from settings.config import settings
from tests.mysql_test_database import MySQLTestDatabase


class WechatCallbackTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.mysql_database = MySQLTestDatabase("revid_test_wechat_callback")
        self.mysql_database.start()
        self.addCleanup(self.mysql_database.stop)
        configure_store(DatabaseStore())
        store.registration_settings["registration_mode"] = "open"

        self.original_mock_enabled = settings.wechat_mock_enabled
        self.original_app_id = settings.wechat_app_id
        self.original_app_secret = settings.wechat_app_secret
        self.original_runtime_profile = settings.runtime_profile
        self.original_runtime_bind_host = settings.runtime_bind_host
        self.original_allow_mock_auth = settings.allow_mock_auth
        self.original_jwt_secret = settings.jwt_secret
        settings.runtime_profile = "development"
        settings.runtime_bind_host = "127.0.0.1"
        settings.allow_mock_auth = True
        settings.jwt_secret = "unit-test-wechat-auth-secret-minimum-32"

        self.client = TestClient(app)

    def tearDown(self) -> None:
        settings.wechat_mock_enabled = self.original_mock_enabled
        settings.wechat_app_id = self.original_app_id
        settings.wechat_app_secret = self.original_app_secret
        settings.runtime_profile = self.original_runtime_profile
        settings.runtime_bind_host = self.original_runtime_bind_host
        settings.allow_mock_auth = self.original_allow_mock_auth
        settings.jwt_secret = self.original_jwt_secret

    def test_mock_route_is_hidden_without_explicit_development_auth(self) -> None:
        settings.wechat_mock_enabled = True
        settings.runtime_profile = "production"
        settings.allow_mock_auth = False

        response = self.client.post(
            "/auth/wechat/mock",
            json={"openid": "blocked-mock-user", "nickname": "Blocked"},
        )

        self.assertEqual(404, response.status_code)
        self.assertEqual("Not found", response.json()["detail"])

    def test_mock_token_issuance_has_a_shared_database_throttle(self) -> None:
        settings.wechat_mock_enabled = True

        responses = [
            self.client.post(
                "/auth/wechat/mock",
                json={"openid": f"throttled-mock-user-{index}", "nickname": "Mock"},
            )
            for index in range(6)
        ]

        self.assertEqual([200] * 5, [response.status_code for response in responses[:5]])
        self.assertEqual(429, responses[5].status_code)
        self.assertEqual("Too many authentication attempts", responses[5].json()["detail"])

    def test_mock_mode_keeps_existing_callback_behavior(self) -> None:
        settings.wechat_mock_enabled = True

        response = self.client.post(
            "/auth/wechat/callback",
            json={"code": "mock-openid", "state": self._authorize_state()},
        )

        self.assertEqual(200, response.status_code)
        self.assertEqual("Mock Wechat User", response.json()["user"]["nickname"])

    def test_authorize_returns_backend_signed_state(self) -> None:
        settings.wechat_mock_enabled = True

        response = self.client.get("/auth/wechat/authorize", params={"state": "browser-state"})

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertTrue(payload["mock"])
        self.assertNotEqual("browser-state", payload["state"])
        self.assertEqual(payload["state"], parse_qs(urlparse(payload["authorize_url"]).query)["state"][0])

    def test_callback_rejects_missing_state(self) -> None:
        settings.wechat_mock_enabled = True

        response = self.client.post("/auth/wechat/callback", json={"code": "mock-openid"})

        self.assertEqual(400, response.status_code)
        self.assertEqual("Wechat OAuth state is required", response.json()["detail"])

    def test_callback_rejects_tampered_state(self) -> None:
        settings.wechat_mock_enabled = True

        response = self.client.post(
            "/auth/wechat/callback",
            json={"code": "mock-openid", "state": f"{self._authorize_state()}x"},
        )

        self.assertEqual(400, response.status_code)
        self.assertEqual("Wechat OAuth state is invalid", response.json()["detail"])

    def test_real_mode_requires_wechat_credentials(self) -> None:
        settings.wechat_mock_enabled = False
        settings.wechat_app_id = ""
        settings.wechat_app_secret = ""

        response = self.client.post(
            "/auth/wechat/callback",
            json={"code": "real-code", "state": self._authorize_state()},
        )

        self.assertEqual(500, response.status_code)
        self.assertEqual("Wechat OAuth credentials are not configured", response.json()["detail"])

    @patch("api.auth.httpx.get")
    def test_real_mode_registers_new_user_from_wechat_profile(self, mock_get: Mock) -> None:
        settings.wechat_mock_enabled = False
        settings.wechat_app_id = "app-id"
        settings.wechat_app_secret = "app-secret"
        mock_get.side_effect = [
            self._response(
                {
                    "access_token": "token-1",
                    "openid": "wechat-openid-1",
                    "unionid": "union-1",
                }
            ),
            self._response(
                {
                    "openid": "wechat-openid-1",
                    "nickname": "Wechat Alice",
                    "headimgurl": "https://example.com/avatar.png",
                    "unionid": "union-1",
                }
            ),
        ]

        response = self.client.post(
            "/auth/wechat/callback",
            json={"code": "real-code", "state": self._authorize_state()},
        )

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual("Wechat Alice", payload["user"]["nickname"])
        self.assertEqual("https://example.com/avatar.png", payload["user"]["avatar_url"])
        self.assertEqual(store.registration_settings["default_quotas"], payload["quotas"])
        identity = store.find_identity("wechat_open", "wechat-openid-1")
        self.assertIsNotNone(identity)
        self.assertEqual("union-1", identity["unionid"])
        self.assertEqual("Wechat Alice", identity["raw_profile"]["nickname"])
        self.assertEqual(2, mock_get.call_count)

    @patch("api.auth.httpx.get")
    def test_real_mode_reuses_existing_user(self, mock_get: Mock) -> None:
        settings.wechat_mock_enabled = False
        settings.wechat_app_id = "app-id"
        settings.wechat_app_secret = "app-secret"
        mock_get.side_effect = [
            self._response(
                {
                    "access_token": "token-1",
                    "openid": "wechat-openid-2",
                    "unionid": "union-2",
                }
            ),
            self._response(
                {
                    "openid": "wechat-openid-2",
                    "nickname": "Wechat Bob",
                    "headimgurl": "",
                    "unionid": "union-2",
                }
            ),
            self._response(
                {
                    "access_token": "token-2",
                    "openid": "wechat-openid-2",
                    "unionid": "union-2",
                }
            ),
            self._response(
                {
                    "openid": "wechat-openid-2",
                    "nickname": "Wechat Bob",
                    "headimgurl": "",
                    "unionid": "union-2",
                }
            ),
        ]

        first_response = self.client.post(
            "/auth/wechat/callback",
            json={"code": "real-code-1", "state": self._authorize_state()},
        )
        second_response = self.client.post(
            "/auth/wechat/callback",
            json={"code": "real-code-2", "state": self._authorize_state()},
        )

        self.assertEqual(200, first_response.status_code)
        self.assertEqual(200, second_response.status_code)
        self.assertEqual(first_response.json()["user"]["id"], second_response.json()["user"]["id"])
        self.assertEqual(4, mock_get.call_count)

    def _authorize_state(self) -> str:
        response = self.client.get("/auth/wechat/authorize", params={"state": "browser-state"})
        self.assertEqual(200, response.status_code)
        return response.json()["state"]

    @staticmethod
    def _response(payload: dict) -> Mock:
        response = Mock()
        response.raise_for_status.return_value = None
        response.json.return_value = payload
        return response


if __name__ == "__main__":
    unittest.main()
