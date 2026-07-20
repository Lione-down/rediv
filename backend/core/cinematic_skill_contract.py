from __future__ import annotations

from copy import deepcopy
from hashlib import sha256
import json
from typing import Any

from core.agent_skill_contract import AgentSkillContractError, resolve_agent_skill_manifest
from core.agnes_contract import AGNES_CONTRACT, AgnesContract
from core.cinematic_constraint_envelope import build_cinematic_constraint_envelope


CINEMATIC_SKILL_CONTRACT_VERSION = 1
CINEMATIC_CAPABILITY_VERSION = 1
MAX_MENTIONS = 25
MAX_INSTRUCTION_LENGTH = 500
MAX_USER_INSTRUCTION_LENGTH = 4_000


class CinematicSkillContractError(ValueError):
    pass


_SKILL_MEDIA_TYPES = {
    "revid.cinema-script": "text",
    "revid.cinema-image": "image",
    "revid.cinema-video": "video",
}

_CANONICAL_SUBTYPES = {
    "script": {"script", "prompt"},
    "note": {"annotation"},
    "asset": {"image", "video", "audio"},
    "generation": {"image", "video"},
    "result": {"image", "video", "text"},
    "group": {"group", "storyboard"},
}

_PROVIDER_CATALOG_TEMPLATE = {
    "contract_version": CINEMATIC_SKILL_CONTRACT_VERSION,
    "providers": [
        {
            "id": "agnes",
            "capability_version": CINEMATIC_CAPABILITY_VERSION,
            "billing_responsibility": "platform",
            "requires_acknowledgement": False,
            "models": [
                {
                    "media_type": "text",
                    "user_selectable": True,
                    "automatic_routing": False,
                    "accepted_reference_media": ["text"],
                    "accepted_reference_roles": [
                        "story", "character", "scene", "source-script", "shot", "dialogue",
                    ],
                    "max_references": 25,
                    "supported_controls": ["shot-count", "aspect-ratio"],
                },
                {
                    "media_type": "image",
                    "user_selectable": True,
                    "automatic_routing": False,
                    "accepted_reference_media": ["image", "text"],
                    "accepted_reference_roles": [
                        "general", "context", "style", "identity", "wardrobe", "scene", "product",
                    ],
                    "max_references": 8,
                    "supported_controls": ["aspect-ratio", "shot-controls"],
                },
                {
                    "media_type": "video",
                    "user_selectable": True,
                    "automatic_routing": False,
                    "accepted_reference_media": ["image", "text"],
                    "accepted_reference_roles": [
                        "general", "context", "style", "identity", "scene", "action",
                        "first-frame", "last-frame",
                    ],
                    "max_references": 8,
                    "supported_controls": ["duration", "reference-mode", "shot-controls", "temporal"],
                },
            ],
        },
    ],
}


