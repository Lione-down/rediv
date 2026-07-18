from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal


AGENT_SKILL_CONTRACT_VERSION = 2
AgentSkillExecutionMode = Literal["mock-only", "unavailable", "native-handoff"]


class AgentSkillContractError(ValueError):
    pass


@dataclass(frozen=True)
class AgentSkillManifest:
    id: str
    version: int
    execution_mode: AgentSkillExecutionMode
    intent: str
    requires_acknowledgement: bool


_MANIFESTS = (
    AgentSkillManifest(
        id="revid.canvas-context",
        version=1,
        execution_mode="mock-only",
        intent="canvas-context",
        requires_acknowledgement=False,
    ),
    AgentSkillManifest(
        id="revid.cinema-script",
        version=1,
        execution_mode="native-handoff",
        intent="cinema-script",
        requires_acknowledgement=False,
    ),
    AgentSkillManifest(
        id="revid.cinema-image",
        version=1,
        execution_mode="native-handoff",
        intent="cinema-image",
        requires_acknowledgement=False,
    ),
    AgentSkillManifest(
        id="revid.cinema-video",
        version=1,
        execution_mode="native-handoff",
        intent="cinema-video",
        requires_acknowledgement=False,
    ),
)

_CANONICAL_SUBTYPES = {
    "script": {"script", "prompt"},
    "note": {"annotation"},
    "asset": {"image", "video", "audio"},
    "generation": {"image", "video"},
    "result": {"image", "video", "text"},
    "group": {"group", "storyboard"},
}


def _serialize_manifest(manifest: AgentSkillManifest) -> dict[str, Any]:
    return {
        "id": manifest.id,
        "version": manifest.version,
        "execution_mode": manifest.execution_mode,
        "intent": manifest.intent,
        "requires_acknowledgement": manifest.requires_acknowledgement,
    }


def build_agent_skill_capabilities(contract_version: int = 1) -> dict[str, Any]:
    """Describe the closed built-in registry while preserving T5-090's exact v1 view."""
    if contract_version not in (1, AGENT_SKILL_CONTRACT_VERSION):
        raise AgentSkillContractError("unknown Agent/Skill capability contract version")
    manifests = _MANIFESTS[:1] if contract_version == 1 else _MANIFESTS
    execution_modes = (
        ["mock-only", "unavailable"]
        if contract_version == 1
        else ["mock-only", "unavailable", "native-handoff"]
    )
    return {
        "contract_version": contract_version,
        "execution_modes": execution_modes,
        "skills": [_serialize_manifest(manifest) for manifest in manifests],
        "provider": {"available": False},
        "quota": {"available": False},
        "task": {"available": False},
    }


def resolve_agent_skill_manifest(skill_id: str, version: int) -> AgentSkillManifest:
    for manifest in _MANIFESTS:
        if manifest.id == skill_id and manifest.version == version:
            return manifest
    raise AgentSkillContractError("unknown or unsupported Revid Skill manifest")


def _resolve_canvas_sources(
    selected_node_ids: list[str],
    canvas_nodes: list[dict[str, Any]],
) -> list[dict[str, str]]:
    nodes_by_id: dict[str, dict[str, Any]] = {}
    for node in canvas_nodes:
        node_id = node.get("id") if isinstance(node, dict) else None
        if not isinstance(node_id, str) or not node_id or node_id in nodes_by_id:
            raise AgentSkillContractError("Canvas source registry is invalid")
        nodes_by_id[node_id] = node

    sources: list[dict[str, str]] = []
    for node_id in selected_node_ids:
        node = nodes_by_id.get(node_id)
        node_type = node.get("node_type") if node else None
        content = node.get("content") if node else None
        subtype = content.get("subtype") if isinstance(content, dict) else None
        if (
            node is None or node.get("status") == "deleted" or
            not isinstance(node_type, str) or node_type not in _CANONICAL_SUBTYPES or
            not isinstance(content, dict) or not isinstance(subtype, str) or
            type(content.get("serialization_version")) is not int or
            content["serialization_version"] != 1 or
            subtype not in _CANONICAL_SUBTYPES[node_type]
        ):
            raise AgentSkillContractError("Canvas source is unavailable or noncanonical")
        sources.append({
            "node_id": node_id,
            "role": "canvas-node",
            "node_type": node_type,
            "subtype": subtype,
        })
    return sources


def build_agent_skill_preflight(
    *,
    skill_id: str,
    skill_version: int,
    project_id: str,
    canvas_id: str,
    selected_node_ids: list[str],
    canvas_nodes: list[dict[str, Any]],
) -> dict[str, Any]:
    manifest = resolve_agent_skill_manifest(skill_id, skill_version)
    if manifest.id != "revid.canvas-context":
        raise AgentSkillContractError("cinematic Skill requires structured native preflight")
    if not project_id or not canvas_id or not selected_node_ids or len(selected_node_ids) > 25:
        raise AgentSkillContractError("invalid Revid Skill preflight scope")
    if len(set(selected_node_ids)) != len(selected_node_ids):
        raise AgentSkillContractError("duplicate Canvas source selection")
    sources = _resolve_canvas_sources(selected_node_ids, canvas_nodes)
    return {
        "contract_version": 1,
        "skill": _serialize_manifest(manifest),
        "project_id": project_id,
        "canvas_id": canvas_id,
        "sources": sources,
        "execution_mode": manifest.execution_mode,
        "requires_acknowledgement": manifest.requires_acknowledgement,
        "provider": {"available": False},
        "quota": {"available": False},
        "task": {"available": False},
    }
