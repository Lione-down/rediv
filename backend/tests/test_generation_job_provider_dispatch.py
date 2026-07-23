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
            return {"status": "processing"}
        return {
            "status": "completed",
            "video_url": "https://example.com/generated.mp4",
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

    async def test_video_dispatch_checkpoints_before_bounded_polling(self) -> None:
        provider = _FakeProvider()
        dispatcher = GenerationProviderDispatcher(
            provider,
            poll_interval_seconds=0,
            max_poll_attempts=2,
        )
        checkpoints: list[str] = []

        result = await dispatcher.dispatch(_job("video"), checkpoints.append)

        self.assertEqual(["video-request-1"], checkpoints)
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
        reclaimed_job = _job("video")
        reclaimed_job["provider_request_id"] = "video-request-1"

        result = await dispatcher.dispatch(reclaimed_job, checkpoints.append)

        self.assertEqual("video-request-1", result.provider_request_id)
        self.assertEqual([], checkpoints)
        self.assertNotIn("video", [operation for operation, _kwargs in provider.calls])
        self.assertEqual(2, provider.video_polls)

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
