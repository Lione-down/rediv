from __future__ import annotations

import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from settings.config import (
    Settings,
    development_auth_request_is_enabled,
    require_runtime_security_settings,
)


class RuntimeSecurityDefaultsTestCase(unittest.TestCase):
    def test_default_settings_disable_all_development_auth(self) -> None:
        with patch.dict(os.environ, {}, clear=True):
            configured = Settings(_env_file=None)

        self.assertEqual("production", configured.runtime_profile)
        self.assertFalse(configured.allow_mock_auth)
        self.assertFalse(configured.wechat_mock_enabled)
        self.assertEqual("", configured.dev_admin_key)

    def test_runtime_rejects_blank_short_and_known_jwt_secrets_without_echo(self) -> None:
        rejected_values = (
            "",
            "short-secret",
            "change-this-in-production",
            "change-this-secret-in-production",
            "your-secret-key",
            "jwt-secret",
        )

        for supplied_value in rejected_values:
            with self.subTest(secret_kind=len(supplied_value)):
                configured = Settings(jwt_secret=supplied_value, _env_file=None)
                with self.assertRaises(RuntimeError) as raised:
                    require_runtime_security_settings(configured)
                if supplied_value:
                    self.assertNotIn(supplied_value, str(raised.exception))

    def test_runtime_accepts_strong_secret_with_development_auth_disabled(self) -> None:
        configured = Settings(jwt_secret="unit-test-runtime-secret-32-bytes-minimum", _env_file=None)

        require_runtime_security_settings(configured)

    def test_mock_auth_requires_development_profile_and_loopback_binding(self) -> None:
        strong_secret = "unit-test-runtime-secret-32-bytes-minimum"
        invalid_settings = (
            Settings(
                jwt_secret=strong_secret,
                runtime_profile="production",
                allow_mock_auth=True,
                wechat_mock_enabled=True,
                runtime_bind_host="127.0.0.1",
                _env_file=None,
            ),
            Settings(
                jwt_secret=strong_secret,
                runtime_profile="development",
                allow_mock_auth=False,
                wechat_mock_enabled=True,
                runtime_bind_host="127.0.0.1",
                _env_file=None,
            ),
            Settings(
                jwt_secret=strong_secret,
                runtime_profile="development",
                allow_mock_auth=True,
                wechat_mock_enabled=True,
                runtime_bind_host="0.0.0.0",
                _env_file=None,
            ),
        )

        for configured in invalid_settings:
            with self.subTest(profile=configured.runtime_profile, host=configured.runtime_bind_host):
                with self.assertRaisesRegex(RuntimeError, "Development authentication"):
                    require_runtime_security_settings(configured)

        require_runtime_security_settings(
            Settings(
                jwt_secret=strong_secret,
                runtime_profile="development",
                allow_mock_auth=True,
                wechat_mock_enabled=True,
                runtime_bind_host="127.0.0.1",
                _env_file=None,
            )
        )

    def test_development_auth_rejects_non_loopback_request_clients(self) -> None:
        configured = Settings(
            jwt_secret="unit-test-runtime-secret-32-bytes-minimum",
            runtime_profile="development",
            allow_mock_auth=True,
            wechat_mock_enabled=True,
            runtime_bind_host="127.0.0.1",
            _env_file=None,
        )

        self.assertTrue(development_auth_request_is_enabled("127.0.0.1", configured))
        self.assertTrue(development_auth_request_is_enabled("::1", configured))
        self.assertFalse(development_auth_request_is_enabled("198.51.100.42", configured))


if __name__ == "__main__":
    unittest.main()
