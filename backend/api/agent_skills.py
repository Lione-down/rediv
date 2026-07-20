from fastapi import APIRouter, Depends, HTTPException, status
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from api.canvases import map_canvas_domain_error
from controllers import canvas_documents as document_controller
from controllers import canvases as canvas_controller
from core.agent_skill_contract import (
    AgentSkillContractError,
    build_agent_skill_capabilities,
    build_agent_skill_preflight,
)
from core.cinematic_skill_contract import (
    CinematicSkillContractError,
    build_cinematic_skill_capabilities,
    build_cinematic_skill_preflight,
    build_cinematic_source_index,
)
from core.security import current_user
from schemas.cinematic_sequence import (
    CinematicDirectorBrief,
    CinematicRetakeContext,
    CinematicSequenceState,
    TransferExclusion,
)


class AgentSkillPreflightRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    skill_id: str = Field(min_length=1, max_length=96)
    skill_version: int = Field(ge=1, le=1)
    selected_node_ids: list[str] = Field(min_length=1, max_length=25)


class CinematicMentionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    node_id: str = Field(min_length=1, max_length=96)
    role: str = Field(min_length=1, max_length=32)
    instruction: str = Field(min_length=1, max_length=500)
    must_not_transfer: list[TransferExclusion] | None = Field(default=None, max_length=12)
    source_revision: str = Field(pattern=r"^[a-fA-F0-9]{64}$")


class CinematicSkillPreflightRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    skill_id: str = Field(min_length=1, max_length=96)
    skill_version: int = Field(ge=1, le=2)
    canvas_revision: int = Field(ge=0)
    provider_id: str = Field(min_length=1, max_length=64)
    model_id: str = Field(min_length=1, max_length=96)
    user_instruction: str = Field(min_length=1, max_length=4_000)
    mentions: list[CinematicMentionRequest] = Field(default_factory=list, max_length=25)
    generation_parameters: dict = Field(default_factory=dict)
    workflow_mode: Literal["standalone_clip", "sequence_clip", "continuation", "retake"] | None = None
    director_brief: CinematicDirectorBrief | None = None
    sequence_context: CinematicSequenceState | None = None
    retake_context: CinematicRetakeContext | None = None

    @model_validator(mode="after")
    def bound_structured_payload(self):
        import json

        if len(json.dumps(self.generation_parameters, ensure_ascii=False)) > 32_000:
            raise ValueError("generation parameters exceed the cinematic preflight limit")
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


router = APIRouter(
    prefix="/api/projects/{project_id}/canvases/{canvas_id}/agent-skills",
    tags=["agent-skills"],
)


def _guard_canvas(project_id: str, canvas_id: str, user_id: str) -> dict:
    try:
        return canvas_controller.get_canvas(project_id, canvas_id, user_id)
    except canvas_controller.CanvasDomainError as error:
        raise map_canvas_domain_error(error) from error


@router.get("")
def get_agent_skill_capabilities(
    project_id: str,
    canvas_id: str,
    contract_version: int = 1,
    user=Depends(current_user),
):
    _guard_canvas(project_id, canvas_id, user["id"])
    try:
        return build_agent_skill_capabilities(contract_version=contract_version)
    except AgentSkillContractError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error


@router.get("/cinematic-capabilities")
def get_cinematic_skill_capabilities(project_id: str, canvas_id: str, user=Depends(current_user)):
    _guard_canvas(project_id, canvas_id, user["id"])
    return build_cinematic_skill_capabilities()


@router.get("/cinematic-sources")
def get_cinematic_skill_sources(project_id: str, canvas_id: str, user=Depends(current_user)):
    _guard_canvas(project_id, canvas_id, user["id"])
    try:
        document = document_controller.get_document(project_id, canvas_id, user["id"])
        return {
            "canvas_revision": document["revision"],
            "items": build_cinematic_source_index(document["nodes"]),
        }
    except CinematicSkillContractError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
    except canvas_controller.CanvasDomainError as error:
        raise map_canvas_domain_error(error) from error


@router.post("/preflight")
def preflight_agent_skill(
    project_id: str,
    canvas_id: str,
    payload: AgentSkillPreflightRequest,
    user=Depends(current_user),
):
    _guard_canvas(project_id, canvas_id, user["id"])
    try:
        document = document_controller.get_document(project_id, canvas_id, user["id"])
        return build_agent_skill_preflight(
            skill_id=payload.skill_id,
            skill_version=payload.skill_version,
            project_id=project_id,
            canvas_id=canvas_id,
            selected_node_ids=payload.selected_node_ids,
            canvas_nodes=document["nodes"],
        )
    except AgentSkillContractError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
    except canvas_controller.CanvasDomainError as error:
        raise map_canvas_domain_error(error) from error


@router.post("/cinematic-preflight")
def preflight_cinematic_skill(
    project_id: str,
    canvas_id: str,
    payload: CinematicSkillPreflightRequest,
    user=Depends(current_user),
):
    _guard_canvas(project_id, canvas_id, user["id"])
    try:
        document = document_controller.get_document(project_id, canvas_id, user["id"])
        if payload.canvas_revision != document["revision"]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Canvas revision changed before cinematic Skill preflight",
            )
        return build_cinematic_skill_preflight(
            skill_id=payload.skill_id,
            skill_version=payload.skill_version,
            project_id=project_id,
            canvas_id=canvas_id,
            canvas_revision=document["revision"],
            provider_id=payload.provider_id,
            model_id=payload.model_id,
            user_instruction=payload.user_instruction,
            mentions=[item.model_dump(exclude_none=True) for item in payload.mentions],
            generation_parameters=payload.generation_parameters,
            canvas_nodes=document["nodes"],
            workflow_mode=payload.workflow_mode,
            director_brief=payload.director_brief.model_dump(mode="json") if payload.director_brief else None,
            sequence_context=payload.sequence_context.model_dump(mode="json") if payload.sequence_context else None,
            retake_context=payload.retake_context.model_dump(mode="json") if payload.retake_context else None,
        )
    except CinematicSkillContractError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
    except canvas_controller.CanvasDomainError as error:
        raise map_canvas_domain_error(error) from error
