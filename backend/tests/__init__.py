"""Shared fail-closed runtime configuration for backend tests.

Production settings remain fail closed. Tests opt in once to the development
mock contract and use a high mock-attempt ceiling unless a focused throttle
test explicitly restores the production limit.
"""

from settings.config import settings


settings.runtime_profile = "development"
settings.runtime_bind_host = "127.0.0.1"
settings.allow_mock_auth = True
settings.wechat_mock_enabled = True
settings.jwt_secret = "unit-test-suite-signing-secret-minimum-32"
settings.auth_development_attempt_limit = 1000
