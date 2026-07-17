from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.generation_parameter_contract import (
    GenerationParameterError,
    build_generation_capabilities,
    normalize_image_parameters,
    normalize_video_parameters,
)
from core.audio_generation_contract import build_audio_generation_capabilities
from core.shot_control_contract import build_shot_control_capabilities
from core.image_operation_contract import (
    ImageOperationContractError,
    build_image_operation_capabilities,
    normalize_image_operation,
)


class GenerationParameterContractTestCase(unittest.TestCase):
    def test_capability_document_has_exact_backend_owned_values(self) -> None:
        self.assertEqual(
            {
                "contract_version": 4,
                "image": {
                    "model": "agnes-image-2.1-flash",
                    "size": "1K",
                    "aspect_ratios": ["1:1", "3:4", "4:3", "16:9", "9:16", "2:3", "3:2", "21:9"],
                    "default_aspect_ratio": "4:3",
                    "operations": build_image_operation_capabilities(),
                    "shot_controls": build_shot_control_capabilities("image"),
                },
                "video": {
                    "model": "agnes-video-v2.0",
                    "width": 1152,
                    "height": 768,
                    "reference_modes": ["text-to-video", "image-to-video", "keyframes"],
                    "default_duration_seconds": 5,
                    "min_keyframes": 2,
                    "max_keyframes": 8,
                    "duration_presets": [
                        {"duration_seconds": 3, "num_frames": 81, "frame_rate": 24},
                        {"duration_seconds": 5, "num_frames": 121, "frame_rate": 24},
                        {"duration_seconds": 10, "num_frames": 241, "frame_rate": 24},
                        {"duration_seconds": 18, "num_frames": 441, "frame_rate": 24},
                    ],
                    "shot_controls": build_shot_control_capabilities("video"),
                },
                "audio": build_audio_generation_capabilities(),
            },
            build_generation_capabilities(),
        )

    def test_image_operation_capabilities_are_versioned_and_provider_honest(self) -> None:
        self.assertEqual(
            {
                "contract_version": 1,
                "supported_operations": ["region"],
                "provider_operations": [],
                "region_coordinate_space": "source-normalized",
                "max_fusion_images": 8,
                "upscale_factors": [2, 4],
            },
            build_image_operation_capabilities(),
        )

    def test_inpaint_normalizes_exact_source_region_and_mask(self) -> None:
        operation = {
            "contract_version": 1,
            "id": "inpaint",
            "region": {
                "contract_version": 1,
                "coordinate_space": "source-normalized",
                "x": 0.2,
                "y": 0.25,
                "width": 0.5,
                "height": 0.4,
            },
            "mask": {
                "contract_version": 1,
                "kind": "region",
                "feather": 0.1,
                "invert": False,
            },
        }

        normalized = normalize_image_operation(
            operation,
            image_ids=["asset-a"],
            prompt="Replace the selected object",
            provider_operations=("inpaint",),
        )

        self.assertEqual(operation, normalized)

    def test_operation_specific_shape_prompt_and_source_rules_fail_closed(self) -> None:
        region = {
            "contract_version": 1,
            "coordinate_space": "source-normalized",
            "x": 0.25,
            "y": 0.25,
            "width": 0.5,
            "height": 0.5,
        }
        mask = {"contract_version": 1, "kind": "region", "feather": 0, "invert": False}
        valid = [
            (
                {
                    "contract_version": 1,
                    "id": "expand",
                    "expansion": {
                        "contract_version": 1,
                        "top": 0.25,
                        "right": 0,
                        "bottom": 0,
                        "left": 0.25,
                    },
                },
                ["asset-a"],
                "Extend the environment",
            ),
            ({"contract_version": 1, "id": "erase", "region": region, "mask": mask}, ["asset-a"], None),
            ({"contract_version": 1, "id": "cutout"}, ["asset-a"], None),
            ({"contract_version": 1, "id": "upscale", "upscale_factor": 4}, ["asset-a"], None),
            ({"contract_version": 1, "id": "fusion"}, ["asset-a", "asset-b"], "Fuse both images"),
        ]
        for operation, image_ids, prompt in valid:
            with self.subTest(operation=operation["id"]):
                self.assertEqual(
                    operation,
                    normalize_image_operation(
                        operation,
                        image_ids=image_ids,
                        prompt=prompt,
                        provider_operations=(operation["id"],),
                    ),
                )

        invalid = [
            ({"contract_version": 2, "id": "cutout"}, ["asset-a"], None, ("cutout",), "version"),
            ({"contract_version": 1, "id": "unknown"}, ["asset-a"], None, ("unknown",), "unknown"),
            ({"contract_version": 1, "id": "region", "region": region}, ["asset-a"], None, (), "local-only"),
            ({"contract_version": 1, "id": "cutout", "region": region}, ["asset-a"], None, ("cutout",), "fields"),
            ({"contract_version": 1, "id": "upscale", "upscale_factor": 3}, ["asset-a"], None, ("upscale",), "factor"),
            ({"contract_version": 1, "id": "fusion"}, ["asset-a"], "Fuse", ("fusion",), "2 to 8"),
            ({"contract_version": 1, "id": "fusion"}, ["asset-a", "asset-a"], "Fuse", ("fusion",), "unique"),
            ({"contract_version": 1, "id": "expand", "expansion": {"contract_version": 1, "top": 0, "right": 0, "bottom": 0, "left": 0}}, ["asset-a"], "Extend", ("expand",), "positive"),
            ({"contract_version": 1, "id": "inpaint", "region": {**region, "x": 0.75}, "mask": mask}, ["asset-a"], "Replace", ("inpaint",), "bounds"),
            ({"contract_version": 1, "id": "inpaint", "region": region}, ["asset-a"], "Replace", ("inpaint",), "mask"),
            ({"contract_version": 1, "id": "inpaint", "region": region, "mask": mask}, ["asset-a"], None, ("inpaint",), "prompt"),
            ({"contract_version": 1, "id": "erase", "region": region, "mask": mask, "extra": True}, ["asset-a"], None, ("erase",), "fields"),
            ({"contract_version": 1, "id": "erase", "region": region, "mask": {**mask, "feather": 1.1}}, ["asset-a"], None, ("erase",), "feather"),
            ({"contract_version": 1, "id": "cutout"}, ["asset-a"], None, (), "unsupported"),
        ]
        for operation, image_ids, prompt, provider_operations, message in invalid:
            with self.subTest(operation=operation, message=message):
                with self.assertRaisesRegex(ImageOperationContractError, message):
                    normalize_image_operation(
                        operation,
                        image_ids=image_ids,
                        prompt=prompt,
                        provider_operations=provider_operations,
                    )

    def test_ordinary_image_defaults_to_revid_ratio_and_rejects_unknown_values(self) -> None:
        normalized = normalize_image_parameters(aspect_ratio=None, image_ids=["asset-a"])

        self.assertEqual("1K", normalized.provider_size)
        self.assertEqual("4:3", normalized.provider_ratio)
        self.assertEqual(
            {
                "contract_version": 1,
                "media_type": "image",
                "model": "agnes-image-2.1-flash",
                "size": "1K",
                "aspect_ratio": "4:3",
                "image_ids": ["asset-a"],
            },
            normalized.request_parameters,
        )

        with self.assertRaisesRegex(GenerationParameterError, "unsupported image aspect ratio"):
            normalize_image_parameters(aspect_ratio="5:4", image_ids=[])

    def test_mock_shot_controls_are_exactly_snapshotted_and_production_fails_closed(self) -> None:
        image_controls = {
            "contract_version": 1,
            "angle": "high-angle",
            "framing": "wide",
            "focus": "shallow",
            "lighting": "dramatic",
            "temporal": "hold",
        }
        video_controls = {
            "contract_version": 1,
            "angle": "low-angle",
            "framing": "close-up",
            "focus": "shallow",
            "lighting": "soft",
            "temporal": "advance",
        }

        image = normalize_image_parameters(
            aspect_ratio="16:9",
            image_ids=["asset-a"],
            shot_controls=image_controls,
            provider_shot_controls=("angle", "framing", "focus", "lighting"),
        )
        self.assertEqual(image_controls, image.request_parameters["shot_controls"])
        video = normalize_video_parameters(
            reference_mode="image-to-video",
            duration_seconds=5,
            image_ids=["asset-a"],
            shot_controls=video_controls,
            provider_shot_controls=("angle", "framing", "focus", "lighting", "temporal"),
        )
        self.assertEqual(video_controls, video.request_parameters["shot_controls"])

        with self.assertRaisesRegex(GenerationParameterError, "unsupported shot controls"):
            normalize_image_parameters(
                aspect_ratio="16:9",
                image_ids=["asset-a"],
                shot_controls=image_controls,
            )

    def test_shot_control_temporal_and_contract_shape_fail_closed(self) -> None:
        controls = {
            "contract_version": 1,
            "angle": "eye-level",
            "framing": "medium",
            "focus": "deep",
            "lighting": "natural",
            "temporal": "rewind",
        }
        provider_controls = ("angle", "framing", "focus", "lighting", "temporal")
        for reference_mode, image_ids, message in [
            ("text-to-video", [], "image-to-video"),
            ("keyframes", ["asset-a", "asset-b"], "image-to-video"),
            ("image-to-video", ["asset-a"], "fields"),
        ]:
            value = {**controls}
            if message == "fields":
                value["extra"] = True
            with self.subTest(reference_mode=reference_mode, message=message):
                with self.assertRaisesRegex(GenerationParameterError, message):
                    normalize_video_parameters(
                        reference_mode=reference_mode,
                        duration_seconds=5,
                        image_ids=image_ids,
                        shot_controls=value,
                        provider_shot_controls=provider_controls,
                    )

    def test_recipe_image_is_fixed_and_never_accepts_an_aspect_ratio_override(self) -> None:
        normalized = normalize_image_parameters(
            aspect_ratio=None,
            image_ids=["asset-reference"],
            recipe_id="character-sheet",
            recipe_version=2,
            recipe_size="1024x768",
        )

        self.assertEqual("1024x768", normalized.provider_size)
        self.assertIsNone(normalized.provider_ratio)
        self.assertEqual(
            {
                "contract_version": 1,
                "media_type": "image",
                "model": "agnes-image-2.1-flash",
                "size": "1024x768",
                "aspect_ratio": "4:3",
                "image_ids": ["asset-reference"],
                "generation_recipe_id": "character-sheet",
                "generation_recipe_version": 2,
            },
            normalized.request_parameters,
        )

        with self.assertRaisesRegex(GenerationParameterError, "recipe controls output size"):
            normalize_image_parameters(
                aspect_ratio="4:3",
                image_ids=["asset-reference"],
                recipe_id="character-sheet",
                recipe_version=2,
                recipe_size="1024x768",
            )

    def test_video_modes_validate_exact_reference_counts_and_duration_mapping(self) -> None:
        text = normalize_video_parameters(
            reference_mode="text-to-video",
            duration_seconds=3,
            image_ids=[],
        )
        single = normalize_video_parameters(
            reference_mode="image-to-video",
            duration_seconds=10,
            image_ids=["asset-a"],
        )
        keyframes = normalize_video_parameters(
            reference_mode="keyframes",
            duration_seconds=18,
            image_ids=["asset-a", "asset-b"],
        )

        self.assertEqual((81, 24), (text.num_frames, text.frame_rate))
        self.assertEqual((241, 24), (single.num_frames, single.frame_rate))
        self.assertEqual((441, 24), (keyframes.num_frames, keyframes.frame_rate))
        self.assertEqual(
            {
                "contract_version": 1,
                "media_type": "video",
                "model": "agnes-video-v2.0",
                "reference_mode": "keyframes",
                "duration_seconds": 18,
                "num_frames": 441,
                "frame_rate": 24,
                "width": 1152,
                "height": 768,
                "image_ids": ["asset-a", "asset-b"],
            },
            keyframes.request_parameters,
        )

        invalid_cases = [
            ("text-to-video", 5, ["asset-a"], "requires zero"),
            ("image-to-video", 5, [], "requires exactly one"),
            ("image-to-video", 5, ["asset-a", "asset-b"], "requires exactly one"),
            ("keyframes", 5, ["asset-a"], "requires 2 to 8"),
            ("keyframes", 5, [f"asset-{index}" for index in range(9)], "requires 2 to 8"),
            ("unsupported", 5, [], "unsupported video reference mode"),
            ("text-to-video", 7, [], "unsupported video duration"),
        ]
        for mode, duration, image_ids, message in invalid_cases:
            with self.subTest(mode=mode, duration=duration, image_ids=image_ids):
                with self.assertRaisesRegex(GenerationParameterError, message):
                    normalize_video_parameters(
                        reference_mode=mode,
                        duration_seconds=duration,
                        image_ids=image_ids,
                    )

    def test_legacy_video_omission_keeps_count_mapping_only_at_backend_boundary(self) -> None:
        self.assertEqual(
            "text-to-video",
            normalize_video_parameters(reference_mode=None, duration_seconds=None, image_ids=[]).reference_mode,
        )
        self.assertEqual(
            "image-to-video",
            normalize_video_parameters(reference_mode=None, duration_seconds=None, image_ids=["asset-a"]).reference_mode,
        )
        self.assertEqual(
            "keyframes",
            normalize_video_parameters(
                reference_mode=None,
                duration_seconds=None,
                image_ids=["asset-a", "asset-b"],
            ).reference_mode,
        )


if __name__ == "__main__":
    unittest.main()
