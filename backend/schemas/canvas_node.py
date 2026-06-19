from typing import Optional

from pydantic import BaseModel, Field


class CanvasNodeCreateRequest(BaseModel):
    node_type: str = Field(..., min_length=1, max_length=50)
    content: dict = Field(default_factory=dict)
    position_x: float = Field(default=0.0, ge=0.0)
    position_y: float = Field(default=0.0, ge=0.0)
    width: int = Field(default=300, ge=50)
    height: int = Field(default=200, ge=50)


class CanvasNodeUpdateRequest(BaseModel):
    node_type: Optional[str] = Field(None, min_length=1, max_length=50)
    content: Optional[dict] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    width: Optional[int] = None
    height: Optional[int] = None
    status: Optional[str] = None


class CanvasNodeResponse(BaseModel):
    id: str
    project_id: str
    node_type: str
    content: dict
    position_x: float
    position_y: float
    width: int
    height: int
    status: str
    created_at: str


class CanvasNodeListResponse(BaseModel):
    items: list[CanvasNodeResponse]
    total: int
