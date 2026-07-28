from __future__ import annotations

from copy import deepcopy
from typing import Any

from sqlalchemy import select

from models.canvas_connection import CanvasConnection
from models.canvas_node import CanvasNode
from models.workflow_template import WorkflowTemplateInstance
from models.workflow_template_lineage import WorkflowTemplateInstanceCommit


_SERVER_LINEAGE_KEYS = {
    "workflow_template_lineage",
    "workflow_template_instance",
}
_NODE_FIELDS = (
    "node_type",
    "content",
    "position_x",
    "position_y",
    "width",
    "height",
    "z_index",
    "parent_node_id",
    "is_locked",
    "is_collapsed",
)


def _node_snapshot(node: CanvasNode) -> dict[str, Any]:
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


def _display_name(path: str) -> str:
    if ".content.script_document" in path:
        return "脚本内容"
    if ".content" in path:
        return "卡片内容"
    if path.endswith(("position_x", "position_y", "z_index")):
        return "画布位置"
    if "connections" in path:
        return "连接关系"
    if path.endswith("missing"):
        return "节点缺失"
    return "本地画布修改"


def _override(path: str, kind: str) -> dict[str, Any]:
    return {
        "path": path,
        "kind": kind,
        "protected": True,
        "display_name": _display_name(path),
    }


def _content_differences(
    local_id: str,
    baseline: dict[str, Any],
    current: dict[str, Any],
) -> list[dict[str, Any]]:
    changes: list[dict[str, Any]] = []
    keys = sorted((set(baseline) | set(current)) - _SERVER_LINEAGE_KEYS)
    for key in keys:
        if baseline.get(key) == current.get(key):
            continue
        changes.append(
            _override(
                f"canvas.nodes.{local_id}.content.{key}",
                "content_changed",
            )
        )
    return changes


def detect_instance_local_overrides(
    session,
    *,
    instance: WorkflowTemplateInstance,
) -> tuple[list[dict[str, Any]], dict[str, CanvasNode]]:
    commit = session.get(WorkflowTemplateInstanceCommit, instance.id)
    baseline_mutation = (
        commit.response_snapshot.get("mutation")
        if commit is not None and isinstance(commit.response_snapshot, dict)
        else None
    )
    if not isinstance(baseline_mutation, dict):
        return [_override("canvas.baseline.missing", "baseline_missing")], {}

    baseline_nodes = {
        item["id"]: item
        for item in baseline_mutation.get("node_upserts", [])
        if isinstance(item, dict) and isinstance(item.get("id"), str)
    }
    local_by_node_id = {
        node_id: local_id
        for local_id, node_id in instance.node_id_map.items()
    }
    current_nodes = {
        node.id: node
        for node in session.scalars(
            select(CanvasNode)
            .where(
                CanvasNode.canvas_id == instance.canvas_id,
                CanvasNode.id.in_(list(local_by_node_id) or [""]),
                CanvasNode.status != "deleted",
            )
            .with_for_update()
        ).all()
    }
    overrides: list[dict[str, Any]] = []
    for node_id, local_id in sorted(
        local_by_node_id.items(),
        key=lambda item: item[1],
    ):
        current = current_nodes.get(node_id)
        baseline = baseline_nodes.get(node_id)
        if current is None:
            overrides.append(
                _override(
                    f"canvas.nodes.{local_id}.missing",
                    "node_missing",
                )
            )
            continue
        if baseline is None:
            overrides.append(
                _override(
                    f"canvas.nodes.{local_id}",
                    "baseline_node_missing",
                )
            )
            continue
        current_payload = _node_snapshot(current)
        for field in _NODE_FIELDS:
            if field == "content":
                overrides.extend(
                    _content_differences(
                        local_id,
                        baseline.get("content", {}),
                        current_payload["content"],
                    )
                )
            elif baseline.get(field) != current_payload[field]:
                overrides.append(
                    _override(
                        f"canvas.nodes.{local_id}.{field}",
                        "node_field_changed",
                    )
                )

    baseline_connections = {
        item["id"]: item
        for item in baseline_mutation.get("connection_upserts", [])
        if isinstance(item, dict) and isinstance(item.get("id"), str)
    }
    managed_node_ids = set(local_by_node_id)
    current_connections = {
        connection.id: connection
        for connection in session.scalars(
            select(CanvasConnection)
            .where(
                CanvasConnection.canvas_id == instance.canvas_id,
                (
                    CanvasConnection.source_node_id.in_(
                        list(managed_node_ids) or [""]
                    )
                    | CanvasConnection.target_node_id.in_(
                        list(managed_node_ids) or [""]
                    )
                ),
                CanvasConnection.status != "deleted",
            )
            .with_for_update()
        ).all()
    }
    for connection_id in sorted(set(baseline_connections) | set(current_connections)):
        baseline = baseline_connections.get(connection_id)
        current = current_connections.get(connection_id)
        if baseline is None:
            overrides.append(
                _override(
                    f"canvas.connections.{connection_id}",
                    "connection_added",
                )
            )
        elif current is None:
            overrides.append(
                _override(
                    f"canvas.connections.{connection_id}",
                    "connection_removed",
                )
            )
        else:
            current_shape = {
                "source_node_id": current.source_node_id,
                "source_port": current.source_port,
                "target_node_id": current.target_node_id,
                "target_port": current.target_port,
                "metadata": deepcopy(current.metadata_),
            }
            baseline_shape = {
                key: baseline.get(key)
                for key in current_shape
            }
            if current_shape != baseline_shape:
                overrides.append(
                    _override(
                        f"canvas.connections.{connection_id}",
                        "connection_changed",
                    )
                )

    persisted = (
        instance.local_overrides.get("items", [])
        if isinstance(instance.local_overrides, dict)
        else []
    )
    merged = {
        (item["path"], item["kind"]): deepcopy(item)
        for item in [*persisted, *overrides]
        if isinstance(item, dict)
        and isinstance(item.get("path"), str)
        and isinstance(item.get("kind"), str)
    }
    resolved = sorted(
        merged.values(),
        key=lambda item: (item["path"], item["kind"]),
    )
    return resolved, current_nodes


def local_override_snapshot(items: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "contract_version": 1,
        "items": deepcopy(items),
    }


def remap_local_overrides(
    items: list[dict[str, Any]],
    replacements: dict[str, str],
) -> list[dict[str, Any]]:
    remapped = []
    for source in items:
        item = deepcopy(source)
        item["path"] = ".".join(
            replacements.get(segment, segment)
            for segment in item["path"].split(".")
        )
        remapped.append(item)
    return remapped
