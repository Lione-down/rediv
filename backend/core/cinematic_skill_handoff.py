from __future__ import annotations

from copy import deepcopy
from typing import Any

from core.cinematic_skill_contract import (
    CinematicSkillContractError,
    build_cinematic_skill_preflight,
)


def validate_cinematic_generation_handoff(
    *,
    submitted_preflight: dict[str, Any],
    skill_id: str,
    skill_version: int,
    project_id: str,
    canvas_id: str,
    canvas_revision: int,
    provider_id: str,
    model_id: str,
    user_instruction: str,
    mentions: list[dict[str, Any]],
    generation_parameters: dict[str, Any],
    canvas_nodes: list[dict[str, Any]],
    workflow_mode: str | None = None,
    director_brief: dict[str, Any] | None = None,
    sequence_context: dict[str, Any] | None = None,
    retake_context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    current = build_cinematic_skill_preflight(
        skill_id=skill_id,
        skill_version=skill_version,
        project_id=project_id,
        canvas_id=canvas_id,
        canvas_revision=canvas_revision,
        provider_id=provider_id,
        model_id=model_id,
        user_instruction=user_instruction,
        mentions=mentions,
        generation_parameters=generation_parameters,
        canvas_nodes=canvas_nodes,
        workflow_mode=workflow_mode,
        director_brief=director_brief,
        sequence_context=sequence_context,
        retake_context=retake_context,
    )
    if not isinstance(submitted_preflight, dict) or submitted_preflight != current:
        raise CinematicSkillContractError("cinematic Skill preview or context drifted before submission")
    if not current.get("ready_for_handoff", True):
        raise CinematicSkillContractError("cinematic Skill preview is not ready for native handoff")
    request = current["canonical_request"]
    contract_version = current["contract_version"]
    return {
        "provider_id": current["provider_id"],
        "model_id": current["model_id"],
        "prompt": request["optimized_prompt"],
        "image_ids": list(request["image_ids"]),
        "request_digest": current["request_digest"],
        "request_snapshot": {
            "contract_version": contract_version,
            "skill_id": skill_id,
            "skill_version": skill_version,
            "canvas_revision": canvas_revision,
            "capability_version": current["capability_version"],
            **(
                {
                    "policy_version": request["policy_version"],
                    "workflow_mode": workflow_mode,
                    "director_brief": deepcopy(request["director_brief"]),
                    "reference_transfers": deepcopy(request["references"]),
                    "sequence_context": deepcopy(request["sequence_context"]),
                    "retake_context": deepcopy(request["retake_context"]),
                }
                if contract_version == 2 else {}
            ),
            "canonical_request": deepcopy(request),
            "request_digest": current["request_digest"],
        },
    }
