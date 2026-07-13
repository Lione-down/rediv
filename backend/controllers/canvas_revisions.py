from __future__ import annotations

from copy import deepcopy
from datetime import datetime
from hashlib import sha256
import json
from uuid import uuid4

from sqlalchemy import delete, select

from controllers.canvas_documents import _connection_to_dict, _datetime_to_iso, _node_to_dict
from controllers.canvases import CanvasNotFoundError, _active_canvas, _owned_project
from models.base import get_session, utc_now
from models.canvas_connection import CanvasConnection
from models.canvas_node import CanvasNode
from models.canvas_revision import CanvasRevision


LATEST_EDIT_REVISIONS = 50
CHECKPOINT_INTERVAL = 10


def _active_nodes(session, project_id: str, canvas_id: str) -> list[CanvasNode]:
    return list(session.scalars(
        select(CanvasNode)
        .where(
            CanvasNode.project_id == project_id,
            CanvasNode.canvas_id == canvas_id,
            CanvasNode.status != "deleted",
        )
        .order_by(CanvasNode.z_index, CanvasNode.created_at, CanvasNode.id)
    ).all())


def _active_connections(session, project_id: str, canvas_id: str) -> list[CanvasConnection]:
    return list(session.scalars(
        select(CanvasConnection)
        .where(
            CanvasConnection.project_id == project_id,
            CanvasConnection.canvas_id == canvas_id,
            CanvasConnection.status != "deleted",
        )
        .order_by(CanvasConnection.created_at, CanvasConnection.id)
    ).all())


def capture_graph_snapshot(session, project_id: str, canvas_id: str) -> dict:
    return {
        "nodes": [_node_to_dict(node) for node in _active_nodes(session, project_id, canvas_id)],
        "connections": [
            _connection_to_dict(connection)
            for connection in _active_connections(session, project_id, canvas_id)
        ],
    }


def should_checkpoint(session, canvas_id: str, revision_no: int) -> bool:
    if revision_no == 1 or revision_no % CHECKPOINT_INTERVAL == 0:
        return True
    return not any(
        revision.checkpoint_snapshot is not None
        for revision in session.scalars(select(CanvasRevision).where(
            CanvasRevision.canvas_id == canvas_id,
        )).all()
    )


def prune_revisions(session, canvas_id: str, head_revision: int) -> None:
    window_start = max(1, head_revision - LATEST_EDIT_REVISIONS + 1)
    checkpoint = next((
        revision
        for revision in session.scalars(
            select(CanvasRevision)
            .where(
                CanvasRevision.canvas_id == canvas_id,
                CanvasRevision.revision_no <= window_start,
            )
            .order_by(CanvasRevision.revision_no.desc())
        ).all()
        if revision.checkpoint_snapshot is not None
    ), None)
    if checkpoint is None:
        return
    session.execute(delete(CanvasRevision).where(
        CanvasRevision.canvas_id == canvas_id,
        CanvasRevision.revision_no < checkpoint.revision_no,
    ))


def _revision_summary(revision: CanvasRevision) -> dict:
    restored_from = None
    if isinstance(revision.operations, dict):
        restored_from = revision.operations.get("restored_from_revision")
    return {
        "revision": revision.revision_no,
        "base_revision": revision.base_revision,
        "is_checkpoint": revision.checkpoint_snapshot is not None,
        "restored_from_revision": restored_from,
        "created_at": _datetime_to_iso(revision.created_at),
    }


def list_revisions(project_id: str, canvas_id: str, user_id: str) -> dict:
    with get_session() as session:
        _owned_project(session, project_id, user_id)
        canvas = _active_canvas(session, project_id, canvas_id)
        revisions = session.scalars(
            select(CanvasRevision)
            .where(CanvasRevision.canvas_id == canvas_id)
            .order_by(CanvasRevision.revision_no.desc())
        ).all()
        first_checkpoint = next((
            revision.revision_no
            for revision in reversed(revisions)
            if revision.checkpoint_snapshot is not None
        ), None)
        if first_checkpoint is not None:
            revisions = [
                revision for revision in revisions
                if revision.revision_no >= first_checkpoint
            ]
        else:
            revisions = []
        return {
            "items": [_revision_summary(revision) for revision in revisions],
            "current_revision": canvas.graph_revision,
        }


