from __future__ import annotations

import hashlib
from collections.abc import Iterable
from copy import deepcopy
from datetime import UTC, datetime
from typing import Any

from core.canvas_document_fingerprint import canonical_json
from core.workflow_template_contract import (
    classify_workflow_template_field,
    workflow_template_fingerprint,
)
from schemas.workflow_template import WorkflowTemplateManifest


class PortableCaptureError(ValueError):
    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code


_ASSET_KEYS = {
    "asset_id",
    "result_asset_id",
    "reference_asset_id",
}
_ASSET_LIST_KEYS = {
    "image_ids",
    "reference_asset_ids",
}
_STRIP_PATHS = {
    "job_id": "generation.job_id",
    "active_generation_job_id": "generation.job_id",
    "last_generation_job_id": "generation.job_id",
    "provider_task_id": "generation.provider_task_id",
    "source_task_id": "generation.provider_task_id",
    "result_url": "generation.result_url",
    "url": "generation.result_url",
    "result_base64": "generation.result_base64",
    "base64": "generation.result_base64",
    "quota_ledger_id": "billing.quota_ledger_id",
    "owner_id": "ownership.owner_id",
    "user_id": "ownership.owner_id",
    "local_path": "runtime.local_path",
    "provider_endpoint": "runtime.provider_endpoint",
    "authorization": "runtime.authorization",
    "raw_response": "runtime.raw_response",
    "prompt": "runtime.source_content",
    "source_text": "runtime.source_content",
    "content_text": "runtime.source_content",
}
_PORTABLE_CONTENT_KEYS = {
    "subtype",
    "title",
    "label",
    "name",
    "description",
    "type",
    "role",
    "order",
    "mode",
    "parameters",
    "aspect_ratio",
    "size",
    "duration_seconds",
    "negative_prompt_present",
    "is_placeholder",
    "status",
    "media_type",
    "reference_mode",
    "output_count",
    "shot_id",
    "shot_index",
    "source_script_node_id",
    "video_references",
    "references",
    "segments",
}
_NODE_TYPE_MAP = {
    "note": "text",
    "text": "text",
    "script": "script",
    "generation": "generation",
    "group": "group",
    "asset": "asset",
    "result": "asset",
    "image": "asset",
    "video": "asset",
    "audio": "asset",
}


def asset_source_revision(asset: Any) -> str:
    updated_at = asset.updated_at
    if isinstance(updated_at, datetime):
        if updated_at.tzinfo is None:
            updated_at = updated_at.replace(tzinfo=UTC)
        updated_at = updated_at.isoformat()
    payload = {
        "id": asset.id,
        "media_type": asset.type,
        "owner_id": asset.user_id,
        "project_id": asset.project_id,
        "source": asset.source,
        "status": asset.status,
        "updated_at": updated_at,
    }
    return hashlib.sha256(canonical_json(payload).encode("utf-8")).hexdigest()


def _record_classification(
    classifications: set[tuple[str, str]],
    path: str,
    classification: str,
) -> None:
    classifications.add((path, classification))


def _scan_capture_value(
    value: Any,
    *,
    path: str,
    asset_ids: set[str],
    classifications: set[tuple[str, str]],
) -> None:
    if isinstance(value, dict):
        for key, child in value.items():
            if key in _ASSET_KEYS:
                if not isinstance(child, str) or not child.strip():
                    raise PortableCaptureError("workflow_template_asset_reference_invalid")
                asset_ids.add(child)
                _record_classification(
                    classifications,
                    "canvas.project_asset_id",
                    classify_workflow_template_field("canvas.project_asset_id"),
                )
                continue
            if key in _ASSET_LIST_KEYS:
                if (
                    not isinstance(child, list)
                    or any(not isinstance(item, str) or not item.strip() for item in child)
                ):
                    raise PortableCaptureError("workflow_template_asset_reference_invalid")
                asset_ids.update(child)
                _record_classification(
                    classifications,
                    "canvas.project_asset_id",
                    classify_workflow_template_field("canvas.project_asset_id"),
                )
                continue
            strip_path = _STRIP_PATHS.get(key)
            if strip_path is not None:
                _record_classification(classifications, strip_path, "strip")
                continue
            if key not in _PORTABLE_CONTENT_KEYS:
                raise PortableCaptureError("workflow_template_field_unclassified")
            _record_classification(classifications, f"{path}.{key}", "portable")
            _scan_capture_value(
                child,
                path=f"{path}.{key}",
                asset_ids=asset_ids,
                classifications=classifications,
            )
        return
    if isinstance(value, list):
        for child in value:
            _scan_capture_value(
                child,
                path=f"{path}.*",
                asset_ids=asset_ids,
                classifications=classifications,
            )
        return
    if value is None or isinstance(value, (str, int, float, bool)):
        return
    raise PortableCaptureError("workflow_template_field_unclassified")


