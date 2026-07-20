from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


ASSET_CONTENT_TEXT_MAX_LENGTH = 64 * 1024


class AssetListItem(BaseModel):
    id: str
    user_id: str
    project_id: str | None
    origin_canvas_id: str | None
    canvas_node_id: str | None
    type: str
    url: str | None
    content_text: str | None
    source: str
    source_model: str | None
    source_task_id: str | None
    status: str
    created_at: str
    updated_at: str


class AssetListResponse(BaseModel):
    items: list[AssetListItem]
    total: int
    page: int
    page_size: int


class AssetCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: Literal["prompt", "image", "video", "audio"]
    url: str | None = Field(default=None, max_length=2048)
    content_text: str | None = Field(default=None, max_length=ASSET_CONTENT_TEXT_MAX_LENGTH)
    project_id: str | None = Field(default=None, max_length=36)
    origin_canvas_id: str | None = Field(default=None, max_length=36)


class AssetHideRequest(BaseModel):
    asset_id: str
