from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.agnes_provider import AgnesProvider


class AgnesProviderImageContractTestCase(unittest.IsolatedAsyncioTestCase):
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

    async def _capture_image_payload(self, image: list[str] | None = None) -> dict:
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
            size="1024x768",
            image=image,
        )

        self.assertEqual(1, len(captured))
        return captured[0]
