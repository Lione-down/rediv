import asyncio
import time
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from api.generation_common import fingerprint_generation_request, map_generation_error, resolve_cinematic_generation_handoff
from controllers import generation_transactions as generation_controller
from controllers import canvas_documents as document_controller
from controllers.store import store
from controllers.canvases import CanvasDomainError
from api.canvases import map_canvas_domain_error
from core.agnes_contract import TEXT_CONTRACT
from core.agnes_image_reference import AgnesImageReferenceError, resolve_agnes_public_image_url
from core.generation_provider import GenerationProvider, get_generation_provider
from core.generation_results import (
    ProviderResultError,
    extract_text_content,
    validate_optional_provider_identifier,
)
from core.generation_task_utils import (
    elapsed_ms,
    error_code_for_exception,
    extract_provider_request_id,
    provider_error_message,
    provider_failure_detail,
    provider_failure_http_status,
    provider_request_id_for_exception,
    safe_retry_after_seconds,
    sanitize_error_message,
    status_for_error_code,
)
from core.security import current_user
from core.script_authoring_contract import (
    ScriptAuthoringOutputError,
    build_script_authoring_messages,
    script_authoring_snapshot,
    validate_script_authoring_output,
)
from schemas.generation import TextGenerateRequest, TextGenerateResponse
from schemas.shot_schema import CinematicShotSchemaDocument


MODEL_NAME = TEXT_CONTRACT.model

router = APIRouter(prefix="/api", tags=["text-generate"])


def _script_authoring_lineage(snapshot: dict, *, task_id: str) -> dict:
    return {
        "contract_version": 1,
        "intent": snapshot["intent"],
        "locale": snapshot["locale"],
        "source_node_id": snapshot["source_node_id"],
        "source_task_id": task_id,
        "source_model": MODEL_NAME,
        "canvas_revision": snapshot["canvas_revision"],
    }


def _resolve_script_authoring_snapshot(payload: TextGenerateRequest, user_id: str) -> dict | None:
    if payload.intent == "freeform":
        return None
    try:
        document = document_controller.get_document(
            payload.project_id,
            payload.origin_canvas_id,
            user_id,
        )
    except CanvasDomainError as error:
        raise map_canvas_domain_error(error) from error
    source = next((node for node in document["nodes"] if node["id"] == payload.canvas_node_id), None)
    content = source.get("content") if isinstance(source, dict) else None
    if (
        not isinstance(content, dict)
        or source["node_type"] != "script"
        or source["is_locked"]
        or source["parent_node_id"] is not None
        or content.get("subtype") != "script"
        or content.get("serialization_version") != 1
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "script_source_unavailable", "message": "Script source is no longer eligible"},
        )
    current_text = content.get("text", "")
    if not isinstance(current_text, str):
        current_text = ""
    if document["revision"] != payload.canvas_revision or (
        payload.intent == "script_refine" and current_text.strip() != payload.source_text
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "script_source_stale", "message": "Script source changed before submission"},
        )
    return script_authoring_snapshot(
        intent=payload.intent,
        locale=payload.locale,
        source_node_id=payload.canvas_node_id,
        canvas_revision=payload.canvas_revision,
        brief=payload.brief,
        source_text=payload.source_text,
        instruction=payload.instruction,
        reference_asset_ids=payload.reference_asset_ids,
    )


def _resolve_script_reference_image_urls(payload: TextGenerateRequest, user_id: str) -> list[str]:
    image_urls: list[str] = []
    for asset_id in payload.reference_asset_ids:
        asset = store.get_asset(asset_id)
        if (
            not asset or asset["user_id"] != user_id or asset["project_id"] != payload.project_id or
            asset["status"] != "active"
        ):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"code": "script_reference_unavailable", "message": "附加素材已失效或不属于当前项目。"},
            )
        if asset["type"] != "image" or not isinstance(asset["url"], str):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"code": "script_reference_unsupported", "message": "脚本写作附件目前仅支持可公开访问的图片。"},
            )
        try:
            image_urls.append(resolve_agnes_public_image_url(asset["url"]))
        except AgnesImageReferenceError as error:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"code": "script_reference_unavailable", "message": "附加图片必须是可公开访问的 HTTPS 地址。"},
            ) from error
    return image_urls


