from __future__ import annotations

import hashlib
from copy import deepcopy
from typing import Any

from core.canvas_document_fingerprint import canonical_json
from models.canvas_node import CanvasNode


def instance_lifecycle_request_fingerprint(
    *,
    project_id: str,
    canvas_id: str,
    instance_id: str,
    action: str,
    request: Any,
) -> str:
    payload = {
        "project_id": project_id,
        "canvas_id": canvas_id,
        "instance_id": instance_id,
        "action": action,
        "request": request.model_dump(mode="json", exclude_none=True),
    }
    return hashlib.sha256(canonical_json(payload).encode("utf-8")).hexdigest()


def instance_diff_fingerprint(payload: dict[str, Any]) -> str:
    return hashlib.sha256(canonical_json(payload).encode("utf-8")).hexdigest()


def _remap_structured(value: Any, replacements: dict[str, str]) -> Any:
    if isinstance(value, str):
        return replacements.get(value, value)
    if isinstance(value, list):
        return [_remap_structured(item, replacements) for item in value]
    if isinstance(value, dict):
        return {
            key: _remap_structured(item, replacements)
            for key, item in value.items()
        }
    return deepcopy(value)


def lifecycle_node_content(
    content: dict[str, Any],
    *,
    template_id: str,
    template_version: int,
    instance_id: str,
    managed: bool,
    replacements: dict[str, str] | None = None,
) -> dict[str, Any]:
    result = _remap_structured(content, replacements or {})
    lineage = result.get("workflow_template_lineage")
    if isinstance(lineage, dict) and lineage.get("contract_version") == 1:
        lineage["template_id"] = template_id
        lineage["template_version"] = template_version
        lineage["instance_id"] = instance_id
    result["workflow_template_instance"] = {
        "contract_version": 1,
        "template_id": template_id,
        "template_version": template_version,
        "instance_id": instance_id,
        "managed": managed,
    }
    return result


def node_upsert_payload(
    node: CanvasNode,
    *,
    content: dict[str, Any] | None = None,
    position_x: float | None = None,
    position_y: float | None = None,
    parent_node_id: str | None | object = ...,
) -> dict[str, Any]:
    resolved_parent = (
        node.parent_node_id
        if parent_node_id is ...
        else parent_node_id
    )
    return {
        "id": node.id,
        "node_type": node.node_type,
        "content": deepcopy(content if content is not None else node.content),
        "position_x": node.position_x if position_x is None else position_x,
        "position_y": node.position_y if position_y is None else position_y,
        "width": node.width,
        "height": node.height,
        "z_index": node.z_index,
        "parent_node_id": resolved_parent,
        "is_locked": node.is_locked,
        "is_collapsed": node.is_collapsed,
    }
