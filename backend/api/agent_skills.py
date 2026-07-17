from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from api.canvases import map_canvas_domain_error
from controllers import canvas_documents as document_controller
from controllers import canvases as canvas_controller
from core.agent_skill_contract import (
    AgentSkillContractError,
    build_agent_skill_capabilities,
    build_agent_skill_preflight,
)
from core.security import current_user


class AgentSkillPreflightRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    skill_id: str = Field(min_length=1, max_length=96)
    skill_version: int = Field(ge=1, le=1)
    selected_node_ids: list[str] = Field(min_length=1, max_length=25)


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
def get_agent_skill_capabilities(project_id: str, canvas_id: str, user=Depends(current_user)):
    _guard_canvas(project_id, canvas_id, user["id"])
    return build_agent_skill_capabilities()


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