@router.post("/text-generate", response_model=TextGenerateResponse)
async def text_generate(
    payload: TextGenerateRequest,
    user=Depends(current_user),
    provider: GenerationProvider = Depends(get_generation_provider),
):
    authoring_snapshot = _resolve_script_authoring_snapshot(payload, user["id"])
    script_reference_image_urls = (
        _resolve_script_reference_image_urls(payload, user["id"])
        if authoring_snapshot else []
    )
    cinematic_handoff = resolve_cinematic_generation_handoff(
        payload.cinematic_handoff,
        user_id=user["id"],
        project_id=payload.project_id,
        canvas_id=payload.origin_canvas_id,
        media_type="script",
        provider_id="agnes",
        model_id=MODEL_NAME,
        prompt=payload.prompt,
        image_ids=[],
        expected_control_parameters=(
            {
                key: value
                for key, value in payload.cinematic_handoff.generation_parameters.items()
                if key != "image_ids"
            }
            if payload.cinematic_handoff else {}
        ),
    )
    try:
        request_parameters = (
            {"cinematic_skill": cinematic_handoff["request_snapshot"]}
            if cinematic_handoff else {"script_authoring": authoring_snapshot} if authoring_snapshot else None
        )
        start = generation_controller.start_generation_request(
            user_id=user["id"],
            media_type="text",
            provider="agnes",
            model=MODEL_NAME,
            project_id=payload.project_id,
            origin_canvas_id=payload.origin_canvas_id,
            canvas_node_id=payload.canvas_node_id,
            request_parameters=request_parameters,
            client_request_id=str(payload.client_request_id or uuid4()),
            request_fingerprint=fingerprint_generation_request(
                media_type="text",
                user_id=user["id"],
                project_id=payload.project_id,
                origin_canvas_id=payload.origin_canvas_id,
                canvas_node_id=payload.canvas_node_id,
                provider="agnes",
                model=MODEL_NAME,
                prompt=payload.prompt,
                image_ids=None,
                request_parameters=request_parameters,
                cinematic_handoff=payload.cinematic_handoff,
            ),
        )
    except generation_controller.GenerationTransactionError as error:
        raise map_generation_error(error) from error
    if start.is_replay:
        replay_lineage = (
            _script_authoring_lineage(authoring_snapshot, task_id=start.replay_outcome["generation_task"]["id"])
            if authoring_snapshot else None
        )
        return {
            "content": start.replay_outcome["asset"]["content_text"],
            "script_authoring": replay_lineage,
            **start.replay_outcome,
        }
    task = start.task
    started_at = time.perf_counter()
    provider_request_id: str | None = None

    try:
        messages = (
            build_script_authoring_messages(
                intent=payload.intent,
                locale=payload.locale,
                brief=payload.brief,
                source_text=payload.source_text,
                instruction=payload.instruction,
                image_urls=script_reference_image_urls,
            )
            if authoring_snapshot else [{"role": "user", "content": payload.prompt}]
        )
        response = await provider.chat(
            model=MODEL_NAME,
            messages=messages,
        )
        generated_text = extract_text_content(response)
        if authoring_snapshot:
            generated_text = validate_script_authoring_output(generated_text)
        if payload.cinematic_handoff:
            shot_document = CinematicShotSchemaDocument.model_validate_json(generated_text)
            reference_revisions = {
                reference["source_revision"]
                for reference in payload.cinematic_handoff.submitted_preflight["references"]
            }
            if (
                shot_document.source_script_node_id != payload.canvas_node_id
                or shot_document.source_revision not in reference_revisions
            ):
                raise ProviderResultError("Provider returned a shot document for the wrong script source")
            generated_text = shot_document.model_dump_json()
        provider_request_id = validate_optional_provider_identifier(
            extract_provider_request_id(response, "id", "request_id")
        )
    except asyncio.CancelledError:
        generation_controller.fail_generation_task(
            task["id"],
            status="failed",
            duration_ms=elapsed_ms(started_at),
            provider_request_id=provider_request_id,
            error_code="request_cancelled",
            error_message="Text generation request was cancelled",
        )
        raise
    except Exception as exc:
        provider_request_id = provider_request_id_for_exception(exc) or provider_request_id
        error_code = (
            "provider_result_invalid"
            if isinstance(exc, ProviderResultError | ScriptAuthoringOutputError)
            else error_code_for_exception(exc)
        )
        generation_controller.fail_generation_task(
            task["id"],
            status=status_for_error_code(error_code),
            duration_ms=elapsed_ms(started_at),
            provider_request_id=provider_request_id,
            error_code=error_code,
            error_message=provider_error_message(exc),
        )
        if isinstance(exc, HTTPException):
            raise
        retry_after = safe_retry_after_seconds(exc)
        raise HTTPException(
            status_code=provider_failure_http_status(error_code),
            detail=provider_failure_detail(exc, "text"),
            headers={"Retry-After": str(retry_after)} if retry_after is not None else None,
        ) from exc

    try:
        result = generation_controller.complete_generation_task(
            task["id"],
            asset_type="prompt",
            url=None,
            content_text=generated_text,
            source_model=MODEL_NAME,
            duration_ms=elapsed_ms(started_at),
            provider_request_id=provider_request_id,
        )
    except generation_controller.GenerationPersistenceError as error:
        generation_controller.fail_generation_task(
            task["id"],
            status="failed",
            duration_ms=elapsed_ms(started_at),
            provider_request_id=provider_request_id,
            error_code="asset_persistence_error",
            error_message=sanitize_error_message(error.__cause__ or error),
        )
        raise map_generation_error(error) from error
    except generation_controller.GenerationTransactionError as error:
        raise map_generation_error(error) from error
    return {
        "content": generated_text,
        "script_authoring": (
            _script_authoring_lineage(authoring_snapshot, task_id=task["id"])
            if authoring_snapshot else None
        ),
        **result,
    }
