from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class StrictCanvasModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class CanvasCreateRequest(StrictCanvasModel):
    name: str = Field(..., min_length=1, max_length=255)
    base_order_revision: int = Field(..., ge=0)


class CanvasUpdateRequest(StrictCanvasModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    status: Literal["archived"] | None = None
    base_order_revision: int | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def validate_update(self):
        if self.name is None and self.status is None:
            raise ValueError("At least one canvas field must be provided")
        if self.status is not None and self.base_order_revision is None:
            raise ValueError("base_order_revision is required when archiving a canvas")
        if self.status is None and self.base_order_revision is not None:
            raise ValueError("base_order_revision is only valid when archiving a canvas")
        return self


class CanvasReorderRequest(StrictCanvasModel):
    base_order_revision: int = Field(..., ge=0)
    ordered_canvas_ids: list[str] = Field(..., min_length=1)

    @field_validator("ordered_canvas_ids")
    @classmethod
    def validate_canvas_ids(cls, canvas_ids: list[str]) -> list[str]:
        if any(not canvas_id.strip() for canvas_id in canvas_ids):
            raise ValueError("ordered_canvas_ids cannot contain empty IDs")
        if len(set(canvas_ids)) != len(canvas_ids):
            raise ValueError("ordered_canvas_ids cannot contain duplicate IDs")
        return canvas_ids


class CanvasResponse(BaseModel):
    id: str
    project_id: str
    name: str
    sort_order: int
    status: Literal["active", "archived"]
    viewport_x: float
    viewport_y: float
    viewport_zoom: float
    graph_revision: int
    created_at: str
    updated_at: str
    deleted_at: str | None


class CanvasListResponse(BaseModel):
    items: list[CanvasResponse]
    order_revision: int


class CanvasMutationResponse(BaseModel):
    item: CanvasResponse
    order_revision: int
