from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator


class TemplateCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    project_id: str = Field(..., min_length=1)


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
