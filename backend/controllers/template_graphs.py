from __future__ import annotations

import hashlib
import json
from copy import deepcopy
from uuid import NAMESPACE_URL, uuid4, uuid5

from pydantic import ValidationError
from sqlalchemy import select

from controllers import canvas_document_mutations as mutation_controller
from controllers.canvas_documents import _datetime_to_iso
from controllers.canvases import _active_canvas, _owned_project
from core.canvas_document_fingerprint import canonical_json
from models.base import get_session, utc_now
from models.canvas import Canvas
from models.canvas_connection import CanvasConnection
from models.canvas_node import CanvasNode
from models.canvas_revision import CanvasRevision
from models.project import Project
from models.template import Template
from schemas.canvas_document import (
    MAX_MUTATIONS_PER_BATCH,
    CanvasConnectionUpsert,
    CanvasDocumentPatchRequest,
    CanvasNodeUpsert,
)


class TemplateGraphError(Exception):
    pass


class TemplateGraphNotFoundError(TemplateGraphError):
    pass


class TemplateGraphForbiddenError(TemplateGraphError):
    pass


class TemplateGraphValidationError(TemplateGraphError):
    pass


_TEMPLATE_INSTANTIATION_KEY = "template_instantiation"


def _node_to_graph_data(node: CanvasNode) -> dict:
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


def _connection_to_graph_data(connection: CanvasConnection) -> dict:
    return {
        "id": connection.id,
        "source_node_id": connection.source_node_id,
        "source_port": connection.source_port,
        "target_node_id": connection.target_node_id,
        "target_port": connection.target_port,
        "metadata": deepcopy(connection.metadata_),
    }


def template_to_dict(template: Template) -> dict:
    return {
        "id": template.id,
        "name": template.name,
        "user_id": template.user_id,
        "node_data": deepcopy(template.node_data),
        "schema_version": template.schema_version,
        "graph_data": deepcopy(template.graph_data),
        "node_count": template.node_count,
        "created_at": _datetime_to_iso(template.created_at),
    }


def capture_canvas_template(project_id: str, canvas_id: str, user_id: str, name: str) -> dict:
    with get_session() as session:
        project = session.scalar(
            select(Project).where(Project.id == project_id).with_for_update()
        )
        if project is None:
            raise TemplateGraphNotFoundError("Project not found")
        if project.user_id != user_id:
            raise TemplateGraphForbiddenError("Project does not belong to user")

        canvas = session.scalar(
            select(Canvas)
            .where(Canvas.id == canvas_id, Canvas.project_id == project_id)
            .with_for_update()
        )
        if canvas is None or canvas.status != "active":
            raise TemplateGraphNotFoundError("Canvas not found")

        nodes = list(
            session.scalars(
                select(CanvasNode)
                .where(
                    CanvasNode.project_id == project_id,
                    CanvasNode.canvas_id == canvas_id,
                    CanvasNode.status != "deleted",
                )
                .order_by(CanvasNode.z_index, CanvasNode.created_at, CanvasNode.id)
                .with_for_update()
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
                .with_for_update()
            ).all()
        )
        if (
            len(nodes) > MAX_MUTATIONS_PER_BATCH
            or len(connections) > MAX_MUTATIONS_PER_BATCH
        ):
            raise TemplateGraphValidationError("template_graph_capacity_exceeded")
        graph_nodes = [_node_to_graph_data(node) for node in nodes]
        graph_data = {
            "schema_version": 1,
            "nodes": graph_nodes,
            "connections": [_connection_to_graph_data(connection) for connection in connections],
        }
        template = Template(
            id=str(uuid4()),
            user_id=user_id,
            name=name,
            node_data=deepcopy(graph_nodes),
            schema_version=1,
            graph_data=graph_data,
            node_count=len(graph_nodes),
            created_at=utc_now(),
        )
        session.add(template)
        session.commit()
        return template_to_dict(template)


def _canonical_node(raw_node: object) -> dict:
    if not isinstance(raw_node, dict):
        raise TemplateGraphValidationError("template_node_not_object")
    candidate = {
        "id": raw_node.get("id"),
        "node_type": raw_node.get("node_type"),
        "content": deepcopy(raw_node.get("content", {})),
        "position_x": raw_node.get("position_x"),
        "position_y": raw_node.get("position_y"),
        "width": raw_node.get("width"),
        "height": raw_node.get("height"),
        "z_index": raw_node.get("z_index", 0),
        "parent_node_id": raw_node.get("parent_node_id"),
        "is_locked": raw_node.get("is_locked", False),
        "is_collapsed": raw_node.get("is_collapsed", False),
    }
    try:
        return CanvasNodeUpsert.model_validate(candidate).model_dump(mode="json")
    except ValidationError as error:
        raise TemplateGraphValidationError("template_node_invalid") from error


