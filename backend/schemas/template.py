from __future__ import annotations

from pydantic import BaseModel, Field


class TemplateCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    project_id: str = Field(..., min_length=1)


class TemplateResponse(BaseModel):
    id: str
    name: str
    user_id: str
    node_count: int
    created_at: str
    node_data: list[dict] | None = None


class TemplateListResponse(BaseModel):
    items: list[TemplateResponse]
    total: int


class TemplateUseResponse(BaseModel):
    template: TemplateResponse
    project_id: str
    project_name: str
    nodes_created: int
