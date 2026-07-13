from __future__ import annotations

from copy import deepcopy
from datetime import UTC
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import or_, select

from controllers.canvases import (
    CanvasNotFoundError,
    _active_canvas,
    _canvas_to_dict,
    _owned_project,
)
from controllers.resource_links import clear_resource_node_links
from models.base import get_session, utc_now
from models.canvas_connection import CanvasConnection
from models.canvas_node import CanvasNode


def _datetime_to_iso(value) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.isoformat()


def _node_to_dict(node: CanvasNode) -> dict:
    return {
        "id": node.id,
        "project_id": node.project_id,
        "canvas_id": node.canvas_id,
        "node_type": node.node_type,
        "content": node.content,
        "position_x": node.position_x,
        "position_y": node.position_y,
        "width": node.width,
        "height": node.height,
        "z_index": node.z_index,
        "parent_node_id": node.parent_node_id,
        "is_locked": node.is_locked,
        "is_collapsed": node.is_collapsed,
        "status": node.status,
        "created_at": _datetime_to_iso(node.created_at),
        "updated_at": _datetime_to_iso(node.updated_at),
    }


def _connection_to_dict(connection: CanvasConnection) -> dict:
    return {
        "id": connection.id,
        "project_id": connection.project_id,
        "canvas_id": connection.canvas_id,
        "source_node_id": connection.source_node_id,
        "source_port": connection.source_port,
        "target_node_id": connection.target_node_id,
        "target_port": connection.target_port,
        "status": connection.status,
        "metadata": connection.metadata_,
        "created_at": _datetime_to_iso(connection.created_at),
        "updated_at": _datetime_to_iso(connection.updated_at),
    }


def get_document(project_id: str, canvas_id: str, user_id: str) -> dict:
    with get_session() as session:
        _owned_project(session, project_id, user_id)
        canvas = _active_canvas(session, project_id, canvas_id)
        nodes = list(
            session.scalars(
                select(CanvasNode)
                .where(
                    CanvasNode.project_id == project_id,
                    CanvasNode.canvas_id == canvas_id,
                    CanvasNode.status != "deleted",
                )
                .order_by(CanvasNode.z_index, CanvasNode.created_at, CanvasNode.id)
            ).all()
        )
        connections = list(
            session.scalars(
                select(CanvasConnection)
                .where(
                    CanvasConnection.project_id == project_id,
                    CanvasConnection.canvas_id == canvas_id,
                    CanvasConnection.status != "deleted",
                )
                .order_by(CanvasConnection.created_at, CanvasConnection.id)
            ).all()
        )
        return {
            "canvas": _canvas_to_dict(canvas),
            "nodes": [_node_to_dict(node) for node in nodes],
            "connections": [_connection_to_dict(connection) for connection in connections],
            "revision": canvas.graph_revision,
        }


def update_viewport(
    project_id: str,
    canvas_id: str,
    user_id: str,
    *,
    x: float,
    y: float,
    zoom: float,
) -> dict:
    with get_session() as session:
        _owned_project(session, project_id, user_id)
        canvas = _active_canvas(session, project_id, canvas_id, lock=True)
        canvas.viewport_x = x
        canvas.viewport_y = y
        canvas.viewport_zoom = Decimal(f"{zoom:.4f}")
        canvas.updated_at = utc_now()
        session.commit()
        return _canvas_to_dict(canvas)


def create_node(project_id: str, canvas_id: str, user_id: str, **fields) -> dict:
    with get_session() as session:
        _owned_project(session, project_id, user_id)
        _active_canvas(session, project_id, canvas_id, lock=True)
        parent_node_id = fields.get("parent_node_id")
        if parent_node_id is not None:
            parent = _active_node(session, project_id, canvas_id, parent_node_id)
            if parent.node_type != "group":
                raise ValueError("Parent node must be a group")
        timestamp = utc_now()
        node = CanvasNode(
            id=str(uuid4()),
            project_id=project_id,
            canvas_id=canvas_id,
            node_type=fields["node_type"],
            content=deepcopy(fields["content"]),
            position_x=fields["position_x"],
            position_y=fields["position_y"],
            width=fields["width"],
            height=fields["height"],
            z_index=fields.get("z_index", 0),
            parent_node_id=fields.get("parent_node_id"),
            is_locked=fields.get("is_locked", False),
            is_collapsed=fields.get("is_collapsed", False),
            status="active",
            created_at=timestamp,
            updated_at=timestamp,
        )
        session.add(node)
        session.commit()
        return _node_to_dict(node)


