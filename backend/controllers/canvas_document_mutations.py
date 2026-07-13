from __future__ import annotations

from contextlib import nullcontext
from copy import deepcopy
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from controllers.canvas_documents import _connection_to_dict, _datetime_to_iso, _node_to_dict
from controllers.canvas_revisions import capture_graph_snapshot, prune_revisions, should_checkpoint
from controllers.canvases import CanvasDomainError, _active_canvas, _owned_project
from controllers.resource_links import clear_resource_node_links
from core.canvas_document_fingerprint import mutation_fingerprint
from models.base import get_session, utc_now
from models.canvas_connection import CanvasConnection
from models.canvas_node import CanvasNode
from models.canvas_revision import CanvasRevision


class CanvasDocumentValidationError(CanvasDomainError):
    pass


class CanvasDocumentConflictError(CanvasDomainError):
    def __init__(self, code: str, current_revision: int) -> None:
        super().__init__(code)
        self.code = code
        self.current_revision = current_revision


def _response_from_revision(revision: CanvasRevision) -> dict:
    operations = deepcopy(revision.operations)
    return {
        "revision": revision.revision_no,
        "node_upserts": operations["node_upserts"],
        "node_deletes": operations["node_deletes"],
        "connection_upserts": operations["connection_upserts"],
        "connection_deletes": operations["connection_deletes"],
        "server_timestamp": _datetime_to_iso(revision.created_at),
        "save_state": "saved",
    }


def _node_fields(node: CanvasNode) -> dict:
    return {
        "id": node.id,
        "node_type": node.node_type,
        "content": deepcopy(node.content),
        "position_x": node.position_x,
        "position_y": node.position_y,
        "width": node.width,
        "height": node.height,
        "z_index": node.z_index,
        "parent_node_id": node.parent_node_id,
        "is_locked": node.is_locked,
        "is_collapsed": node.is_collapsed,
    }


def _validate_node_graph(nodes: dict[str, dict]) -> None:
    for node_id, node in nodes.items():
        parent_id = node["parent_node_id"]
        if parent_id is None:
            continue
        if parent_id == node_id:
            raise CanvasDocumentValidationError("node_cannot_parent_itself")
        if node["node_type"] == "group":
            raise CanvasDocumentValidationError("nested_groups_not_allowed")
        parent = nodes.get(parent_id)
        if parent is None:
            raise CanvasDocumentValidationError("parent_node_missing")
        if parent["node_type"] != "group":
            raise CanvasDocumentValidationError("parent_node_not_group")


def _validate_connection_graph(connections: dict[str, dict], nodes: dict[str, dict]) -> None:
    edge_keys: set[tuple[str, str, str, str]] = set()
    for connection in connections.values():
        source_id = connection["source_node_id"]
        target_id = connection["target_node_id"]
        if source_id == target_id:
            raise CanvasDocumentValidationError("self_loop_not_allowed")
        if source_id not in nodes or target_id not in nodes:
            raise CanvasDocumentValidationError("connection_endpoint_missing")
        edge_key = (
            source_id,
            connection["source_port"],
            target_id,
            connection["target_port"],
        )
        if edge_key in edge_keys:
            raise CanvasDocumentValidationError("duplicate_connection")
        edge_keys.add(edge_key)


