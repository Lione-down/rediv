from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.canvas import Canvas
from models.canvas_node import CanvasNode
from models.project import Project


@dataclass(frozen=True)
class ResourceScope:
    project_id: str | None
    origin_canvas_id: str | None


class ProjectResourceConflictError(RuntimeError):
    pass


def resolve_memory_resource_scope(
    *,
    user_id: str,
    project_id: str | None,
    origin_canvas_id: str | None,
    canvas_node_id: str | None,
    projects: Mapping[str, dict],
    canvases: Mapping[str, dict],
    nodes: Mapping[str, dict],
) -> ResourceScope:
    node = nodes.get(canvas_node_id) if canvas_node_id else None
    if canvas_node_id and (node is None or node.get("status") != "active"):
        raise KeyError(f'Canvas node "{canvas_node_id}" not found')

    if node is not None:
        node_project_id = node["project_id"]
        node_canvas_id = node["canvas_id"]
        if project_id is not None and project_id != node_project_id:
            raise PermissionError("Canvas node does not belong to project")
        if origin_canvas_id is not None and origin_canvas_id != node_canvas_id:
            raise PermissionError("Canvas node does not belong to origin canvas")
        project_id = node_project_id
        origin_canvas_id = node_canvas_id

    canvas = canvases.get(origin_canvas_id) if origin_canvas_id else None
    if origin_canvas_id and (canvas is None or canvas.get("status") != "active"):
        raise KeyError(f'Canvas "{origin_canvas_id}" not found')
    if canvas is not None and project_id is None:
        project_id = canvas["project_id"]
    if canvas is not None and canvas["project_id"] != project_id:
        raise PermissionError("Origin canvas does not belong to project")

    project = projects.get(project_id) if project_id else None
    if project_id and project is None:
        raise KeyError(f'Project "{project_id}" not found')
    if project is not None and project["user_id"] != user_id:
        raise PermissionError("Project does not belong to user")

    return ResourceScope(project_id=project_id, origin_canvas_id=origin_canvas_id)


def resolve_database_resource_scope(
    session: Session,
    *,
    user_id: str,
    project_id: str | None,
    origin_canvas_id: str | None,
    canvas_node_id: str | None,
    require_active: bool = True,
) -> ResourceScope:
    node_scope = None
    if canvas_node_id:
        node_scope = session.execute(
            select(CanvasNode.project_id, CanvasNode.canvas_id)
            .where(CanvasNode.id == canvas_node_id)
        ).one_or_none()
    if canvas_node_id and node_scope is None:
        raise KeyError(f'Canvas node "{canvas_node_id}" not found')

    if node_scope is not None:
        node_project_id, node_canvas_id = node_scope
        if project_id is not None and project_id != node_project_id:
            raise PermissionError("Canvas node does not belong to project")
        if origin_canvas_id is not None and origin_canvas_id != node_canvas_id:
            raise PermissionError("Canvas node does not belong to origin canvas")
        project_id = node_project_id
        origin_canvas_id = node_canvas_id

    if origin_canvas_id and project_id is None:
        project_id = session.scalar(
            select(Canvas.project_id).where(Canvas.id == origin_canvas_id)
        )
        if project_id is None:
            raise KeyError(f'Canvas "{origin_canvas_id}" not found')

    project = session.scalar(
        select(Project).where(Project.id == project_id).with_for_update()
    ) if project_id else None
    if project_id and project is None:
        raise KeyError(f'Project "{project_id}" not found')
    if project is not None and project.user_id != user_id:
        raise PermissionError("Project does not belong to user")

    canvas = session.scalar(
        select(Canvas).where(Canvas.id == origin_canvas_id).with_for_update()
    ) if origin_canvas_id else None
    if origin_canvas_id and canvas is None:
        raise KeyError(f'Canvas "{origin_canvas_id}" not found')
    if require_active and canvas is not None and canvas.status != "active":
        raise KeyError(f'Canvas "{origin_canvas_id}" not found')
    if canvas is not None and canvas.project_id != project_id:
        raise PermissionError("Origin canvas does not belong to project")

    node = session.scalar(
        select(CanvasNode).where(CanvasNode.id == canvas_node_id).with_for_update()
    ) if canvas_node_id else None
    if canvas_node_id and node is None:
        raise KeyError(f'Canvas node "{canvas_node_id}" not found')
    if require_active and node is not None and node.status != "active":
        raise KeyError(f'Canvas node "{canvas_node_id}" not found')
    if node is not None and (node.project_id != project_id or node.canvas_id != origin_canvas_id):
        raise PermissionError("Canvas node scope changed during resource creation")

    return ResourceScope(project_id=project_id, origin_canvas_id=origin_canvas_id)
