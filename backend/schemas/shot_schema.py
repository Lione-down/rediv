from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator


ResourceId = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=36)]
BoundedTitle = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]
BoundedNarrative = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)
]
BoundedImagePrompt = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=1000)
]


class ShotSchemaGenerateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    contract_version: Literal[1] = 1
    provider: Literal["mock"] = "mock"
    source_script_node_id: ResourceId
    script: str = Field(min_length=1, max_length=12000)
    requested_shot_count: int | None = Field(default=None, ge=2, le=25)


class ShotSchemaShot(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    shot_id: Annotated[str, StringConstraints(min_length=7, max_length=7)]
    index: int = Field(ge=1, le=25)
    title: BoundedTitle
    narrative: BoundedNarrative
    image_prompt: BoundedImagePrompt


class ShotSchemaDocument(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    contract_version: Literal[1]
    schema_id: Literal["revid.shot-sequence"]
    provider: Literal["mock"]
    model: Literal["revid-shot-mock-v1"]
    project_id: ResourceId
    canvas_id: ResourceId
    source_script_node_id: ResourceId
    aspect_ratio: Literal["16:9", "9:16", "1:1", "4:3"]
    shot_count: int = Field(ge=2, le=25)
    shots: list[ShotSchemaShot] = Field(min_length=2, max_length=25)

    @model_validator(mode="after")
    def validate_shot_sequence(self):
        if self.shot_count != len(self.shots):
            raise ValueError("shot_count must match shots")
        for expected_index, shot in enumerate(self.shots, start=1):
            expected_id = f"shot-{expected_index:02d}"
            if shot.index != expected_index or shot.shot_id != expected_id:
                raise ValueError("shots must use contiguous ordered identities")
        return self
