from __future__ import annotations

from copy import deepcopy
from typing import Any


def build_cinematic_constraint_envelope(
    skill_id: str,
    user_instruction: str,
    references: list[dict[str, Any]],
    generation_parameters: dict[str, Any],
) -> dict[str, Any]:
    role_bindings: dict[str, list[dict[str, str]]] = {}
    for reference in references:
        role_bindings.setdefault(reference["role"], []).append({
            "node_id": reference["node_id"],
            "source_revision": reference["source_revision"],
            "instruction": reference["instruction"],
        })
    common = {
        "instruction_precedence": [
            "current-user-instruction", "reference-instruction", "current-node-parameters",
            "skill-consistency-policy", "provider-defaults",
        ],
        "current_user_instruction": user_instruction,
        "reference_role_bindings": role_bindings,
        "current_node_parameters": deepcopy(generation_parameters),
        "explicit_change_authority": [user_instruction],
    }
    if skill_id == "revid.cinema-image":
        lock_roles = ("style", "identity", "wardrobe", "scene", "product")
        return {
            **common,
            "locks": {role: role_bindings.get(role, []) for role in lock_roles},
            "negative_drift_constraints": [
                f"do-not-drift-{role}" for role in lock_roles if role_bindings.get(role)
            ][:5],
        }
    if skill_id == "revid.cinema-video":
        return {
            **common,
            "continuity": {
                "first_frame": role_bindings.get("first-frame", []),
                "last_frame": role_bindings.get("last-frame", []),
                "identity": role_bindings.get("identity", []),
                "style": role_bindings.get("style", []),
                "scene": role_bindings.get("scene", []),
                "action": role_bindings.get("action", []),
            },
            "camera_motion_intent": user_instruction,
            "action_stability_constraints": [
                "preserve-bound-frame-roles", "preserve-character-continuity", "avoid-unrequested-motion-drift",
            ],
        }
    return {
        **common,
        "story_structure": user_instruction,
        "character_consistency": role_bindings.get("character", []),
        "requested_shot_count": generation_parameters.get("requested_shot_count"),
        "generatability_required": True,
    }