def _node_type(node: Any) -> tuple[str, str | None]:
    node_type = _NODE_TYPE_MAP.get(node.node_type)
    if node_type is None:
        raise PortableCaptureError("workflow_template_node_type_unsupported")
    subtype = None
    if node_type == "generation":
        raw_subtype = node.content.get("subtype") if isinstance(node.content, dict) else None
        if raw_subtype not in {"image", "video"}:
            raise PortableCaptureError("workflow_template_generation_subtype_invalid")
        subtype = raw_subtype
    return node_type, subtype


def build_portable_capture(
    *,
    nodes: Iterable[Any],
    connections: Iterable[Any],
    assets_by_id: dict[str, Any],
    owner_user_id: str,
    project_id: str,
    request: Any,
) -> dict[str, Any]:
    ordered_nodes = list(nodes)
    ordered_connections = list(connections)
    if not ordered_nodes:
        raise PortableCaptureError("workflow_template_graph_empty")

    node_id_map = {
        node.id: f"node-{index:03d}"
        for index, node in enumerate(ordered_nodes, start=1)
    }
    classifications: set[tuple[str, str]] = {
        ("graph.nodes.*.local_id", "remap_local_id"),
        ("graph.connections.*.local_id", "remap_local_id"),
        ("layout.position", "portable"),
    }
    referenced_asset_ids: set[str] = set()
    graph_nodes: list[dict[str, Any]] = []
    for node in ordered_nodes:
        if not isinstance(node.content, dict):
            raise PortableCaptureError("workflow_template_node_content_invalid")
        _scan_capture_value(
            node.content,
            path="content",
            asset_ids=referenced_asset_ids,
            classifications=classifications,
        )
        node_type, subtype = _node_type(node)
        graph_node = {"local_id": node_id_map[node.id], "node_type": node_type}
        if subtype is not None:
            graph_node["subtype"] = subtype
        graph_nodes.append(graph_node)

    graph_connections: list[dict[str, Any]] = []
    for index, connection in enumerate(ordered_connections, start=1):
        if (
            connection.source_node_id not in node_id_map
            or connection.target_node_id not in node_id_map
        ):
            raise PortableCaptureError("workflow_template_graph_endpoint_invalid")
        if connection.metadata_:
            _scan_capture_value(
                connection.metadata_,
                path="connection.metadata",
                asset_ids=referenced_asset_ids,
                classifications=classifications,
            )
        graph_connections.append(
            {
                "local_id": f"connection-{index:03d}",
                "source_node_local_id": node_id_map[connection.source_node_id],
                "source_port": connection.source_port,
                "target_node_local_id": node_id_map[connection.target_node_id],
                "target_port": connection.target_port,
            }
        )

    promotion_by_asset: dict[str, Any] = {}
    slot_ids: set[str] = set()
    for promotion in request.asset_promotions:
        if promotion.asset_id in promotion_by_asset or promotion.slot.slot_id in slot_ids:
            raise PortableCaptureError("workflow_template_asset_promotion_duplicate")
        promotion_by_asset[promotion.asset_id] = promotion
        slot_ids.add(promotion.slot.slot_id)
    if set(promotion_by_asset) != referenced_asset_ids:
        raise PortableCaptureError("workflow_template_asset_promotion_required")

    binding_candidates: list[dict[str, str]] = []
    asset_slots: list[dict[str, Any]] = []
    for asset_id, promotion in sorted(
        promotion_by_asset.items(),
        key=lambda item: item[1].slot.slot_id,
    ):
        asset = assets_by_id.get(asset_id)
        if (
            asset is None
            or asset.user_id != owner_user_id
            or asset.project_id != project_id
            or asset.status != "active"
            or asset.type != promotion.slot.media_type
        ):
            raise PortableCaptureError("workflow_template_asset_unavailable")
        asset_slots.append(
            promotion.slot.model_dump(mode="json", exclude_none=True)
        )
        binding_candidates.append(
            {
                "slot_id": promotion.slot.slot_id,
                "asset_id": asset.id,
                "source_revision": asset_source_revision(asset),
            }
        )

    manifest = WorkflowTemplateManifest.model_validate(
        {
            "schema_id": "revid.workflow-template",
            "schema_version": 1,
            "template_id": request.template_id,
            "template_version": 1,
            "lifecycle": "draft",
            "scope": "private",
            "metadata": request.metadata.model_dump(mode="json"),
            "variables": [
                item.model_dump(mode="json", exclude_none=True)
                for item in request.variables
            ],
            "asset_slots": asset_slots,
            "graph": {
                "nodes": graph_nodes,
                "connections": graph_connections,
            },
            "steps": [
                item.model_dump(mode="json", exclude_none=True)
                for item in request.steps
            ],
            "override_policy": request.override_policy.model_dump(mode="json"),
            "result_policy": request.result_policy.model_dump(mode="json"),
            "security": request.security.model_dump(mode="json"),
        }
    )
    normalized = manifest.model_dump(mode="json", exclude_none=True)
    return {
        "manifest": normalized,
        "fingerprint": workflow_template_fingerprint(manifest),
        "classifications": [
            {"path": path, "classification": classification}
            for path, classification in sorted(classifications)
        ],
        "binding_candidates": binding_candidates,
    }
