from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator

from schemas.canvas_document import (
    MAX_SAFE_JSON_INTEGER,
    CanvasDocumentPatchResponse,
    VIEWPORT_COORDINATE_LIMIT,
)


class TemplateCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    project_id: str = Field(..., min_length=1)


class CanvasTemplateCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    name: str = Field(..., min_length=1, max_length=255)


class TemplateInstantiateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False, str_strip_whitespace=True)

    base_revision: int = Field(..., ge=0, le=MAX_SAFE_JSON_INTEGER)
    client_mutation_id: str = Field(..., min_length=1, max_length=64)
    anchor_x: float | None = Field(
        default=None,
        ge=-VIEWPORT_COORDINATE_LIMIT,
        le=VIEWPORT_COORDINATE_LIMIT,
    )
    anchor_y: float | None = Field(
        default=None,
        ge=-VIEWPORT_COORDINATE_LIMIT,
        le=VIEWPORT_COORDINATE_LIMIT,
    )

    @model_validator(mode="after")
    def validate_anchor_pair(self) -> TemplateInstantiateRequest:
        if (self.anchor_x is None) != (self.anchor_y is None):
            raise ValueError("anchor_x and anchor_y must be provided together")
        return self


class TemplateGraphData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    schema_version: int = Field(ge=1)
    nodes: list[dict[str, Any]]
    connections: list[dict[str, Any]]


class TemplateResponse(BaseModel):
    id: str
    name: str
    user_id: str
    node_count: int
    created_at: str
    node_data: list[dict] | None = None
    schema_version: int = Field(ge=1)
    graph_data: TemplateGraphData

    @model_validator(mode="after")
    def validate_graph_schema_version(self) -> TemplateResponse:
        if self.schema_version != self.graph_data.schema_version:
            raise ValueError("Template schema version does not match graph data")
        return self


class TemplateListResponse(BaseModel):
    items: list[TemplateResponse]
    total: int


class TemplateUseResponse(BaseModel):
    template: TemplateResponse
    project_id: str
    project_name: str
    nodes_created: int


class TemplateInstantiateResponse(BaseModel):
    template_id: str
    project_id: str
    canvas_id: str
    nodes_created: int
    connections_created: int
    node_id_map: dict[str, str]
    connection_id_map: dict[str, str]
    mutation: CanvasDocumentPatchResponse
