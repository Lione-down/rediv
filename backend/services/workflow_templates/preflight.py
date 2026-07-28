from __future__ import annotations

import hashlib
from typing import Any

from core.canvas_document_fingerprint import canonical_json
from core.generation_parameter_contract import CAPABILITY_CONTRACT_VERSION
from core.workflow_template_contract import workflow_template_fingerprint
from schemas.workflow_template import WorkflowTemplateManifest
from services.workflow_templates.portable_classifier import asset_source_revision


_SOURCE_PORTS = {
    "text": {"out"},
    "script": {"out"},
    "generation": {"out"},
    "asset": {"out"},
    "group": {"out"},
}
_TARGET_PORTS = {
    "text": {"in", "prompt"},
    "script": {"in", "prompt"},
    "generation": {"in", "prompt", "media"},
    "asset": {"in"},
    "group": {"in"},
}
_TARGET_CAPACITY = {"in": 1, "prompt": 25, "media": 9}


def _error(code: str, message: str) -> dict[str, str]:
    return {"code": code, "message": message}


def _base_result(manifest: WorkflowTemplateManifest) -> dict[str, Any]:
    return {
        "contract_version": 1,
        "template": {
            "id": manifest.template_id,
            "version": manifest.template_version,
        },
        "executable": False,
        "errors": [],
        "warnings": [],
        "resolved_slots": [],
        "graph_summary": {
            "nodes": len(manifest.graph.nodes),
            "connections": len(manifest.graph.connections),
        },
        "capability_snapshot": {"version": 0},
        "quota_estimate": {"text": 0, "image": 0, "video": 0},
        "cost_class": "included",
        "fingerprint": "",
    }


def _fail(result: dict[str, Any], code: str, message: str) -> dict[str, Any]:
    result["errors"] = [_error(code, message)]
    return result


def _resolve_variable(variable: Any, bindings: dict[str, Any]) -> tuple[bool, Any]:
    value = bindings.get(variable.key, variable.default)
    if value is None:
        return (not variable.required, None)
    if variable.type in {"text", "multiline", "enum"}:
        if not isinstance(value, str):
            return False, None
        if variable.max_length is not None and len(value) > variable.max_length:
            return False, None
        if variable.type == "enum" and value not in (variable.options or []):
            return False, None
    elif variable.type == "integer":
        if isinstance(value, bool) or not isinstance(value, int):
            return False, None
        if variable.minimum is not None and value < variable.minimum:
            return False, None
        if variable.maximum is not None and value > variable.maximum:
            return False, None
    elif variable.type == "boolean":
        if not isinstance(value, bool):
            return False, None
    elif variable.type == "bounded_list":
        if (
            not isinstance(value, list)
            or len(value) > 100
            or any(not isinstance(item, str) for item in value)
        ):
            return False, None
    return True, value


def _graph_error(manifest: WorkflowTemplateManifest) -> str | None:
    nodes = {node.local_id: node for node in manifest.graph.nodes}
    target_counts: dict[tuple[str, str], int] = {}
    adjacency = {node_id: set() for node_id in nodes}
    for connection in manifest.graph.connections:
        source = nodes[connection.source_node_local_id]
        target = nodes[connection.target_node_local_id]
        if connection.source_port not in _SOURCE_PORTS[source.node_type]:
            return "workflow_template_graph_port_invalid"
        if connection.target_port not in _TARGET_PORTS[target.node_type]:
            return "workflow_template_graph_port_invalid"
        key = (target.local_id, connection.target_port)
        target_counts[key] = target_counts.get(key, 0) + 1
        if target_counts[key] > _TARGET_CAPACITY[connection.target_port]:
            return "workflow_template_graph_capacity_invalid"
        adjacency[source.local_id].add(target.local_id)

    visiting: set[str] = set()
    visited: set[str] = set()

    def visit(node_id: str) -> bool:
        if node_id in visiting:
            return False
        if node_id in visited:
            return True
        visiting.add(node_id)
        if any(not visit(target) for target in adjacency[node_id]):
            return False
        visiting.remove(node_id)
        visited.add(node_id)
        return True

    if any(not visit(node_id) for node_id in nodes):
        return "workflow_template_graph_cycle"
    return None


def _supported_requirements(capabilities: dict[str, Any]) -> set[str]:
    supported: set[str] = set()
    if capabilities.get("text", {}).get("story_director", {}).get("available"):
        supported.add("text.tool_calling")
    if capabilities.get("image", {}).get("models"):
        supported.add("image.text_or_single_image")
    video = capabilities.get("video", {})
    modes = set(video.get("reference_modes", []))
    if {"text-to-video", "image-to-video", "keyframes"}.issubset(modes):
        supported.add("video.text_or_single_image_or_keyframes")
    return supported


