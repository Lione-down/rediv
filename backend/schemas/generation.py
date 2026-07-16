from __future__ import annotations

from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator, model_validator

from schemas.asset import AssetListItem
from schemas.generation_task import GenerationTaskItem
from core.generation_parameter_contract import (
    normalize_image_parameters,
    normalize_video_parameters,
)
from core.image_generation_recipes import ImageGenerationRecipeId, resolve_image_generation_recipe


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
    prompt: str | None = Field(default=None, min_length=1)


class ImageGenerateRequest(ScopedGenerationRequest):
    image_ids: list[ResourceId] | None = Field(default=None, max_length=8)
    aspect_ratio: str | None = Field(default=None, max_length=10)
    generation_recipe_id: ImageGenerationRecipeId | None = None
    generation_recipe_version: int | None = Field(default=None, ge=1)

    @field_validator("image_ids")
    @classmethod
    def deduplicate_image_ids(cls, value: list[str] | None) -> list[str] | None:
        return list(dict.fromkeys(value)) if value is not None else None

    @model_validator(mode="after")
    def validate_prompt_or_recipe(self):
        if self.generation_recipe_id is None:
            if self.generation_recipe_version is not None:
                raise ValueError("generation recipe version requires a generation recipe")
            if not self.prompt:
                raise ValueError("prompt is required without a generation recipe")
            normalize_image_parameters(
                aspect_ratio=self.aspect_ratio,
                image_ids=self.image_ids,
            )
            return self
        if self.prompt is not None:
            raise ValueError("prompt cannot override a generation recipe")
        if not self.image_ids or len(self.image_ids) != 1:
            raise ValueError("generation recipe requires exactly one image reference")
        recipe = resolve_image_generation_recipe(
            self.generation_recipe_id,
            self.generation_recipe_version,
        )
        normalize_image_parameters(
            aspect_ratio=self.aspect_ratio,
            image_ids=self.image_ids,
            recipe_id=recipe.id,
            recipe_version=recipe.version,
            recipe_size=recipe.output_size,
        )
        return self


class VideoGenerateRequest(ScopedGenerationRequest):
    image_ids: list[ResourceId] | None = Field(default=None, max_length=8)
    reference_mode: str | None = Field(default=None, max_length=32)
    duration_seconds: int | None = None

    @field_validator("image_ids")
    @classmethod
    def deduplicate_image_ids(cls, value: list[str] | None) -> list[str] | None:
        return list(dict.fromkeys(value)) if value is not None else None

    @model_validator(mode="after")
    def require_prompt(self):
        if not self.prompt:
            raise ValueError("prompt is required")
        normalize_video_parameters(
            reference_mode=self.reference_mode,
            duration_seconds=self.duration_seconds,
            image_ids=self.image_ids,
        )
        return self


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
