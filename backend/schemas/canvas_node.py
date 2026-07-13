from typing import Optional

from pydantic import BaseModel, Field


class CanvasNodeCreateRequest(BaseModel):
    node_type: str = Field(..., min_length=1, max_length=50)
    content: dict = Field(default_factory=dict)
    position_x: float = Field(default=0.0)
    position_y: float = Field(default=0.0)
    width: int = Field(default=300, ge=50)
    height: int = Field(default=200, ge=50)
    z_index: int = Field(default=0)
    parent_node_id: Optional[str] = Field(default=None, max_length=36)
    is_locked: bool = Field(default=False)
    is_collapsed: bool = Field(default=False)


class CanvasNodeUpdateRequest(BaseModel):
    node_type: Optional[str] = Field(None, min_length=1, max_length=50)
    content: Optional[dict] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    width: Optional[int] = None
    height: Optional[int] = None
    z_index: Optional[int] = None
    parent_node_id: Optional[str] = Field(default=None, max_length=36)
    is_locked: Optional[bool] = None
    is_collapsed: Optional[bool] = None
    status: Optional[str] = None


class CanvasNodeResponse(BaseModel):
    id: str
    project_id: str
    canvas_id: str
    node_type: str
    content: dict
    position_x: float
    position_y: float
    width: int
    height: int
    z_index: int
    parent_node_id: Optional[str]
    is_locked: bool
    is_collapsed: bool
    status: str
    created_at: str
    updated_at: str


class CanvasNodeListResponse(BaseModel):
    items: list[CanvasNodeResponse]
    total: int
