from __future__ import annotations

from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator, model_validator

from schemas.asset import AssetListItem
from schemas.generation_task import GenerationTaskItem


class QuotaBalances(BaseModel):
    text: int = Field(ge=0)
    image: int = Field(ge=0)
    video: int = Field(ge=0)


ResourceId = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=36)]


class ScopedGenerationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    project_id: ResourceId
    origin_canvas_id: ResourceId
    canvas_node_id: ResourceId | None = None
    prompt: str = Field(..., min_length=1)


class ImageGenerateRequest(ScopedGenerationRequest):
    image_ids: list[ResourceId] | None = Field(default=None, max_length=8)

    @field_validator("image_ids")
    @classmethod
    def deduplicate_image_ids(cls, value: list[str] | None) -> list[str] | None:
        return list(dict.fromkeys(value)) if value is not None else None


class VideoGenerateRequest(ScopedGenerationRequest):
    image_ids: list[ResourceId] | None = Field(default=None, max_length=8)

    @field_validator("image_ids")
    @classmethod
    def deduplicate_image_ids(cls, value: list[str] | None) -> list[str] | None:
        return list(dict.fromkeys(value)) if value is not None else None


class TextGenerateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    project_id: ResourceId
    origin_canvas_id: ResourceId | None = None
    canvas_node_id: ResourceId
    prompt: str = Field(..., min_length=1)

    @model_validator(mode="before")
    @classmethod
    def accept_legacy_node_id(cls, value):
        if isinstance(value, dict) and "canvas_node_id" not in value and "node_id" in value:
            value = {**value, "canvas_node_id": value["node_id"]}
            value.pop("node_id", None)
        return value


class GenerationResponseBase(BaseModel):
    asset: AssetListItem
    generation_task: GenerationTaskItem
    quotas: QuotaBalances
    quota_revision: int = Field(ge=0)


class TextGenerateResponse(GenerationResponseBase):
    content: str


class ImageGenerateResponse(GenerationResponseBase):
    url: str


class VideoGenerateResponse(GenerationResponseBase):
    video_id: str
    url: str
