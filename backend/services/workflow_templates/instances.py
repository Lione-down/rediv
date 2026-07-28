from __future__ import annotations

import hashlib
from collections import defaultdict, deque
from copy import deepcopy
from typing import Any
from uuid import NAMESPACE_URL, uuid5

from core.canvas_document_fingerprint import canonical_json
from schemas.canvas_document import CanvasDocumentPatchRequest
from schemas.workflow_template import WorkflowTemplateManifest
from schemas.workflow_template_instance import WorkflowTemplateInstantiateRequest


_NODE_SHAPES = {
    "text": ("text", "text", 240, 140),
    "script": ("script", "script", 320, 200),
    "generation": ("generation", None, 340, 220),
    "asset": ("asset", "image", 320, 240),
    "group": ("group", "group", 480, 320),
}
_HORIZONTAL_GAP = 100
_VERTICAL_GAP = 80


def stable_instance_entity_id(
    *,
    template_id: str,
    template_version: int,
    canvas_id: str,
    client_mutation_id: str,
    entity_kind: str,
    local_id: str,
) -> str:
    identity = canonical_json(
        [
            "revid",
            "workflow-template",
            template_id,
            template_version,
            canvas_id,
            client_mutation_id,
            entity_kind,
            local_id,
        ]
    )
    return str(uuid5(NAMESPACE_URL, identity))


def instantiate_request_fingerprint(
    *,
    project_id: str,
    canvas_id: str,
    request: WorkflowTemplateInstantiateRequest,
) -> str:
    payload = {
        "project_id": project_id,
        "canvas_id": canvas_id,
        "request": request.model_dump(mode="json", exclude_none=True),
    }
    return hashlib.sha256(canonical_json(payload).encode("utf-8")).hexdigest()


def _node_levels(manifest: WorkflowTemplateManifest) -> dict[str, int]:
    incoming = {node.local_id: 0 for node in manifest.graph.nodes}
    adjacency: dict[str, list[str]] = defaultdict(list)
    for connection in manifest.graph.connections:
        source_id = connection.source_node_local_id
        target_id = connection.target_node_local_id
        adjacency[source_id].append(target_id)
        incoming[target_id] += 1
    queue = deque(sorted(node_id for node_id, count in incoming.items() if count == 0))
    levels = {node_id: 0 for node_id in incoming}
    while queue:
        node_id = queue.popleft()
        for target_id in sorted(adjacency[node_id]):
            levels[target_id] = max(levels[target_id], levels[node_id] + 1)
            incoming[target_id] -= 1
            if incoming[target_id] == 0:
                queue.append(target_id)
    return levels


def build_instance_projection(
    *,
    manifest: WorkflowTemplateManifest,
    canvas_id: str,
    request: WorkflowTemplateInstantiateRequest,
) -> tuple[dict, dict[str, str], dict[str, str], str]:
    instance_id = stable_instance_entity_id(
        template_id=manifest.template_id,
        template_version=manifest.template_version,
        canvas_id=canvas_id,
        client_mutation_id=request.client_mutation_id,
        entity_kind="instance",
        local_id="instance",
    )
    node_id_map = {
        node.local_id: stable_instance_entity_id(
            template_id=manifest.template_id,
            template_version=manifest.template_version,
            canvas_id=canvas_id,
            client_mutation_id=request.client_mutation_id,
            entity_kind="node",
            local_id=node.local_id,
        )
        for node in manifest.graph.nodes
    }
    connection_id_map = {
        connection.local_id: stable_instance_entity_id(
            template_id=manifest.template_id,
            template_version=manifest.template_version,
            canvas_id=canvas_id,
            client_mutation_id=request.client_mutation_id,
            entity_kind="connection",
            local_id=connection.local_id,
        )
        for connection in manifest.graph.connections
    }
    levels = _node_levels(manifest)
    rows_by_level: dict[int, int] = defaultdict(int)
    anchor_x = request.anchor.x if request.anchor is not None else 80.0
    anchor_y = request.anchor.y if request.anchor is not None else 80.0
    node_upserts = []
    for z_index, node in enumerate(manifest.graph.nodes):
        level = levels[node.local_id]
        row = rows_by_level[level]
        rows_by_level[level] += 1
        node_type, default_subtype, width, height = _NODE_SHAPES[node.node_type]
        subtype = node.subtype or default_subtype
        content: dict[str, Any] = {
            "serialization_version": 1,
            "template_placeholder": True,
        }
        if subtype is not None:
            content["subtype"] = subtype
        node_upserts.append(
            {
                "id": node_id_map[node.local_id],
                "node_type": node_type,
                "content": content,
                "position_x": anchor_x + level * (340 + _HORIZONTAL_GAP),
                "position_y": anchor_y + row * (240 + _VERTICAL_GAP),
                "width": width,
                "height": height,
                "z_index": z_index,
                "parent_node_id": None,
                "is_locked": False,
                "is_collapsed": False,
            }
        )
    connection_upserts = [
        {
            "id": connection_id_map[connection.local_id],
            "source_node_id": node_id_map[connection.source_node_local_id],
            "source_port": connection.source_port,
            "target_node_id": node_id_map[connection.target_node_local_id],
            "target_port": connection.target_port,
            "metadata": {},
        }
        for connection in manifest.graph.connections
    ]
    mutation = CanvasDocumentPatchRequest.model_validate(
        {
            "base_revision": request.base_revision,
            "client_mutation_id": request.client_mutation_id,
            "node_upserts": node_upserts,
            "node_deletes": [],
            "connection_upserts": connection_upserts,
            "connection_deletes": [],
        }
    ).model_dump(mode="json")
    return mutation, node_id_map, connection_id_map, instance_id


def response_from_replay_metadata(
    *,
    metadata: dict,
    mutation: dict,
    project_id: str,
    canvas_id: str,
) -> dict:
    return {
        "instance_id": metadata["instance_id"],
        "template_id": metadata["template_id"],
        "template_version": metadata["template_version"],
        "project_id": project_id,
        "canvas_id": canvas_id,
        "state": "instantiated",
        "preflight_fingerprint": metadata["preflight_fingerprint"],
        "node_id_map": deepcopy(metadata["node_id_map"]),
        "connection_id_map": deepcopy(metadata["connection_id_map"]),
        "binding_id_map": deepcopy(metadata["binding_id_map"]),
        "step_id_map": deepcopy(metadata["step_id_map"]),
        "mutation": mutation,
    }
