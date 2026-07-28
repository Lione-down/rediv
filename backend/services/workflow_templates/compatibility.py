from __future__ import annotations

import hashlib
from typing import Any

from core.canvas_document_fingerprint import canonical_json
from schemas.workflow_template import WorkflowTemplateManifest


def _change(
    path: str,
    kind: str,
    *,
    compatible: bool,
    summary: str,
) -> dict[str, Any]:
    return {
        "path": path,
        "kind": kind,
        "compatible": compatible,
        "summary": summary,
    }


def _reason(code: str, path: str, message: str) -> dict[str, str]:
    return {"code": code, "path": path, "message": message}


def _indexed(items: list[Any], key: str) -> dict[str, dict]:
    return {
        str(item[key]): item
        for item in items
    }


def compare_workflow_template_manifests(
    source: WorkflowTemplateManifest,
    target: WorkflowTemplateManifest,
) -> dict[str, Any]:
    source_payload = source.model_dump(mode="json", exclude_none=True)
    target_payload = target.model_dump(mode="json", exclude_none=True)
    changes: list[dict[str, Any]] = []
    blockers: list[dict[str, str]] = []

    if source.template_id != target.template_id:
        blockers.append(
            _reason(
                "template_identity_changed",
                "template_id",
                "Template identity must remain exact",
            )
        )
    if target.template_version <= source.template_version:
        blockers.append(
            _reason(
                "target_version_not_newer",
                "template_version",
                "Compatible upgrade requires a newer exact version",
            )
        )
    for field in ("schema_id", "schema_version", "scope", "security", "result_policy"):
        if source_payload[field] != target_payload[field]:
            changes.append(
                _change(
                    field,
                    "changed",
                    compatible=False,
                    summary=f"{field} changed",
                )
            )
            blockers.append(
                _reason(
                    f"{field}_changed",
                    field,
                    f"{field} cannot change in a compatible upgrade",
                )
            )

    if source_payload["metadata"] != target_payload["metadata"]:
        changes.append(
            _change(
                "metadata",
                "changed",
                compatible=True,
                summary="Display metadata changed without execution semantics",
            )
        )

    if source_payload["graph"] != target_payload["graph"]:
        changes.append(
            _change(
                "graph",
                "changed",
                compatible=False,
                summary="Graph topology or ports changed",
            )
        )
        blockers.append(
            _reason(
                "graph_changed",
                "graph",
                "Graph nodes, ports, and connections must remain exact",
            )
        )

    source_steps = _indexed(source_payload["steps"], "step_id")
    target_steps = _indexed(target_payload["steps"], "step_id")
    for step_id in sorted(set(source_steps) | set(target_steps)):
        if source_steps.get(step_id) == target_steps.get(step_id):
            continue
        path = f"steps.{step_id}"
        changes.append(
            _change(
                path,
                "changed",
                compatible=False,
                summary="Workflow step semantics changed",
            )
        )
        blockers.append(
            _reason(
                "step_changed",
                path,
                "Step intent, dependencies, inputs, model policy, and capability must remain exact",
            )
        )

    source_variables = _indexed(source_payload["variables"], "key")
    target_variables = _indexed(target_payload["variables"], "key")
    for key in sorted(set(source_variables) | set(target_variables)):
        path = f"variables.{key}"
        if key not in target_variables:
            changes.append(_change(path, "removed", compatible=False, summary="Variable removed"))
            blockers.append(
                _reason("variable_removed", path, "Variables cannot be removed or renamed")
            )
        elif key not in source_variables:
            variable = target_variables[key]
            is_compatible = (
                variable.get("required") is False
                and "default" in variable
            )
            changes.append(
                _change(
                    path,
                    "added",
                    compatible=is_compatible,
                    summary=(
                        "Optional variable with a valid default added"
                        if is_compatible
                        else "New variable requires an unresolved value"
                    ),
                )
            )
            if not is_compatible:
                blockers.append(
                    _reason(
                        "required_variable_added",
                        path,
                        "New variables must be optional and have a valid default",
                    )
                )
        elif source_variables[key] != target_variables[key]:
            changes.append(
                _change(
                    path,
                    "changed",
                    compatible=False,
                    summary="Existing variable contract changed",
                )
            )
            blockers.append(
                _reason(
                    "variable_changed",
                    path,
                    "Existing variable definitions must remain exact",
                )
            )

    source_assets = _indexed(source_payload["asset_slots"], "slot_id")
    target_assets = _indexed(target_payload["asset_slots"], "slot_id")
    for slot_id in sorted(set(source_assets) | set(target_assets)):
        path = f"asset_slots.{slot_id}"
        if slot_id not in target_assets:
            changes.append(_change(path, "removed", compatible=False, summary="Asset slot removed"))
            blockers.append(
                _reason("asset_slot_removed", path, "Asset slots cannot be removed or renamed")
            )
        elif slot_id not in source_assets:
            slot = target_assets[slot_id]
            is_compatible = (
                slot.get("required") is False
                and slot.get("minimum_items") == 0
            )
            changes.append(
                _change(
                    path,
                    "added",
                    compatible=is_compatible,
                    summary=(
                        "Optional empty asset slot added"
                        if is_compatible
                        else "New asset slot requires an unresolved binding"
                    ),
                )
            )
            if not is_compatible:
                blockers.append(
                    _reason(
                        "required_asset_slot_added",
                        path,
                        "New asset slots must accept an empty default",
                    )
                )
        elif source_assets[slot_id] != target_assets[slot_id]:
            changes.append(
                _change(
                    path,
                    "changed",
                    compatible=False,
                    summary="Existing asset-slot contract changed",
                )
            )
            blockers.append(
                _reason(
                    "asset_slot_changed",
                    path,
                    "Existing asset-slot definitions must remain exact",
                )
            )

    source_allowed = set(source.override_policy.allowed_fields)
    target_allowed = set(target.override_policy.allowed_fields)
    for field in sorted(target_allowed - source_allowed):
        leaf = field.rsplit(".", 1)[-1]
        changes.append(
            _change(
                f"override_policy.allowed_fields.{leaf}",
                "added",
                compatible=True,
                summary="An additional field may be overridden locally",
            )
        )
    for field in sorted(source_allowed - target_allowed):
        path = f"override_policy.allowed_fields.{field.rsplit('.', 1)[-1]}"
        changes.append(
            _change(path, "removed", compatible=False, summary="Allowed override removed")
        )
        blockers.append(
            _reason(
                "allowed_override_removed",
                path,
                "A compatible upgrade cannot revoke a local-override allowance",
            )
        )

    source_locked = set(source.override_policy.locked_fields)
    target_locked = set(target.override_policy.locked_fields)
    for field in sorted(source_locked - target_locked):
        path = f"override_policy.locked_fields.{field}"
        changes.append(_change(path, "removed", compatible=False, summary="Template lock removed"))
        blockers.append(
            _reason(
                "locked_field_removed",
                path,
                "A locked field cannot be removed in a compatible upgrade",
            )
        )
    for field in sorted(target_locked - source_locked):
        path = f"override_policy.locked_fields.{field}"
        changes.append(_change(path, "added", compatible=False, summary="New template lock added"))
        blockers.append(
            _reason(
                "locked_field_added",
                path,
                "A new lock could invalidate an existing local override",
            )
        )

    changes.sort(key=lambda item: (item["path"], item["kind"]))
    blockers.sort(key=lambda item: (item["code"], item["path"]))
    fingerprint_payload = {
        "contract_version": 1,
        "source_version": source.template_version,
        "target_version": target.template_version,
        "changes": changes,
        "blocking_reasons": blockers,
    }
    return {
        **fingerprint_payload,
        "compatible": not blockers,
        "fingerprint": hashlib.sha256(
            canonical_json(fingerprint_payload).encode("utf-8")
        ).hexdigest(),
    }
