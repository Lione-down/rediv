import asyncio
import time

from fastapi import APIRouter, Depends, HTTPException, status

from api.generation_common import map_generation_error, resolve_cinematic_generation_handoff
from controllers import generation_transactions as generation_controller
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
    sanitize_error_message,
    status_for_error_code,
)
from core.security import current_user
from schemas.generation import TextGenerateRequest, TextGenerateResponse
from schemas.shot_schema import CinematicShotSchemaDocument


MODEL_NAME = "agnes-2.0-flash"

router = APIRouter(prefix="/api", tags=["text-generate"])


@router.post("/text-generate", response_model=TextGenerateResponse)
async def text_generate(
    payload: TextGenerateRequest,
    user=Depends(current_user),
    provider: GenerationProvider = Depends(get_generation_provider),
):
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
        task = generation_controller.start_generation_task(
            user_id=user["id"],
            media_type="text",
            provider="agnes",
            model=MODEL_NAME,
            project_id=payload.project_id,
            origin_canvas_id=payload.origin_canvas_id,
            canvas_node_id=payload.canvas_node_id,
            request_parameters=(
                {"cinematic_skill": cinematic_handoff["request_snapshot"]}
                if cinematic_handoff else None
            ),
        )
    except generation_controller.GenerationTransactionError as error:
        raise map_generation_error(error) from error
    started_at = time.perf_counter()
    provider_request_id: str | None = None

    try:
        response = await provider.chat(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": payload.prompt}],
        )
        generated_text = extract_text_content(response)
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
        error_code = (
            "provider_result_invalid"
            if isinstance(exc, ProviderResultError)
            else error_code_for_exception(exc)
        )
        generation_controller.fail_generation_task(
            task["id"],
            status=status_for_error_code(error_code),
            duration_ms=elapsed_ms(started_at),
            provider_request_id=provider_request_id,
            error_code=error_code,
            error_message=sanitize_error_message(exc),
        )
        if isinstance(exc, HTTPException):
            raise
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Agnes text generation failed") from exc

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
    return {"content": generated_text, **result}
