from __future__ import annotations

from collections.abc import Iterable

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from models.asset import Asset
from models.canvas_node import CanvasNode
from models.generation_task import GenerationTask


def clear_resource_node_links(session: Session, node_ids: Iterable[str]) -> None:
    linked_node_ids = tuple(sorted(set(node_ids)))
    if not linked_node_ids:
        return
    session.execute(
        select(CanvasNode.id)
        .where(CanvasNode.id.in_(linked_node_ids))
        .order_by(CanvasNode.id)
        .with_for_update()
    ).all()
    session.execute(
        update(Asset)
        .where(Asset.canvas_node_id.in_(linked_node_ids))
        .values(canvas_node_id=None)
    )
    session.execute(
        update(GenerationTask)
        .where(GenerationTask.canvas_node_id.in_(linked_node_ids))
        .values(canvas_node_id=None)
    )
