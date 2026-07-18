from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.agnes_provider import AgnesProvider
from core.generation_task_utils import (
    error_code_for_exception,
    provider_failure_http_status,
    safe_retry_after_seconds,
)
from settings.config import settings


class AgnesProviderImageContractTestCase(unittest.IsolatedAsyncioTestCase):
    async def test_provider_rate_limit_keeps_safe_bounded_retry_metadata(self) -> None:
        request = httpx.Request("POST", "https://provider.test/v1/images/generations")
        response = httpx.Response(429, request=request, headers={"Retry-After": "17"})
        with self.assertRaises(httpx.HTTPStatusError) as raised:
            response.raise_for_status()
        error_code = error_code_for_exception(raised.exception)
        self.assertEqual("provider_rate_limited", error_code)
        self.assertEqual(429, provider_failure_http_status(error_code))
        self.assertEqual(17, safe_retry_after_seconds(raised.exception))

    async def test_client_pool_and_timeouts_follow_backend_admission_settings(self) -> None:
        with patch("core.agnes_provider.httpx.AsyncClient") as client:
            AgnesProvider(api_key="test-only-key")
        kwargs = client.call_args.kwargs
        self.assertEqual(settings.agnes_admission_global_limit, kwargs["limits"].max_connections)
        self.assertEqual(settings.agnes_http_pool_timeout_seconds, kwargs["timeout"].pool)
        self.assertEqual(settings.agnes_http_connect_timeout_seconds, kwargs["timeout"].connect)
        self.assertEqual(settings.agnes_http_read_timeout_seconds, kwargs["timeout"].read)
        self.assertEqual(settings.agnes_http_write_timeout_seconds, kwargs["timeout"].write)

    async def test_text_to_image_sends_exact_documented_payload(self) -> None:
        payload = await self._capture_image_payload()

        self.assertEqual(
            {
                "model": "agnes-image-2.1-flash",
                "prompt": "Create a cinematic landscape",
                "size": "1024x768",
                "extra_body": {"response_format": "url"},
            },
            payload,
        )

    async def test_image_to_image_nests_references_in_extra_body(self) -> None:
        references = [
            "https://example.com/source-a.png",
            "https://example.com/source-b.png",
        ]
        payload = await self._capture_image_payload(image=references)

        self.assertEqual(
            {
                "model": "agnes-image-2.1-flash",
                "prompt": "Create a cinematic landscape",
                "size": "1024x768",
                "extra_body": {
                    "image": references,
                    "response_format": "url",
                },
            },
            payload,
        )
        self.assertNotIn("image", payload)

    async def test_ratio_is_sent_only_when_explicitly_supplied(self) -> None:
        payload = await self._capture_image_payload(size="1K", ratio="16:9")

        self.assertEqual("1K", payload["size"])
        self.assertEqual("16:9", payload["ratio"])

    async def _capture_image_payload(
        self,
        image: list[str] | None = None,
        size: str = "1024x768",
        ratio: str | None = None,
    ) -> dict:
        captured: list[dict] = []

        async def handler(request: httpx.Request) -> httpx.Response:
            self.assertEqual("/v1/images/generations", request.url.path)
            captured.append(json.loads(request.content))
            return httpx.Response(200, json={"data": [{"url": "https://example.com/result.png"}]})

        provider = AgnesProvider(api_key="test-only-key")
        await provider._client.aclose()
        provider._client = httpx.AsyncClient(
            base_url=provider.base_url,
            transport=httpx.MockTransport(handler),
        )
        self.addAsyncCleanup(provider.close)

        await provider.generate_image(
            model="agnes-image-2.1-flash",
            prompt="Create a cinematic landscape",
            size=size,
            image=image,
            ratio=ratio,
        )

        self.assertEqual(1, len(captured))
        return captured[0]
