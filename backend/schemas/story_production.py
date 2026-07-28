from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator


Identifier = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=96)]
Revision = Annotated[str, StringConstraints(pattern=r"^[a-f0-9]{64}$")]
ShortText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
DetailText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)]
PromptText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=4000)]
TransferExclusion = Literal[
    "identity",
    "face",
    "wardrobe",
    "product",
    "logo",
    "background",
    "scene",
    "camera",
    "lighting",
    "motion",
    "action",
    "audio",
    "style",
]
ReferenceRole = Literal[
    "identity",
    "wardrobe",
    "scene",
    "product",
    "style",
    "motion",
    "camera",
    "lighting",
    "first-frame",
    "last-frame",
]


class StoryProductionRecord(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    editable_fields: dict[Identifier, str] = Field(default_factory=dict, max_length=64)
    locked_fields: dict[Identifier, bool] = Field(default_factory=dict, max_length=64)
    generation_revision: int = Field(ge=1)
    source_ids: list[Identifier] = Field(default_factory=list, max_length=100)
    validation_state: Literal["valid", "needs_review"]

    @model_validator(mode="after")
    def validate_record_metadata(self):
        if len(set(self.source_ids)) != len(self.source_ids):
            raise ValueError("source identities must be unique")
        if not set(self.locked_fields).issubset(set(self.editable_fields)):
            raise ValueError("locked fields must be declared editable")
        return self


class StoryEvent(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    event_id: Identifier
    summary: DetailText


class StorySummary(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    summary: DetailText
    events: list[StoryEvent] = Field(min_length=1, max_length=100)

    @model_validator(mode="after")
    def validate_event_identities(self):
        if len({event.event_id for event in self.events}) != len(self.events):
            raise ValueError("story event identities must be unique")
        return self


class StoryAsset(StoryProductionRecord):
    asset_id: Identifier
    name: ShortText
    description: DetailText
    image_prompt: PromptText


class StoryAssets(BaseModel):
    model_config = ConfigDict(extra="forbid")

    roles: list[StoryAsset] = Field(default_factory=list, max_length=50)
    scenes: list[StoryAsset] = Field(default_factory=list, max_length=50)
    props: list[StoryAsset] = Field(default_factory=list, max_length=50)

    def all(self) -> list[StoryAsset]:
        return [*self.roles, *self.scenes, *self.props]


class StoryReference(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    reference_id: Identifier
    asset_id: Identifier
    node_id: Identifier
    source_revision: Revision
    role: ReferenceRole
    instruction: DetailText
    must_not_transfer: list[TransferExclusion] = Field(min_length=1, max_length=12)
    order: int = Field(ge=0, le=8)

    @model_validator(mode="after")
    def validate_transfer_policy(self):
        if len(set(self.must_not_transfer)) != len(self.must_not_transfer):
            raise ValueError("reference exclusions must be unique")
        if self.role in self.must_not_transfer:
            raise ValueError("reference primary role cannot be excluded")
        return self


class StoryContinuity(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    canonical_revision: int = Field(ge=0)
    identity_locks: list[Identifier] = Field(default_factory=list, max_length=50)
    accepted_take_id: Identifier | None
    accepted_result_node_id: Identifier | None
    accepted_result_revision: Revision | None
    observed_end_state: DetailText | None

    @model_validator(mode="after")
    def validate_accepted_lineage(self):
        accepted = (
            self.accepted_take_id,
            self.accepted_result_node_id,
            self.accepted_result_revision,
            self.observed_end_state,
        )
        if any(value is not None for value in accepted) and any(value is None for value in accepted):
            raise ValueError("accepted continuity lineage must be complete")
        if len(set(self.identity_locks)) != len(self.identity_locks):
            raise ValueError("continuity identity locks must be unique")
        return self


class StoryShot(StoryProductionRecord):
    shot_id: Identifier
    shot_number: int = Field(ge=1, le=25)
    duration_seconds: int = Field(ge=1, le=30)
    visual_description: DetailText
    framing: ShortText
    scene_id: Identifier
    role_ids: list[Identifier] = Field(default_factory=list, max_length=12)
    prop_ids: list[Identifier] = Field(default_factory=list, max_length=12)
    dialogue: str = Field(max_length=1000)
    music_sfx: str = Field(max_length=1000)
    camera_movement: ShortText
    image_prompt: PromptText
    video_prompt: PromptText
    reference_ids: list[Identifier] = Field(default_factory=list, max_length=9)
    continuity_locks: list[Identifier] = Field(default_factory=list, max_length=50)
    reserved_beat_ids: list[Identifier] = Field(default_factory=list, max_length=100)

    @model_validator(mode="after")
    def validate_unique_relations(self):
        for values in (
            self.role_ids,
            self.prop_ids,
            self.reference_ids,
            self.continuity_locks,
            self.reserved_beat_ids,
        ):
            if len(set(values)) != len(values):
                raise ValueError("shot relation identities must be unique")
        return self


class StoryProductionDocument(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    schema_id: Literal["revid.story-production"]
    schema_version: Literal[1]
    skill_id: Literal["revid.story-director"]
    skill_version: Literal[1]
    source_node_id: Identifier
    source_revision: Revision
    model_id: Identifier
    story: StorySummary
    references: list[StoryReference] = Field(default_factory=list, max_length=9)
    continuity: StoryContinuity
    assets: StoryAssets
    shots: list[StoryShot] = Field(min_length=1, max_length=25)

    @model_validator(mode="after")
    def validate_document_graph(self):
        assets = self.assets.all()
        asset_ids = [asset.asset_id for asset in assets]
        if len(set(asset_ids)) != len(asset_ids):
            raise ValueError("story asset identities must be unique")
        shot_ids = [shot.shot_id for shot in self.shots]
        if len(set(shot_ids)) != len(shot_ids):
            raise ValueError("story shot identities must be unique")
        if [shot.shot_number for shot in self.shots] != list(range(1, len(self.shots) + 1)):
            raise ValueError("story shots must use contiguous order")

        known_assets = set(asset_ids)
        role_ids = {asset.asset_id for asset in self.assets.roles}
        scene_ids = {asset.asset_id for asset in self.assets.scenes}
        prop_ids = {asset.asset_id for asset in self.assets.props}
        reference_ids = [reference.reference_id for reference in self.references]
        if len(set(reference_ids)) != len(reference_ids):
            raise ValueError("story reference identities must be unique")
        if [reference.order for reference in self.references] != list(range(len(self.references))):
            raise ValueError("story references must use contiguous order")
        if any(reference.asset_id not in known_assets for reference in self.references):
            raise ValueError("story reference asset is unresolved")

        known_references = set(reference_ids)
        known_events = {event.event_id for event in self.story.events}
        for shot in self.shots:
            if shot.scene_id not in scene_ids:
                raise ValueError("shot scene is unresolved")
            if not set(shot.role_ids).issubset(role_ids):
                raise ValueError("shot role is unresolved")
            if not set(shot.prop_ids).issubset(prop_ids):
                raise ValueError("shot prop is unresolved")
            if not set(shot.reference_ids).issubset(known_references):
                raise ValueError("shot reference is unresolved")
            if not set(shot.continuity_locks).issubset(known_assets):
                raise ValueError("shot continuity lock is unresolved")
            if not set(shot.reserved_beat_ids).issubset(known_events):
                raise ValueError("shot reserved beat is unresolved")
        if not set(self.continuity.identity_locks).issubset(known_assets):
            raise ValueError("continuity identity lock is unresolved")
        return self
