from __future__ import annotations

import sys
import unittest
from pathlib import Path

from pydantic import ValidationError

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.agnes_contract import build_image_request, build_text_request, build_video_request
from core.generation_parameter_contract import (
    build_generation_capabilities,
    normalize_image_parameters,
    normalize_video_parameters,
)
from core.image_generation_recipes import resolve_image_generation_recipe
from core.generation_results import ProviderResultError, extract_image_url
from core.story_director_contract import (
    build_story_director_tool_contract,
    extract_story_director_tool_arguments,
)
from schemas.generation import ImageGenerateRequest, VideoGenerateRequest


class T6013AgnesOfficialContractTestCase(unittest.TestCase):
    def test_capability_exposes_official_image_sizes_and_video_negative_prompt(self) -> None:
        capabilities = build_generation_capabilities()

        self.assertEqual(7, capabilities["contract_version"])
        self.assertEqual("1:1", capabilities["image"]["default_aspect_ratio"])
        self.assertEqual(["1K", "2K", "3K", "4K"], capabilities["image"]["sizes"])
        self.assertEqual("1K", capabilities["image"]["default_size"])
        self.assertEqual(
            {"width": 1312, "height": 736},
            capabilities["image"]["size_dimensions"]["1K"]["16:9"],
        )
        self.assertEqual(2000, capabilities["video"]["negative_prompt_max_length"])
        self.assertFalse(capabilities["video"]["supports_semantic_multi_reference"])

    def test_request_schemas_admit_only_bounded_official_fields(self) -> None:
        self.assertIn("size", ImageGenerateRequest.model_fields)
        self.assertIn("negative_prompt", VideoGenerateRequest.model_fields)

        base = {
            "project_id": "project-a",
            "origin_canvas_id": "canvas-a",
            "canvas_node_id": "video-a",
            "prompt": "A slow tracking shot.",
            "reference_mode": "text-to-video",
        }
        self.assertIsNone(VideoGenerateRequest(**{**base, "negative_prompt": "   "}).negative_prompt)
        with self.assertRaises(ValidationError):
            VideoGenerateRequest(**{**base, "negative_prompt": 42})
        with self.assertRaises(ValidationError):
            VideoGenerateRequest(**{**base, "negative_prompt": "x" * 2001})

    def test_image_size_and_ratio_normalize_to_official_provider_targets(self) -> None:
        normalized = normalize_image_parameters(
            size="4K",
            aspect_ratio="21:9",
            image_ids=[],
        )

        self.assertEqual("4K", normalized.provider_size)
        self.assertEqual("21:9", normalized.provider_ratio)
        self.assertEqual("4K", normalized.request_parameters["size"])
        self.assertEqual("21:9", normalized.request_parameters["aspect_ratio"])

    def test_image_recipes_use_official_size_tier_and_ratio_not_monitor_dimensions(self) -> None:
        recipe = resolve_image_generation_recipe("character-sheet", 2)
        normalized = normalize_image_parameters(
            aspect_ratio=None,
            image_ids=["asset-a"],
            recipe_id=recipe.id,
            recipe_version=recipe.version,
            recipe_size=recipe.output_size,
        )

        self.assertEqual("1K", normalized.provider_size)
        self.assertEqual("4:3", normalized.provider_ratio)
        self.assertEqual("1K", normalized.request_parameters["size"])
        self.assertEqual("4:3", normalized.request_parameters["aspect_ratio"])

    def test_video_negative_prompt_is_provider_input_but_not_raw_compact_snapshot(self) -> None:
        normalized = normalize_video_parameters(
            reference_mode="text-to-video",
            duration_seconds=5,
            image_ids=[],
            negative_prompt="watermark, distorted hands",
        )

        self.assertEqual("watermark, distorted hands", normalized.negative_prompt)
        self.assertTrue(normalized.request_parameters["negative_prompt_present"])
        self.assertNotIn("negative_prompt", normalized.request_parameters)

    def test_structured_keyframes_require_an_explicit_official_mode(self) -> None:
        bindings = [
            {"node_id": "frame-a", "asset_id": "asset-a", "role": "first-frame", "order": 0},
            {"node_id": "frame-b", "asset_id": "asset-b", "role": "last-frame", "order": 1},
        ]

        normalized = normalize_video_parameters(
            reference_mode="keyframes",
            duration_seconds=5,
            image_ids=None,
            video_references=bindings,
        )

        self.assertEqual("keyframes", normalized.reference_mode)
        self.assertEqual(bindings, normalized.request_parameters["video_references"])
        self.assertEqual("keyframes", normalized.request_parameters["reference_mode"])

    def test_adapter_body_uses_only_documented_image_and_video_shapes(self) -> None:
        image_body = build_image_request(
            model="agnes-image-2.1-flash",
            prompt="Preserve the composition.",
            size="2K",
            ratio="16:9",
            images=["https://example.com/input.png"],
            response_format="url",
        )
        self.assertNotIn("response_format", image_body)
        self.assertNotIn("tags", image_body)
        self.assertEqual(
            {
                "image": ["https://example.com/input.png"],
                "response_format": "url",
            },
            image_body["extra_body"],
        )
        base64_image_body = build_image_request(
            model="agnes-image-2.1-flash",
            prompt="Preserve the composition.",
            size="2K",
            ratio="16:9",
            images=["https://example.com/input.png"],
            response_format="b64_json",
        )
        self.assertNotIn("response_format", base64_image_body)
        self.assertEqual("b64_json", base64_image_body["extra_body"]["response_format"])
        with self.assertRaisesRegex(ProviderResultError, "invalid image URL"):
            extract_image_url({"data": [{"b64_json": "sensitive-base64-output"}]})

        video_body = build_video_request(
            model="agnes-video-v2.0",
            prompt="Animate the frame.",
            width=1152,
            height=648,
            num_frames=121,
            frame_rate=24,
            negative_prompt="watermark",
        )
        self.assertEqual("watermark", video_body["negative_prompt"])
        self.assertNotIn("extra_body", video_body)

    def test_story_director_uses_official_agnes_tool_calling_for_strict_output(self) -> None:
        tools, tool_choice = build_story_director_tool_contract()
        body = build_text_request(
            model="agnes-2.0-flash",
            messages=[{"role": "user", "content": "story"}],
            tools=tools,
            tool_choice=tool_choice,
        )

        self.assertEqual(
            {"type": "function", "function": {"name": "submit_revid_storyboard"}},
            body["tool_choice"],
        )
        function = body["tools"][0]["function"]
        self.assertEqual("submit_revid_storyboard", function["name"])
        self.assertFalse(function["parameters"]["additionalProperties"])
        self.assertEqual(
            {"schema_id", "schema_version", "summary", "assets", "shots"},
            set(function["parameters"]["required"]),
        )

        arguments = '{"schema_id":"revid.provider-storyboard","schema_version":1}'
        self.assertEqual(
            arguments,
            extract_story_director_tool_arguments({
                "choices": [{
                    "message": {
                        "tool_calls": [{
                            "type": "function",
                            "function": {
                                "name": "submit_revid_storyboard",
                                "arguments": arguments,
                            },
                        }],
                    },
                }],
            }),
        )


if __name__ == "__main__":
    unittest.main()
