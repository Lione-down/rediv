import asyncio
import time
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from api.generation_common import fingerprint_generation_request, map_generation_error, resolve_cinematic_generation_handoff
from controllers import generation_transactions as generation_controller
from core.agnes_provider import extract_provider_progress_percent, normalize_provider_status
from core.generation_provider import GenerationProvider, get_generation_provider
from core.generation_parameter_contract import VIDEO_MODEL, normalize_video_parameters
from core.generation_results import (
    ProviderResultError,
    validate_https_url,
    validate_provider_identifier,
)
from core.generation_task_utils import (
    elapsed_ms,
    error_code_for_exception,
    provider_error_message,
    provider_failure_detail,
    provider_failure_http_status,
    provider_request_id_for_exception,
    safe_retry_after_seconds,
    sanitize_error_message,
    status_for_error_code,
)
from core.security import current_user
from schemas.generation import VideoGenerateRequest, VideoGenerateResponse


MODEL_NAME = VIDEO_MODEL
POLL_INTERVAL_SECONDS = 5
MAX_POLL_ATTEMPTS = 120

router = APIRouter(prefix="/api", tags=["video-generate"])


def _extract_video_id(response: object) -> str:
    if not isinstance(response, dict):
        raise ProviderResultError("Provider returned invalid video task data")
    video_id = response.get("video_id")
    if isinstance(video_id, str) and video_id:
        return validate_provider_identifier(video_id)

    data = response.get("data")
    if isinstance(data, dict):
        nested_video_id = data.get("video_id")
        if isinstance(nested_video_id, str) and nested_video_id:
            return validate_provider_identifier(nested_video_id)

    raise ProviderResultError("Provider returned invalid video task identifier")


def _extract_video_url(response: object) -> str | None:
    if not isinstance(response, dict):
        raise ProviderResultError("Provider returned invalid video result data")
    for field in ("url", "video_url"):
        video_url = response.get(field)
        if isinstance(video_url, str) and video_url:
            return validate_https_url(video_url, media_type="video")

    data = response.get("data")
    if isinstance(data, dict):
        nested_video_url = data.get("video_url")
        if isinstance(nested_video_url, str) and nested_video_url:
            return validate_https_url(nested_video_url, media_type="video")

    return None


async def _poll_video_url(
    provider: GenerationProvider,
    video_id: str,
    generation_task_id: str,
    started_at: float,
) -> str:
    for attempt in range(MAX_POLL_ATTEMPTS):
        try:
            response = await provider.poll_video_result(video_id)
        except asyncio.CancelledError:
            generation_controller.fail_generation_task(
                generation_task_id,
                status="failed",
                duration_ms=elapsed_ms(started_at),
                provider_request_id=video_id,
                error_code="request_cancelled",
                error_message="Video generation request was cancelled",
            )
            raise
        except Exception as exc:
            provider_request_id = provider_request_id_for_exception(exc) or video_id
            error_code = error_code_for_exception(exc)
            generation_controller.fail_generation_task(
                generation_task_id,
                status=status_for_error_code(error_code),
                duration_ms=elapsed_ms(started_at),
                provider_request_id=provider_request_id,
                error_code=error_code,
                error_message=provider_error_message(exc),
            )
            retry_after = safe_retry_after_seconds(exc)
            raise HTTPException(
                status_code=provider_failure_http_status(error_code),
                detail=provider_failure_detail(exc, "video"),
                headers={"Retry-After": str(retry_after)} if retry_after is not None else None,
            ) from exc

        poll_status = response.get("status")
        normalized_status = normalize_provider_status(poll_status if isinstance(poll_status, str) else None)
        progress_percent = extract_provider_progress_percent(response)
        if progress_percent is not None:
            generation_controller.update_generation_task_state(
                generation_task_id,
                progress_percent=progress_percent,
            )
        if normalized_status == "succeeded":
            video_url = _extract_video_url(response)
            if video_url is None:
                generation_controller.fail_generation_task(
                    generation_task_id,
                    status="failed",
                    duration_ms=elapsed_ms(started_at),
                    provider_request_id=video_id,
                    error_code="provider_result_missing",
                    error_message="Provider completed without a video URL",
                )
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Agnes video generation failed",
                )
            generation_controller.update_generation_task_state(
                generation_task_id,
                progress_stage="persisting",
                duration_ms=elapsed_ms(started_at),
                provider_request_id=video_id,
            )
            return video_url
        if normalized_status == "failed":
            generation_controller.fail_generation_task(
                generation_task_id,
                status="failed",
                duration_ms=elapsed_ms(started_at),
                provider_request_id=video_id,
                error_code="provider_failed",
                error_message=sanitize_error_message(response.get("error") or response.get("message") or "Provider reported failure"),
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Agnes video generation failed",
            )
        generation_controller.update_generation_task_state(
            generation_task_id,
            status=normalized_status,
            duration_ms=elapsed_ms(started_at),
            provider_request_id=video_id,
        )

        if attempt < MAX_POLL_ATTEMPTS - 1:
            try:
                await asyncio.sleep(POLL_INTERVAL_SECONDS)
            except asyncio.CancelledError:
                generation_controller.fail_generation_task(
                    generation_task_id,
                    status="failed",
                    duration_ms=elapsed_ms(started_at),
                    provider_request_id=video_id,
                    error_code="request_cancelled",
                    error_message="Video generation request was cancelled",
                )
                raise

    generation_controller.fail_generation_task(
        generation_task_id,
        status="timed_out",
        duration_ms=elapsed_ms(started_at),
        provider_request_id=video_id,
        error_code="timeout",
        error_message="Agnes video generation timed out",
    )
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Agnes video generation timed out",
    )


