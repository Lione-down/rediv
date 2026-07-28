from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services.generation.provider_dispatch import GenerationProviderDispatcher


class _FakeProvider:
    def __init__(self) -> None:
        self.calls: list[tuple[str, dict]] = []
        self.video_polls = 0

    async def chat(self, **kwargs) -> dict:
        self.calls.append(("text", kwargs))
        return {
            "id": "text-request-1",
            "choices": [{"message": {"content": "durable text"}}],
        }

    async def generate_image(self, **kwargs) -> dict:
        self.calls.append(("image", kwargs))
        return {
            "request_id": "image-request-1",
            "data": [{"url": "https://example.com/generated.png"}],
        }

    async def generate_video(self, **kwargs) -> dict:
        self.calls.append(("video", kwargs))
        return {"video_id": "video-request-1"}

    async def poll_video_result(self, provider_request_id: str) -> dict:
        self.calls.append(("video-poll", {"provider_request_id": provider_request_id}))
        self.video_polls += 1
        if self.video_polls == 1:
            return {"status": "in_progress", "progress": 47}
        return {
            "status": "completed",
            "progress": 100,
            "metadata": {"url": "https://example.com/generated.mp4"},
        }


def _job(media_type: str) -> dict:
    return {
        "id": f"{media_type}-job",
        "media_type": media_type,
        "model": f"{media_type}-model",
        "request_parameters": {
            "contract": "revid.generation-job.v2",
            "input": {"prompt": f"{media_type} prompt"},
        },
    }


