from __future__ import annotations

from typing import Any, Literal

from pydantic import Field

from schemas.canvas_document import (
    MAX_SAFE_JSON_INTEGER,
    VIEWPORT_COORDINATE_LIMIT,
    CanvasDocumentPatchResponse,
)
from schemas.workflow_template import (
    Fingerprint,
    StrictContractModel,
    WorkflowTemplateAssetBindingInput,
)


class WorkflowTemplateInstanceAnchor(StrictContractModel):
    x: float = Field(
        ge=-VIEWPORT_COORDINATE_LIMIT,
        le=VIEWPORT_COORDINATE_LIMIT,
    )
    y: float = Field(
        ge=-VIEWPORT_COORDINATE_LIMIT,
        le=VIEWPORT_COORDINATE_LIMIT,
    )


class WorkflowTemplateInstantiateRequest(StrictContractModel):
    template_id: str = Field(pattern=r"^[a-z][a-z0-9.-]{2,127}$")
    template_version: int = Field(ge=1)
    base_revision: int = Field(ge=0, le=MAX_SAFE_JSON_INTEGER)
    client_mutation_id: str = Field(min_length=1, max_length=64)
    anchor: WorkflowTemplateInstanceAnchor | None = None
    variable_bindings: dict[str, Any] = Field(default_factory=dict, max_length=100)
    asset_bindings: dict[str, list[WorkflowTemplateAssetBindingInput]] = Field(
        default_factory=dict,
        max_length=50,
    )
    cost_confirmed: bool = False
    preflight_fingerprint: Fingerprint = Field(pattern=r"^[0-9a-f]{64}$")


class WorkflowTemplateInstantiateResponse(StrictContractModel):
    instance_id: str
    template_id: str
    template_version: int = Field(ge=1)
    project_id: str
    canvas_id: str
    state: Literal["instantiated"]
    preflight_fingerprint: Fingerprint = Field(pattern=r"^[0-9a-f]{64}$")
    node_id_map: dict[str, str]
    connection_id_map: dict[str, str]
    binding_id_map: dict[str, list[str]]
    step_id_map: dict[str, str]
    mutation: CanvasDocumentPatchResponse
