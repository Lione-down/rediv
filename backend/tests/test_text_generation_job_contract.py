from __future__ import annotations

import unittest

from core.agnes_contract import AGNES_CONTRACT
from core.generation_parameter_contract import build_generation_capabilities
from services.generation.job_service import GenerationJobService


TEXT_MODEL_ID = AGNES_CONTRACT.media["text"].model


class RecordingRepository:
    def __init__(self) -> None:
        self.submissions: list[dict] = []

    def submit_job(self, **payload):
        self.submissions.append(payload)
        return (
            {
                "id": "job-text",
                "project_id": payload["project_id"],
                "origin_canvas_id": payload["canvas_id"],
                "canvas_node_id": payload["node_id"],
                "media_type": payload["media_type"],
                "status": "queued",
                "model": payload["model_id"],
                "job_version": 1,
            },
            7,
        )


class TextGenerationJobContractTests(unittest.TestCase):
    def test_capabilities_publish_explicit_allowed_models_and_modes(self):
        capabilities = build_generation_capabilities()

        self.assertEqual(2, capabilities["text"]["contract_version"])
        self.assertEqual(TEXT_MODEL_ID, capabilities["text"]["model"])
        self.assertEqual("Agnes 2.0 Flash", capabilities["text"]["model_label"])
        self.assertEqual(
            [
                {
                    "id": TEXT_MODEL_ID,
                    "label": "Agnes 2.0 Flash",
                    "workflow_modes": ["text-to-video"],
                },
                {
                    "id": "agnes-2.5-flash",
                    "label": "Agnes 2.5 Flash",
                    "workflow_modes": ["text-to-video"],
                },
            ],
            capabilities["text"]["models"],
        )

    def test_text_submission_persists_explicit_supported_model_and_mode(self):
        repository = RecordingRepository()
        service = GenerationJobService(repository=repository)

        receipt = service.submit(
            user_id="user-1",
            project_id="project-1",
            canvas_id="canvas-1",
            node_id="text-1",
            media_type="text",
            provider_id="agnes",
            model_id=TEXT_MODEL_ID,
            client_request_id="00000000-0000-4000-8000-000000000001",
            input_payload={
                "prompt": "优化为一段视频提示词",
                "mode": "text-to-video",
                "content_revision": 3,
            },
        )

        self.assertEqual(TEXT_MODEL_ID, receipt.model_id)
        self.assertEqual(1, len(repository.submissions))
        self.assertEqual(
            {
                "contract": "revid.generation-job.v2",
                "input": {
                    "prompt": "优化为一段视频提示词",
                    "mode": "text-to-video",
                    "content_revision": 3,
                },
            },
            repository.submissions[0]["request_parameters"],
        )

    def test_unknown_or_incompatible_text_selection_fails_before_repository_mutation(self):
        repository = RecordingRepository()
        service = GenerationJobService(repository=repository)
        base = {
            "user_id": "user-1",
            "project_id": "project-1",
            "canvas_id": "canvas-1",
            "node_id": "text-1",
            "media_type": "text",
            "provider_id": "agnes",
            "client_request_id": "00000000-0000-4000-8000-000000000001",
        }

        for model_id, mode in (
            ("unknown-model", "text-to-video"),
            (TEXT_MODEL_ID, "image-to-prompt"),
            (TEXT_MODEL_ID, "text-to-music"),
        ):
            with self.subTest(model_id=model_id, mode=mode):
                with self.assertRaisesRegex(ValueError, "not allowed"):
                    service.submit(
                        **base,
                        model_id=model_id,
                        input_payload={
                            "prompt": "bounded prompt",
                            "mode": mode,
                            "content_revision": 0,
                        },
                    )

        self.assertEqual([], repository.submissions)

    def test_text_revision_fields_do_not_enable_later_media_workflows(self):
        repository = RecordingRepository()
        service = GenerationJobService(repository=repository)

        with self.assertRaisesRegex(ValueError, "not allowed"):
            service.submit(
                user_id="user-1",
                project_id="project-1",
                canvas_id="canvas-1",
                node_id="image-1",
                media_type="image",
                provider_id="agnes",
                model_id=AGNES_CONTRACT.media["image"].model,
                client_request_id="00000000-0000-4000-8000-000000000002",
                input_payload={
                    "prompt": "later image workflow",
                    "mode": "text-to-video",
                    "content_revision": 0,
                },
            )

        self.assertEqual([], repository.submissions)


if __name__ == "__main__":
    unittest.main()
