from __future__ import annotations

import unittest
from unittest.mock import patch

from api.video_generate import video_generate
from controllers.generation_transactions import GenerationStartResult
from core.cinematic_skill_contract import build_cinematic_skill_preflight
from schemas.generation import VideoGenerateRequest


class CinematicSkillV2NativeTransactionTests(unittest.IsolatedAsyncioTestCase):
    @patch("api.video_generate.generation_controller.start_video_generation_request")
    @patch("api.generation_common.document_controller.get_document")
    async def test_one_explicit_send_persists_exact_snapshot_in_existing_transaction_without_provider_call(
        self,
        get_document,
        start_video,
    ):
        arguments = {
            "skill_id": "revid.cinema-video",
            "skill_version": 2,
            "project_id": "project-1",
            "canvas_id": "canvas-1",
            "canvas_revision": 7,
            "provider_id": "agnes",
            "model_id": "agnes-video-v2.0",
            "user_instruction": "Follow the character through the rainy station to the train door.",
            "mentions": [],
            "generation_parameters": {"duration_seconds": 5, "reference_mode": "text-to-video"},
            "canvas_nodes": [],
            "workflow_mode": "standalone_clip",
            "director_brief": None,
            "sequence_context": None,
            "retake_context": None,
        }
        preflight = build_cinematic_skill_preflight(**arguments)
        payload = VideoGenerateRequest.model_validate({
            "project_id": "project-1",
            "origin_canvas_id": "canvas-1",
            "canvas_node_id": "generation-1",
            "prompt": preflight["canonical_request"]["optimized_prompt"],
            "image_ids": [],
            "reference_mode": "text-to-video",
            "duration_seconds": 5,
            "cinematic_handoff": {
                "skill_id": arguments["skill_id"],
                "skill_version": 2,
                "canvas_revision": 7,
                "provider_id": "agnes",
                "model_id": "agnes-video-v2.0",
                "user_instruction": arguments["user_instruction"],
                "mentions": [],
                "generation_parameters": arguments["generation_parameters"],
                "workflow_mode": "standalone_clip",
                "director_brief": None,
                "sequence_context": None,
                "retake_context": None,
                "submitted_preflight": preflight,
            },
        })
        get_document.return_value = {"revision": 7, "nodes": []}
        start_video.return_value = GenerationStartResult(
            task={"provider_request_id": "video-replay"},
            input_image_urls=None,
            replay_outcome={
                "asset": {"url": "https://assets.example.test/replay.mp4"},
                "generation_task": {"id": "task-replay"},
                "quotas": {"video": 1},
            },
        )

        class ProviderMustNotRun:
            async def generate_video(self, **_kwargs):
                raise AssertionError("replay-safe transaction must not call provider")

        result = await video_generate(payload, user={"id": "user-1"}, provider=ProviderMustNotRun())

        snapshot = start_video.call_args.kwargs["request_parameters"]["cinematic_skill"]
        self.assertEqual(preflight["canonical_request"], snapshot["canonical_request"])
        self.assertEqual(preflight["request_digest"], snapshot["request_digest"])
        self.assertEqual("https://assets.example.test/replay.mp4", result["url"])


if __name__ == "__main__":
    unittest.main()
