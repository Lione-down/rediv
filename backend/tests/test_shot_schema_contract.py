from __future__ import annotations

import sys
import unittest
from copy import deepcopy
from pathlib import Path

from pydantic import ValidationError

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from controllers.shot_schemas import generate_mock_shot_schema
from schemas.shot_schema import ShotSchemaDocument, ShotSchemaGenerateRequest


def valid_document() -> dict:
    return {
        "contract_version": 1,
        "schema_id": "revid.shot-sequence",
        "provider": "mock",
        "model": "revid-shot-mock-v1",
        "project_id": "project-a",
        "canvas_id": "canvas-a",
        "source_script_node_id": "script-a",
        "aspect_ratio": "16:9",
        "shot_count": 2,
        "shots": [
            {
                "shot_id": "shot-01",
                "index": 1,
                "title": "镜头 01",
                "narrative": "人物走入黄昏海岸。",
                "image_prompt": "人物走入黄昏海岸。",
            },
            {
                "shot_id": "shot-02",
                "index": 2,
                "title": "镜头 02",
                "narrative": "海浪在人物身后翻涌。",
                "image_prompt": "海浪在人物身后翻涌。",
            },
        ],
    }


class ShotSchemaContractTestCase(unittest.TestCase):
    def test_mock_provider_is_deterministic_bounded_and_explicitly_scoped(self) -> None:
        request = ShotSchemaGenerateRequest(
            contract_version=1,
            provider="mock",
            source_script_node_id="script-a",
            script="人物走入黄昏海岸。\n海浪在身后翻涌。\n人物回头看向远处。",
            requested_shot_count=3,
        )

        first = generate_mock_shot_schema("project-a", "canvas-a", request)
        second = generate_mock_shot_schema("project-a", "canvas-a", request)

        self.assertEqual(first, second)
        self.assertEqual(1, first.contract_version)
        self.assertEqual("revid.shot-sequence", first.schema_id)
        self.assertEqual(("mock", "revid-shot-mock-v1"), (first.provider, first.model))
        self.assertEqual(("project-a", "canvas-a", "script-a"), (
            first.project_id,
            first.canvas_id,
            first.source_script_node_id,
        ))
        self.assertEqual(3, first.shot_count)
        self.assertEqual([1, 2, 3], [shot.index for shot in first.shots])
        self.assertEqual(["shot-01", "shot-02", "shot-03"], [shot.shot_id for shot in first.shots])
        self.assertTrue(all(shot.image_prompt for shot in first.shots))

    def test_request_is_strict_and_rejects_unsupported_or_unbounded_input(self) -> None:
        base = {
            "contract_version": 1,
            "provider": "mock",
            "source_script_node_id": "script-a",
            "script": "第一场。第二场。",
        }
        invalid = [
            {**base, "contract_version": 2},
            {**base, "provider": "agnes"},
            {**base, "requested_shot_count": 1},
            {**base, "requested_shot_count": 26},
            {**base, "script": " "},
            {**base, "script": "x" * 12001},
            {**base, "unexpected": True},
        ]
        for payload in invalid:
            with self.subTest(payload=payload):
                with self.assertRaises(ValidationError):
                    ShotSchemaGenerateRequest.model_validate(payload)

    def test_unpunctuated_script_lines_remain_distinct_mock_shots(self) -> None:
        request = ShotSchemaGenerateRequest(
            source_script_node_id="script-a",
            script="人物入场\n海浪推进",
            requested_shot_count=2,
        )

        document = generate_mock_shot_schema("project-a", "canvas-a", request)

        self.assertEqual(["人物入场", "海浪推进"], [shot.narrative for shot in document.shots])

    def test_response_is_strict_contiguous_unique_and_counted(self) -> None:
        self.assertEqual(2, ShotSchemaDocument.model_validate(valid_document()).shot_count)
        mutations = []

        future = deepcopy(valid_document())
        future["contract_version"] = 2
        mutations.append(future)

        extra = deepcopy(valid_document())
        extra["shots"][0]["camera_angle"] = "wide"
        mutations.append(extra)

        duplicate = deepcopy(valid_document())
        duplicate["shots"][1]["shot_id"] = "shot-01"
        mutations.append(duplicate)

        reordered = deepcopy(valid_document())
        reordered["shots"][1]["index"] = 3
        reordered["shots"][1]["shot_id"] = "shot-03"
        mutations.append(reordered)

        wrong_count = deepcopy(valid_document())
        wrong_count["shot_count"] = 3
        mutations.append(wrong_count)

        for payload in mutations:
            with self.subTest(payload=payload):
                with self.assertRaises(ValidationError):
                    ShotSchemaDocument.model_validate(payload)


if __name__ == "__main__":
    unittest.main()
