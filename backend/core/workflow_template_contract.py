from __future__ import annotations

import hashlib
from typing import Any, Literal

from core.canvas_document_fingerprint import canonical_json
from schemas.workflow_template import WorkflowTemplateManifest


PortabilityClassification = Literal[
    "portable",
    "remap_local_id",
    "promote_to_asset_slot",
    "revalidate_binding",
    "strip",
    "server_owned_reference",
]


def canonical_workflow_template_json(payload: dict[str, Any] | WorkflowTemplateManifest) -> str:
    manifest = (
        payload
        if isinstance(payload, WorkflowTemplateManifest)
        else WorkflowTemplateManifest.model_validate(payload)
    )
    return canonical_json(manifest.model_dump(mode="json", exclude_none=True))


def workflow_template_fingerprint(
    payload: dict[str, Any] | WorkflowTemplateManifest,
) -> str:
    canonical = canonical_workflow_template_json(payload)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def classify_workflow_template_field(path: str) -> PortabilityClassification:
    if path in {"graph.nodes.*.local_id", "graph.connections.*.local_id"}:
        return "remap_local_id"
    if path == "canvas.project_asset_id":
        return "promote_to_asset_slot"
    if path == "binding.source_revision":
        return "revalidate_binding"
    if path == "prompt.system_contract":
        return "server_owned_reference"
    if path.startswith(("generation.", "billing.", "ownership.", "runtime.")):
        return "strip"
    if path == "layout.position":
        return "portable"
    raise ValueError("workflow_template_field_unclassified")