@router.post("/video-generate", response_model=VideoGenerateResponse)
async def video_generate(
    payload: VideoGenerateRequest,
    user=Depends(current_user),
    provider: GenerationProvider = Depends(get_generation_provider),
):
    normalized_parameters = normalize_video_parameters(
        reference_mode=payload.reference_mode,
        duration_seconds=payload.duration_seconds,
        image_ids=payload.image_ids,
        shot_controls=payload.shot_controls,
    )
    cinematic_handoff = resolve_cinematic_generation_handoff(
        payload.cinematic_handoff,
        user_id=user["id"],
        project_id=payload.project_id,
        canvas_id=payload.origin_canvas_id,
        media_type="video",
        provider_id="agnes",
        model_id=MODEL_NAME,
        prompt=payload.prompt,
        image_ids=payload.image_ids,
        expected_control_parameters={
            "reference_mode": normalized_parameters.reference_mode,
            "duration_seconds": normalized_parameters.duration_seconds,
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
        start = generation_controller.start_video_generation_request(
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
                media_type="video",
                user_id=user["id"],
                project_id=payload.project_id,
                origin_canvas_id=payload.origin_canvas_id,
                canvas_node_id=payload.canvas_node_id,
                provider="agnes",
                model=MODEL_NAME,
                prompt=payload.prompt,
                image_ids=payload.image_ids,
                request_parameters=request_parameters,
                cinematic_handoff=payload.cinematic_handoff,
            ),
        )
    except generation_controller.GenerationTransactionError as error:
        raise map_generation_error(error) from error
    if start.is_replay:
        return {
            "video_id": start.task["provider_request_id"],
            "url": start.replay_outcome["asset"]["url"],
            **start.replay_outcome,
        }
    task, input_images = start.task, start.input_image_urls
    started_at = time.perf_counter()
    provider_request_id: str | None = None

    try:
        generation_controller.update_generation_task_state(
            task["id"], status="running", progress_stage="provider"
        )
        generation_options = {
            "width": normalized_parameters.width,
            "height": normalized_parameters.height,
            "num_frames": normalized_parameters.num_frames,
            "frame_rate": normalized_parameters.frame_rate,
        }
        if normalized_parameters.reference_mode == "image-to-video" and input_images:
            generation_options = {"image": input_images[0], "mode": "img2vid"}
            generation_options.update({
                "width": normalized_parameters.width,
                "height": normalized_parameters.height,
                "num_frames": normalized_parameters.num_frames,
                "frame_rate": normalized_parameters.frame_rate,
            })
        elif normalized_parameters.reference_mode == "keyframes" and input_images:
            generation_options.update({"extra_images": input_images, "mode": "keyframes"})
        create_response = await provider.generate_video(
            model=MODEL_NAME,
            prompt=payload.prompt,
            **generation_options,
        )
        video_id = _extract_video_id(create_response)
        provider_request_id = video_id
        generation_controller.update_generation_task_state(
            task["id"], status="running", provider_request_id=provider_request_id
        )
        video_url = await _poll_video_url(provider, video_id, task["id"], started_at)
    except asyncio.CancelledError:
        generation_controller.fail_generation_task(
            task["id"],
            status="failed",
            duration_ms=elapsed_ms(started_at),
            provider_request_id=provider_request_id,
            error_code="request_cancelled",
            error_message="Video generation request was cancelled",
        )
        raise
    except HTTPException as exc:
        detail = str(exc.detail)
        error_code = "timeout" if "timed out" in detail else "provider_error"
        generation_controller.fail_generation_task(
            task["id"],
            status=status_for_error_code(error_code),
            duration_ms=elapsed_ms(started_at),
            provider_request_id=provider_request_id,
            error_code=error_code,
            error_message=sanitize_error_message(detail),
        )
        raise
    except Exception as exc:
        provider_request_id = provider_request_id_for_exception(exc) or provider_request_id
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
            error_message=provider_error_message(exc),
        )
        retry_after = safe_retry_after_seconds(exc)
        raise HTTPException(
            status_code=provider_failure_http_status(error_code),
            detail=provider_failure_detail(exc, "video"),
            headers={"Retry-After": str(retry_after)} if retry_after is not None else None,
        ) from exc

    try:
        result = generation_controller.complete_generation_task(
            task["id"],
            asset_type="video",
            url=video_url,
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
    return {"video_id": video_id, "url": video_url, **result}
