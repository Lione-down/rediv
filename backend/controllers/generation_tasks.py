from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import func, select

from models.base import get_session
from models.canvas import Canvas
from models.generation_task import GenerationTask
from models.project import Project


class GenerationTaskQueryError(Exception):
    pass


class GenerationTaskQueryNotFoundError(GenerationTaskQueryError):
    pass


class GenerationTaskQueryForbiddenError(GenerationTaskQueryError):
    pass


def _datetime_to_iso(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.isoformat()


def _task_to_dict(task: GenerationTask) -> dict:
    return {
        "id": task.id,
        "user_id": task.user_id,
        "project_id": task.project_id,
        "origin_canvas_id": task.origin_canvas_id,
        "canvas_node_id": task.canvas_node_id,
        "media_type": task.media_type,
        "provider": task.provider,
        "model": task.model,
        "provider_request_id": task.provider_request_id,
        "status": task.status,
        "duration_ms": task.duration_ms,
        "result_asset_id": task.result_asset_id,
        "error_code": task.error_code,
        "error_message": task.error_message,
        "created_at": _datetime_to_iso(task.created_at),
        "updated_at": _datetime_to_iso(task.updated_at),
    }


def _validate_scope(
    session,
    *,
    user_id: str,
    project_id: str | None,
    origin_canvas_id: str | None,
) -> None:
    if project_id is not None:
        project = session.get(Project, project_id)
        if project is None:
            raise GenerationTaskQueryNotFoundError("Project not found")
        if project.user_id != user_id:
            raise GenerationTaskQueryForbiddenError("Project does not belong to user")
    if origin_canvas_id is None:
        return
    canvas = session.get(Canvas, origin_canvas_id)
    if canvas is None:
        raise GenerationTaskQueryNotFoundError("Origin canvas not found")
    origin_project = session.get(Project, canvas.project_id)
    if origin_project is None:
        raise GenerationTaskQueryNotFoundError("Origin canvas not found")
    if origin_project.user_id != user_id:
        raise GenerationTaskQueryForbiddenError("Origin canvas does not belong to user")
    if project_id is not None and canvas.project_id != project_id:
        raise GenerationTaskQueryForbiddenError("Origin canvas does not belong to project")


def list_generation_tasks(
    user_id: str,
    *,
    project_id: str | None,
    origin_canvas_id: str | None,
    media_type: str | None,
    status: str | None,
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
        filters = [GenerationTask.user_id == user_id]
        if project_id is not None:
            filters.append(GenerationTask.project_id == project_id)
        if origin_canvas_id is not None:
            filters.append(GenerationTask.origin_canvas_id == origin_canvas_id)
        if media_type is not None:
            filters.append(GenerationTask.media_type == media_type)
        if status is not None:
            filters.append(GenerationTask.status == status)
        total = session.scalar(
            select(func.count()).select_from(GenerationTask).where(*filters)
        ) or 0
        statement = (
            select(GenerationTask)
            .where(*filters)
            .order_by(GenerationTask.created_at.desc(), GenerationTask.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        items = [_task_to_dict(task) for task in session.scalars(statement).all()]
    return items, total
