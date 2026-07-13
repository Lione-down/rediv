from __future__ import annotations

from copy import deepcopy
from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import select

from models.base import get_session
from models.canvas import Canvas
from models.canvas_connection import CanvasConnection
from models.canvas_node import CanvasNode
from models.project import Project


class CanvasDomainError(Exception):
    pass


class ProjectNotFoundError(CanvasDomainError):
    pass


class CanvasNotFoundError(CanvasDomainError):
    pass


class CanvasForbiddenError(CanvasDomainError):
    pass


class CanvasValidationError(CanvasDomainError):
    pass


class CanvasConflictError(CanvasDomainError):
    def __init__(self, code: str, current_order_revision: int) -> None:
        super().__init__(code)
        self.code = code
        self.current_order_revision = current_order_revision


def _now() -> datetime:
    return datetime.now(UTC)


def _datetime_to_iso(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.isoformat()


def _canvas_to_dict(canvas: Canvas) -> dict:
    return {
        "id": canvas.id,
        "project_id": canvas.project_id,
        "name": canvas.name,
        "sort_order": canvas.sort_order,
        "status": canvas.status,
        "viewport_x": canvas.viewport_x,
        "viewport_y": canvas.viewport_y,
        "viewport_zoom": float(canvas.viewport_zoom),
        "graph_revision": canvas.graph_revision,
        "created_at": _datetime_to_iso(canvas.created_at),
        "updated_at": _datetime_to_iso(canvas.updated_at),
        "deleted_at": _datetime_to_iso(canvas.deleted_at),
    }


def _owned_project(session, project_id: str, user_id: str, *, lock: bool = False) -> Project:
    statement = select(Project).where(Project.id == project_id)
    if lock:
        statement = statement.with_for_update()
    project = session.scalar(statement)
    if project is None:
        raise ProjectNotFoundError
    if project.user_id != user_id:
        raise CanvasForbiddenError
    return project


def _active_canvases(session, project_id: str, *, lock: bool = False) -> list[Canvas]:
    statement = (
        select(Canvas)
        .where(Canvas.project_id == project_id, Canvas.status == "active")
        .order_by(Canvas.sort_order, Canvas.created_at, Canvas.id)
    )
    if lock:
        statement = statement.with_for_update()
    return list(session.scalars(statement).all())


def _active_canvas(session, project_id: str, canvas_id: str, *, lock: bool = False) -> Canvas:
    statement = select(Canvas).where(
        Canvas.id == canvas_id,
        Canvas.project_id == project_id,
        Canvas.status == "active",
    )
    if lock:
        statement = statement.with_for_update()
    canvas = session.scalar(statement)
    if canvas is None:
        raise CanvasNotFoundError
    return canvas


def _check_revision(project: Project, base_order_revision: int) -> None:
    if project.canvas_order_revision != base_order_revision:
        raise CanvasConflictError("stale_order_revision", project.canvas_order_revision)


def list_canvases(project_id: str, user_id: str) -> dict:
    with get_session() as session:
        project = _owned_project(session, project_id, user_id)
        canvases = _active_canvases(session, project_id)
        return {
            "items": [_canvas_to_dict(canvas) for canvas in canvases],
            "order_revision": project.canvas_order_revision,
        }


def get_canvas(project_id: str, canvas_id: str, user_id: str) -> dict:
    with get_session() as session:
        _owned_project(session, project_id, user_id)
        return _canvas_to_dict(_active_canvas(session, project_id, canvas_id))


def create_canvas(project_id: str, user_id: str, name: str, base_order_revision: int) -> dict:
    with get_session() as session:
        project = _owned_project(session, project_id, user_id, lock=True)
        _check_revision(project, base_order_revision)
        canvases = _active_canvases(session, project_id, lock=True)
        timestamp = _now()
        canvas = Canvas(
            id=str(uuid4()),
            project_id=project_id,
            name=name,
            sort_order=len(canvases),
            status="active",
            viewport_x=0.0,
            viewport_y=0.0,
            viewport_zoom=1,
            graph_revision=0,
            created_at=timestamp,
            updated_at=timestamp,
            deleted_at=None,
        )
        project.canvas_order_revision += 1
        project.updated_at = timestamp
        session.add(canvas)
        session.commit()
        return {"item": _canvas_to_dict(canvas), "order_revision": project.canvas_order_revision}


def duplicate_canvas(
    project_id: str,
    canvas_id: str,
    user_id: str,
    base_order_revision: int,
    name: str | None,
) -> dict:
    with get_session() as session:
        project = _owned_project(session, project_id, user_id, lock=True)
        _check_revision(project, base_order_revision)
        canvases = _active_canvases(session, project_id, lock=True)
        source = next((canvas for canvas in canvases if canvas.id == canvas_id), None)
        if source is None:
            raise CanvasNotFoundError

        source_nodes = list(
            session.scalars(
                select(CanvasNode)
                .where(CanvasNode.project_id == project_id, CanvasNode.canvas_id == canvas_id)
                .order_by(CanvasNode.created_at, CanvasNode.id)
                .with_for_update()
            ).all()
        )
        source_connections = list(
            session.scalars(
                select(CanvasConnection)
                .where(
                    CanvasConnection.project_id == project_id,
                    CanvasConnection.canvas_id == canvas_id,
                )
                .order_by(CanvasConnection.created_at, CanvasConnection.id)
                .with_for_update()
            ).all()
        )

        timestamp = _now()
        duplicate = Canvas(
            id=str(uuid4()),
            project_id=project_id,
            name=name if name is not None else f"{source.name[:252]} 副本",
            sort_order=len(canvases),
            status="active",
            viewport_x=source.viewport_x,
            viewport_y=source.viewport_y,
            viewport_zoom=source.viewport_zoom,
            graph_revision=0,
            created_at=timestamp,
            updated_at=timestamp,
            deleted_at=None,
        )
        session.add(duplicate)
        session.flush()

        node_id_map = {node.id: str(uuid4()) for node in source_nodes}
        duplicated_nodes: dict[str, CanvasNode] = {}
        for source_node in source_nodes:
            duplicated_node = CanvasNode(
                id=node_id_map[source_node.id],
                project_id=project_id,
                canvas_id=duplicate.id,
                node_type=source_node.node_type,
                content=deepcopy(source_node.content),
                position_x=source_node.position_x,
                position_y=source_node.position_y,
                width=source_node.width,
                height=source_node.height,
                z_index=source_node.z_index,
                parent_node_id=None,
                is_locked=source_node.is_locked,
                is_collapsed=source_node.is_collapsed,
                status=source_node.status,
                created_at=timestamp,
                updated_at=timestamp,
            )
            duplicated_nodes[source_node.id] = duplicated_node
            session.add(duplicated_node)
        session.flush()

        for source_node in source_nodes:
            if source_node.parent_node_id is not None:
                duplicated_nodes[source_node.id].parent_node_id = node_id_map[source_node.parent_node_id]

        for source_connection in source_connections:
            session.add(
                CanvasConnection(
                    id=str(uuid4()),
                    project_id=project_id,
                    canvas_id=duplicate.id,
                    source_node_id=node_id_map[source_connection.source_node_id],
                    source_port=source_connection.source_port,
                    target_node_id=node_id_map[source_connection.target_node_id],
                    target_port=source_connection.target_port,
                    status=source_connection.status,
                    metadata_=deepcopy(source_connection.metadata_),
                    created_at=timestamp,
                    updated_at=timestamp,
                )
            )

        project.canvas_order_revision += 1
        project.updated_at = timestamp
        session.commit()
        return {"item": _canvas_to_dict(duplicate), "order_revision": project.canvas_order_revision}


def update_canvas(
    project_id: str,
    canvas_id: str,
    user_id: str,
    *,
    name: str | None,
    status: str | None,
    base_order_revision: int | None,
) -> dict:
    with get_session() as session:
        project = _owned_project(session, project_id, user_id, lock=status is not None)
        if status is None:
            canvas = _active_canvas(session, project_id, canvas_id, lock=True)
            canvas.name = name
            canvas.updated_at = _now()
            session.commit()
            return {"item": _canvas_to_dict(canvas), "order_revision": project.canvas_order_revision}

        if base_order_revision is None:
            raise CanvasValidationError("base_order_revision is required")
        _check_revision(project, base_order_revision)
        canvases = _active_canvases(session, project_id, lock=True)
        canvas = next((item for item in canvases if item.id == canvas_id), None)
        if canvas is None:
            raise CanvasNotFoundError
        if len(canvases) == 1:
            raise CanvasConflictError("last_active_canvas", project.canvas_order_revision)

        timestamp = _now()
        if name is not None:
            canvas.name = name
        canvas.status = "archived"
        canvas.updated_at = timestamp
        remaining = [item for item in canvases if item.id != canvas_id]
        for sort_order, item in enumerate(remaining):
            item.sort_order = sort_order
            item.updated_at = timestamp
        project.canvas_order_revision += 1
        project.updated_at = timestamp
        session.commit()
        return {"item": _canvas_to_dict(canvas), "order_revision": project.canvas_order_revision}


def reorder_canvases(
    project_id: str,
    user_id: str,
    base_order_revision: int,
    ordered_canvas_ids: list[str],
) -> dict:
    with get_session() as session:
        project = _owned_project(session, project_id, user_id, lock=True)
        _check_revision(project, base_order_revision)
        canvases = _active_canvases(session, project_id, lock=True)
        canvas_by_id = {canvas.id: canvas for canvas in canvases}
        if len(ordered_canvas_ids) != len(canvases) or set(ordered_canvas_ids) != set(canvas_by_id):
            raise CanvasValidationError("ordered_canvas_ids must be an exact permutation of active canvas IDs")

        timestamp = _now()
        for sort_order, canvas_id in enumerate(ordered_canvas_ids):
            canvas = canvas_by_id[canvas_id]
            canvas.sort_order = sort_order
            canvas.updated_at = timestamp
        project.canvas_order_revision += 1
        project.updated_at = timestamp
        session.commit()
        return {
            "items": [_canvas_to_dict(canvas_by_id[canvas_id]) for canvas_id in ordered_canvas_ids],
            "order_revision": project.canvas_order_revision,
        }
