from __future__ import annotations

from datetime import datetime
from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, Field, StrictStr

from schemas.generation import (
    CinematicGenerationHandoff,
    ImageBatchSnapshot,
    ResourceId,
    VideoReferenceBinding,
)
from schemas.story_production import StoryShotTemplateLineage

GenerationJobMediaType = Literal["text", "script", "image", "video"]
GenerationJobStatusValue = Literal[
    "queued",
    "running",
    "succeeded",
    "failed",
    "timed_out",
    "cancel_requested",
    "cancelled",
]
GenerationJobStage = Literal["queued", "provider", "persisting"]


class _StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class GenerationJobSubmitReceipt(_StrictModel):
    job_id: str
    project_id: str
    canvas_id: str
    node_id: str
    media_type: GenerationJobMediaType
    status: GenerationJobStatusValue
    model_id: str
    quota_revision: int | None = None
    version: int = Field(ge=1)


class GenerationJobStatus(_StrictModel):
    job_id: str
    node_id: str
    media_type: GenerationJobMediaType
    status: GenerationJobStatusValue
    stage: GenerationJobStage | None = None
    progress: int | None = Field(default=None, ge=0, le=100)
    error: str | None = None
    result_asset_id: str | None = None
    version: int = Field(ge=1)
    updated_at: datetime


class GenerationJobTextResult(_StrictModel):
    media_type: Literal["text", "script"]
    content: str


class GenerationJobMediaResult(_StrictModel):
    asset_id: str
    media_type: Literal["image", "video"]
    url: str


class GenerationJobResult(_StrictModel):
    job_id: str
    node_id: str
    result: Annotated[
        GenerationJobTextResult | GenerationJobMediaResult,
        Field(discriminator="media_type"),
    ]
    version: int = Field(ge=1)


class GenerationJobDeltaPage(_StrictModel):
    items: list[GenerationJobStatus] = Field(max_length=100)
    next_cursor: str | None = None


class GenerationJobCinematicLineage(_StrictModel):
    job_id: str
    project_id: str
    canvas_id: str
    node_id: str
    cinematic_skill: dict | None = None
    version: int = Field(ge=1)


class GenerationJobInput(_StrictModel):
    prompt: str | None = Field(default=None, min_length=1, max_length=16_000)
    mode: Literal["text-to-video", "image-to-prompt", "text-to-music"] | None = None
    content_revision: int | None = Field(default=None, ge=0)
    image_ids: list[ResourceId] | None = Field(default=None, max_length=8)
    size: Literal["1K", "2K", "3K", "4K"] | None = None
    aspect_ratio: str | None = Field(default=None, max_length=16)
    output_count: Literal[1, 2, 3, 4] | None = None
    batch: ImageBatchSnapshot | None = None
    reference_mode: str | None = Field(default=None, max_length=32)
    video_references: list[VideoReferenceBinding] | None = Field(default=None, max_length=8)
    duration_seconds: int | None = None
    resolution: str | None = Field(default=None, max_length=16)
    negative_prompt: StrictStr | None = Field(default=None, max_length=2_000)
    generation_recipe_id: Literal["character-sheet", "scene-multiview"] | None = None
    generation_recipe_version: int | None = Field(default=None, ge=1)
    image_operation: dict[str, Any] | None = None
    shot_controls: dict[str, Any] | None = None
    template_lineage: StoryShotTemplateLineage | None = None
    cinematic_handoff: CinematicGenerationHandoff | None = None


class GenerationJobSubmitRequest(_StrictModel):
    client_request_id: str = Field(min_length=36, max_length=36)
    project_id: str
    canvas_id: str
    node_id: str
    media_type: GenerationJobMediaType
    provider_id: Literal["agnes"]
    model_id: str = Field(min_length=1, max_length=255)
    input: GenerationJobInput
