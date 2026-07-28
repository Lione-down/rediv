from __future__ import annotations

from typing import Annotated, Any, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StrictStr,
    StringConstraints,
    UUID4,
    field_validator,
    model_validator,
)

from schemas.asset import AssetListItem
from schemas.cinematic_sequence import (
    CinematicDirectorBrief,
    CinematicRetakeContext,
    CinematicSequenceState,
    TransferExclusion,
)
from schemas.generation_task import GenerationTaskItem
from schemas.story_production import StoryShotTemplateLineage, StoryTemplateLineage
from core.generation_parameter_contract import (
    IMAGE_OUTPUT_COUNTS,
    normalize_image_parameters,
    normalize_video_parameters,
)
from core.image_operation_contract import normalize_image_operation
from core.image_generation_recipes import ImageGenerationRecipeId, resolve_image_generation_recipe


class QuotaBalances(BaseModel):
    text: int = Field(ge=0)
    image: int = Field(ge=0)
    video: int = Field(ge=0)


ResourceId = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=36)]


class ImageBatchSnapshot(BaseModel):
    model_config = ConfigDict(extra="forbid")

    batch_id: UUID4
    slot_index: int = Field(ge=1)
    slot_count: int

    @model_validator(mode="after")
    def validate_slot(self):
        if self.slot_count not in IMAGE_OUTPUT_COUNTS:
            raise ValueError("image batch slot count is unsupported")
        if self.slot_index > self.slot_count:
            raise ValueError("image batch slot index is invalid")
        return self


