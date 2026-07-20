from __future__ import annotations

from copy import deepcopy
from hashlib import sha256
import json
from typing import Any

from core.cinematic_director_contract import (
    CinematicDirectorContractError,
    parse_cinematic_director_brief,
    parse_cinematic_reference_transfer,
    parse_cinematic_retake_context,
)
from core.cinematic_sequence_contract import (
    CinematicSequenceContractError,
    parse_cinematic_sequence_state,
)
from core.generation_parameter_contract import (
    GenerationParameterError,
    normalize_image_parameters,
    normalize_video_parameters,
)


CINEMATIC_DIRECTOR_POLICY_VERSION = 2
WORKFLOW_MODES = {"standalone_clip", "sequence_clip", "continuation", "retake"}
VAGUE_INSTRUCTIONS = {
    "生成视频", "生成一个视频", "做个视频", "生成图片", "生成一张图片",
    "写一个脚本", "生成脚本", "帮我生成",
}
INSTRUCTION_PRECEDENCE = (
    "current_user_instruction",
    "reference_transfer",
    "accepted_canon",
    "current_node_parameters",
    "director_policy",
    "provider_defaults",
)
CONTROL_MAPPING = {
    "aspect_ratio": "aspect-ratio",
    "shot_controls": "shot-controls",
    "reference_mode": "reference-mode",
    "duration_seconds": "duration",
    "requested_shot_count": "shot-count",
    "image_ids": "native-image-references",
}


class CinematicDirectorCompilerError(ValueError):
    pass


