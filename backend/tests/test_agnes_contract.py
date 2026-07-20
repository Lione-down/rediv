from __future__ import annotations

import sys
import unittest
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.agnes_contract import (
    AgnesProviderError,
    build_image_request,
    build_text_request,
    build_video_poll_request,
    build_video_request,
    resolve_agnes_contract,
)
from settings.config import Settings
from core.cinematic_skill_contract import build_cinematic_skill_capabilities
from core.generation_parameter_contract import build_generation_capabilities


class AgnesContractTestCase(unittest.TestCase):
    def test_settings_resolve_one_typed_contract_for_all_media(self) -> None:
        contract = resolve_agnes_contract(
            Settings(
                agnes_base_url="https://apihub.agnes-ai.com/",
                agnes_model_text="text-current",
                agnes_model_image="image-current",
                agnes_model_video="video-current",
            )
        )

        self.assertEqual("https://apihub.agnes-ai.com", contract.base_url)
        self.assertEqual(("text", "image", "video"), tuple(contract.media))
        self.assertEqual("text-current", contract.media["text"].model)
        self.assertEqual("/v1/chat/completions", contract.media["text"].submit_path)
        self.assertEqual("image-current", contract.media["image"].model)
        self.assertEqual("/v1/images/generations", contract.media["image"].submit_path)
        self.assertEqual("video-current", contract.media["video"].model)
        self.assertEqual("/v1/videos", contract.media["video"].submit_path)
        self.assertEqual("/agnesapi", contract.media["video"].poll_path)
        self.assertIsNone(contract.media["image"].poll_path)

    def test_request_adapters_emit_only_documented_shapes(self) -> None:
        self.assertEqual(
            {"model": "text-current", "messages": [{"role": "user", "content": "hello"}]},
            build_text_request(
                model="text-current",
                messages=[{"role": "user", "content": "hello"}],
            ),
        )
        self.assertEqual(
            {
                "model": "image-current",
                "prompt": "image prompt",
                "size": "1K",
                "ratio": "4:3",
                "extra_body": {
                    "image": ["https://example.com/reference.png"],
                    "response_format": "url",
                },
            },
            build_image_request(
                model="image-current",
                prompt="image prompt",
                size="1K",
                ratio="4:3",
                images=["https://example.com/reference.png"],
            ),
        )
        self.assertEqual(
            {
                "model": "video-current",
                "prompt": "video prompt",
                "height": 768,
                "width": 1152,
                "num_frames": 121,
                "frame_rate": 24,
                "image": "https://example.com/first.png",
            },
            build_video_request(
                model="video-current",
                prompt="video prompt",
                image="https://example.com/first.png",
                width=1152,
                height=768,
                num_frames=121,
                frame_rate=24,
            ),
        )
        self.assertEqual(
            ("/agnesapi", {"video_id": "video-123"}),
            build_video_poll_request("video-123"),
        )

    def test_text_request_rejects_unknown_provider_parameters(self) -> None:
        with self.assertRaises(TypeError):
            build_text_request(
                model="text-current",
                messages=[{"role": "user", "content": "hello"}],
                undocumented_option="must-not-pass-through",  # type: ignore[call-arg]
            )

        self.assertEqual(
            {
                "model": "text-current",
                "messages": [{"role": "user", "content": "hello"}],
                "temperature": 0.2,
                "stream": True,
            },
            build_text_request(
                model="text-current",
                messages=[{"role": "user", "content": "hello"}],
                temperature=0.2,
                stream=True,
            ),
        )

    def test_generation_and_cinematic_capabilities_consume_the_resolved_contract(self) -> None:
        contract = resolve_agnes_contract(
            Settings(
                agnes_model_text="text-current",
                agnes_model_image="image-current",
                agnes_model_video="video-current",
            )
        )

        generation = build_generation_capabilities(agnes_contract=contract)
        cinematic = build_cinematic_skill_capabilities(agnes_contract=contract)

        self.assertEqual("image-current", generation["image"]["model"])
        self.assertEqual("video-current", generation["video"]["model"])
        self.assertEqual("text-current", generation["text"]["model"])
        self.assertEqual(
            ["text-current", "image-current", "video-current"],
            [model["id"] for model in cinematic["providers"][0]["models"]],
        )

    def test_provider_error_keeps_only_safe_bounded_actionable_metadata(self) -> None:
        request = httpx.Request("POST", "https://provider.example/v1/images/generations")
        response = httpx.Response(
            400,
            request=request,
            headers={"x-request-id": "request-safe-123"},
            json={
                "error": {
                    "code": "unsupported_parameter",
                    "message": "Unsupported ratio; Authorization: Bearer secret-value",
                    "prompt": "must-not-survive",
                },
                "api_key": "must-not-survive",
            },
        )

        error = AgnesProviderError.from_response(response)

        self.assertEqual(400, error.status_code)
        self.assertEqual("unsupported_parameter", error.code)
        self.assertEqual("request-safe-123", error.request_id)
        self.assertFalse(error.retryable)
        self.assertIn("Unsupported ratio", error.safe_message)
        self.assertIn("<redacted>", error.safe_message)
        self.assertNotIn("secret-value", str(error))
        self.assertNotIn("must-not-survive", str(error))

    def test_provider_status_classes_have_stable_retry_semantics(self) -> None:
        cases = [
            (400, {"error": {"message": "invalid request"}}, "invalid_request", False),
            (400, {"error": {"message": "policy rejected"}}, "provider_rejected", False),
            (429, {"error": {"message": "slow down"}}, "rate_limited", True),
            (503, {"error": {"message": "busy"}}, "provider_unavailable", True),
        ]
        for status_code, body, expected_code, expected_retryable in cases:
            with self.subTest(status_code=status_code, expected_code=expected_code):
                request = httpx.Request("POST", "https://provider.example/v1/videos")
                response = httpx.Response(status_code, request=request, json=body)
                error = AgnesProviderError.from_response(response)
                self.assertEqual(expected_code, error.code)
                self.assertEqual(expected_retryable, error.retryable)


if __name__ == "__main__":
    unittest.main()
