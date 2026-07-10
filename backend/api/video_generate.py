import asyncio
import sys
import time

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from controllers.store import store
from core.agnes_provider import normalize_provider_status
from core.generation_task_utils import (
    elapsed_ms,
    error_code_for_exception,
    extract_provider_request_id,
    sanitize_error_message,
    status_for_error_code,
)
from core.security import current_user


MODEL_NAME = "agnes-video-v2.0"
POLL_INTERVAL_SECONDS = 5
MAX_POLL_ATTEMPTS = 120

router = APIRouter(prefix="/api", tags=["video-generate"])


class VideoGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1)


def _get_agnes():
    # `main` imports `api.router`, so importing `main` here would create a circular import.
    main_module = sys.modules.get("main") or sys.modules.get("backend.main")
    if main_module is None or not hasattr(main_module, "get_agnes"):
        raise RuntimeError("Agnes provider is unavailable")
    return main_module.get_agnes()


def _extract_video_id(response: dict) -> str:
    video_id = response.get("video_id")
    if isinstance(video_id, str) and video_id:
        return video_id

    data = response.get("data")
    if isinstance(data, dict):
        nested_video_id = data.get("video_id")
        if isinstance(nested_video_id, str) and nested_video_id:
            return nested_video_id

    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Agnes video generation failed")


def _extract_video_url(response: dict) -> str | None:
    video_url = response.get("video_url")
    if isinstance(video_url, str) and video_url:
        return video_url

    data = response.get("data")
    if isinstance(data, dict):
        nested_video_url = data.get("video_url")
        if isinstance(nested_video_url, str) and nested_video_url:
            return nested_video_url

    return None


async def _poll_video_url(video_id: str, generation_task_id: str, started_at: float) -> str:
    for attempt in range(MAX_POLL_ATTEMPTS):
        try:
            response = await _get_agnes().poll_video_result(video_id)
        except Exception as exc:
            error_code = error_code_for_exception(exc)
            store.update_generation_task(
                generation_task_id,
                status=status_for_error_code(error_code),
                duration_ms=elapsed_ms(started_at),
                provider_request_id=video_id,
                error_code=error_code,
                error_message=sanitize_error_message(exc),
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Agnes video generation failed",
            ) from exc

        poll_status = response.get("status")
        normalized_status = normalize_provider_status(poll_status if isinstance(poll_status, str) else None)
        if normalized_status == "succeeded":
            video_url = _extract_video_url(response)
            if video_url is None:
                store.update_generation_task(
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
            return video_url
        if normalized_status == "failed":
            store.update_generation_task(
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
        store.update_generation_task(
            generation_task_id,
            status=normalized_status,
            duration_ms=elapsed_ms(started_at),
            provider_request_id=video_id,
        )

        if attempt < MAX_POLL_ATTEMPTS - 1:
            await asyncio.sleep(POLL_INTERVAL_SECONDS)

    store.update_generation_task(
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


@router.post("/video-generate")
async def video_generate(payload: VideoGenerateRequest, user=Depends(current_user)):
    quotas = store.quotas.get(user["id"], {"text": 0, "image": 0, "video": 0})
    if quotas.get("video", 0) < 1:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient video quota")

    started_at = time.perf_counter()
    task = store.create_generation_task(
        user["id"],
        "video",
        "agnes",
        MODEL_NAME,
        status="queued",
    )
    store.update_generation_task(task["id"], status="running")
    provider_request_id: str | None = None

    try:
        create_response = await _get_agnes().generate_video(
            model=MODEL_NAME,
            prompt=payload.prompt,
        )
        provider_request_id = extract_provider_request_id(create_response, "video_id", "task_id", "id")
        video_id = _extract_video_id(create_response)
        provider_request_id = video_id
        store.update_generation_task(task["id"], status="running", provider_request_id=provider_request_id)
        video_url = await _poll_video_url(video_id, task["id"], started_at)
    except HTTPException as exc:
        current_task = store.get_generation_task(task["id"])
        if current_task is None or current_task.get("error_code") is None:
            detail = str(exc.detail)
            error_code = "timeout" if "timed out" in detail else "provider_error"
            store.update_generation_task(
                task["id"],
                status=status_for_error_code(error_code),
                duration_ms=elapsed_ms(started_at),
                provider_request_id=provider_request_id,
                error_code=error_code,
                error_message=sanitize_error_message(detail),
            )
        raise
    except Exception as exc:
        error_code = error_code_for_exception(exc)
        store.update_generation_task(
            task["id"],
            status=status_for_error_code(error_code),
            duration_ms=elapsed_ms(started_at),
            provider_request_id=provider_request_id,
            error_code=error_code,
            error_message=sanitize_error_message(exc),
        )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Agnes video generation failed") from exc

    store.grant_quota(user["id"], "video", -1, "video_generate", None)
    try:
        asset = store.create_asset(
            user["id"],
            "video",
            video_url,
            None,
            source="generation",
            source_model=MODEL_NAME,
            source_task_id=video_id,
        )
    except Exception as exc:
        store.grant_quota(user["id"], "video", 1, "video_generate_refund", None)
        store.update_generation_task(
            task["id"],
            status="failed",
            duration_ms=elapsed_ms(started_at),
            provider_request_id=provider_request_id,
            error_code="asset_persistence_error",
            error_message=sanitize_error_message(exc),
        )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save generated asset") from exc

    task = store.update_generation_task(
        task["id"],
        status="succeeded",
        duration_ms=elapsed_ms(started_at),
        provider_request_id=provider_request_id,
        result_asset_id=asset["id"],
    )
    return {"video_id": video_id, "url": video_url, "asset": asset, "generation_task": task}
