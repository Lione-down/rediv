from __future__ import annotations

import importlib
import unittest
from types import ModuleType
from uuid import uuid4


SUBMIT_HARD_LIMIT = 4 * 1024
STATUS_HARD_LIMIT = 4 * 1024
DELTA_100_HARD_LIMIT = 128 * 1024
FORBIDDEN_STATUS_KEYS = {
    "base64",
    "content",
    "data_uri",
    "provider_raw_response",
    "provider_request_snapshot",
    "request_fingerprint",
    "request_parameters",
    "url",
}


def _json_size(model) -> int:
    return len(model.model_dump_json(exclude_none=False).encode("utf-8"))


def _walk_keys(value: object) -> set[str]:
    if isinstance(value, dict):
        return set(value) | set().union(*(_walk_keys(item) for item in value.values()))
    if isinstance(value, list):
        return set().union(*(_walk_keys(item) for item in value))
    return set()


class GenerationJobPayloadBudgetTests(unittest.TestCase):
    def _contract_module(self) -> ModuleType:
        try:
            return importlib.import_module("schemas.generation_job")
        except ModuleNotFoundError as error:
            self.fail(
                "T6-007 RED [compact-generation-payload-budget-module-absent]: "
                f"schemas.generation_job is not implemented ({error})"
            )

    def _model(self, name: str):
        model = getattr(self._contract_module(), name, None)
        if model is None:
            self.fail(
                f"T6-007 RED [compact-generation-payload-budget-{name}-absent]: "
                f"schemas.generation_job.{name} is not implemented"
            )
        return model

    def _status_payload(self, index: int) -> dict[str, object]:
        return {
            "job_id": str(uuid4()),
            "node_id": str(uuid4()),
            "media_type": ("text", "image", "video")[index % 3],
            "status": "running",
            "stage": "provider",
            "progress": index % 101,
            "error": None,
            "result_asset_id": None,
            "version": index + 1,
            "updated_at": "2026-07-23T12:00:00Z",
        }

    def test_submit_and_single_status_stay_under_the_hard_four_kib_budget(self) -> None:
        submit_model = self._model("GenerationJobSubmitReceipt")
        status_model = self._model("GenerationJobStatus")
        submit = submit_model.model_validate({
            "job_id": str(uuid4()),
            "project_id": str(uuid4()),
            "canvas_id": str(uuid4()),
            "node_id": str(uuid4()),
            "media_type": "script",
            "status": "queued",
            "model_id": "allowed-text-model",
            "quota_revision": 12,
            "version": 1,
        })
        status = status_model.model_validate(self._status_payload(0))

        self.assertLessEqual(
            _json_size(submit),
            SUBMIT_HARD_LIMIT,
            "T6-007 RED [compact-submit-hard-budget-exceeded]",
        )
        self.assertLessEqual(
            _json_size(status),
            STATUS_HARD_LIMIT,
            "T6-007 RED [compact-status-hard-budget-exceeded]",
        )

    def test_one_hundred_item_delta_stays_under_128_kib_and_excludes_heavy_fields(self) -> None:
        delta_model = self._model("GenerationJobDeltaPage")
        payload = {
            "items": [self._status_payload(index) for index in range(100)],
            "next_cursor": "generation-job-version:100",
        }

        delta = delta_model.model_validate(payload)
        dumped = delta.model_dump(mode="json", exclude_none=False)

        self.assertLessEqual(
            _json_size(delta),
            DELTA_100_HARD_LIMIT,
            "T6-007 RED [compact-delta-hard-budget-exceeded]",
        )
        self.assertTrue(FORBIDDEN_STATUS_KEYS.isdisjoint(_walk_keys(dumped)))


if __name__ == "__main__":
    unittest.main()
