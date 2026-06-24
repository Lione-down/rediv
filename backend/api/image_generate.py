import sys

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from controllers.store import store
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

    try:
        response = await _get_agnes().generate_image(
            model=MODEL_NAME,
            prompt=payload.prompt,
            image=input_images,
        )
        image_url = response["data"][0]["url"]
    except HTTPException:
        raise
    except Exception as exc:
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
        )
    except Exception as exc:
        store.grant_quota(user["id"], "image", 1, "image_generate_refund", None)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save generated asset") from exc

    return {"url": image_url, "asset": asset}
