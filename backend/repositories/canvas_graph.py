from __future__ import annotations

from sqlalchemy import select

from models.base import get_session
from models.canvas_connection import CanvasConnection
from models.canvas_node import CanvasNode
from repositories.records import canvas_connection_record, canvas_node_record


class CanvasGraphRepository:
    def list_nodes_for_project(self, project_id: str) -> list[dict]:
        with get_session() as session:
            rows = session.scalars(
                select(CanvasNode).where(
                    CanvasNode.project_id == project_id,
                    CanvasNode.status != "deleted",
                )
            ).all()
            return [canvas_node_record(row) for row in rows]

    def get_node(self, node_id: str) -> dict | None:
        with get_session() as session:
            row = session.get(CanvasNode, node_id)
            if row is None or row.status == "deleted":
                return None
            return canvas_node_record(row)

    def get_connection(self, connection_id: str) -> dict | None:
        with get_session() as session:
            row = session.get(CanvasConnection, connection_id)
            if row is None or row.status == "deleted":
                return None
            return canvas_connection_record(row)