def _canonical_connection(raw_connection: object) -> dict:
    if not isinstance(raw_connection, dict):
        raise TemplateGraphValidationError("template_connection_not_object")
    candidate = {
        "id": raw_connection.get("id"),
        "source_node_id": raw_connection.get("source_node_id"),
        "source_port": raw_connection.get("source_port"),
        "target_node_id": raw_connection.get("target_node_id"),
        "target_port": raw_connection.get("target_port"),
        "metadata": deepcopy(
            raw_connection.get("metadata", raw_connection.get("metadata_", {}))
        ),
    }
    try:
        return CanvasConnectionUpsert.model_validate(candidate).model_dump(mode="json")
    except ValidationError as error:
        raise TemplateGraphValidationError("template_connection_invalid") from error


def canonical_template_graph(
    template: Template,
    *,
    allow_empty: bool = False,
) -> tuple[list[dict], list[dict]]:
    graph_data = template.graph_data
    if not isinstance(graph_data, dict):
        raise TemplateGraphValidationError("template_graph_not_object")
    if template.schema_version != 1 or graph_data.get("schema_version") != 1:
        raise TemplateGraphValidationError("unsupported_template_schema_version")
    raw_nodes = graph_data.get("nodes")
    raw_connections = graph_data.get("connections")
    if not isinstance(raw_nodes, list) or not isinstance(raw_connections, list):
        raise TemplateGraphValidationError("template_graph_collections_invalid")

    nodes = [_canonical_node(node) for node in raw_nodes]
    connections = [_canonical_connection(connection) for connection in raw_connections]
    node_ids = [node["id"] for node in nodes]
    connection_ids = [connection["id"] for connection in connections]
    if len(node_ids) != len(set(node_ids)):
        raise TemplateGraphValidationError("template_node_ids_not_unique")
    if len(connection_ids) != len(set(connection_ids)):
        raise TemplateGraphValidationError("template_connection_ids_not_unique")
    if not nodes and not connections and not allow_empty:
        raise TemplateGraphValidationError("template_graph_empty")

    node_map = {node["id"]: node for node in nodes}
    connection_map = {connection["id"]: connection for connection in connections}
    try:
        mutation_controller._validate_node_graph(node_map)
        mutation_controller._validate_connection_graph(connection_map, node_map)
    except mutation_controller.CanvasDocumentValidationError as error:
        raise TemplateGraphValidationError(f"template_{error}") from error
    return nodes, connections


def _stable_graph_id(
    template_id: str,
    canvas_id: str,
    client_mutation_id: str,
    entity_kind: str,
    source_id: str,
) -> str:
    identity = json.dumps(
        ["revid", "template", template_id, canvas_id, client_mutation_id, entity_kind, source_id],
        ensure_ascii=False,
        separators=(",", ":"),
    )
    return str(uuid5(NAMESPACE_URL, identity))


def build_template_mutation(
    template_id: str,
    canvas_id: str,
    nodes: list[dict],
    connections: list[dict],
    request_payload: dict,
) -> tuple[dict, dict[str, str], dict[str, str]]:
    client_mutation_id = request_payload["client_mutation_id"]
    node_id_map = {
        node["id"]: _stable_graph_id(
            template_id, canvas_id, client_mutation_id, "node", node["id"]
        )
        for node in nodes
    }
    connection_id_map = {
        connection["id"]: _stable_graph_id(
            template_id, canvas_id, client_mutation_id, "connection", connection["id"]
        )
        for connection in connections
    }

    anchor_x = request_payload.get("anchor_x")
    anchor_y = request_payload.get("anchor_y")
    offset_x = 0.0
    offset_y = 0.0
    if anchor_x is not None and anchor_y is not None:
        offset_x = anchor_x - min(node["position_x"] for node in nodes)
        offset_y = anchor_y - min(node["position_y"] for node in nodes)

    node_upserts = []
    for source in nodes:
        target = deepcopy(source)
        target["id"] = node_id_map[source["id"]]
        target["position_x"] += offset_x
        target["position_y"] += offset_y
        parent_id = source["parent_node_id"]
        target["parent_node_id"] = node_id_map[parent_id] if parent_id is not None else None
        node_upserts.append(target)

    connection_upserts = []
    for source in connections:
        target = deepcopy(source)
        target["id"] = connection_id_map[source["id"]]
        target["source_node_id"] = node_id_map[source["source_node_id"]]
        target["target_node_id"] = node_id_map[source["target_node_id"]]
        connection_upserts.append(target)

    try:
        mutation_payload = CanvasDocumentPatchRequest.model_validate(
            {
                "base_revision": request_payload["base_revision"],
                "client_mutation_id": client_mutation_id,
                "node_upserts": node_upserts,
                "node_deletes": [],
                "connection_upserts": connection_upserts,
                "connection_deletes": [],
            }
        ).model_dump(mode="json")
    except ValidationError as error:
        raise TemplateGraphValidationError("template_graph_translation_invalid") from error

    return mutation_payload, node_id_map, connection_id_map


def _service_request_fingerprint(
    project_id: str,
    canvas_id: str,
    template_id: str,
    request_payload: dict,
) -> str:
    canonical_request = {
        "project_id": project_id,
        "canvas_id": canvas_id,
        "template_id": template_id,
        "base_revision": request_payload["base_revision"],
        "client_mutation_id": request_payload["client_mutation_id"],
        "anchor_x": request_payload.get("anchor_x"),
        "anchor_y": request_payload.get("anchor_y"),
    }
    return hashlib.sha256(canonical_json(canonical_request).encode("utf-8")).hexdigest()


