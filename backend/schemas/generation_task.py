from typing import Literal

from pydantic import BaseModel, Field


GenerationTaskStatus = Literal["queued", "running", "succeeded", "failed", "timed_out"]
GenerationTaskMediaType = Literal["text", "image", "video"]
GenerationTaskProgressStage = Literal["queued", "provider", "persisting"]


class GenerationTaskItem(BaseModel):
    id: str
    user_id: str
    project_id: str | None = None
    origin_canvas_id: str | None = None
    canvas_node_id: str | None = None
    media_type: GenerationTaskMediaType
    provider: str
    model: str | None = None
    provider_request_id: str | None = None
    request_parameters: dict | None = None
    progress_percent: float | None = None
    progress_stage: GenerationTaskProgressStage | None = None
    status: GenerationTaskStatus
    duration_ms: int | None = None
    result_asset_id: str | None = None
    error_code: str | None = None
    error_message: str | None = None
    created_at: str
    updated_at: str


class GenerationTaskListResponse(BaseModel):
    items: list[GenerationTaskItem]
    total: int
    page: int
    page_size: int


class GenerationTaskQueryParams(BaseModel):
    project_id: str | None = None
    origin_canvas_id: str | None = None
    media_type: GenerationTaskMediaType | None = None
    status: GenerationTaskStatus | None = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
