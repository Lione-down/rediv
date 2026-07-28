from __future__ import annotations

import base64
import hashlib
import json
from datetime import datetime

from controllers.generation_starts import resolve_input_image_urls
from core.agnes_contract import AGNES_CONTRACT, build_image_request
from core.generation_parameter_contract import (
    build_generation_capabilities,
    normalize_image_parameters,
    normalize_video_parameters,
)
from core.image_generation_recipes import resolve_image_generation_recipe
from core.generation_task_utils import sanitize_error_message
from models.asset import Asset
from models.base import get_session
from models.generation_task import GenerationTask
from repositories.generation_tasks import (
    GenerationJobForbiddenError,
    GenerationJobIdempotencyConflictError,
    GenerationJobNotFoundError,
    GenerationTaskRepository,
)
from schemas.generation import ImageGenerateRequest, VideoGenerateRequest
from schemas.generation_job import (
    GenerationJobCinematicLineage,
    GenerationJobDeltaPage,
    GenerationJobMediaResult,
    GenerationJobResult,
    GenerationJobStatus,
    GenerationJobSubmitReceipt,
    GenerationJobTextResult,
)
from schemas.workflow_template import WorkflowTemplateProviderProjection
from services.workflow_templates.provider_projection import (
    compile_workflow_template_video_projection,
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


def _receipt(task: dict, quota_revision: int | None) -> GenerationJobSubmitReceipt:
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


def _prepare_image_input(
    *,
    user_id: str,
    project_id: str,
    canvas_id: str,
    node_id: str,
    model_id: str,
    input_payload: dict,
) -> tuple[dict, dict]:
    from api.generation_common import resolve_cinematic_generation_handoff
    from api.image_generate import _resolve_image_template_lineage

    payload = ImageGenerateRequest.model_validate({
        "project_id": project_id,
        "origin_canvas_id": canvas_id,
        "canvas_node_id": node_id,
        **input_payload,
    })
    template_lineage = _resolve_image_template_lineage(payload, user_id=user_id)
    recipe = (
        resolve_image_generation_recipe(
            payload.generation_recipe_id,
            payload.generation_recipe_version,
        )
        if payload.generation_recipe_id
        else None
    )
    normalized = normalize_image_parameters(
        size=payload.size,
        aspect_ratio=payload.aspect_ratio,
        image_ids=payload.image_ids,
        output_count=payload.output_count,
        batch=payload.batch.model_dump(mode="json") if payload.batch else None,
        recipe_id=recipe.id if recipe else None,
        recipe_version=recipe.version if recipe else None,
        recipe_size=recipe.output_size if recipe else None,
        shot_controls=payload.shot_controls,
    )
    if payload.cinematic_handoff and (recipe or payload.image_operation):
        raise ValueError("Cinematic Skill does not wrap recipes or image operations")
    cinematic_handoff = resolve_cinematic_generation_handoff(
        payload.cinematic_handoff,
        user_id=user_id,
        project_id=project_id,
        canvas_id=canvas_id,
        media_type="image",
        provider_id="agnes",
        model_id=model_id,
        prompt=payload.prompt,
        image_ids=payload.image_ids,
        expected_control_parameters={
            "aspect_ratio": normalized.request_parameters["aspect_ratio"],
            **(
                {"shot_controls": normalized.request_parameters["shot_controls"]}
                if "shot_controls" in normalized.request_parameters
                else {}
            ),
        },
    )
    with get_session() as session:
        image_urls = resolve_input_image_urls(
            session,
            user_id=user_id,
            project_id=project_id,
            image_ids=payload.image_ids,
        )
    prompt = recipe.prompt if recipe else payload.prompt
    request = build_image_request(
        model=model_id,
        prompt=prompt or "",
        size=normalized.provider_size,
        ratio=normalized.provider_ratio,
        images=image_urls or [],
        response_format="url",
    )
    projection = WorkflowTemplateProviderProjection.model_validate({
        "name": "durable direct-card image projection",
        "projection_version": 1,
        "provider": "agnes",
        "contract_id": "agnes.image-2.1.generations.v1",
        "intent": "shot-image",
        "request": request,
    })
    prepared = dict(input_payload)
    prepared["prompt"] = prompt
    prepared["provider_request"] = {
        "contract_id": projection.contract_id,
        "request": projection.request,
    }
    extras: dict = {"generation_parameters": normalized.request_parameters}
    if template_lineage is not None:
        extras["template_lineage"] = template_lineage
    if cinematic_handoff:
        extras["cinematic_skill"] = cinematic_handoff["request_snapshot"]
    return prepared, extras


def _prepare_video_input(
    *,
    user_id: str,
    project_id: str,
    canvas_id: str,
    node_id: str,
    model_id: str,
    input_payload: dict,
) -> tuple[dict, dict]:
    from api.generation_common import resolve_cinematic_generation_handoff
    from api.video_generate import _resolve_video_template_lineage

    payload = VideoGenerateRequest.model_validate({
        "project_id": project_id,
        "origin_canvas_id": canvas_id,
        "canvas_node_id": node_id,
        **input_payload,
    })
    template_lineage = _resolve_video_template_lineage(payload, user_id=user_id)
    video_references = (
        [binding.model_dump(mode="json") for binding in payload.video_references]
        if payload.video_references is not None
        else None
    )
    normalized = normalize_video_parameters(
        aspect_ratio=payload.aspect_ratio,
        resolution=payload.resolution,
        reference_mode=payload.reference_mode,
        duration_seconds=payload.duration_seconds,
        image_ids=payload.image_ids,
        video_references=video_references,
        negative_prompt=payload.negative_prompt,
        shot_controls=payload.shot_controls,
    )
    request_image_ids = normalized.request_parameters["image_ids"]
    cinematic_handoff = resolve_cinematic_generation_handoff(
        payload.cinematic_handoff,
        user_id=user_id,
        project_id=project_id,
        canvas_id=canvas_id,
        media_type="video",
        provider_id="agnes",
        model_id=model_id,
        prompt=payload.prompt,
        image_ids=request_image_ids,
        expected_control_parameters={
            "reference_mode": normalized.reference_mode,
            "duration_seconds": normalized.duration_seconds,
            **(
                {"resolution": normalized.resolution}
                if payload.resolution is not None or (
                    payload.cinematic_handoff is not None
                    and "resolution" in payload.cinematic_handoff.generation_parameters
                )
                else {}
            ),
            **(
                {"shot_controls": normalized.request_parameters["shot_controls"]}
                if "shot_controls" in normalized.request_parameters
                else {}
            ),
        },
    )
    with get_session() as session:
        image_urls = resolve_input_image_urls(
            session,
            user_id=user_id,
            project_id=project_id,
            image_ids=request_image_ids,
        )
    projection = compile_workflow_template_video_projection(
        prompt=payload.prompt or "",
        normalized_parameters=normalized,
        image_urls=image_urls or [],
    )
    prepared = dict(input_payload)
    prepared["provider_request"] = {
        "contract_id": projection.contract_id,
        "request": projection.request,
    }
    extras: dict = {"generation_parameters": normalized.request_parameters}
    if template_lineage is not None:
        extras["template_lineage"] = template_lineage
    if cinematic_handoff:
        extras["cinematic_skill"] = cinematic_handoff["request_snapshot"]
    return prepared, extras


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
        if allowed_contract is None or model_id not in allowed_contract.models:
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
        existing = (
            self.repository.get_by_client_request(user_id, client_request_id)
            if media_type in {"image", "video"}
            else None
        )
        if existing is not None:
            if existing["request_fingerprint"] != fingerprint:
                raise GenerationJobIdempotencyConflictError(
                    "Client request ID already owns a different generation request"
                )
            return _receipt(
                existing,
                self.repository.get_quota_revision(user_id),
            )
        request_input = input_payload
        request_extras: dict = {}
        if media_type == "image":
            request_input, request_extras = _prepare_image_input(
                user_id=user_id,
                project_id=project_id,
                canvas_id=canvas_id,
                node_id=node_id,
                model_id=model_id,
                input_payload=input_payload,
            )
        elif media_type == "video":
            request_input, request_extras = _prepare_video_input(
                user_id=user_id,
                project_id=project_id,
                canvas_id=canvas_id,
                node_id=node_id,
                model_id=model_id,
                input_payload=input_payload,
            )
        elif set(input_payload) - {"prompt", "mode", "content_revision"}:
            raise ValueError("Generation job input fields do not match media type")
        if not request_input.get("prompt"):
            raise ValueError("Generation job prompt is required")
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
                "input": request_input,
                **request_extras,
            },
        )
        return _receipt(task, quota_revision)

    def get_status(self, user_id: str, job_id: str) -> GenerationJobStatus:
        return _status(self.repository.get_owned(user_id, job_id))

    @staticmethod
    def _assert_scope(task: dict, project_id: str, canvas_id: str, node_id: str) -> None:
        if (
            task["project_id"] != project_id
            or task["origin_canvas_id"] != canvas_id
            or task["canvas_node_id"] != node_id
        ):
            raise GenerationJobForbiddenError("Generation job scope mismatch")

    def recover_by_client_request(
        self,
        *,
        user_id: str,
        project_id: str,
        canvas_id: str,
        node_id: str,
        client_request_id: str,
    ) -> GenerationJobSubmitReceipt:
        task = self.repository.get_by_client_request(user_id, client_request_id)
        if task is None:
            raise GenerationJobNotFoundError("Generation job not found")
        self._assert_scope(task, project_id, canvas_id, node_id)
        return GenerationJobSubmitReceipt(
            job_id=task["id"],
            project_id=task["project_id"],
            canvas_id=task["origin_canvas_id"],
            node_id=task["canvas_node_id"],
            media_type=task["media_type"],
            status=task["status"],
            model_id=task["model"],
            quota_revision=None,
            version=task.get("job_version") or 1,
        )

    def get_cinematic_lineage(
        self,
        *,
        user_id: str,
        project_id: str,
        canvas_id: str,
        node_id: str,
        job_id: str,
    ) -> GenerationJobCinematicLineage:
        task = self.repository.get_owned(user_id, job_id)
        self._assert_scope(task, project_id, canvas_id, node_id)
        request_parameters = task.get("request_parameters")
        cinematic_skill = (
            request_parameters.get("cinematic_skill")
            if isinstance(request_parameters, dict)
            and isinstance(request_parameters.get("cinematic_skill"), dict)
            else None
        )
        return GenerationJobCinematicLineage(
            job_id=task["id"],
            project_id=task["project_id"],
            canvas_id=task["origin_canvas_id"],
            node_id=task["canvas_node_id"],
            cinematic_skill=cinematic_skill,
            version=task.get("job_version") or 1,
        )

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
