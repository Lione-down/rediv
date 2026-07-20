from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator


Identifier = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=96)]
Revision = Annotated[str, StringConstraints(pattern=r"^[a-f0-9]{64}$")]
ShortText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
DetailText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)]
OptionalDetailText = Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)]
TransferExclusion = Literal[
    "identity", "face", "wardrobe", "product", "logo", "background", "scene",
    "camera", "lighting", "motion", "action", "audio",
]
ReferenceRole = Literal[
    "general", "context", "style", "identity", "wardrobe", "scene", "product",
    "story", "character", "source-script", "shot", "dialogue", "action",
    "first-frame", "last-frame",
]


class CinematicCameraBrief(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    shot: str = Field(default="", max_length=200)
    movement: str = Field(default="", max_length=200)
    endpoint: str = Field(default="", max_length=200)


class CinematicLightBrief(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    motivated_source: str = Field(default="", max_length=200)
    transition: str = Field(default="", max_length=200)


class CinematicDirectorBrief(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    contract_version: Literal[1]
    schema_id: Literal["revid.cinematic-director-brief"]
    source_script_node_id: Identifier
    source_revision: Revision
    intention: DetailText
    visible_beat: DetailText
    camera: CinematicCameraBrief
    light: CinematicLightBrief
    blocking_performance: OptionalDetailText = ""
    motion: OptionalDetailText = ""
    sound_intent: OptionalDetailText = ""
    continuity_anchors: list[ShortText] = Field(default_factory=list, max_length=12)
    must_preserve: list[ShortText] = Field(default_factory=list, max_length=12)
    allowed_changes: list[ShortText] = Field(default_factory=list, max_length=12)
    must_not_transfer: list[ShortText] = Field(default_factory=list, max_length=12)
    safety_notes: list[ShortText] = Field(default_factory=list, max_length=12)


class CinematicReferenceTransfer(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    contract_version: Literal[1]
    node_id: Identifier
    role: ReferenceRole
    instruction: DetailText
    must_not_transfer: list[TransferExclusion] = Field(default_factory=list, max_length=12)
    source_revision: Revision

    @model_validator(mode="after")
    def validate_unique_exclusions(self):
        if len(set(self.must_not_transfer)) != len(self.must_not_transfer):
            raise ValueError("reference transfer exclusions must be unique")
        return self


class CinematicRetakeContext(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    contract_version: Literal[1]
    prior_task_id: Identifier
    prior_result_node_id: Identifier
    decision: Literal["keep", "fix_in_post", "edit", "reroll", "rewrite"]
    problem_category: Literal[
        "camera", "action", "identity", "continuity", "lighting", "composition", "audio", "other",
    ]
    repair_variable: ShortText | None
    attempt_count: int = Field(ge=0, le=8)
    revised_instruction: DetailText | None

    @model_validator(mode="after")
    def validate_retake_decision(self):
        if self.decision in {"reroll", "rewrite"} and self.repair_variable is None:
            raise ValueError("generation retake requires one repair variable")
        if self.decision == "rewrite" and self.revised_instruction is None:
            raise ValueError("rewrite requires a revised instruction")
        if self.decision != "rewrite" and self.revised_instruction is not None:
            raise ValueError("only rewrite accepts a revised instruction")
        if self.decision not in {"reroll", "rewrite"} and self.repair_variable is not None:
            raise ValueError("non-generation review cannot carry a repair variable")
        return self


class CinematicSequenceBeat(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    beat_id: Identifier
    summary: DetailText
    state: Literal["planned", "completed", "reserved"]


class CinematicSequenceClip(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    clip_id: Identifier
    scene_id: Identifier
    narrative_job: DetailText
    intention: DetailText
    state: Literal["planned", "generated", "accepted", "rejected"]
    accepted_result_node_id: Identifier | None
    accepted_result_revision: Revision | None
    observed_end_state: DetailText | None
    completed_beat_ids: list[Identifier] = Field(default_factory=list, max_length=100)
    reserved_beat_ids: list[Identifier] = Field(default_factory=list, max_length=100)
    extension_depth: int = Field(ge=0, le=8)
    attempt_count: int = Field(ge=0, le=8)

    @model_validator(mode="after")
    def validate_canon_shape(self):
        canon_values = (
            self.accepted_result_node_id,
            self.accepted_result_revision,
            self.observed_end_state,
        )
        if self.state == "accepted" and any(value is None for value in canon_values):
            raise ValueError("accepted clip requires complete observed canon")
        if self.state != "accepted" and any(value is not None for value in canon_values):
            raise ValueError("non-accepted clip cannot carry accepted canon")
        if len(set(self.completed_beat_ids)) != len(self.completed_beat_ids):
            raise ValueError("completed beat references must be unique")
        if len(set(self.reserved_beat_ids)) != len(self.reserved_beat_ids):
            raise ValueError("reserved beat references must be unique")
        if set(self.completed_beat_ids) & set(self.reserved_beat_ids):
            raise ValueError("completed and reserved beats must be disjoint")
        return self


class CinematicSequenceState(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    contract_version: Literal[1]
    schema_id: Literal["revid.cinematic-sequence"]
    sequence_id: Identifier
    source_script_node_id: Identifier
    source_revision: Revision
    story_objective: DetailText
    final_outcome: DetailText
    director_brief: CinematicDirectorBrief
    ordered_beats: list[CinematicSequenceBeat] = Field(min_length=1, max_length=100)
    clips: list[CinematicSequenceClip] = Field(min_length=1, max_length=25)
    canon_revision: int = Field(ge=0)

    @model_validator(mode="after")
    def validate_sequence_identity(self):
        beat_ids = [beat.beat_id for beat in self.ordered_beats]
        clip_ids = [clip.clip_id for clip in self.clips]
        if len(set(beat_ids)) != len(beat_ids) or len(set(clip_ids)) != len(clip_ids):
            raise ValueError("sequence beat and clip identities must be unique")
        known_beats = set(beat_ids)
        beat_states = {beat.beat_id: beat.state for beat in self.ordered_beats}
        for clip in self.clips:
            if not set(clip.completed_beat_ids).issubset(known_beats):
                raise ValueError("completed beat reference is unknown")
            if not set(clip.reserved_beat_ids).issubset(known_beats):
                raise ValueError("reserved beat reference is unknown")
            if any(beat_states[beat_id] != "completed" for beat_id in clip.completed_beat_ids):
                raise ValueError("completed beat reference has the wrong state")
            if any(beat_states[beat_id] != "reserved" for beat_id in clip.reserved_beat_ids):
                raise ValueError("reserved beat reference has the wrong state")
        if self.director_brief.source_script_node_id != self.source_script_node_id:
            raise ValueError("director brief source node does not match sequence")
        if self.director_brief.source_revision != self.source_revision:
            raise ValueError("director brief source revision does not match sequence")
        return self