def _apply_operations(snapshot: dict, operations: dict) -> dict:
    nodes = {item["id"]: deepcopy(item) for item in snapshot["nodes"]}
    connections = {item["id"]: deepcopy(item) for item in snapshot["connections"]}
    for node_id in operations["node_deletes"]:
        nodes.pop(node_id, None)
    for node in operations["node_upserts"]:
        nodes[node["id"]] = deepcopy(node)
    for connection_id in operations["connection_deletes"]:
        connections.pop(connection_id, None)
    for connection in operations["connection_upserts"]:
        connections[connection["id"]] = deepcopy(connection)
    return {
        "nodes": sorted(
            nodes.values(),
            key=lambda item: (item["z_index"], item["created_at"], item["id"]),
        ),
        "connections": sorted(
            connections.values(),
            key=lambda item: (item["created_at"], item["id"]),
        ),
    }


def _reconstruct_snapshot(session, canvas_id: str, target_revision: int) -> dict:
    checkpoint = next((
        revision
        for revision in session.scalars(
            select(CanvasRevision)
            .where(
                CanvasRevision.canvas_id == canvas_id,
                CanvasRevision.revision_no <= target_revision,
            )
            .order_by(CanvasRevision.revision_no.desc())
        ).all()
        if revision.checkpoint_snapshot is not None
    ), None)
    if checkpoint is None:
        raise CanvasNotFoundError("Canvas revision checkpoint not found")
    snapshot = deepcopy(checkpoint.checkpoint_snapshot)
    if checkpoint.revision_no == target_revision:
        return snapshot
    revisions = session.scalars(
        select(CanvasRevision)
        .where(
            CanvasRevision.canvas_id == canvas_id,
            CanvasRevision.revision_no > checkpoint.revision_no,
            CanvasRevision.revision_no <= target_revision,
        )
        .order_by(CanvasRevision.revision_no)
    ).all()
    expected = list(range(checkpoint.revision_no + 1, target_revision + 1))
    if [revision.revision_no for revision in revisions] != expected:
        raise CanvasNotFoundError("Canvas revision reconstruction chain not found")
    for revision in revisions:
        snapshot = _apply_operations(snapshot, revision.operations)
    return snapshot


def _parse_timestamp(value: str) -> datetime:
    return datetime.fromisoformat(value)


def _restore_graph(session, project_id: str, canvas_id: str, snapshot: dict, timestamp) -> None:
    target_nodes = {item["id"]: item for item in snapshot["nodes"]}
    current_nodes = {
        node.id: node
        for node in session.scalars(select(CanvasNode).where(
            CanvasNode.project_id == project_id,
            CanvasNode.canvas_id == canvas_id,
        ).with_for_update()).all()
    }
    current_connections = session.scalars(select(CanvasConnection).where(
        CanvasConnection.project_id == project_id,
        CanvasConnection.canvas_id == canvas_id,
    ).with_for_update()).all()
    for node in current_nodes.values():
        node.parent_node_id = None
    for connection in current_connections:
        session.delete(connection)
    session.flush()

    desired_parents: dict[str, str | None] = {}
    for node_id, fields in target_nodes.items():
        node = current_nodes.get(node_id)
        if node is None:
            node = CanvasNode(
                id=node_id,
                project_id=project_id,
                canvas_id=canvas_id,
                created_at=_parse_timestamp(fields["created_at"]),
            )
            session.add(node)
        node.node_type = fields["node_type"]
        node.content = deepcopy(fields["content"])
        node.position_x = fields["position_x"]
        node.position_y = fields["position_y"]
        node.width = fields["width"]
        node.height = fields["height"]
        node.z_index = fields["z_index"]
        node.parent_node_id = None
        desired_parents[node_id] = fields["parent_node_id"]
        node.is_locked = fields["is_locked"]
        node.is_collapsed = fields["is_collapsed"]
        node.status = "active"
        node.updated_at = timestamp
    for node_id, node in current_nodes.items():
        if node_id not in target_nodes:
            node.status = "deleted"
            node.updated_at = timestamp
    session.flush()
    for node_id, parent_id in desired_parents.items():
        (current_nodes.get(node_id) or session.get(CanvasNode, node_id)).parent_node_id = parent_id
    session.flush()

    for fields in snapshot["connections"]:
        session.add(CanvasConnection(
            id=fields["id"],
            project_id=project_id,
            canvas_id=canvas_id,
            source_node_id=fields["source_node_id"],
            source_port=fields["source_port"],
            target_node_id=fields["target_node_id"],
            target_port=fields["target_port"],
            status="active",
            metadata_=deepcopy(fields["metadata"]),
            created_at=_parse_timestamp(fields["created_at"]),
            updated_at=timestamp,
        ))
    session.flush()


