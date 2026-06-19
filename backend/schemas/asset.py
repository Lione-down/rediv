from pydantic import BaseModel, Field


class AssetListItem(BaseModel):
    id: str
    user_id: str
    project_id: str | None
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
    type: str = Field(pattern="^(prompt|image|video)$")
    url: str | None = None
    content_text: str | None = None
    project_id: str | None = None


class AssetFromGenerationRequest(BaseModel):
    type: str = Field(pattern="^(prompt|image|video)$")
    url: str | None = None
    content_text: str | None = None
    source_model: str | None = None
    source_task_id: str | None = None
    canvas_node_id: str | None = None
    project_id: str | None = None


class AssetHideRequest(BaseModel):
    asset_id: str
