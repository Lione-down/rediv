import asyncio
import sys

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from controllers.store import store
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


async def _poll_video_url(video_id: str) -> str:
    for attempt in range(MAX_POLL_ATTEMPTS):
        try:
            response = await _get_agnes().poll_video_result(video_id)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Agnes video generation failed",
            ) from exc

        poll_status = response.get("status")
        if poll_status == "completed":
            video_url = _extract_video_url(response)
            if video_url is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Agnes video generation failed",
                )
            return video_url
        if poll_status == "failed":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Agnes video generation failed",
            )

        if attempt < MAX_POLL_ATTEMPTS - 1:
            await asyncio.sleep(POLL_INTERVAL_SECONDS)

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Agnes video generation timed out",
    )


@router.post("/video-generate")
async def video_generate(payload: VideoGenerateRequest, user=Depends(current_user)):
    quotas = store.quotas.get(user["id"], {"text": 0, "image": 0, "video": 0})
    if quotas.get("video", 0) < 1:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient video quota")

    try:
        create_response = await _get_agnes().generate_video(
            model=MODEL_NAME,
            prompt=payload.prompt,
        )
        video_id = _extract_video_id(create_response)
        video_url = await _poll_video_url(video_id)
    except HTTPException:
        raise
    except Exception as exc:
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
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save generated asset") from exc

    return {"video_id": video_id, "url": video_url, "asset": asset}