def _patch_document(
    project_id: str,
    canvas_id: str,
    user_id: str,
    payload: dict,
    *,
    session: Session | None,
    should_commit: bool,
) -> dict:
    try:
        fingerprint = mutation_fingerprint(payload)
    except (TypeError, ValueError) as error:
        raise CanvasDocumentValidationError("mutation_payload_not_canonical_json") from error
    session_context = get_session() if session is None else nullcontext(session)
    with session_context as active_session:
        session = active_session
        _owned_project(session, project_id, user_id)
        canvas = _active_canvas(session, project_id, canvas_id, lock=True)
        existing_revision = session.scalar(
            select(CanvasRevision).where(
                CanvasRevision.canvas_id == canvas_id,
                CanvasRevision.client_mutation_id == payload["client_mutation_id"],
            ).with_for_update()
        )
        if existing_revision is not None:
            if existing_revision.request_fingerprint != fingerprint:
                raise CanvasDocumentConflictError("mutation_id_reused", canvas.graph_revision)
            return _response_from_revision(existing_revision)
        if canvas.graph_revision != payload["base_revision"]:
            raise CanvasDocumentConflictError("stale_graph_revision", canvas.graph_revision)

        current_nodes = {
            node.id: node
            for node in session.scalars(
                select(CanvasNode).where(
                    CanvasNode.project_id == project_id,
                    CanvasNode.canvas_id == canvas_id,
                    CanvasNode.status != "deleted",
                ).with_for_update()
            ).all()
        }
        current_connections = {
            connection.id: connection
            for connection in session.scalars(
                select(CanvasConnection).where(
                    CanvasConnection.project_id == project_id,
                    CanvasConnection.canvas_id == canvas_id,
                    CanvasConnection.status != "deleted",
                ).with_for_update()
            ).all()
        }
        node_delete_ids = set(payload["node_deletes"])
        connection_delete_ids = set(payload["connection_deletes"])
        if not node_delete_ids <= current_nodes.keys():
            raise CanvasDocumentValidationError("node_delete_missing")
        if not connection_delete_ids <= current_connections.keys():
            raise CanvasDocumentValidationError("connection_delete_missing")

        node_upserts = {item["id"]: deepcopy(item) for item in payload["node_upserts"]}
        upsert_node_models = {
            node.id: node
            for node in session.scalars(
                select(CanvasNode)
                .where(CanvasNode.id.in_(node_upserts or [""]))
                .with_for_update()
            ).all()
        }
        if any(
            node.project_id != project_id or node.canvas_id != canvas_id
            for node in upsert_node_models.values()
        ):
            raise CanvasDocumentValidationError("node_id_scope_conflict")

        prospective_nodes = {
            node_id: _node_fields(node)
            for node_id, node in current_nodes.items()
            if node_id not in node_delete_ids
        }
        prospective_nodes.update(node_upserts)
        for node_id, node in list(prospective_nodes.items()):
            if node["parent_node_id"] in node_delete_ids and node_id not in node_upserts:
                normalized = deepcopy(node)
                normalized["parent_node_id"] = None
                prospective_nodes[node_id] = normalized
                node_upserts[node_id] = normalized
        _validate_node_graph(prospective_nodes)

        connection_upserts = {
            item["id"]: deepcopy(item) for item in payload["connection_upserts"]
        }
        upsert_connection_models = {
            connection.id: connection
            for connection in session.scalars(
                select(CanvasConnection)
                .where(CanvasConnection.id.in_(connection_upserts or [""]))
                .with_for_update()
            ).all()
        }
        if any(
            connection.project_id != project_id or connection.canvas_id != canvas_id
            for connection in upsert_connection_models.values()
        ):
            raise CanvasDocumentValidationError("connection_id_scope_conflict")

        prospective_connections = {
            connection_id: {
                "id": connection.id,
                "source_node_id": connection.source_node_id,
                "source_port": connection.source_port,
                "target_node_id": connection.target_node_id,
                "target_port": connection.target_port,
                "metadata": deepcopy(connection.metadata_),
            }
            for connection_id, connection in current_connections.items()
            if connection_id not in connection_delete_ids
        }
        implicit_connection_deletes = {
            connection_id
            for connection_id, connection in prospective_connections.items()
            if (
                connection["source_node_id"] not in prospective_nodes
                or connection["target_node_id"] not in prospective_nodes
            )
        }
        implicit_connection_deletes.difference_update(connection_upserts)
        for connection_id in implicit_connection_deletes:
            prospective_connections.pop(connection_id)
        prospective_connections.update(connection_upserts)
        _validate_connection_graph(prospective_connections, prospective_nodes)

        timestamp = utc_now().replace(microsecond=0)
        desired_parents: dict[str, str | None] = {}
        normalized_node_models: list[CanvasNode] = []
        for node_id, fields in node_upserts.items():
            node = upsert_node_models.get(node_id) or current_nodes.get(node_id)
            if node is None:
                node = CanvasNode(
                    id=node_id,
                    project_id=project_id,
                    canvas_id=canvas_id,
                    created_at=timestamp,
                )
                session.add(node)
            node.node_type = fields["node_type"]
            node.content = deepcopy(fields["content"])
            node.position_x = fields["position_x"]
            node.position_y = fields["position_y"]
            node.width = fields["width"]
            node.height = fields["height"]
            node.z_index = fields["z_index"]
            desired_parents[node_id] = fields["parent_node_id"]
            node.parent_node_id = None
            node.is_locked = fields["is_locked"]
            node.is_collapsed = fields["is_collapsed"]
            node.status = "active"
            node.updated_at = timestamp
            normalized_node_models.append(node)
        session.flush()
        for node in normalized_node_models:
            node.parent_node_id = desired_parents[node.id]
        clear_resource_node_links(session, node_delete_ids)
        for node_id in node_delete_ids:
            current_nodes[node_id].status = "deleted"
            current_nodes[node_id].updated_at = timestamp
        session.flush()

        all_connection_deletes = connection_delete_ids | implicit_connection_deletes
        for connection_id in all_connection_deletes:
            session.delete(current_connections[connection_id])
        normalized_connection_models: list[CanvasConnection] = []
        for connection_id, fields in connection_upserts.items():
            connection = upsert_connection_models.get(connection_id)
            if connection is None:
                connection = CanvasConnection(
                    id=connection_id,
                    project_id=project_id,
                    canvas_id=canvas_id,
                    created_at=timestamp,
                )
                session.add(connection)
            connection.source_node_id = fields["source_node_id"]
            connection.source_port = fields["source_port"]
            connection.target_node_id = fields["target_node_id"]
            connection.target_port = fields["target_port"]
            connection.status = "active"
            connection.metadata_ = deepcopy(fields["metadata"])
            connection.updated_at = timestamp
            normalized_connection_models.append(connection)
        session.flush()

        operations = {
            "node_upserts": [_node_to_dict(node) for node in normalized_node_models],
            "node_deletes": sorted(node_delete_ids),
            "connection_upserts": [
                _connection_to_dict(connection) for connection in normalized_connection_models
            ],
            "connection_deletes": sorted(all_connection_deletes),
        }
        next_revision = canvas.graph_revision + 1
        checkpoint_snapshot = (
            capture_graph_snapshot(session, project_id, canvas_id)
            if should_checkpoint(session, canvas_id, next_revision)
            else None
        )
        revision = CanvasRevision(
            id=str(uuid4()),
            canvas_id=canvas_id,
            revision_no=next_revision,
            base_revision=payload["base_revision"],
            client_mutation_id=payload["client_mutation_id"],
            request_fingerprint=fingerprint,
            operations=deepcopy(operations),
            checkpoint_snapshot=checkpoint_snapshot,
            created_by_user_id=user_id,
            created_at=timestamp,
        )
        canvas.graph_revision = revision.revision_no
        canvas.updated_at = timestamp
        session.add(revision)
        session.flush()
        prune_revisions(session, canvas_id, next_revision)
        if should_commit:
            session.commit()
        return _response_from_revision(revision)


def patch_document(project_id: str, canvas_id: str, user_id: str, payload: dict) -> dict:
    return _patch_document(
        project_id,
        canvas_id,
        user_id,
        payload,
        session=None,
        should_commit=True,
    )


def apply_document_patch_in_session(
    session: Session,
    project_id: str,
    canvas_id: str,
    user_id: str,
    payload: dict,
) -> dict:
    return _patch_document(
        project_id,
        canvas_id,
        user_id,
        payload,
        session=session,
        should_commit=False,
    )