def _graph_delta(before: dict, after: dict) -> dict:
    before_nodes = {item["id"]: item for item in before["nodes"]}
    after_nodes = {item["id"]: item for item in after["nodes"]}
    before_connections = {item["id"]: item for item in before["connections"]}
    after_connections = {item["id"]: item for item in after["connections"]}
    return {
        "node_upserts": [
            item for item in after["nodes"] if before_nodes.get(item["id"]) != item
        ],
        "node_deletes": sorted(set(before_nodes) - set(after_nodes)),
        "connection_upserts": [
            item for item in after["connections"]
            if before_connections.get(item["id"]) != item
        ],
        "connection_deletes": sorted(set(before_connections) - set(after_connections)),
    }


def restore_revision(project_id: str, canvas_id: str, revision_no: int, user_id: str) -> dict:
    with get_session() as session:
        _owned_project(session, project_id, user_id)
        canvas = _active_canvas(session, project_id, canvas_id, lock=True)
        target = session.scalar(select(CanvasRevision).where(
            CanvasRevision.canvas_id == canvas_id,
            CanvasRevision.revision_no == revision_no,
        ).with_for_update())
        if target is None:
            raise CanvasNotFoundError("Canvas revision not found")
        target_snapshot = _reconstruct_snapshot(session, canvas_id, revision_no)
        current_snapshot = capture_graph_snapshot(session, project_id, canvas_id)
        timestamp = utc_now().replace(microsecond=0)
        _restore_graph(session, project_id, canvas_id, target_snapshot, timestamp)
        restored_snapshot = capture_graph_snapshot(session, project_id, canvas_id)

        next_revision = canvas.graph_revision + 1
        operations = _graph_delta(current_snapshot, restored_snapshot)
        operations["restored_from_revision"] = revision_no
        fingerprint_payload = json.dumps(
            {"base_revision": canvas.graph_revision, "operations": operations},
            ensure_ascii=False,
            allow_nan=False,
            sort_keys=True,
            separators=(",", ":"),
        ).encode("utf-8")
        revision = CanvasRevision(
            id=str(uuid4()),
            canvas_id=canvas_id,
            revision_no=next_revision,
            base_revision=canvas.graph_revision,
            client_mutation_id=f"restore:{uuid4()}",
            request_fingerprint=sha256(fingerprint_payload).hexdigest(),
            operations=deepcopy(operations),
            checkpoint_snapshot=deepcopy(restored_snapshot),
            created_by_user_id=user_id,
            created_at=timestamp,
        )
        canvas.graph_revision = next_revision
        canvas.updated_at = timestamp
        session.add(revision)
        session.flush()
        prune_revisions(session, canvas_id, next_revision)
        session.commit()
        return {
            "revision": next_revision,
            "restored_from_revision": revision_no,
            "server_timestamp": _datetime_to_iso(timestamp),
        }
