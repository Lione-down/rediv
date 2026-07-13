from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, status

from controllers.store import now_iso, store
from core.security import current_user
from schemas.asset import AssetCreateRequest, AssetFromGenerationRequest, AssetListResponse
from settings.config import settings


router = APIRouter(prefix="/assets", tags=["assets"])


def _assert_asset_owner(asset: dict, user_id: str) -> dict:
    if asset["user_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    if asset["status"] != "active":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return asset


def _storage_upload_root() -> Path:
    return Path(settings.storage_local_root) / "uploads"


def _asset_scope_http_error(error: KeyError | PermissionError) -> HTTPException:
    status_code = status.HTTP_404_NOT_FOUND if isinstance(error, KeyError) else status.HTTP_403_FORBIDDEN
    return HTTPException(status_code=status_code, detail=str(error.args[0]))


@router.get("", response_model=AssetListResponse)
def list_assets(
    asset_type: str | None = None,
    project_id: str | None = None,
    origin_canvas_id: str | None = None,
    page: int = 1,
    page_size: int = 20,
    user=Depends(current_user),
):
    if page < 1 or page_size < 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid pagination")

    items, total = store.list_assets(
        user["id"],
        asset_type=asset_type,
        project_id=project_id,
        origin_canvas_id=origin_canvas_id,
        page=page,
        page_size=page_size,
    )
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("/upload")
async def upload_asset(
    request: Request,
    user=Depends(current_user),
):
    request_payload: AssetCreateRequest
    file = None
    saved_path: Path | None = None
    content_type = request.headers.get("content-type", "")
    if "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
        form = await request.form()
        asset_type = form.get("type")
        if not asset_type:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Missing asset type")
        request_payload = AssetCreateRequest(
            type=str(asset_type),
            url=str(form.get("url")) if form.get("url") is not None else None,
            content_text=str(form.get("content_text")) if form.get("content_text") is not None else None,
            project_id=str(form.get("project_id")) if form.get("project_id") is not None else None,
            origin_canvas_id=(
                str(form.get("origin_canvas_id")) if form.get("origin_canvas_id") is not None else None
            ),
        )
        maybe_file = form.get("file")
        if hasattr(maybe_file, "filename") and hasattr(maybe_file, "read"):
            file = maybe_file
    else:
        request_payload = AssetCreateRequest.model_validate(await request.json())

    asset_url = request_payload.url
    if file is not None:
        suffix = Path(file.filename or "").suffix
        filename = f"{uuid4()}{suffix}"
        user_dir = _storage_upload_root() / user["id"]
        user_dir.mkdir(parents=True, exist_ok=True)
        saved_path = user_dir / filename
        try:
            content = await file.read()
            saved_path.write_bytes(content)
            asset_url = f"/uploads/{user['id']}/{filename}"
        finally:
            await file.close()

    if asset_url is None and request_payload.content_text is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Asset content is required")

    try:
        asset = store.create_asset(
            user["id"],
            request_payload.type,
            asset_url,
            request_payload.content_text,
            project_id=request_payload.project_id,
            origin_canvas_id=request_payload.origin_canvas_id,
            source="upload",
        )
    except Exception as error:
        if saved_path is not None:
            saved_path.unlink(missing_ok=True)
        if isinstance(error, (KeyError, PermissionError)):
            raise _asset_scope_http_error(error) from error
        raise
    return asset


@router.post("/from_generation")
def from_generation(payload: AssetFromGenerationRequest, user=Depends(current_user)):
    try:
        asset = store.create_asset(
            user["id"],
            payload.type,
            payload.url,
            payload.content_text,
            project_id=payload.project_id,
            origin_canvas_id=payload.origin_canvas_id,
            canvas_node_id=payload.canvas_node_id,
            source="generation",
            source_model=payload.source_model,
            source_task_id=payload.source_task_id,
        )
    except (KeyError, PermissionError) as error:
        raise _asset_scope_http_error(error) from error
    return asset


@router.get("/{asset_id}")
def get_asset(asset_id: str, user=Depends(current_user)):
    asset = store.get_asset(asset_id)
    if asset is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return _assert_asset_owner(asset, user["id"])


@router.delete("/{asset_id}")
def delete_asset(asset_id: str, user=Depends(current_user)):
    asset = store.get_asset(asset_id)
    if asset is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    if asset["user_id"] != user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    deleted = store.delete_asset(asset_id, user["id"])
    if deleted is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    deleted["updated_at"] = deleted.get("updated_at") or now_iso()
    return deleted
