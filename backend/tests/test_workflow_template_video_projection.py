from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import api.video_generate as video_generate_api
from core.generation_parameter_contract import normalize_video_parameters
from schemas.generation import VideoGenerateRequest
from services.workflow_templates.provider_projection import (
    compile_workflow_template_video_projection,
)

SCRIPT_NODE_ID = "11111111-1111-4111-8111-111111111111"
VIDEO_NODE_ID = "22222222-2222-4222-8222-222222222222"
PROJECT_ID = "33333333-3333-4333-8333-333333333333"
CANVAS_ID = "44444444-4444-4444-8444-444444444444"
INSTANCE_ID = "55555555-5555-4555-8555-555555555555"
INSTANCE_STEP_ID = "66666666-6666-4666-8666-666666666666"
SHOT_ID = "77777777-7777-4777-8777-777777777777"
SHOT_LINEAGE = {
    "contract_version": 1,
    "template_id": "revid.product-ad",
    "template_version": 1,
    "instance_id": INSTANCE_ID,
    "instance_step_id": INSTANCE_STEP_ID,
    "step_id": "compile-story",
    "script_node_id": SCRIPT_NODE_ID,
    "shot_id": SHOT_ID,
}


class WorkflowTemplateVideoProjectionTestCase(unittest.TestCase):
    def test_compiler_emits_only_the_three_official_video_request_modes(self) -> None:
        cases = (
            (
                "text-to-video",
                normalize_video_parameters(
                    reference_mode="text-to-video",
                    duration_seconds=3,
                    aspect_ratio="9:16",
                    resolution="480p",
                    image_ids=[],
                ),
                [],
                {
                    "model": "agnes-video-v2.0",
                    "prompt": "Create the approved text clip.",
                    "width": 448,
                    "height": 832,
                    "num_frames": 81,
                    "frame_rate": 24,
                },
            ),
            (
                "image-to-video",
                normalize_video_parameters(
                    reference_mode="image-to-video",
                    duration_seconds=5,
                    aspect_ratio="16:9",
                    resolution="720p",
                    image_ids=["asset-first"],
                    negative_prompt="No text overlays.",
                ),
                ["https://fixture.invalid/first.png"],
                {
                    "model": "agnes-video-v2.0",
                    "prompt": "Animate the approved owned frame.",
                    "width": 1152,
                    "height": 648,
                    "num_frames": 121,
                    "frame_rate": 24,
                    "image": "https://fixture.invalid/first.png",
                    "negative_prompt": "No text overlays.",
                },
            ),
            (
                "keyframes",
                normalize_video_parameters(
                    reference_mode="keyframes",
                    duration_seconds=18,
                    aspect_ratio="16:9",
                    resolution="1080p",
                    image_ids=None,
                    video_references=[
                        {
                            "node_id": "node-first",
                            "asset_id": "asset-first",
                            "role": "first-frame",
                            "order": 0,
                        },
                        {
                            "node_id": "node-middle",
                            "asset_id": "asset-middle",
                            "role": "reference",
                            "order": 1,
                        },
                        {
                            "node_id": "node-last",
                            "asset_id": "asset-last",
                            "role": "last-frame",
                            "order": 2,
                        },
                    ],
                ),
                [
                    "https://fixture.invalid/first.png",
                    "https://fixture.invalid/middle.png",
                    "https://fixture.invalid/last.png",
                ],
                {
                    "model": "agnes-video-v2.0",
                    "prompt": "Transition through the approved temporal frames.",
                    "width": 1920,
                    "height": 1080,
                    "num_frames": 441,
                    "frame_rate": 24,
                    "extra_body": {
                        "mode": "keyframes",
                        "image": [
                            "https://fixture.invalid/first.png",
                            "https://fixture.invalid/middle.png",
                            "https://fixture.invalid/last.png",
                        ],
                    },
                },
            ),
        )

        for mode, normalized, image_urls, expected in cases:
            with self.subTest(mode=mode):
                projection = compile_workflow_template_video_projection(
                    prompt=expected["prompt"],
                    normalized_parameters=normalized,
                    image_urls=image_urls,
                )

                self.assertEqual("agnes.video-v2.0.v1", projection.contract_id)
                self.assertEqual("shot-video", projection.intent)
                self.assertEqual(expected, projection.request)
                self.assertNotIn("resolution", projection.request)

    def test_compiler_rejects_conflicting_or_unvalidated_frame_inputs(self) -> None:
        text = normalize_video_parameters(
            reference_mode="text-to-video",
            duration_seconds=5,
            image_ids=[],
        )
        single = normalize_video_parameters(
            reference_mode="image-to-video",
            duration_seconds=5,
            image_ids=["asset-first"],
        )
        keyframes = normalize_video_parameters(
            reference_mode="keyframes",
            duration_seconds=5,
            image_ids=["asset-first", "asset-last"],
        )

        invalid = (
            (text, ["https://fixture.invalid/unexpected.png"], "text-to-video"),
            (single, [], "single image"),
            (
                keyframes,
                ["https://fixture.invalid/first.png"],
                "ordered keyframes",
            ),
        )
        for normalized, image_urls, message in invalid:
            with self.subTest(message=message):
                with self.assertRaisesRegex(ValueError, message):
                    compile_workflow_template_video_projection(
                        prompt="Reject invalid frame projection.",
                        normalized_parameters=normalized,
                        image_urls=image_urls,
                    )

    def test_semantic_video_fields_fail_before_provider_projection(self) -> None:
        semantic_reference = {
            "node_id": "character-node",
            "asset_id": "character-asset",
            "source_revision": "a" * 64,
            "role": "character",
            "instruction": "Preserve identity.",
            "must_not_transfer": ["background"],
            "order": 0,
        }

        with self.assertRaisesRegex(ValueError, "fields|role"):
            normalize_video_parameters(
                reference_mode="keyframes",
                duration_seconds=5,
                image_ids=None,
                video_references=[
                    semantic_reference,
                    {
                        **semantic_reference,
                        "node_id": "scene-node",
                        "asset_id": "scene-asset",
                        "source_revision": "b" * 64,
                        "role": "scene",
                        "instruction": "Use the scene.",
                        "must_not_transfer": ["identity"],
                        "order": 1,
                    },
                ],
            )

    def test_template_video_requires_exact_card_and_shot_lineage(self) -> None:
        request = VideoGenerateRequest.model_validate(
            {
                "project_id": PROJECT_ID,
                "origin_canvas_id": CANVAS_ID,
                "canvas_node_id": VIDEO_NODE_ID,
                "prompt": "Animate the selected template shot.",
                "reference_mode": "text-to-video",
                "template_lineage": SHOT_LINEAGE,
            }
        )
        document = {
            "nodes": [
                {
                    "id": VIDEO_NODE_ID,
                    "content": {
                        "source_script_node_id": SCRIPT_NODE_ID,
                        "shot_id": SHOT_ID,
                        "template_lineage": SHOT_LINEAGE,
                    },
                }
            ]
        }

        with (
            patch.object(
                video_generate_api,
                "resolve_workflow_template_story_lineage",
                return_value=request.template_lineage,
            ),
            patch.object(
                video_generate_api.document_controller,
                "get_document",
                return_value=document,
            ),
        ):
            snapshot = video_generate_api._resolve_video_template_lineage(
                request,
                user_id="owner-1",
            )

        self.assertEqual(SHOT_LINEAGE, snapshot)

    def test_template_video_rejects_stale_card_before_task_or_provider(self) -> None:
        request = VideoGenerateRequest.model_validate(
            {
                "project_id": PROJECT_ID,
                "origin_canvas_id": CANVAS_ID,
                "canvas_node_id": VIDEO_NODE_ID,
                "prompt": "Reject stale template Video lineage.",
                "reference_mode": "text-to-video",
                "template_lineage": SHOT_LINEAGE,
            }
        )
        document = {
            "nodes": [
                {
                    "id": VIDEO_NODE_ID,
                    "content": {
                        "source_script_node_id": SCRIPT_NODE_ID,
                        "shot_id": "88888888-8888-4888-8888-888888888888",
                        "template_lineage": SHOT_LINEAGE,
                    },
                }
            ]
        }

        with (
            patch.object(
                video_generate_api,
                "resolve_workflow_template_story_lineage",
                return_value=request.template_lineage,
            ),
            patch.object(
                video_generate_api.document_controller,
                "get_document",
                return_value=document,
            ),
        ):
            with self.assertRaises(HTTPException) as raised:
                video_generate_api._resolve_video_template_lineage(
                    request,
                    user_id="owner-1",
                )

        self.assertEqual(409, raised.exception.status_code)
        self.assertEqual(
            "workflow_template_video_lineage_stale",
            raised.exception.detail["code"],
        )


if __name__ == "__main__":
    unittest.main()