class VideoReferenceBinding(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    node_id: str = Field(min_length=1, max_length=96)
    asset_id: ResourceId
    role: Literal["first-frame", "last-frame", "reference"]
    order: int = Field(ge=0, le=8)


class CinematicGenerationMention(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    node_id: str = Field(min_length=1, max_length=96)
    role: str = Field(min_length=1, max_length=32)
    instruction: str = Field(min_length=1, max_length=500)
    must_not_transfer: list[TransferExclusion] | None = Field(default=None, max_length=12)
    source_revision: str = Field(pattern=r"^[a-f0-9]{64}$")


class CinematicGenerationHandoff(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    skill_id: str = Field(min_length=1, max_length=96)
    skill_version: int = Field(ge=1, le=2)
    canvas_revision: int = Field(ge=0)
    provider_id: str = Field(min_length=1, max_length=64)
    model_id: str = Field(min_length=1, max_length=96)
    user_instruction: str = Field(min_length=1, max_length=4_000)
    mentions: list[CinematicGenerationMention] = Field(default_factory=list, max_length=25)
    generation_parameters: dict[str, Any] = Field(default_factory=dict)
    workflow_mode: Literal["standalone_clip", "sequence_clip", "continuation", "retake"] | None = None
    director_brief: CinematicDirectorBrief | None = None
    sequence_context: CinematicSequenceState | None = None
    retake_context: CinematicRetakeContext | None = None
    submitted_preflight: dict[str, Any]

    @model_validator(mode="after")
    def validate_versioned_workflow(self):
        workflow_values = (
            self.workflow_mode, self.director_brief, self.sequence_context, self.retake_context,
        )
        if self.skill_version == 1:
            if any(value is not None for value in workflow_values):
                raise ValueError("cinematic v1 cannot use director workflow fields")
            if any(mention.must_not_transfer is not None for mention in self.mentions):
                raise ValueError("cinematic v1 cannot use reference transfer exclusions")
        else:
            if self.workflow_mode is None:
                raise ValueError("cinematic v2 requires a workflow mode")
            if any(mention.must_not_transfer is None for mention in self.mentions):
                raise ValueError("cinematic v2 requires explicit reference transfer exclusions")
        return self


class ScopedGenerationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    client_request_id: UUID4 | None = None
    project_id: ResourceId
    origin_canvas_id: ResourceId
    canvas_node_id: ResourceId | None = None
    prompt: str | None = Field(default=None, min_length=1)
    cinematic_handoff: CinematicGenerationHandoff | None = None


class ImageGenerateRequest(ScopedGenerationRequest):
    image_ids: list[ResourceId] | None = Field(default=None, max_length=8)
    size: Literal["1K", "2K", "3K", "4K"] | None = None
    aspect_ratio: str | None = Field(default=None, max_length=10)
    output_count: Literal[1, 2, 3, 4] | None = None
    template_lineage: StoryShotTemplateLineage | None = None
    generation_recipe_id: ImageGenerationRecipeId | None = None
    generation_recipe_version: int | None = Field(default=None, ge=1)
    image_operation: dict[str, Any] | None = None
    shot_controls: dict[str, Any] | None = None
    batch: ImageBatchSnapshot | None = None

    @field_validator("image_ids")
    @classmethod
    def deduplicate_image_ids(cls, value: list[str] | None) -> list[str] | None:
        return list(dict.fromkeys(value)) if value is not None else None

    @model_validator(mode="after")
    def validate_prompt_or_recipe(self):
        if self.image_operation is not None:
            if self.generation_recipe_id is not None or self.generation_recipe_version is not None:
                raise ValueError("image operation cannot use a generation recipe")
            if self.shot_controls is not None:
                raise ValueError("image operation cannot use shot controls")
            normalize_image_operation(
                self.image_operation,
                image_ids=self.image_ids,
                prompt=self.prompt,
            )
            normalize_image_parameters(
                size=self.size,
                aspect_ratio=self.aspect_ratio,
                image_ids=self.image_ids,
                output_count=self.output_count,
                batch=self.batch.model_dump(mode="json") if self.batch else None,
                shot_controls=self.shot_controls,
            )
            return self
        if self.generation_recipe_id is None:
            if self.generation_recipe_version is not None:
                raise ValueError("generation recipe version requires a generation recipe")
            if not self.prompt:
                raise ValueError("prompt is required without a generation recipe")
            normalize_image_parameters(
                size=self.size,
                aspect_ratio=self.aspect_ratio,
                image_ids=self.image_ids,
                output_count=self.output_count,
                batch=self.batch.model_dump(mode="json") if self.batch else None,
                shot_controls=self.shot_controls,
            )
            return self
        if self.prompt is not None:
            raise ValueError("prompt cannot override a generation recipe")
        if self.shot_controls is not None:
            raise ValueError("generation recipe cannot use shot controls")
        if not self.image_ids or len(self.image_ids) != 1:
            raise ValueError("generation recipe requires exactly one image reference")
        recipe = resolve_image_generation_recipe(
            self.generation_recipe_id,
            self.generation_recipe_version,
        )
        normalize_image_parameters(
            size=self.size,
            aspect_ratio=self.aspect_ratio,
            image_ids=self.image_ids,
            output_count=self.output_count,
            batch=self.batch.model_dump(mode="json") if self.batch else None,
            recipe_id=recipe.id,
            recipe_version=recipe.version,
            recipe_size=recipe.output_size,
        )
        return self


class VideoGenerateRequest(ScopedGenerationRequest):
    image_ids: list[ResourceId] | None = Field(default=None, max_length=8)
    aspect_ratio: str | None = Field(default=None, max_length=16)
    resolution: str | None = Field(default=None, max_length=16)
    reference_mode: str | None = Field(default=None, max_length=32)
    duration_seconds: int | None = None
    negative_prompt: StrictStr | None = Field(default=None, max_length=2000)
    shot_controls: dict[str, Any] | None = None
    video_references: list[VideoReferenceBinding] | None = Field(default=None, max_length=8)
    template_lineage: StoryShotTemplateLineage | None = None

    @field_validator("image_ids")
    @classmethod
    def deduplicate_image_ids(cls, value: list[str] | None) -> list[str] | None:
        return list(dict.fromkeys(value)) if value is not None else None

    @field_validator("negative_prompt")
    @classmethod
    def normalize_empty_negative_prompt(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @model_validator(mode="after")
    def require_prompt(self):
        if not self.prompt:
            raise ValueError("prompt is required")
        normalize_video_parameters(
            aspect_ratio=self.aspect_ratio,
            resolution=self.resolution,
            reference_mode=self.reference_mode,
            duration_seconds=self.duration_seconds,
            image_ids=self.image_ids,
            negative_prompt=self.negative_prompt,
            video_references=(
                [binding.model_dump(mode="json") for binding in self.video_references]
                if self.video_references is not None else None
            ),
            shot_controls=self.shot_controls,
        )
        return self


class StoryDirectorRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal[1]
    source_node_ids: list[ResourceId] = Field(default_factory=list, max_length=8)
    requested_shot_count: int | None = Field(default=None, ge=1, le=25)
    template_lineage: StoryTemplateLineage | None = None

    @field_validator("source_node_ids")
    @classmethod
    def require_unique_source_node_ids(cls, value: list[str]) -> list[str]:
        if len(set(value)) != len(value):
            raise ValueError("story director source node identities must be unique")
        return value


class TextGenerateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    client_request_id: UUID4 | None = None
    project_id: ResourceId
    origin_canvas_id: ResourceId | None = None
    canvas_node_id: ResourceId
    model_id: str | None = Field(default=None, min_length=1, max_length=96)
    prompt: str | None = Field(default=None, min_length=1, max_length=12_000)
    cinematic_handoff: CinematicGenerationHandoff | None = None
    intent: Literal["freeform", "script_draft", "script_refine"] = "freeform"
    brief: str | None = Field(default=None, min_length=1, max_length=4_000)
    source_text: str | None = Field(default=None, min_length=1, max_length=12_000)
    instruction: str | None = Field(default=None, min_length=1, max_length=4_000)
    locale: Literal["zh-CN", "en-US"] = "zh-CN"
    canvas_revision: int | None = Field(default=None, ge=0)
    reference_asset_ids: list[ResourceId] = Field(default_factory=list, max_length=8)
    story_director: StoryDirectorRequest | None = None

    @field_validator("reference_asset_ids")
    @classmethod
    def deduplicate_reference_asset_ids(cls, value: list[str]) -> list[str]:
        return list(dict.fromkeys(value))

    @model_validator(mode="before")
    @classmethod
    def accept_legacy_node_id(cls, value):
        if isinstance(value, dict) and "canvas_node_id" not in value and "node_id" in value:
            value = {**value, "canvas_node_id": value["node_id"]}
            value.pop("node_id", None)
        return value

    @model_validator(mode="after")
    def validate_intent_contract(self):
        structured_values = (
            self.brief, self.source_text, self.instruction, self.canvas_revision,
            self.reference_asset_ids or None,
        )
        if self.intent == "freeform":
            if not self.prompt:
                raise ValueError("prompt is required for freeform text generation")
            if any(value is not None for value in structured_values) or self.story_director is not None:
                raise ValueError("freeform text generation cannot use script authoring fields")
            return self
        if self.prompt is not None or self.cinematic_handoff is not None:
            raise ValueError("script authoring cannot use prompt or cinematic handoff")
        if self.origin_canvas_id is None or self.canvas_revision is None:
            raise ValueError("script authoring requires Canvas scope and revision")
        if self.intent == "script_draft":
            if not self.brief or self.source_text is not None or self.instruction is not None:
                raise ValueError("script draft requires only a brief")
        elif not self.source_text or not self.instruction or self.brief is not None:
            raise ValueError("script refine requires source text and instruction")
        if self.story_director is not None and (
            self.intent != "script_draft" or self.reference_asset_ids
        ):
            raise ValueError("story director requires a script draft without image attachments")
        return self


class GenerationResponseBase(BaseModel):
    asset: AssetListItem
    generation_task: GenerationTaskItem
    quotas: QuotaBalances
    quota_revision: int = Field(ge=0)


class TextGenerateResponse(GenerationResponseBase):
    content: str
    script_authoring: dict[str, Any] | None = None
    story_production: dict[str, Any] | None = None


class ImageGenerateResponse(GenerationResponseBase):
    url: str


class VideoGenerateResponse(GenerationResponseBase):
    video_id: str
    url: str