def _canonical_json(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def _bounded_string(value: object, maximum: int, label: str) -> str:
    if not isinstance(value, str) or not value.strip() or len(value.strip()) > maximum:
        raise CinematicSkillContractError(f"invalid {label}")
    return value.strip()


def build_cinematic_skill_capabilities(
    *, agnes_contract: AgnesContract = AGNES_CONTRACT,
) -> dict[str, Any]:
    catalog = deepcopy(_PROVIDER_CATALOG_TEMPLATE)
    for model in catalog["providers"][0]["models"]:
        model["id"] = agnes_contract.media[model["media_type"]].model
    return catalog


def build_cinematic_source_index(canvas_nodes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not isinstance(canvas_nodes, list):
        raise CinematicSkillContractError("Canvas source registry is invalid")
    items: list[dict[str, Any]] = []
    seen: set[str] = set()
    for raw_node in canvas_nodes:
        node = _validate_node(raw_node)
        node_id = node["id"]
        if node_id in seen:
            raise CinematicSkillContractError("Canvas source registry is invalid")
        seen.add(node_id)
        content = node["content"]
        title = content.get("title")
        if not isinstance(title, str) or not title.strip() or len(title.strip()) > 200:
            title = f"{node['node_type']} · {node_id}"
        items.append({
            "node_id": node_id,
            "title": title.strip(),
            "node_type": node["node_type"],
            "subtype": content["subtype"],
            "source_revision": cinematic_source_revision(node),
        })
    return items


def cinematic_source_revision(node: dict[str, Any]) -> str:
    if not isinstance(node, dict):
        raise CinematicSkillContractError("Canvas source is unavailable or noncanonical")
    content = node.get("content")
    if not isinstance(content, dict):
        raise CinematicSkillContractError("Canvas source is unavailable or noncanonical")
    revision_content = {
        key: value
        for key, value in content.items()
        if key not in {"title", "generation_status", "progress_percent", "progress_stage"}
    }
    revision_value = {
        "node_type": node.get("node_type"),
        "parent_node_id": node.get("parent_node_id"),
        "content": revision_content,
    }
    return sha256(_canonical_json(revision_value).encode("utf-8")).hexdigest()


def _validate_node(node: dict[str, Any] | None) -> dict[str, Any]:
    if not isinstance(node, dict) or node.get("status") == "deleted":
        raise CinematicSkillContractError("Canvas source is unavailable or noncanonical")
    node_type = node.get("node_type")
    content = node.get("content")
    subtype = content.get("subtype") if isinstance(content, dict) else None
    if (
        not isinstance(node.get("id"), str)
        or not isinstance(node_type, str)
        or node_type not in _CANONICAL_SUBTYPES
        or not isinstance(content, dict)
        or content.get("serialization_version") != 1
        or subtype not in _CANONICAL_SUBTYPES[node_type]
    ):
        raise CinematicSkillContractError("Canvas source is unavailable or noncanonical")
    return node


def _resolve_model(provider_id: str, model_id: str, media_type: str) -> tuple[dict[str, Any], dict[str, Any]]:
    for provider in build_cinematic_skill_capabilities()["providers"]:
        if provider["id"] != provider_id:
            continue
        for model in provider["models"]:
            if model["id"] == model_id and model["media_type"] == media_type:
                return provider, model
        raise CinematicSkillContractError("unsupported provider model for cinematic Skill")
    raise CinematicSkillContractError("unknown cinematic Skill provider")


def _source_media(node: dict[str, Any]) -> str:
    node_type = node["node_type"]
    subtype = node["content"]["subtype"]
    if node_type in {"script", "note"} or subtype == "text":
        return "text"
    if subtype in {"image", "video", "audio"}:
        return subtype
    if node_type == "generation":
        return "text"
    raise CinematicSkillContractError("Canvas source has no meaningful cinematic projection")


def _project_reference(
    node: dict[str, Any],
    *,
    role: str,
    instruction: str,
    model: dict[str, Any],
) -> dict[str, Any]:
    media_type = _source_media(node)
    if role not in model["accepted_reference_roles"] or media_type not in model["accepted_reference_media"]:
        raise CinematicSkillContractError("unsupported provider reference role or media")
    content = node["content"]
    asset_id = content.get("asset_id") if media_type in {"image", "video", "audio"} else None
    if media_type in {"image", "video", "audio"} and (
        not isinstance(asset_id, str) or not asset_id.strip()
    ):
        raise CinematicSkillContractError("Canvas source is unavailable or noncanonical")
    text = content.get("text") if media_type == "text" else None
    if text is not None and not isinstance(text, str):
        raise CinematicSkillContractError("Canvas source is unavailable or noncanonical")
    return {
        "node_id": node["id"],
        "role": role,
        "instruction": instruction,
        "source_revision": cinematic_source_revision(node),
        "media_type": media_type,
        "asset_id": asset_id.strip() if isinstance(asset_id, str) else None,
        "text": text.strip()[:MAX_USER_INSTRUCTION_LENGTH] if isinstance(text, str) else None,
    }


def _expand_mention(
    mention: dict[str, Any],
    *,
    nodes_by_id: dict[str, dict[str, Any]],
    model: dict[str, Any],
) -> list[dict[str, Any]]:
    if not isinstance(mention, dict) or set(mention) != {
        "node_id", "role", "instruction", "source_revision",
    }:
        raise CinematicSkillContractError("malformed structured mention")
    node_id = _bounded_string(mention["node_id"], 96, "mention node ID")
    role = _bounded_string(mention["role"], 32, "mention role")
    instruction = _bounded_string(mention["instruction"], MAX_INSTRUCTION_LENGTH, "mention instruction")
    source_revision = _bounded_string(mention["source_revision"], 64, "mention source revision")
    node = _validate_node(nodes_by_id.get(node_id))
    if source_revision != cinematic_source_revision(node):
        raise CinematicSkillContractError("structured mention source revision is stale")
    if node["node_type"] != "group":
        return [_project_reference(node, role=role, instruction=instruction, model=model)]

    ordered_child_ids = node["content"].get("ordered_child_ids")
    if not isinstance(ordered_child_ids, list) or not ordered_child_ids or len(ordered_child_ids) > MAX_MENTIONS:
        raise CinematicSkillContractError("Canvas group reference is malformed or over limit")
    if len(set(ordered_child_ids)) != len(ordered_child_ids):
        raise CinematicSkillContractError("duplicate Canvas group reference")
    references: list[dict[str, Any]] = []
    for child_id in ordered_child_ids:
        if not isinstance(child_id, str):
            raise CinematicSkillContractError("Canvas group reference is malformed or over limit")
        child = _validate_node(nodes_by_id.get(child_id))
        if child["node_type"] == "group" or child.get("parent_node_id") != node_id:
            raise CinematicSkillContractError("recursive or cross-group reference is unsupported")
        references.append(_project_reference(child, role=role, instruction=instruction, model=model))
    return references


def _optimized_prompt(
    *,
    skill_id: str,
    user_instruction: str,
    references: list[dict[str, Any]],
) -> str:
    policy = {
        "revid.cinema-script": (
            "保持故事结构、角色设定与分镜可生成性；不得覆盖用户明确要求。仅返回 revid.shot-sequence "
            "contract_version 2 JSON，包含 story_structure、character_consistency 与每个 ordered shot 的 "
            "shot_id、index、title、narrative、dialogue、characters、wardrobe、scene、action、framing_camera、"
            "duration_seconds、image_prompt、video_prompt、generatable、generatability_reason；不要输出 Markdown。"
        ),
        "revid.cinema-image": "保持用户绑定的风格、身份、服装、场景与产品约束；只允许用户明确要求的变化。",
        "revid.cinema-video": "保持首尾帧语义、视觉连续性、镜头运动与动作稳定；不得静默丢弃引用。",
    }[skill_id]
    lines = [f"用户指令：{user_instruction}", f"Skill 约束：{policy}"]
    if references:
        lines.append("结构化参考：")
        for index, reference in enumerate(references, 1):
            lines.append(
                f"{index}. [{reference['role']}] {reference['instruction']} "
                f"(node:{reference['node_id']}, revision:{reference['source_revision']})"
            )
            if reference["text"]:
                lines.append(f"   参考文本：{reference['text']}")
    return "\n".join(lines)


def build_cinematic_skill_preflight(
    *,
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
    if skill_version == 2:
        from core.cinematic_director_compiler import (
            CinematicDirectorCompilerError,
            compile_cinematic_director_preflight,
        )

        try:
            return compile_cinematic_director_preflight(
                skill_id=skill_id,
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
        except CinematicDirectorCompilerError as error:
            raise CinematicSkillContractError(str(error)) from error
    if any(value is not None for value in (workflow_mode, director_brief, sequence_context, retake_context)):
        raise CinematicSkillContractError("cinematic v1 cannot use director workflow fields")
    try:
        manifest = resolve_agent_skill_manifest(skill_id, skill_version)
    except AgentSkillContractError as error:
        raise CinematicSkillContractError(str(error)) from error
    media_type = _SKILL_MEDIA_TYPES.get(manifest.id)
    if media_type is None or manifest.execution_mode != "native-handoff":
        raise CinematicSkillContractError("unknown or unsupported cinematic Skill")
    project_id = _bounded_string(project_id, 96, "project scope")
    canvas_id = _bounded_string(canvas_id, 96, "Canvas scope")
    if type(canvas_revision) is not int or canvas_revision < 0:
        raise CinematicSkillContractError("invalid Canvas revision")
    user_instruction = _bounded_string(
        user_instruction,
        MAX_USER_INSTRUCTION_LENGTH,
        "user instruction",
    )
    if not isinstance(mentions, list) or len(mentions) > MAX_MENTIONS:
        raise CinematicSkillContractError("structured mention list is malformed or over limit")
    if not isinstance(generation_parameters, dict):
        raise CinematicSkillContractError("generation parameters are malformed")
    if not isinstance(canvas_nodes, list):
        raise CinematicSkillContractError("Canvas source registry is invalid")
    nodes_by_id: dict[str, dict[str, Any]] = {}
    for raw_node in canvas_nodes:
        node = _validate_node(raw_node)
        if node["id"] in nodes_by_id:
            raise CinematicSkillContractError("Canvas source registry is invalid")
        nodes_by_id[node["id"]] = node
    provider, model = _resolve_model(provider_id, model_id, media_type)
    parameter_controls = {
        "aspect_ratio": "aspect-ratio",
        "shot_controls": "shot-controls",
        "reference_mode": "reference-mode",
        "duration_seconds": "duration",
        "requested_shot_count": "shot-count",
    }
    unknown_parameters = set(generation_parameters) - {"image_ids", *parameter_controls}
    unsupported_parameters = {
        key for key in generation_parameters
        if key in parameter_controls and parameter_controls[key] not in model["supported_controls"]
    }
    if unknown_parameters or unsupported_parameters:
        raise CinematicSkillContractError("generation controls are unsupported by the selected provider model")
    references: list[dict[str, Any]] = []
    seen_mentions: set[str] = set()
    seen_references: set[str] = set()
    for mention in mentions:
        mention_id = mention.get("node_id") if isinstance(mention, dict) else None
        if isinstance(mention_id, str) and mention_id in seen_mentions:
            raise CinematicSkillContractError("duplicate structured mention")
        if isinstance(mention_id, str):
            seen_mentions.add(mention_id)
        for reference in _expand_mention(mention, nodes_by_id=nodes_by_id, model=model):
            if reference["node_id"] in seen_references:
                raise CinematicSkillContractError("duplicate projected cinematic reference")
            seen_references.add(reference["node_id"])
            references.append(reference)
    if len(references) > model["max_references"]:
        raise CinematicSkillContractError("cinematic reference count exceeds provider capability")

    native_image_ids = generation_parameters.get("image_ids", [])
    if (
        not isinstance(native_image_ids, list)
        or any(not isinstance(item, str) or not item.strip() for item in native_image_ids)
        or len(native_image_ids) != len(set(native_image_ids))
    ):
        raise CinematicSkillContractError("generation image references are malformed or duplicate")
    mentioned_image_ids = [
        reference["asset_id"]
        for reference in references
        if reference["media_type"] == "image" and reference["asset_id"] is not None
    ]
    image_ids = [*native_image_ids, *(
        image_id for image_id in mentioned_image_ids if image_id not in native_image_ids
    )]
    if len(image_ids) > model["max_references"]:
        raise CinematicSkillContractError("cinematic reference count exceeds provider capability")
    if manifest.id == "revid.cinema-video":
        reference_mode = generation_parameters.get("reference_mode")
        roles = {reference["role"] for reference in references}
        if "last-frame" in roles and reference_mode != "keyframes":
            raise CinematicSkillContractError("last-frame role requires exact keyframes capability")
        if "last-frame" in roles and "first-frame" not in roles:
            raise CinematicSkillContractError("last-frame role requires an explicit first-frame reference")
    canonical_request = {
        "skill_id": manifest.id,
        "skill_version": manifest.version,
        "provider_id": provider["id"],
        "model_id": model["id"],
        "optimized_prompt": _optimized_prompt(
            skill_id=manifest.id,
            user_instruction=user_instruction,
            references=references,
        ),
        "references": references,
        "image_ids": image_ids,
        "parameters": deepcopy(generation_parameters),
        "constraint_envelope": build_cinematic_constraint_envelope(
            manifest.id, user_instruction, references, generation_parameters,
        ),
    }
    canonical_request_json = _canonical_json(canonical_request)
    preserved = list(dict.fromkeys(reference["role"] for reference in references))
    return {
        "contract_version": CINEMATIC_SKILL_CONTRACT_VERSION,
        "skill": {"id": manifest.id, "version": manifest.version},
        "project_id": project_id,
        "canvas_id": canvas_id,
        "canvas_revision": canvas_revision,
        "provider_id": provider["id"],
        "model_id": model["id"],
        "capability_version": provider["capability_version"],
        "references": references,
        "summary": {
            "preserved_attributes": preserved,
            "allowed_changes": [user_instruction],
            "conflicts": [],
        },
        "canonical_request": canonical_request,
        "canonical_request_json": canonical_request_json,
        "exact_request": canonical_request_json,
        "request_digest": sha256(canonical_request_json.encode("utf-8")).hexdigest(),
        "requires_acknowledgement": provider["requires_acknowledgement"],
    }


def validate_cinematic_generation_handoff(
    **kwargs: Any,
) -> dict[str, Any]:
    from core.cinematic_skill_handoff import validate_cinematic_generation_handoff as validate

    return validate(**kwargs)