def _lock_target_and_get_revision(
    session,
    *,
    project_id: str,
    canvas_id: str,
    user_id: str,
    client_mutation_id: str,
) -> tuple[Canvas, CanvasRevision | None]:
    _owned_project(session, project_id, user_id)
    canvas = _active_canvas(session, project_id, canvas_id, lock=True)
    revision = session.scalar(
        select(CanvasRevision)
        .where(
            CanvasRevision.canvas_id == canvas_id,
            CanvasRevision.client_mutation_id == client_mutation_id,
        )
        .with_for_update()
    )
    return canvas, revision


def _reject_target_id_collisions(
    session,
    *,
    node_ids: list[str],
    connection_ids: list[str],
) -> None:
    existing_node_id = None
    if node_ids:
        existing_node_id = session.scalar(
            select(CanvasNode.id)
            .where(CanvasNode.id.in_(node_ids))
            .limit(1)
            .with_for_update()
        )
    existing_connection_id = None
    if connection_ids:
        existing_connection_id = session.scalar(
            select(CanvasConnection.id)
            .where(CanvasConnection.id.in_(connection_ids))
            .limit(1)
            .with_for_update()
        )
    if existing_node_id is not None or existing_connection_id is not None:
        raise TemplateGraphValidationError("template_target_id_collision")


def _replay_template_instantiation(
    revision: CanvasRevision,
    *,
    request_fingerprint: str,
    current_revision: int,
    template_id: str,
    project_id: str,
    canvas_id: str,
) -> dict:
    metadata = revision.operations.get(_TEMPLATE_INSTANTIATION_KEY)
    if (
        not isinstance(metadata, dict)
        or metadata.get("request_fingerprint") != request_fingerprint
        or metadata.get("template_id") != template_id
    ):
        raise mutation_controller.CanvasDocumentConflictError(
            "mutation_id_reused",
            current_revision,
        )
    return {
        "template_id": template_id,
        "project_id": project_id,
        "canvas_id": canvas_id,
        "nodes_created": metadata["nodes_created"],
        "connections_created": metadata["connections_created"],
        "node_id_map": deepcopy(metadata["node_id_map"]),
        "connection_id_map": deepcopy(metadata["connection_id_map"]),
        "mutation": mutation_controller._response_from_revision(revision),
    }


def instantiate_canvas_template(
    project_id: str,
    canvas_id: str,
    template_id: str,
    user_id: str,
    request_payload: dict,
) -> dict:
    with get_session() as session:
        request_fingerprint = _service_request_fingerprint(
            project_id,
            canvas_id,
            template_id,
            request_payload,
        )
        canvas, existing_revision = _lock_target_and_get_revision(
            session,
            project_id=project_id,
            canvas_id=canvas_id,
            user_id=user_id,
            client_mutation_id=request_payload["client_mutation_id"],
        )
        if existing_revision is not None:
            return _replay_template_instantiation(
                existing_revision,
                request_fingerprint=request_fingerprint,
                current_revision=canvas.graph_revision,
                template_id=template_id,
                project_id=project_id,
                canvas_id=canvas_id,
            )

        template = session.scalar(
            select(Template).where(Template.id == template_id).with_for_update()
        )
        if template is None:
            raise TemplateGraphNotFoundError("Template not found")
        if template.user_id != user_id:
            raise TemplateGraphForbiddenError("Template does not belong to user")
        nodes, connections = canonical_template_graph(template)
        mutation_payload, node_id_map, connection_id_map = build_template_mutation(
            template_id,
            canvas_id,
            nodes,
            connections,
            request_payload,
        )
        _reject_target_id_collisions(
            session,
            node_ids=list(node_id_map.values()),
            connection_ids=list(connection_id_map.values()),
        )
        mutation = mutation_controller.apply_document_patch_in_session(
            session,
            project_id,
            canvas_id,
            user_id,
            mutation_payload,
        )
        revision = session.scalar(
            select(CanvasRevision)
            .where(
                CanvasRevision.canvas_id == canvas_id,
                CanvasRevision.client_mutation_id == request_payload["client_mutation_id"],
            )
            .with_for_update()
        )
        if revision is None:
            raise RuntimeError("Template instantiation revision was not persisted")
        operations = deepcopy(revision.operations)
        operations[_TEMPLATE_INSTANTIATION_KEY] = {
            "request_fingerprint": request_fingerprint,
            "template_id": template_id,
            "nodes_created": len(nodes),
            "connections_created": len(connections),
            "node_id_map": deepcopy(node_id_map),
            "connection_id_map": deepcopy(connection_id_map),
        }
        revision.operations = operations
        session.commit()

    return {
        "template_id": template_id,
        "project_id": project_id,
        "canvas_id": canvas_id,
        "nodes_created": len(nodes),
        "connections_created": len(connections),
        "node_id_map": node_id_map,
        "connection_id_map": connection_id_map,
        "mutation": mutation,
    }
