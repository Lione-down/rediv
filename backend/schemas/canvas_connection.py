from typing import Optional

from pydantic import BaseModel, Field


class CanvasConnectionCreateRequest(BaseModel):
    source_node_id: str = Field(..., min_length=1, max_length=36)
    source_port: str = Field(..., min_length=1, max_length=100)
    target_node_id: str = Field(..., min_length=1, max_length=36)
    target_port: str = Field(..., min_length=1, max_length=100)
    metadata: dict = Field(default_factory=dict)


class CanvasConnectionUpdateRequest(BaseModel):
    source_node_id: Optional[str] = Field(None, min_length=1, max_length=36)
    source_port: Optional[str] = Field(None, min_length=1, max_length=100)
    target_node_id: Optional[str] = Field(None, min_length=1, max_length=36)
    target_port: Optional[str] = Field(None, min_length=1, max_length=100)
    status: Optional[str] = Field(None, min_length=1, max_length=20)
    metadata: Optional[dict] = None


class CanvasConnectionResponse(BaseModel):
    id: str
    project_id: str
    canvas_id: str
    source_node_id: str
    source_port: str
    target_node_id: str
    target_port: str
    status: str
    metadata: dict
    created_at: str
    updated_at: str


class CanvasConnectionListResponse(BaseModel):
    items: list[CanvasConnectionResponse]
    total: int
