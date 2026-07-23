from __future__ import annotations

import unittest
from uuid import uuid4

from pydantic import ValidationError

from core.generation_parameter_contract import GenerationParameterError, normalize_video_parameters
from schemas.generation import VideoGenerateRequest, VideoReferenceBinding


REVISION = "a" * 64


def semantic_reference(index: int, role: str) -> dict[str, object]:
    return {
        "node_id": f"image-node-{index}",
        "asset_id": str(uuid4()),
        "source_revision": REVISION,
        "role": role,
        "instruction": f"仅传递 reference {index} 的 {role} 特征",
        "must_not_transfer": ["logo", "motion"],
        "order": index,
    }


class SemanticVideoReferenceContractTests(unittest.TestCase):
    def _parse_reference(self, payload: dict[str, object]) -> VideoReferenceBinding:
        try:
            return VideoReferenceBinding.model_validate(payload)
        except ValidationError as error:
            self.fail(
                "T6-007 RED [semantic-video-reference-schema-absent]: "
                f"stable revision, semantic role, instruction, and exclusions are not accepted ({error})"
            )

    def test_semantic_bindings_preserve_every_authoritative_field_and_order(self) -> None:
        payloads = [
            semantic_reference(0, "character"),
            semantic_reference(1, "scene"),
            semantic_reference(2, "prop"),
        ]
        parsed = [self._parse_reference(payload) for payload in payloads]

        try:
            normalized = normalize_video_parameters(
                reference_mode=None,
                duration_seconds=5,
                image_ids=None,
                video_references=[item.model_dump(mode="json") for item in parsed],
            )
        except GenerationParameterError as error:
            self.fail(
                "T6-007 RED [semantic-video-normalization-absent]: "
                f"semantic references are still coerced to legacy keyframes ({error})"
            )

        self.assertEqual("semantic-multi-image", normalized.reference_mode)
        self.assertEqual(payloads, normalized.request_parameters["video_references"])

    def test_nine_semantic_references_validate_but_ten_fail_before_execution(self) -> None:
        roles = (
            "character",
            "scene",
            "prop",
            "wardrobe",
            "action",
            "style",
            "composition",
            "first-frame",
            "last-frame",
        )
        references = [semantic_reference(index, role) for index, role in enumerate(roles)]
        try:
            request = VideoGenerateRequest.model_validate({
                "client_request_id": str(uuid4()),
                "project_id": str(uuid4()),
                "origin_canvas_id": str(uuid4()),
                "canvas_node_id": str(uuid4()),
                "prompt": "保持角色、场景和道具语义生成一个连续镜头。",
                "duration_seconds": 5,
                "video_references": references,
            })
        except ValidationError as error:
            self.fail(
                "T6-007 RED [semantic-video-nine-reference-boundary-absent]: "
                f"the approved nine-reference contract is not accepted ({error})"
            )

        self.assertEqual(references, request.model_dump(mode="json")["video_references"])
        with self.assertRaises((ValidationError, GenerationParameterError)):
            VideoGenerateRequest.model_validate({
                **request.model_dump(mode="json", exclude={"video_references"}),
                "video_references": [*references, semantic_reference(9, "style")],
            })

    def test_display_title_is_not_part_of_the_persisted_binding_identity(self) -> None:
        payload = semantic_reference(0, "character")
        parsed = self._parse_reference(payload).model_dump(mode="json")

        self.assertEqual(payload, parsed)
        self.assertNotIn("title", parsed)
        self.assertNotIn("thumbnail", parsed)


if __name__ == "__main__":
    unittest.main()
