from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from core.json_budget import (
    CANVAS_CONNECTION_METADATA_MAX_BYTES,
    CANVAS_NODE_CONTENT_MAX_BYTES,
    measure_json,
)
from schemas.canvas import CanvasResponse
from schemas.canvas_connection import CanvasConnectionResponse
from schemas.canvas_node import CanvasNodeResponse


VIEWPORT_COORDINATE_LIMIT = 10_000_000.0
MAX_SAFE_JSON_INTEGER = 9_007_199_254_740_991
MAX_MUTATIONS_PER_BATCH = 1_000


class CanvasNodeUpsert(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)

    id: str = Field(..., min_length=1, max_length=36)
    node_type: str = Field(..., min_length=1, max_length=50)
    content: dict = Field(default_factory=dict)
    position_x: float = Field(..., ge=-VIEWPORT_COORDINATE_LIMIT, le=VIEWPORT_COORDINATE_LIMIT)
    position_y: float = Field(..., ge=-VIEWPORT_COORDINATE_LIMIT, le=VIEWPORT_COORDINATE_LIMIT)
    width: int = Field(..., ge=50, le=100_000)
    height: int = Field(..., ge=50, le=100_000)
    z_index: int = Field(default=0, ge=-2_147_483_648, le=2_147_483_647)
    parent_node_id: str | None = Field(default=None, max_length=36)
    is_locked: bool = Field(default=False)
    is_collapsed: bool = Field(default=False)

    @field_validator("content")
    @classmethod
    def validate_content_budget(cls, value: dict) -> dict:
        if measure_json(value).serialized_bytes > CANVAS_NODE_CONTENT_MAX_BYTES:
            raise ValueError("Canvas node content is too large")
        return value


class CanvasConnectionUpsert(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(..., min_length=1, max_length=36)
    source_node_id: str = Field(..., min_length=1, max_length=36)
    source_port: str = Field(..., min_length=1, max_length=100)
    target_node_id: str = Field(..., min_length=1, max_length=36)
    target_port: str = Field(..., min_length=1, max_length=100)
    metadata: dict = Field(default_factory=dict)

    @field_validator("metadata")
    @classmethod
    def validate_metadata_budget(cls, value: dict) -> dict:
        if measure_json(value).serialized_bytes > CANVAS_CONNECTION_METADATA_MAX_BYTES:
            raise ValueError("Canvas connection metadata is too large")
        return value


class CanvasDocumentPatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False, str_strip_whitespace=True)

    base_revision: int = Field(..., ge=0, le=MAX_SAFE_JSON_INTEGER)
    client_mutation_id: str = Field(..., min_length=1, max_length=64)
    node_upserts: list[CanvasNodeUpsert] = Field(default_factory=list, max_length=MAX_MUTATIONS_PER_BATCH)
    node_deletes: list[str] = Field(default_factory=list, max_length=MAX_MUTATIONS_PER_BATCH)
    connection_upserts: list[CanvasConnectionUpsert] = Field(default_factory=list, max_length=MAX_MUTATIONS_PER_BATCH)
    connection_deletes: list[str] = Field(default_factory=list, max_length=MAX_MUTATIONS_PER_BATCH)

    @model_validator(mode="after")
    def validate_operation_sets(self):
        node_upsert_ids = [item.id for item in self.node_upserts]
        connection_upsert_ids = [item.id for item in self.connection_upserts]
        if len(node_upsert_ids) != len(set(node_upsert_ids)):
            raise ValueError("node_upserts contains duplicate IDs")
        if len(self.node_deletes) != len(set(self.node_deletes)):
            raise ValueError("node_deletes contains duplicate IDs")
        if len(connection_upsert_ids) != len(set(connection_upsert_ids)):
            raise ValueError("connection_upserts contains duplicate IDs")
        if len(self.connection_deletes) != len(set(self.connection_deletes)):
            raise ValueError("connection_deletes contains duplicate IDs")
        if set(node_upsert_ids) & set(self.node_deletes):
            raise ValueError("node IDs cannot be upserted and deleted in one batch")
        if set(connection_upsert_ids) & set(self.connection_deletes):
            raise ValueError("connection IDs cannot be upserted and deleted in one batch")
        if not any((self.node_upserts, self.node_deletes, self.connection_upserts, self.connection_deletes)):
            raise ValueError("document patch must contain at least one mutation")
        return self


class CanvasDocumentPatchResponse(BaseModel):
    revision: int
    node_upserts: list[CanvasNodeResponse]
    node_deletes: list[str]
    connection_upserts: list[CanvasConnectionResponse]
    connection_deletes: list[str]
    server_timestamp: str
    save_state: Literal["saved"]


class CanvasDocumentResponse(BaseModel):
    canvas: CanvasResponse
    nodes: list[CanvasNodeResponse]
    connections: list[CanvasConnectionResponse]
    revision: int


class CanvasRevisionSummary(BaseModel):
    revision: int = Field(..., ge=1, le=MAX_SAFE_JSON_INTEGER)
    base_revision: int = Field(..., ge=0, le=MAX_SAFE_JSON_INTEGER)
    is_checkpoint: bool
    restored_from_revision: int | None = Field(default=None, ge=1, le=MAX_SAFE_JSON_INTEGER)
    created_at: str


class CanvasRevisionListResponse(BaseModel):
    items: list[CanvasRevisionSummary]
    current_revision: int = Field(..., ge=0, le=MAX_SAFE_JSON_INTEGER)


class CanvasRevisionRestoreResponse(BaseModel):
    revision: int = Field(..., ge=1, le=MAX_SAFE_JSON_INTEGER)
    restored_from_revision: int = Field(..., ge=1, le=MAX_SAFE_JSON_INTEGER)
    server_timestamp: str


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