def run_provider_free_preflight(
    *,
    manifest: WorkflowTemplateManifest,
    owner_user_id: str,
    project_id: str,
    canvas_id: str,
    variable_bindings: dict[str, Any],
    asset_bindings: dict[str, list[Any]],
    assets_by_id: dict[str, Any],
    capabilities: dict[str, Any],
    quota_balances: dict[str, int],
    cost_confirmed: bool,
) -> dict[str, Any]:
    result = _base_result(manifest)

    declared_variables = {item.key: item for item in manifest.variables}
    if set(variable_bindings) - set(declared_variables):
        return _fail(
            result,
            "workflow_template_variable_unknown",
            "Variable binding is not declared",
        )
    resolved_variables: dict[str, Any] = {}
    for key in sorted(declared_variables):
        valid, value = _resolve_variable(declared_variables[key], variable_bindings)
        if not valid:
            return _fail(
                result,
                "workflow_template_variable_type_invalid",
                "Variable binding is missing or invalid",
            )
        resolved_variables[key] = value

    declared_slots = {item.slot_id: item for item in manifest.asset_slots}
    if set(asset_bindings) - set(declared_slots):
        return _fail(
            result,
            "workflow_template_asset_slot_unknown",
            "Asset binding slot is not declared",
        )
    resolved_assets: dict[str, list[dict[str, str]]] = {}
    for slot_id in sorted(declared_slots):
        slot = declared_slots[slot_id]
        bindings = asset_bindings.get(slot_id, [])
        if not slot.minimum_items <= len(bindings) <= slot.maximum_items:
            return _fail(
                result,
                "workflow_template_asset_cardinality_invalid",
                "Asset binding count is invalid",
            )
        resolved: list[dict[str, str]] = []
        seen: set[str] = set()
        for binding in bindings:
            if binding.asset_id in seen:
                return _fail(
                    result,
                    "workflow_template_asset_binding_duplicate",
                    "Asset binding is duplicated",
                )
            seen.add(binding.asset_id)
            asset = assets_by_id.get(binding.asset_id)
            if (
                asset is None
                or asset.user_id != owner_user_id
                or asset.project_id != project_id
                or asset.status != "active"
                or asset.type != slot.media_type
            ):
                return _fail(
                    result,
                    "workflow_template_asset_unavailable",
                    "Asset binding is unavailable",
                )
            revision = asset_source_revision(asset)
            if binding.source_revision != revision:
                return _fail(
                    result,
                    "workflow_template_asset_revision_stale",
                    "Asset source revision is stale",
                )
            resolved.append(
                {
                    "asset_id": binding.asset_id,
                    "source_revision": revision,
                }
            )
        resolved_assets[slot_id] = resolved

    graph_error = _graph_error(manifest)
    if graph_error is not None:
        return _fail(result, graph_error, "Workflow-template graph is invalid")

    result["capability_snapshot"] = {
        "version": capabilities.get("contract_version", CAPABILITY_CONTRACT_VERSION)
    }
    supported = _supported_requirements(capabilities)
    required = {
        requirement
        for step in manifest.steps
        for requirement in step.capability_requirements
    }
    if not required.issubset(supported):
        return _fail(
            result,
            "workflow_template_capability_unsupported",
            "Required generation capability is unavailable",
        )

    shot_count = resolved_variables.get("shot_count", 1)
    if isinstance(shot_count, bool) or not isinstance(shot_count, int):
        shot_count = 1
    estimate = {"text": 0, "image": 0, "video": 0}
    for step in manifest.steps:
        if step.intent == "story-production":
            estimate["text"] += 1
        elif step.intent in {"shot-image", "image-precomposition"}:
            estimate["image"] += shot_count if step.intent == "shot-image" else 1
        elif step.intent == "shot-video":
            estimate["video"] += shot_count
    result["quota_estimate"] = estimate
    if any(quota_balances.get(key, 0) < value for key, value in estimate.items()):
        return _fail(
            result,
            "workflow_template_quota_insufficient",
            "Quota is insufficient for the estimated workflow",
        )

    result["cost_class"] = (
        "requires_confirmation" if sum(estimate.values()) else "included"
    )
    if result["cost_class"] == "requires_confirmation" and not cost_confirmed:
        return _fail(
            result,
            "workflow_template_cost_confirmation_required",
            "Cost confirmation is required",
        )

    result["resolved_slots"] = [
        *[
            {"slot_id": key, "kind": "variable", "value": resolved_variables[key]}
            for key in sorted(resolved_variables)
        ],
        *[
            {
                "slot_id": key,
                "kind": "asset",
                "items": resolved_assets[key],
            }
            for key in sorted(resolved_assets)
        ],
    ]
    fingerprint_payload = {
        "contract_version": 1,
        "template": {
            "id": manifest.template_id,
            "version": manifest.template_version,
            "fingerprint": workflow_template_fingerprint(manifest),
        },
        "scope": {"project_id": project_id, "canvas_id": canvas_id},
        "resolved_variables": resolved_variables,
        "resolved_assets": resolved_assets,
        "capability_version": result["capability_snapshot"]["version"],
        "quota_estimate": estimate,
        "cost_class": result["cost_class"],
        "cost_confirmed": cost_confirmed,
    }
    result["fingerprint"] = hashlib.sha256(
        canonical_json(fingerprint_payload).encode("utf-8")
    ).hexdigest()
    result["executable"] = True
    return result
