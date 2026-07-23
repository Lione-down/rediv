from __future__ import annotations

import importlib
import unittest
from types import ModuleType
from uuid import uuid4

from pydantic import ValidationError


FORBIDDEN_ORDINARY_FIELDS = {
    "asset",
    "generation_task",
    "provider_raw_response",
    "provider_request_snapshot",
    "request_fingerprint",
    "request_parameters",
}


def _ids() -> dict[str, str]:
    return {
        "job_id": str(uuid4()),
        "project_id": str(uuid4()),
        "canvas_id": str(uuid4()),
        "node_id": str(uuid4()),
        "asset_id": str(uuid4()),
    }


class CompactGenerationJobContractTests(unittest.TestCase):
    def _contract_module(self) -> ModuleType:
        try:
            return importlib.import_module("schemas.generation_job")
        except ModuleNotFoundError as error:
            self.fail(
                "T6-007 RED [compact-generation-dto-module-absent]: "
                f"schemas.generation_job is not implemented ({error})"
            )

    def _model(self, name: str):
        contract = self._contract_module()
        model = getattr(contract, name, None)
        if model is None:
            self.fail(
                f"T6-007 RED [compact-generation-dto-{name}-absent]: "
                f"schemas.generation_job.{name} is not implemented"
            )
        return model

    def test_submit_receipt_is_compact_versioned_and_rejects_task_internals(self) -> None:
        identifiers = _ids()
        model = self._model("GenerationJobSubmitReceipt")
        payload = {
            **{key: identifiers[key] for key in ("job_id", "project_id", "canvas_id", "node_id")},
            "media_type": "video",
            "status": "queued",
            "model_id": "provider-video-model",
            "quota_revision": 8,
            "version": 1,
        }

        receipt = model.model_validate(payload)

        self.assertEqual(payload, receipt.model_dump(mode="json", exclude_none=True))
        for field in FORBIDDEN_ORDINARY_FIELDS:
            with self.subTest(field=field):
                with self.assertRaises(ValidationError):
                    model.model_validate({**payload, field: {"unexpected": True}})

    def test_status_contains_only_runtime_state_and_safe_error_summary(self) -> None:
        identifiers = _ids()
        model = self._model("GenerationJobStatus")
        payload = {
            "job_id": identifiers["job_id"],
            "node_id": identifiers["node_id"],
            "media_type": "image",
            "status": "running",
            "stage": "provider",
            "progress": 42,
            "error": None,
            "result_asset_id": None,
            "version": 4,
            "updated_at": "2026-07-23T12:00:00Z",
        }

        status = model.model_validate(payload)

        self.assertEqual(payload, status.model_dump(mode="json", exclude_none=False))
        for field in FORBIDDEN_ORDINARY_FIELDS | {"content", "url"}:
            with self.subTest(field=field):
                with self.assertRaises(ValidationError):
                    model.model_validate({**payload, field: "forbidden"})

    def test_result_serializes_text_or_media_once_without_full_task_duplication(self) -> None:
        identifiers = _ids()
        model = self._model("GenerationJobResult")
        text_payload = {
            "job_id": identifiers["job_id"],
            "node_id": identifiers["node_id"],
            "result": {
                "media_type": "text",
                "content": "雨夜车站。摄影师穿过人群。",
            },
            "version": 7,
        }
        media_payload = {
            "job_id": identifiers["job_id"],
            "node_id": identifiers["node_id"],
            "result": {
                "asset_id": identifiers["asset_id"],
                "media_type": "video",
                "url": "https://media.revid.test/result.mp4",
            },
            "version": 8,
        }

        text_result = model.model_validate(text_payload).model_dump(mode="json", exclude_none=True)
        media_result = model.model_validate(media_payload).model_dump(mode="json", exclude_none=True)

        self.assertEqual(text_payload, text_result)
        self.assertEqual(media_payload, media_result)
        self.assertEqual(1, str(text_result).count("雨夜车站"))
        self.assertEqual(1, str(media_result).count("https://media.revid.test/result.mp4"))
        for field in FORBIDDEN_ORDINARY_FIELDS:
            self.assertNotIn(field, text_result)
            self.assertNotIn(field, media_result)


if __name__ == "__main__":
    unittest.main()