class GenerationJobProviderDispatchTests(unittest.IsolatedAsyncioTestCase):
    async def test_workflow_image_projection_uses_the_existing_dispatch_path(self) -> None:
        provider = _FakeProvider()
        dispatcher = GenerationProviderDispatcher(provider)
        job = _job("image")
        job["model"] = "agnes-image-2.1-flash"
        job["request_parameters"]["input"]["prompt"] = "approved image"
        job["request_parameters"]["input"]["workflow_step"] = {
            "contract_version": 1,
            "run_id": "run-1",
            "intent": "shot-image",
        }
        job["request_parameters"]["input"]["provider_request"] = {
            "contract_id": "agnes.image-2.1.generations.v1",
            "request": {
                "model": "agnes-image-2.1-flash",
                "prompt": "approved image",
                "size": "2K",
                "ratio": "1:1",
                "extra_body": {
                    "image": ["https://assets.example.test/reference.png"],
                    "response_format": "url",
                },
            },
        }

        await dispatcher.dispatch(job, lambda _request_id: None)

        self.assertEqual(
            (
                "image",
                {
                    "model": "agnes-image-2.1-flash",
                    "prompt": "approved image",
                    "size": "2K",
                    "ratio": "1:1",
                    "image": ["https://assets.example.test/reference.png"],
                    "response_format": "url",
                },
            ),
            provider.calls[0],
        )

    async def test_workflow_video_projection_uses_official_keyframes_request(self) -> None:
        provider = _FakeProvider()
        dispatcher = GenerationProviderDispatcher(
            provider,
            poll_interval_seconds=0,
            max_poll_attempts=2,
        )
        job = _job("video")
        job["model"] = "agnes-video-v2.0"
        job["request_parameters"]["input"]["prompt"] = "approved video"
        job["request_parameters"]["input"]["workflow_step"] = {
            "contract_version": 1,
            "run_id": "run-1",
            "intent": "shot-video",
        }
        job["request_parameters"]["input"]["provider_request"] = {
            "contract_id": "agnes.video-v2.0.v1",
            "request": {
                "model": "agnes-video-v2.0",
                "prompt": "approved video",
                "width": 1280,
                "height": 720,
                "num_frames": 121,
                "frame_rate": 24,
                "negative_prompt": "blur",
                "extra_body": {
                    "image": [
                        "https://assets.example.test/start.png",
                        "https://assets.example.test/end.png",
                    ],
                    "mode": "keyframes",
                },
            },
        }

        await dispatcher.dispatch(
            job,
            lambda _request_id: None,
            lambda _progress: None,
        )

        self.assertEqual(
            (
                "video",
                {
                    "model": "agnes-video-v2.0",
                    "prompt": "approved video",
                    "width": 1280,
                    "height": 720,
                    "num_frames": 121,
                    "frame_rate": 24,
                    "negative_prompt": "blur",
                    "extra_images": [
                        "https://assets.example.test/start.png",
                        "https://assets.example.test/end.png",
                    ],
                    "mode": "keyframes",
                },
            ),
            provider.calls[0],
        )

    async def test_text_and_image_dispatch_return_canonical_results_and_checkpoint_ids(
        self,
    ) -> None:
        provider = _FakeProvider()
        dispatcher = GenerationProviderDispatcher(provider)
        checkpoints: list[str] = []

        text_result = await dispatcher.dispatch(_job("text"), checkpoints.append)
        image_result = await dispatcher.dispatch(_job("image"), checkpoints.append)

        self.assertEqual("prompt", text_result.asset_type)
        self.assertEqual("durable text", text_result.content_text)
        self.assertEqual("image", image_result.asset_type)
        self.assertEqual("https://example.com/generated.png", image_result.url)
        self.assertEqual(["text-request-1", "image-request-1"], checkpoints)

    async def test_text_dispatch_preserves_the_admitted_agnes_25_flash_model_id(self) -> None:
        provider = _FakeProvider()
        dispatcher = GenerationProviderDispatcher(provider)
        job = _job("text")
        job["model"] = "agnes-2.5-flash"

        await dispatcher.dispatch(job, lambda _request_id: None)

        self.assertEqual(
            "agnes-2.5-flash",
            provider.calls[0][1]["model"],
        )

    async def test_video_dispatch_checkpoints_before_bounded_polling(self) -> None:
        provider = _FakeProvider()
        dispatcher = GenerationProviderDispatcher(
            provider,
            poll_interval_seconds=0,
            max_poll_attempts=2,
        )
        checkpoints: list[str] = []
        progress: list[int] = []

        result = await dispatcher.dispatch(
            _job("video"),
            checkpoints.append,
            progress.append,
        )

        self.assertEqual(["video-request-1"], checkpoints)
        self.assertEqual([47, 100], progress)
        self.assertEqual("video", result.asset_type)
        self.assertEqual("https://example.com/generated.mp4", result.url)
        self.assertEqual(2, provider.video_polls)

    async def test_reclaimed_video_job_resumes_checkpoint_without_duplicate_create(
        self,
    ) -> None:
        provider = _FakeProvider()
        dispatcher = GenerationProviderDispatcher(
            provider,
            poll_interval_seconds=0,
            max_poll_attempts=2,
        )
        checkpoints: list[str] = []
        progress: list[int] = []
        reclaimed_job = _job("video")
        reclaimed_job["provider_request_id"] = "video-request-1"

        result = await dispatcher.dispatch(
            reclaimed_job,
            checkpoints.append,
            progress.append,
        )

        self.assertEqual("video-request-1", result.provider_request_id)
        self.assertEqual([], checkpoints)
        self.assertEqual([47, 100], progress)
        self.assertNotIn("video", [operation for operation, _kwargs in provider.calls])
        self.assertEqual(2, provider.video_polls)

    async def test_video_dispatch_rejects_non_official_status_and_url_aliases(self) -> None:
        provider = _FakeProvider()
        provider.video_polls = 1

        async def legacy_poll(_provider_request_id: str) -> dict:
            return {
                "status": "success",
                "progress_percent": 100,
                "video_url": "https://example.com/legacy.mp4",
            }

        provider.poll_video_result = legacy_poll
        dispatcher = GenerationProviderDispatcher(
            provider,
            poll_interval_seconds=0,
            max_poll_attempts=1,
        )

        with self.assertRaisesRegex(RuntimeError, "status"):
            await dispatcher.dispatch(
                _job("video"),
                lambda _request_id: None,
                lambda _progress: None,
            )

    async def test_video_dispatch_rejects_nested_create_identifier(self) -> None:
        provider = _FakeProvider()

        async def nested_create(**_kwargs) -> dict:
            return {"data": {"video_id": "legacy-video-id"}}

        provider.generate_video = nested_create
        dispatcher = GenerationProviderDispatcher(provider)

        with self.assertRaisesRegex(ValueError, "video task"):
            await dispatcher.dispatch(
                _job("video"),
                lambda _request_id: None,
                lambda _progress: None,
            )

    async def test_dispatch_rejects_non_v2_request_snapshot_without_provider_call(
        self,
    ) -> None:
        provider = _FakeProvider()
        dispatcher = GenerationProviderDispatcher(provider)
        invalid_job = _job("text")
        invalid_job["request_parameters"]["contract"] = "legacy"

        with self.assertRaisesRegex(ValueError, "request snapshot is invalid"):
            await dispatcher.dispatch(invalid_job, lambda _request_id: None)

        self.assertEqual([], provider.calls)


if __name__ == "__main__":
    unittest.main()
