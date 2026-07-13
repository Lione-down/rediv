from pydantic import BaseModel, ConfigDict, Field, field_validator

from schemas.canvas import CanvasResponse
from schemas.canvas_connection import CanvasConnectionResponse
from schemas.canvas_node import CanvasNodeResponse


VIEWPORT_COORDINATE_LIMIT = 10_000_000.0


class CanvasDocumentResponse(BaseModel):
    canvas: CanvasResponse
    nodes: list[CanvasNodeResponse]
    connections: list[CanvasConnectionResponse]
    revision: int


class CanvasViewportUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)

    x: float = Field(..., ge=-VIEWPORT_COORDINATE_LIMIT, le=VIEWPORT_COORDINATE_LIMIT)
    y: float = Field(..., ge=-VIEWPORT_COORDINATE_LIMIT, le=VIEWPORT_COORDINATE_LIMIT)
    zoom: float = Field(..., ge=0.1, le=8.0)

    @field_validator("x", "y")
    @classmethod
    def normalize_coordinate(cls, value: float) -> float:
        return round(value, 2)

    @field_validator("zoom")
    @classmethod
    def normalize_zoom(cls, value: float) -> float:
        return round(value, 4)
