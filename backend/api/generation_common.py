from fastapi import HTTPException, status

from api.canvases import map_canvas_domain_error
from controllers import canvas_documents as document_controller
from controllers import canvases as canvas_controller
from controllers import generation_transactions as generation_controller
from controllers import provider_cost_acknowledgements as acknowledgement_controller
from core.cinematic_skill_contract import (
    CinematicSkillContractError,
    validate_cinematic_generation_handoff,
)
from schemas.generation import CinematicGenerationHandoff
from core.generation_request_idempotency import generation_request_fingerprint


def map_generation_error(error: generation_controller.GenerationTransactionError) -> HTTPException:
    if isinstance(error, generation_controller.GenerationProviderBusyError):
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "provider_busy",
                "message": str(error),
                "retry_after_seconds": error.retry_after_seconds,
            },
            headers={"Retry-After": str(error.retry_after_seconds)},
        )
    if isinstance(error, generation_controller.GenerationIdempotencyConflictError):
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "generation_request_mismatch", "task_id": error.task_id},
        )
    if isinstance(error, generation_controller.GenerationRequestInProgressError):
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "generation_request_in_progress" if error.duplicate else "generation_node_busy",
                "task_id": error.task_id,
            },
        )
    if isinstance(error, generation_controller.GenerationRequestTerminalError):
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "generation_request_terminal",
                "task_id": error.task_id,
                "task_status": error.task_status,
            },
        )
    if isinstance(error, generation_controller.GenerationScopeNotFoundError):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    if isinstance(error, generation_controller.GenerationValidationError):
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    if isinstance(error, generation_controller.GenerationTaskStateError):
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))
    if isinstance(
        error,
        generation_controller.GenerationForbiddenError
        | generation_controller.GenerationFrozenError
        | generation_controller.GenerationQuotaError,
    ):
        return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to save generated asset",
    )


def fingerprint_generation_request(
    *,
    media_type: str,
    user_id: str,
    project_id: str,
    origin_canvas_id: str | None,
    canvas_node_id: str | None,
    provider: str,
    model: str,
    prompt: str | None,
    image_ids: list[str] | None,
    request_parameters: dict | None,
    cinematic_handoff: CinematicGenerationHandoff | None,
) -> str:
    return generation_request_fingerprint({
        "contract_version": 1,
        "media_type": media_type,
        "user_id": user_id,
        "project_id": project_id,
        "origin_canvas_id": origin_canvas_id,
        "canvas_node_id": canvas_node_id,
        "provider": provider,
        "model": model,
        "prompt": prompt,
        "image_ids": list(image_ids or []),
        "request_parameters": request_parameters,
        "cinematic_handoff": cinematic_handoff.model_dump(mode="json") if cinematic_handoff else None,
    })


def resolve_cinematic_generation_handoff(
    handoff: CinematicGenerationHandoff | None,
    *,
    user_id: str,
    project_id: str,
    canvas_id: str | None,
    media_type: str,
    provider_id: str,
    model_id: str,
    prompt: str | None,
    image_ids: list[str] | None,
    expected_control_parameters: dict,
) -> dict | None:
    if handoff is None:
        return None
    if not canvas_id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cinematic Skill requires Canvas scope")
    try:
        expected_skill_id = f"revid.cinema-{media_type}"
        if handoff.skill_id != expected_skill_id:
            raise CinematicSkillContractError("cinematic Skill media type drifted before native handoff")
        document = document_controller.get_document(project_id, canvas_id, user_id)
        if handoff.canvas_revision != document["revision"]:
            raise CinematicSkillContractError("Canvas revision drifted before native handoff")
        if handoff.provider_id != provider_id or handoff.model_id != model_id:
            raise CinematicSkillContractError("provider or model drifted before native handoff")
        submitted_controls = {
            key: value
            for key, value in handoff.generation_parameters.items()
            if key != "image_ids"
        }
        if submitted_controls != expected_control_parameters:
            raise CinematicSkillContractError("generation controls drifted before native handoff")
        resolved = validate_cinematic_generation_handoff(
            submitted_preflight=handoff.submitted_preflight,
            skill_id=handoff.skill_id,
            skill_version=handoff.skill_version,
            project_id=project_id,
            canvas_id=canvas_id,
            canvas_revision=document["revision"],
            provider_id=handoff.provider_id,
            model_id=handoff.model_id,
            user_instruction=handoff.user_instruction,
            mentions=[mention.model_dump() for mention in handoff.mentions],
            generation_parameters=handoff.generation_parameters,
            canvas_nodes=document["nodes"],
        )
        if resolved["request_snapshot"]["canonical_request"] and handoff.submitted_preflight.get("requires_acknowledgement"):
            acknowledgement = acknowledgement_controller.get_acknowledgement(user_id, handoff.provider_id)
            if not acknowledgement["active"]:
                raise CinematicSkillContractError("user-billed provider acknowledgement is missing or expired")
        if prompt != resolved["prompt"] or list(image_ids or []) != resolved["image_ids"]:
            raise CinematicSkillContractError("provider request drifted from cinematic preflight")
        if resolved["request_snapshot"]["canonical_request"]["skill_id"] != handoff.skill_id:
            raise CinematicSkillContractError("cinematic Skill identity drifted before native handoff")
        return resolved
    except CinematicSkillContractError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    except canvas_controller.CanvasDomainError as error:
        raise map_canvas_domain_error(error) from error