def _canonical_json(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def _parse_transfers(mentions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    transfers: list[dict[str, Any]] = []
    for mention in mentions:
        if not isinstance(mention, dict) or set(mention) != {
            "node_id", "role", "instruction", "must_not_transfer", "source_revision",
        }:
            raise CinematicDirectorCompilerError("malformed cinematic v2 reference transfer")
        try:
            parsed = parse_cinematic_reference_transfer({"contract_version": 1, **mention})
        except CinematicDirectorContractError as error:
            raise CinematicDirectorCompilerError(str(error)) from error
        parsed.pop("contract_version", None)
        transfers.append(parsed)
    return transfers


def _validate_context_source(context: dict[str, Any], source_index: dict[str, str]) -> None:
    node_id = context["source_script_node_id"]
    if source_index.get(node_id) != context["source_revision"]:
        raise CinematicDirectorCompilerError("cinematic director source revision is stale")


def _parse_contexts(
    *,
    workflow_mode: str,
    director_brief: dict[str, Any] | None,
    sequence_context: dict[str, Any] | None,
    retake_context: dict[str, Any] | None,
    source_index: dict[str, str],
) -> tuple[dict[str, Any] | None, dict[str, Any] | None, dict[str, Any] | None]:
    try:
        director = parse_cinematic_director_brief(director_brief) if director_brief is not None else None
        sequence = parse_cinematic_sequence_state(sequence_context) if sequence_context is not None else None
        retake = parse_cinematic_retake_context(retake_context) if retake_context is not None else None
    except (CinematicDirectorContractError, CinematicSequenceContractError) as error:
        raise CinematicDirectorCompilerError(str(error)) from error
    if workflow_mode == "standalone_clip" and (sequence is not None or retake is not None):
        raise CinematicDirectorCompilerError("standalone cinematic workflow cannot carry sequence or retake context")
    if workflow_mode in {"sequence_clip", "continuation"} and (sequence is None or retake is not None):
        raise CinematicDirectorCompilerError("sequence cinematic workflow requires exact sequence context")
    if workflow_mode == "retake" and retake is None:
        raise CinematicDirectorCompilerError("retake workflow requires exact retake context")
    if workflow_mode != "retake" and retake is not None:
        raise CinematicDirectorCompilerError("retake context is unsupported for this workflow")
    if sequence is not None:
        _validate_context_source(sequence, source_index)
        sequence_director = sequence["director_brief"]
        if director is not None and director != sequence_director:
            raise CinematicDirectorCompilerError("director brief drifted from sequence context")
        director = sequence_director
    if director is not None:
        _validate_context_source(director, source_index)
    return director, sequence, retake


def _sequence_projection(sequence: dict[str, Any] | None) -> dict[str, Any] | None:
    if sequence is None:
        return None
    completed: list[str] = []
    reserved: list[str] = []
    for clip in sequence["clips"]:
        completed.extend(item for item in clip["completed_beat_ids"] if item not in completed)
        reserved.extend(item for item in clip["reserved_beat_ids"] if item not in reserved)
    current_clip = next(
        (clip for clip in sequence["clips"] if clip["state"] in {"planned", "generated"}),
        None,
    )
    accepted = next((clip for clip in reversed(sequence["clips"]) if clip["state"] == "accepted"), None)
    return {
        "sequence_id": sequence["sequence_id"],
        "canon_revision": sequence["canon_revision"],
        "current_clip_id": current_clip["clip_id"] if current_clip else None,
        "accepted_source": (
            {
                "clip_id": accepted["clip_id"],
                "result_node_id": accepted["accepted_result_node_id"],
                "result_revision": accepted["accepted_result_revision"],
                "observed_end_state": accepted["observed_end_state"],
            }
            if accepted else None
        ),
        "completed_beat_ids": completed,
        "reserved_beat_ids": reserved,
        "excluded_beat_ids": [
            beat["beat_id"]
            for beat in sequence["ordered_beats"]
            if beat["beat_id"] not in completed and beat["beat_id"] not in reserved
        ],
    }


def _reference_conflicts(references: list[dict[str, Any]]) -> list[dict[str, str]]:
    conflicts: list[dict[str, str]] = []
    for reference in references:
        exclusions = set(reference["must_not_transfer"])
        is_excluded = reference["role"] in exclusions or (
            reference["role"] == "identity" and bool(exclusions & {"identity", "face"})
        )
        if is_excluded:
            conflicts.append({
                "code": "reference_role_excluded",
                "node_id": reference["node_id"],
                "message": "reference primary role is excluded by its transfer policy",
            })
    return conflicts


def _validate_native_parameters(
    *,
    skill_id: str,
    generation_parameters: dict[str, Any],
    image_ids: list[str],
) -> None:
    try:
        if skill_id == "revid.cinema-image":
            if "aspect_ratio" not in generation_parameters:
                raise CinematicDirectorCompilerError("cinematic v2 image requires explicit aspect ratio")
            normalize_image_parameters(
                aspect_ratio=generation_parameters.get("aspect_ratio"),
                image_ids=image_ids,
                shot_controls=generation_parameters.get("shot_controls"),
            )
        elif skill_id == "revid.cinema-video":
            if not {"reference_mode", "duration_seconds"}.issubset(generation_parameters):
                raise CinematicDirectorCompilerError(
                    "cinematic v2 video requires explicit reference mode and duration"
                )
            normalize_video_parameters(
                reference_mode=generation_parameters.get("reference_mode"),
                duration_seconds=generation_parameters.get("duration_seconds"),
                image_ids=image_ids,
                shot_controls=generation_parameters.get("shot_controls"),
            )
    except GenerationParameterError as error:
        raise CinematicDirectorCompilerError(str(error)) from error


def _optimized_prompt(
    *,
    skill_id: str,
    user_instruction: str,
    references: list[dict[str, Any]],
    director: dict[str, Any] | None,
    sequence: dict[str, Any] | None,
    generation_parameters: dict[str, Any],
) -> str:
    lines = [f"当前明确指令：{user_instruction}"]
    if references:
        lines.append("参考传递：")
        for index, reference in enumerate(references, 1):
            exclusions = "、".join(reference["must_not_transfer"]) or "无"
            lines.append(
                f"{index}. [{reference['role']}] {reference['instruction']}；禁止传递：{exclusions} "
                f"(node:{reference['node_id']}, revision:{reference['source_revision']})"
            )
    projection = _sequence_projection(sequence)
    if projection and projection["accepted_source"]:
        accepted = projection["accepted_source"]
        lines.append(f"已接受 canon：{accepted['observed_end_state']} (result:{accepted['result_node_id']})")
    lines.append(f"当前节点参数：{_canonical_json(generation_parameters)}")
    if director is not None:
        lines.extend([
            f"导演意图：{director['intention']}",
            f"可见节拍：{director['visible_beat']}",
            "导演控制："
            f"camera={_canonical_json(director['camera'])};"
            f"light={_canonical_json(director['light'])};"
            f"performance={director['blocking_performance']};"
            f"motion={director['motion']};sound={director['sound_intent']}",
        ])
    lines.append("导演政策：保持显式指令、参考传递和已接受 canon，不得静默削弱约束或改变 provider/model。")
    if skill_id == "revid.cinema-script":
        lines.append(
            "输出契约：只返回 revid.cinematic-sequence contract_version 1 JSON，不要 Markdown；"
            "保持 source_script_node_id、source_revision 和 director_brief 精确一致，clip 不超过 25。"
        )
    return "\n".join(lines)


def compile_cinematic_director_preflight(
    *,
    skill_id: str,
    project_id: str,
    canvas_id: str,
    canvas_revision: int,
    provider_id: str,
    model_id: str,
    user_instruction: str,
    mentions: list[dict[str, Any]],
    generation_parameters: dict[str, Any],
    canvas_nodes: list[dict[str, Any]],
    workflow_mode: str | None,
    director_brief: dict[str, Any] | None,
    sequence_context: dict[str, Any] | None,
    retake_context: dict[str, Any] | None,
) -> dict[str, Any]:
    if workflow_mode not in WORKFLOW_MODES:
        raise CinematicDirectorCompilerError("unknown cinematic workflow mode")
    if not isinstance(mentions, list):
        raise CinematicDirectorCompilerError("cinematic reference transfers are malformed")
    transfers = _parse_transfers(mentions)
    legacy_mentions = [
        {key: transfer[key] for key in ("node_id", "role", "instruction", "source_revision")}
        for transfer in transfers
    ]
    from core.cinematic_skill_contract import (
        build_cinematic_skill_preflight,
        build_cinematic_source_index,
    )

    legacy = build_cinematic_skill_preflight(
        skill_id=skill_id,
        skill_version=1,
        project_id=project_id,
        canvas_id=canvas_id,
        canvas_revision=canvas_revision,
        provider_id=provider_id,
        model_id=model_id,
        user_instruction=user_instruction,
        mentions=legacy_mentions,
        generation_parameters=generation_parameters,
        canvas_nodes=canvas_nodes,
    )
    _validate_native_parameters(
        skill_id=skill_id,
        generation_parameters=generation_parameters,
        image_ids=list(legacy["canonical_request"]["image_ids"]),
    )
    transfer_by_node = {transfer["node_id"]: transfer for transfer in transfers}
    nodes_by_id = {node.get("id"): node for node in canvas_nodes if isinstance(node, dict)}
    references: list[dict[str, Any]] = []
    for reference in legacy["references"]:
        node = nodes_by_id.get(reference["node_id"])
        parent_id = node.get("parent_node_id") if isinstance(node, dict) else None
        transfer = transfer_by_node.get(reference["node_id"]) or transfer_by_node.get(parent_id)
        if transfer is None:
            raise CinematicDirectorCompilerError("projected reference lost its transfer policy")
        references.append({
            **reference,
            "must_not_transfer": transfer["must_not_transfer"],
        })
    source_index = {
        item["node_id"]: item["source_revision"]
        for item in build_cinematic_source_index(canvas_nodes)
    }
    director, sequence, retake = _parse_contexts(
        workflow_mode=workflow_mode,
        director_brief=director_brief,
        sequence_context=sequence_context,
        retake_context=retake_context,
        source_index=source_index,
    )
    is_vague = director is None and user_instruction.strip().lower() in VAGUE_INSTRUCTIONS
    conflicts = _reference_conflicts(references)
    recommendations = (
        [{"code": "director_brief_required", "message": "Add an explicit director brief before handoff."}]
        if is_vague else []
    )
    director_coherence = (
        "director_brief_required" if is_vague else "explicit_brief" if director else "standalone_fast_lane"
    )
    warnings: list[dict[str, str]] = []
    sequence_projection = _sequence_projection(sequence)
    precedence = [
        {"rank": index, "source": source}
        for index, source in enumerate(INSTRUCTION_PRECEDENCE, 1)
    ]
    canonical_request = {
        "skill_id": skill_id,
        "skill_version": 2,
        "policy_version": CINEMATIC_DIRECTOR_POLICY_VERSION,
        "workflow_mode": workflow_mode,
        "scope": {"project_id": project_id, "canvas_id": canvas_id, "canvas_revision": canvas_revision},
        "provider": {
            "provider_id": legacy["provider_id"],
            "model_id": legacy["model_id"],
            "capability_version": legacy["capability_version"],
        },
        "user_instruction": user_instruction.strip(),
        "instruction_precedence": precedence,
        "director_brief": deepcopy(director),
        "director_coherence": director_coherence,
        "references": deepcopy(references),
        "sequence_context": deepcopy(sequence_projection),
        "retake_context": deepcopy(retake),
        "image_ids": list(legacy["canonical_request"]["image_ids"]),
        "parameters": deepcopy(generation_parameters),
        "supported_control_mapping": {
            key: CONTROL_MAPPING[key]
            for key in generation_parameters
            if key in CONTROL_MAPPING
        },
        "optimized_prompt": _optimized_prompt(
            skill_id=skill_id,
            user_instruction=user_instruction.strip(),
            references=references,
            director=director,
            sequence=sequence,
            generation_parameters=generation_parameters,
        ),
        "constraint_envelope": deepcopy(legacy["canonical_request"]["constraint_envelope"]),
        "warnings": warnings,
        "conflicts": conflicts,
        "recommendations": recommendations,
    }
    canonical_request_json = _canonical_json(canonical_request)
    return {
        "contract_version": 2,
        "skill": {"id": skill_id, "version": 2},
        "workflow_mode": workflow_mode,
        "project_id": project_id,
        "canvas_id": canvas_id,
        "canvas_revision": canvas_revision,
        "provider_id": legacy["provider_id"],
        "model_id": legacy["model_id"],
        "capability_version": legacy["capability_version"],
        "director_coherence": director_coherence,
        "references": references,
        "warnings": warnings,
        "conflicts": conflicts,
        "recommendations": recommendations,
        "ready_for_handoff": not recommendations and not conflicts,
        "canonical_request": canonical_request,
        "canonical_request_json": canonical_request_json,
        "exact_request": canonical_request_json,
        "request_digest": sha256(canonical_request_json.encode("utf-8")).hexdigest(),
        "requires_acknowledgement": legacy["requires_acknowledgement"],
    }
