from __future__ import annotations

import unittest
from uuid import uuid4

from pydantic import ValidationError

from core.generation_parameter_contract import (
    GenerationParameterError,
    normalize_video_parameters,
)
from schemas.generation import VideoGenerateRequest, VideoReferenceBinding


def semantic_reference(index: int, role: str) -> dict[str, object]:
    return {
        "node_id": f"image-node-{index}",
        "asset_id": str(uuid4()),
        "source_revision": "a" * 64,
        "role": role,
        "instruction": "Preserve only the declared semantic reference.",
        "must_not_transfer": ["background"],
        "order": index,
    }


class SemanticVideoReferenceContractTests(unittest.TestCase):
    def test_semantic_bindings_fail_closed_at_the_strict_schema_boundary(self) -> None:
        for role in ("character", "scene", "prop"):
            with self.subTest(role=role):
                with self.assertRaises(ValidationError):
                    VideoReferenceBinding.model_validate(semantic_reference(0, role))

    def test_semantic_fields_cannot_be_reinterpreted_as_keyframes(self) -> None:
        references = [
            semantic_reference(0, "first-frame"),
            semantic_reference(1, "last-frame"),
        ]

        with self.assertRaisesRegex(GenerationParameterError, "fields"):
            normalize_video_parameters(
                reference_mode="keyframes",
                duration_seconds=5,
                image_ids=None,
                video_references=references,
            )

    def test_official_video_reference_boundary_is_eight(self) -> None:
        references = [
            {
                "node_id": f"image-node-{index}",
                "asset_id": str(uuid4()),
                "role": (
                    "first-frame"
                    if index == 0
                    else "last-frame"
                    if index == 8
                    else "reference"
                ),
                "order": index,
            }
            for index in range(9)
        ]

        with self.assertRaises(ValidationError):
            VideoGenerateRequest.model_validate({
                "client_request_id": str(uuid4()),
                "project_id": str(uuid4()),
                "origin_canvas_id": str(uuid4()),
                "canvas_node_id": str(uuid4()),
                "prompt": "Reject nine references before execution.",
                "duration_seconds": 5,
                "reference_mode": "keyframes",
                "video_references": references,
            })

    def test_display_fields_are_not_accepted_as_provider_reference_identity(self) -> None:
        binding = {
            "node_id": "image-node",
            "asset_id": str(uuid4()),
            "role": "first-frame",
            "order": 0,
            "title": "Display-only title",
        }

        with self.assertRaises(ValidationError):
            VideoReferenceBinding.model_validate(binding)


if __name__ == "__main__":
    unittest.main()
