from __future__ import annotations

import base64
import hashlib
import json
from datetime import datetime

from core.agnes_contract import AGNES_CONTRACT
from core.generation_parameter_contract import build_generation_capabilities
from core.generation_task_utils import sanitize_error_message
from models.asset import Asset
from models.base import get_session
from models.generation_task import GenerationTask
from repositories.generation_tasks import GenerationTaskRepository
from schemas.generation_job import (
    GenerationJobDeltaPage,
    GenerationJobMediaResult,
    GenerationJobResult,
    GenerationJobStatus,
    GenerationJobSubmitReceipt,
    GenerationJobTextResult,
)


class GenerationJobResultUnavailableError(Exception):
    pass


def _fingerprint(value: dict) -> str:
    serialized = json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return hashlib.sha256(serialized).hexdigest()


def _status(task: dict) -> GenerationJobStatus:
    safe_error = None
    if task["error_code"]:
        message = sanitize_error_message(task["error_message"] or "Generation failed")
        safe_error = f"{task['error_code']}: {message}"[:500]
    return GenerationJobStatus(
        job_id=task["id"],
        node_id=task["canvas_node_id"] or task["id"],
        media_type=task["media_type"],
        status=task["status"],
        stage=task["progress_stage"],
        progress=task["progress_percent"],
        error=safe_error,
        result_asset_id=task["result_asset_id"],
        version=task.get("job_version") or 1,
        updated_at=task["updated_at"],
    )


def _encode_cursor(task: dict) -> str:
    raw = f"{task['updated_at']}|{task['id']}".encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _decode_cursor(cursor: str | None) -> tuple[datetime | None, str | None]:
    if cursor is None:
        return None, None
    try:
        padding = "=" * (-len(cursor) % 4)
        decoded = base64.urlsafe_b64decode(cursor + padding).decode("utf-8")
        timestamp, task_id = decoded.rsplit("|", 1)
        return datetime.fromisoformat(timestamp), task_id
    except (ValueError, UnicodeDecodeError):
        raise ValueError("Invalid generation job cursor") from None


class GenerationJobService:
    def __init__(self, repository: GenerationTaskRepository | None = None) -> None:
        self.repository = repository or GenerationTaskRepository()

    def submit(
        self,
        *,
        user_id: str,
        project_id: str,
        canvas_id: str,
        node_id: str,
        media_type: str,
        provider_id: str,
        model_id: str,
        client_request_id: str,
        input_payload: dict,
    ) -> GenerationJobSubmitReceipt:
        if provider_id != "agnes":
            raise ValueError("Generation job provider is not allowed")
        capability_media_type = "text" if media_type == "script" else media_type
        allowed_contract = AGNES_CONTRACT.media.get(capability_media_type)
        if allowed_contract is None or model_id != allowed_contract.model:
            raise ValueError(f"Generation job model is not allowed for {media_type}")
        if media_type != "text" and (
            input_payload.get("mode") is not None
            or input_payload.get("content_revision") is not None
        ):
            raise ValueError(
                "Text workflow fields are not allowed for non-text generation jobs"
            )
        if media_type == "text" and input_payload.get("mode") is not None:
            text_capabilities = build_generation_capabilities()["text"]
            allowed_model = next(
                (
                    model
                    for model in text_capabilities["models"]
                    if model["id"] == model_id
                ),
                None,
            )
            if (
                allowed_model is None
                or input_payload["mode"] not in allowed_model["workflow_modes"]
            ):
                raise ValueError("Generation job model or mode is not allowed for text")
        fingerprint = _fingerprint({
            "user_id": user_id,
            "project_id": project_id,
            "canvas_id": canvas_id,
            "node_id": node_id,
            "media_type": media_type,
            "provider_id": provider_id,
            "model_id": model_id,
            "input": input_payload,
        })
        task, quota_revision = self.repository.submit_job(
            user_id=user_id,
            project_id=project_id,
            canvas_id=canvas_id,
            node_id=node_id,
            media_type=media_type,
            provider_id=provider_id,
            model_id=model_id,
            client_request_id=client_request_id,
            request_fingerprint=fingerprint,
            request_parameters={
                "contract": "revid.generation-job.v2",
                "input": input_payload,
            },
        )
        return GenerationJobSubmitReceipt(
            job_id=task["id"],
            project_id=task["project_id"],
            canvas_id=task["origin_canvas_id"],
            node_id=task["canvas_node_id"],
            media_type=task["media_type"],
            status=task["status"],
            model_id=task["model"],
            quota_revision=quota_revision,
            version=task.get("job_version") or 1,
        )

    def get_status(self, user_id: str, job_id: str) -> GenerationJobStatus:
        return _status(self.repository.get_owned(user_id, job_id))

    def get_result(self, user_id: str, job_id: str) -> GenerationJobResult:
        task = self.repository.get_owned(user_id, job_id)
        if task["status"] != "succeeded" or not task["result_asset_id"]:
            raise GenerationJobResultUnavailableError("Generation job result is not available")
        with get_session() as session:
            row = session.get(GenerationTask, job_id)
            asset = session.get(Asset, task["result_asset_id"])
            if row is None or asset is None or asset.source_task_id != job_id:
                raise GenerationJobResultUnavailableError("Generation job result is not available")
            if row.media_type in {"text", "script"}:
                result = GenerationJobTextResult(
                    media_type=row.media_type,
                    content=asset.content_text or "",
                )
            else:
                result = GenerationJobMediaResult(
                    asset_id=asset.id,
                    media_type=row.media_type,
                    url=asset.url or "",
                )
        return GenerationJobResult(
            job_id=task["id"],
            node_id=task["canvas_node_id"] or task["id"],
            result=result,
            version=task.get("job_version") or 1,
        )

    def list_delta(
        self,
        *,
        user_id: str,
        project_id: str,
        canvas_id: str,
        after: str | None,
        limit: int,
    ) -> GenerationJobDeltaPage:
        after_updated_at, after_id = _decode_cursor(after)
        tasks = self.repository.list_for_canvas(
            user_id=user_id,
            project_id=project_id,
            canvas_id=canvas_id,
            after_updated_at=after_updated_at,
            after_id=after_id,
            limit=limit,
        )
        return GenerationJobDeltaPage(
            items=[_status(task) for task in tasks],
            next_cursor=_encode_cursor(tasks[-1]) if tasks else after,
        )

    def cancel(self, user_id: str, job_id: str) -> GenerationJobStatus:
        return _status(self.repository.cancel(user_id, job_id))

    def retry(self, user_id: str, job_id: str) -> GenerationJobStatus:
        return _status(self.repository.retry(user_id, job_id))
