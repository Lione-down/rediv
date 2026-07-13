from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from models.asset import Asset
from models.base import get_session
from models.canvas import Canvas
from models.project import Project


class AssetQueryError(Exception):
    pass


class AssetProjectNotFoundError(AssetQueryError):
    pass


class AssetOriginNotFoundError(AssetQueryError):
    pass


class AssetQueryForbiddenError(AssetQueryError):
    pass


def _datetime_to_iso(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.isoformat()


def _asset_to_dict(asset: Asset) -> dict:
    return {
        "id": asset.id,
        "user_id": asset.user_id,
        "project_id": asset.project_id,
        "origin_canvas_id": asset.origin_canvas_id,
        "canvas_node_id": asset.canvas_node_id,
        "type": asset.type,
        "url": asset.url,
        "content_text": asset.content_text,
        "source": asset.source,
        "source_model": asset.source_model,
        "source_task_id": asset.source_task_id,
        "status": asset.status,
        "created_at": _datetime_to_iso(asset.created_at),
        "updated_at": _datetime_to_iso(asset.updated_at),
    }


def _validate_scope(
    session: Session,
    *,
    user_id: str,
    project_id: str | None,
    origin_canvas_id: str | None,
) -> None:
    if project_id is not None:
        project = session.scalar(select(Project).where(Project.id == project_id))
        if project is None:
            raise AssetProjectNotFoundError("Project not found")
        if project.user_id != user_id:
            raise AssetQueryForbiddenError("Project does not belong to user")

    if origin_canvas_id is None:
        return

    origin_canvas = session.scalar(select(Canvas).where(Canvas.id == origin_canvas_id))
    if origin_canvas is None:
        raise AssetOriginNotFoundError("Origin canvas not found")

    origin_project = session.scalar(select(Project).where(Project.id == origin_canvas.project_id))
    if origin_project is None:
        raise AssetOriginNotFoundError("Origin canvas not found")
    if origin_project.user_id != user_id:
        raise AssetQueryForbiddenError("Origin canvas does not belong to user")
    if project_id is not None and origin_canvas.project_id != project_id:
        raise AssetQueryForbiddenError("Origin canvas does not belong to project")


def list_assets(
    user_id: str,
    *,
    asset_type: str | None,
    project_id: str | None,
    origin_canvas_id: str | None,
    page: int,
    page_size: int,
) -> tuple[list[dict], int]:
    with get_session() as session:
        _validate_scope(
            session,
            user_id=user_id,
            project_id=project_id,
            origin_canvas_id=origin_canvas_id,
        )

        filters = [Asset.user_id == user_id, Asset.status == "active"]
        if asset_type is not None:
            filters.append(Asset.type == asset_type)
        if project_id is not None:
            filters.append(Asset.project_id == project_id)
        if origin_canvas_id is not None:
            filters.append(Asset.origin_canvas_id == origin_canvas_id)

        total = session.scalar(select(func.count()).select_from(Asset).where(*filters)) or 0
        statement = (
            select(Asset)
            .where(*filters)
            .order_by(Asset.created_at.desc(), Asset.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        items = [_asset_to_dict(asset) for asset in session.scalars(statement).all()]
        return items, total
