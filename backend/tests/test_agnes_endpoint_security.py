from __future__ import annotations

import asyncio
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.agnes_provider import AgnesProvider
from settings.config import Settings, require_runtime_security_settings


class AgnesEndpointSecurityTestCase(unittest.TestCase):
    def test_untrusted_endpoints_fail_before_client_construction_without_key_echo(self) -> None:
        supplied_key = "sensitive-test-provider-key"
        invalid_endpoints = (
            "http://apihub.agnes-ai.com",
            "https://user:password@apihub.agnes-ai.com",
            "https://apihub.agnes-ai.com?redirect=https://attacker.example",
            "https://apihub.agnes-ai.com#attacker",
            "https://apihub.agnes-ai.com/v1",
            "https://apihub.agnes-ai.com:443",
            "https://apihub.agnes-ai.coｍ",
            "https://apihub.agnes-ai.com.attacker.example",
            "https://attacker.example",
        )

        with patch("core.agnes_provider.httpx.AsyncClient") as async_client:
            for endpoint in invalid_endpoints:
                with self.subTest(endpoint=endpoint):
                    with self.assertRaises(ValueError) as context:
                        AgnesProvider(api_key=supplied_key, base_url=endpoint)
                    self.assertNotIn(supplied_key, str(context.exception))

        async_client.assert_not_called()

    def test_custom_endpoint_requires_explicit_development_loopback_contract(self) -> None:
        endpoint = "http://127.0.0.1:8765"
        disabled = Settings(
            runtime_profile="development",
            agnes_allow_development_endpoint=False,
            _env_file=None,
        )
        production = Settings(
            runtime_profile="production",
            agnes_allow_development_endpoint=True,
            _env_file=None,
        )
        enabled = Settings(
            runtime_profile="development",
            agnes_allow_development_endpoint=True,
            _env_file=None,
        )

        with patch("core.agnes_provider.httpx.AsyncClient") as async_client:
            with self.assertRaises(ValueError):
                AgnesProvider("test-only-key", base_url=endpoint, config=disabled)
            with self.assertRaises(ValueError):
                AgnesProvider("test-only-key", base_url=endpoint, config=production)
            provider = AgnesProvider("test-only-key", base_url=endpoint, config=enabled)

        self.assertEqual(endpoint, provider.base_url)
        self.assertEqual(1, async_client.call_count)

    def test_runtime_security_validation_rejects_untrusted_endpoint(self) -> None:
        configured = Settings(
            jwt_secret="unit-test-" * 4,
            agnes_base_url="https://attacker.example",
            _env_file=None,
        )

        with self.assertRaises(ValueError):
            require_runtime_security_settings(configured)

    def test_mock_transport_is_injected_without_production_endpoint_override(self) -> None:
        requests: list[httpx.Request] = []

        def handle(request: httpx.Request) -> httpx.Response:
            requests.append(request)
            return httpx.Response(
                200,
                request=request,
                json={"choices": [{"message": {"content": "mock result"}}]},
            )

        async def exercise() -> dict:
            provider = AgnesProvider(
                "test-only-key",
                transport=httpx.MockTransport(handle),
            )
            try:
                return await provider.chat(
                    "agnes-2.0-flash",
                    [{"role": "user", "content": "test prompt"}],
                )
            finally:
                await provider.close()

        payload = asyncio.run(exercise())

        self.assertEqual("mock result", payload["choices"][0]["message"]["content"])
        self.assertEqual(1, len(requests))
        self.assertEqual("https", requests[0].url.scheme)
        self.assertEqual("apihub.agnes-ai.com", requests[0].url.host)


if __name__ == "__main__":
    unittest.main()
