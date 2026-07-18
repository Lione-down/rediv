import asyncio
import time
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from api.generation_common import fingerprint_generation_request, map_generation_error, resolve_cinematic_generation_handoff
from controllers import generation_transactions as generation_controller
from core.generation_provider import GenerationProvider, get_generation_provider
from core.generation_parameter_contract import IMAGE_MODEL, normalize_image_parameters
from core.image_generation_recipes import resolve_image_generation_recipe
from core.generation_results import (
    ProviderResultError,
    extract_image_url,
    validate_optional_provider_identifier,
)
from core.generation_task_utils import (
    elapsed_ms,
    error_code_for_exception,
    extract_provider_request_id,
    provider_failure_http_status,
    safe_retry_after_seconds,
    sanitize_error_message,
    status_for_error_code,
)
from core.security import current_user
from schemas.generation import ImageGenerateRequest, ImageGenerateResponse


MODEL_NAME = IMAGE_MODEL

router = APIRouter(prefix="/api", tags=["image-generate"])


@router.post("/image-generate", response_model=ImageGenerateResponse)
async def image_generate(
    payload: ImageGenerateRequest,
    user=Depends(current_user),
    provider: GenerationProvider = Depends(get_generation_provider),
):
    recipe = (
        resolve_image_generation_recipe(payload.generation_recipe_id, payload.generation_recipe_version)
        if payload.generation_recipe_id else None
    )
    normalized_parameters = normalize_image_parameters(
        aspect_ratio=payload.aspect_ratio,
        image_ids=payload.image_ids,
        recipe_id=recipe.id if recipe else None,
        recipe_version=recipe.version if recipe else None,
        recipe_size=recipe.output_size if recipe else None,
        shot_controls=payload.shot_controls,
    )
    if payload.cinematic_handoff and (recipe or payload.image_operation):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cinematic Skill does not wrap recipes or image operations",
        )
    cinematic_handoff = resolve_cinematic_generation_handoff(
        payload.cinematic_handoff,
        user_id=user["id"],
        project_id=payload.project_id,
        canvas_id=payload.origin_canvas_id,
        media_type="image",
        provider_id="agnes",
        model_id=MODEL_NAME,
        prompt=payload.prompt,
        image_ids=payload.image_ids,
        expected_control_parameters={
            "aspect_ratio": normalized_parameters.request_parameters["aspect_ratio"],
            **(
                {"shot_controls": normalized_parameters.request_parameters["shot_controls"]}
                if "shot_controls" in normalized_parameters.request_parameters else {}
            ),
        },
    )
    request_parameters = dict(normalized_parameters.request_parameters)
    if cinematic_handoff:
        request_parameters["cinematic_skill"] = cinematic_handoff["request_snapshot"]
    try:
        start = generation_controller.start_image_generation_request(
            user_id=user["id"],
            provider="agnes",
            model=MODEL_NAME,
            project_id=payload.project_id,
            origin_canvas_id=payload.origin_canvas_id,
            canvas_node_id=payload.canvas_node_id,
            image_ids=payload.image_ids,
            request_parameters=request_parameters,
            client_request_id=str(payload.client_request_id or uuid4()),
            request_fingerprint=fingerprint_generation_request(
                media_type="image",
                user_id=user["id"],
                project_id=payload.project_id,
                origin_canvas_id=payload.origin_canvas_id,
                canvas_node_id=payload.canvas_node_id,
                provider="agnes",
                model=MODEL_NAME,
                prompt=recipe.prompt if recipe else payload.prompt,
                image_ids=payload.image_ids,
                request_parameters=request_parameters,
                cinematic_handoff=payload.cinematic_handoff,
            ),
        )
    except generation_controller.GenerationTransactionError as error:
        raise map_generation_error(error) from error
    if start.is_replay:
        return {"url": start.replay_outcome["asset"]["url"], **start.replay_outcome}
    task, input_images = start.task, start.input_image_urls
    started_at = time.perf_counter()
    provider_request_id: str | None = None

    try:
        generation_controller.update_generation_task_state(
            task["id"], status="running", progress_stage="provider"
        )
        provider_parameters = {"size": normalized_parameters.provider_size}
        if normalized_parameters.provider_ratio is not None:
            provider_parameters["ratio"] = normalized_parameters.provider_ratio
        response = await provider.generate_image(
            model=MODEL_NAME,
            prompt=recipe.prompt if recipe else payload.prompt,
            image=input_images,
            **provider_parameters,
        )
        image_url = extract_image_url(response)
        provider_request_id = validate_optional_provider_identifier(
            extract_provider_request_id(response, "id", "request_id")
        )
        generation_controller.update_generation_task_state(
            task["id"], progress_stage="persisting"
        )
    except asyncio.CancelledError:
        generation_controller.fail_generation_task(
            task["id"],
            status="failed",
            duration_ms=elapsed_ms(started_at),
            provider_request_id=provider_request_id,
            error_code="request_cancelled",
            error_message="Image generation request was cancelled",
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
        retry_after = safe_retry_after_seconds(exc)
        raise HTTPException(
            status_code=provider_failure_http_status(error_code),
            detail="Agnes image generation failed",
            headers={"Retry-After": str(retry_after)} if retry_after is not None else None,
        ) from exc

    try:
        result = generation_controller.complete_generation_task(
            task["id"],
            asset_type="image",
            url=image_url,
            content_text=None,
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
    return {"url": image_url, **result}