def _active_node(session, project_id: str, canvas_id: str, node_id: str) -> CanvasNode:
    node = session.scalar(
        select(CanvasNode).where(
            CanvasNode.id == node_id,
            CanvasNode.project_id == project_id,
            CanvasNode.canvas_id == canvas_id,
            CanvasNode.status != "deleted",
        )
    )
    if node is None:
        raise CanvasNotFoundError
    return node


def update_node(project_id: str, canvas_id: str, node_id: str, user_id: str, **fields) -> dict:
    with get_session() as session:
        _owned_project(session, project_id, user_id)
        _active_canvas(session, project_id, canvas_id, lock=True)
        node = _active_node(session, project_id, canvas_id, node_id)
        parent_node_id = fields.get("parent_node_id")
        if parent_node_id is not None:
            if parent_node_id == node_id:
                raise ValueError("A node cannot be its own parent")
            parent = _active_node(session, project_id, canvas_id, parent_node_id)
            if parent.node_type != "group":
                raise ValueError("Parent node must be a group")
        for key, value in fields.items():
            setattr(node, key, deepcopy(value) if key == "content" else value)
        node.updated_at = utc_now()
        session.commit()
        return _node_to_dict(node)


def delete_node(project_id: str, canvas_id: str, node_id: str, user_id: str) -> None:
    with get_session() as session:
        _owned_project(session, project_id, user_id)
        _active_canvas(session, project_id, canvas_id, lock=True)
        node = _active_node(session, project_id, canvas_id, node_id)
        connections = session.scalars(
            select(CanvasConnection).where(
                CanvasConnection.canvas_id == canvas_id,
                or_(
                    CanvasConnection.source_node_id == node_id,
                    CanvasConnection.target_node_id == node_id,
                ),
            )
        ).all()
        for connection in connections:
            session.delete(connection)
        if node.node_type == "group":
            children = session.scalars(
                select(CanvasNode).where(
                    CanvasNode.canvas_id == canvas_id,
                    CanvasNode.parent_node_id == node_id,
                    CanvasNode.status != "deleted",
                )
            ).all()
            for child in children:
                child.parent_node_id = None
                child.updated_at = utc_now()
        clear_resource_node_links(session, [node_id])
        node.status = "deleted"
        node.updated_at = utc_now()
        session.commit()


def create_connection(project_id: str, canvas_id: str, user_id: str, **fields) -> dict:
    with get_session() as session:
        _owned_project(session, project_id, user_id)
        _active_canvas(session, project_id, canvas_id, lock=True)
        source_node_id = fields["source_node_id"]
        target_node_id = fields["target_node_id"]
        if source_node_id == target_node_id:
            raise ValueError("Self-loop connections are not allowed")
        source_node = session.get(CanvasNode, source_node_id)
        target_node = session.get(CanvasNode, target_node_id)
        if (
            source_node is None
            or target_node is None
            or source_node.status == "deleted"
            or target_node.status == "deleted"
        ):
            raise ValueError("Connection nodes must exist")
        if source_node.project_id != project_id or target_node.project_id != project_id:
            raise ValueError("Connection nodes must belong to project")
        if source_node.canvas_id != canvas_id or target_node.canvas_id != canvas_id:
            raise ValueError("Connection nodes must belong to canvas")
        duplicate = session.scalar(
            select(CanvasConnection.id).where(
                CanvasConnection.canvas_id == canvas_id,
                CanvasConnection.source_node_id == source_node_id,
                CanvasConnection.source_port == fields["source_port"],
                CanvasConnection.target_node_id == target_node_id,
                CanvasConnection.target_port == fields["target_port"],
                CanvasConnection.status != "deleted",
            )
        )
        if duplicate is not None:
            raise ValueError("Connection already exists")
        timestamp = utc_now()
        connection = CanvasConnection(
            id=str(uuid4()),
            project_id=project_id,
            canvas_id=canvas_id,
            source_node_id=source_node_id,
            source_port=fields["source_port"],
            target_node_id=target_node_id,
            target_port=fields["target_port"],
            status="active",
            metadata_=deepcopy(fields.get("metadata") or {}),
            created_at=timestamp,
            updated_at=timestamp,
        )
        session.add(connection)
        session.commit()
        return _connection_to_dict(connection)


def delete_connection(
    project_id: str,
    canvas_id: str,
    connection_id: str,
    user_id: str,
) -> None:
    with get_session() as session:
        _owned_project(session, project_id, user_id)
        _active_canvas(session, project_id, canvas_id, lock=True)
        connection = session.scalar(
            select(CanvasConnection).where(
                CanvasConnection.id == connection_id,
                CanvasConnection.project_id == project_id,
                CanvasConnection.canvas_id == canvas_id,
            )
        )
        if connection is None:
            raise CanvasNotFoundError
        session.delete(connection)
        session.commit()
