from fastapi import APIRouter, Depends

from controllers.store import store
from core.security import current_user
from schemas.asset import AssetCreateRequest


router = APIRouter(prefix="/assets", tags=["assets"])


@router.get("")
def list_assets(asset_type: str | None = None, user=Depends(current_user)):
    items = [asset for asset in store.assets.values() if asset["user_id"] == user["id"]]
    if asset_type:
        items = [asset for asset in items if asset["type"] == asset_type]
    return {"items": items}


@router.post("/upload")
def upload_asset(payload: AssetCreateRequest, user=Depends(current_user)):
    asset = store.create_asset(user["id"], payload.type, payload.url, payload.content_text)
    return asset
