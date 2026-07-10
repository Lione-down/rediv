import sys
import time

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from controllers.store import store
from core.generation_task_utils import (
    elapsed_ms,
    error_code_for_exception,
    extract_provider_request_id,
    sanitize_error_message,
    status_for_error_code,
)
from core.security import current_user


MODEL_NAME = "agnes-image-2.1-flash"

router = APIRouter(prefix="/api", tags=["image-generate"])


class ImageGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    image_ids: list[str] | None = None


def _get_agnes():
    # `main` imports `api.router`, so importing `main` here would create a circular import.
    main_module = sys.modules.get("main") or sys.modules.get("backend.main")
    if main_module is None or not hasattr(main_module, "get_agnes"):
        raise RuntimeError("Agnes provider is unavailable")
    return main_module.get_agnes()


def _resolve_input_images(image_ids: list[str] | None, user_id: str) -> list[str] | None:
    if not image_ids:
        return None

    urls: list[str] = []
    for image_id in image_ids:
        asset = store.get_asset(image_id)
        if asset is None or asset.get("status") != "active":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image asset not found")
        if asset["user_id"] != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        if asset["type"] != "image":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Asset must be an image")
        if not asset.get("url"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image asset URL is required")
        urls.append(asset["url"])
    return urls


@router.post("/image-generate")
async def image_generate(payload: ImageGenerateRequest, user=Depends(current_user)):
    quotas = store.quotas.get(user["id"], {"text": 0, "image": 0, "video": 0})
    if quotas.get("image", 0) < 1:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient image quota")

    input_images = _resolve_input_images(payload.image_ids, user["id"])

    started_at = time.perf_counter()
    task = store.create_generation_task(
        user["id"],
        "image",
        "agnes",
        MODEL_NAME,
        status="queued",
    )
    store.update_generation_task(task["id"], status="running")
    provider_request_id: str | None = None

    try:
        response = await _get_agnes().generate_image(
            model=MODEL_NAME,
            prompt=payload.prompt,
            image=input_images,
        )
        provider_request_id = extract_provider_request_id(response, "id", "request_id")
        image_url = response["data"][0]["url"]
    except HTTPException:
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
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Agnes image generation failed") from exc

    store.grant_quota(user["id"], "image", -1, "image_generate", None)
    try:
        asset = store.create_asset(
            user["id"],
            "image",
            image_url,
            None,
            source="generation",
            source_model=MODEL_NAME,
            source_task_id=task["id"],
        )
    except Exception as exc:
        store.grant_quota(user["id"], "image", 1, "image_generate_refund", None)
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
    return {"url": image_url, "asset": asset, "generation_task": task}
