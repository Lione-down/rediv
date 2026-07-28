from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator


ProviderName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
ProviderDetail = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)]
ProviderPrompt = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=4000)]


class ProviderStoryboardAsset(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    name: ProviderName
    description: ProviderDetail
    image_prompt: ProviderPrompt
    image_prompt_zh: ProviderPrompt | None = None


class ProviderStoryboardAssets(BaseModel):
    model_config = ConfigDict(extra="forbid")

    roles: list[ProviderStoryboardAsset] = Field(default_factory=list, max_length=50)
    scenes: list[ProviderStoryboardAsset] = Field(min_length=1, max_length=50)
    props: list[ProviderStoryboardAsset] = Field(default_factory=list, max_length=50)

    @model_validator(mode="after")
    def validate_unique_names(self):
        names = [
            asset.name
            for assets in (self.roles, self.scenes, self.props)
            for asset in assets
        ]
        if len(set(names)) != len(names):
            raise ValueError("provider storyboard asset names must be unique")
        return self


class ProviderStoryboardShot(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    shot_number: int = Field(ge=1, le=25)
    duration_seconds: int = Field(ge=1, le=30)
    visual_description: ProviderDetail
    framing: ProviderName
    framing_zh: ProviderName | None = None
    scene: ProviderName
    roles: list[ProviderName] = Field(default_factory=list, max_length=12)
    props: list[ProviderName] = Field(default_factory=list, max_length=12)
    dialogue: str = Field(max_length=1000)
    music_sfx: str = Field(max_length=1000)
    camera_movement: ProviderName
    image_prompt: ProviderPrompt
    image_prompt_zh: ProviderPrompt | None = None
    video_prompt: ProviderPrompt
    video_prompt_zh: ProviderPrompt | None = None

    @model_validator(mode="after")
    def validate_unique_relations(self):
        if len(set(self.roles)) != len(self.roles) or len(set(self.props)) != len(self.props):
            raise ValueError("provider storyboard shot relations must be unique")
        return self


class ProviderStoryboardDocument(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    schema_id: Literal["revid.provider-storyboard"]
    schema_version: Literal[1]
    summary: ProviderDetail
    assets: ProviderStoryboardAssets
    shots: list[ProviderStoryboardShot] = Field(min_length=1, max_length=25)

    @model_validator(mode="after")
    def validate_document_graph(self):
        if [shot.shot_number for shot in self.shots] != list(range(1, len(self.shots) + 1)):
            raise ValueError("provider storyboard shots must use contiguous order")
        role_names = {asset.name for asset in self.assets.roles}
        scene_names = {asset.name for asset in self.assets.scenes}
        prop_names = {asset.name for asset in self.assets.props}
        for shot in self.shots:
            if shot.scene not in scene_names:
                raise ValueError("provider storyboard shot scene is unresolved")
            if not set(shot.roles).issubset(role_names):
                raise ValueError("provider storyboard shot role is unresolved")
            if not set(shot.props).issubset(prop_names):
                raise ValueError("provider storyboard shot prop is unresolved")
        return self
