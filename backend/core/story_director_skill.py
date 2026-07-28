from __future__ import annotations

from copy import deepcopy
import json
from typing import Literal

from schemas.story_production import StoryProductionDocument


StoryDirectorRoute = Literal["standalone_shot", "sequence_project"]


class StoryDirectorSkillError(ValueError):
    pass


def resolve_story_director_route(*, requested_shot_count: int | None) -> StoryDirectorRoute:
    if requested_shot_count is None:
        return "sequence_project"
    if requested_shot_count < 1 or requested_shot_count > 25:
        raise StoryDirectorSkillError("Requested shot count is outside the supported boundary")
    return "standalone_shot" if requested_shot_count == 1 else "sequence_project"


def build_story_director_messages(
    *,
    source_text: str,
    source_node_id: str,
    source_revision: str,
    model_id: str,
    requested_shot_count: int | None,
) -> list[dict[str, str]]:
    source_text = source_text.strip()
    if not source_text or len(source_text) > 12_000:
        raise StoryDirectorSkillError("Story source is outside the supported boundary")
    route = resolve_story_director_route(requested_shot_count=requested_shot_count)
    system = (
        "You are Revid's internal automatic story-production compiler. "
        "Return one strict JSON object for schema revid.provider-storyboard version 1. "
        "The exact top-level fields are schema_id, schema_version, summary, assets, and shots. "
        "Assets contains roles, scenes, and props; each asset contains name, description, "
        "image_prompt, and image_prompt_zh. Each shot contains shot_number, duration_seconds, "
        "visual_description, framing, framing_zh, scene, roles, props, dialogue, music_sfx, "
        "camera_movement, image_prompt, image_prompt_zh, a non-empty video_prompt, and "
        "video_prompt_zh. Keep provider-optimized prompts in English and supply truthful "
        "Chinese counterparts in every *_zh field. "
        "Use contiguous shot numbers and only asset names declared in assets. "
        "Do not return internal IDs, metadata, Markdown, or prose."
    )
    user = json.dumps({
        "route": route,
        "source_node_id": source_node_id,
        "source_revision": source_revision,
        "model_id": model_id,
        "requested_shot_count": requested_shot_count,
        "source_text": source_text,
    }, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def _record_id(record: dict[str, object]) -> str:
    value = record.get("asset_id") or record.get("shot_id")
    if not isinstance(value, str):
        raise StoryDirectorSkillError("Story-production record identity is missing")
    return value


def _merge_record(
    current: dict[str, object],
    candidate: dict[str, object],
) -> dict[str, object]:
    merged = deepcopy(candidate)
    locked_fields = current.get("locked_fields")
    if not isinstance(locked_fields, dict):
        raise StoryDirectorSkillError("Story-production lock map is invalid")
    editable_fields = current.get("editable_fields")
    if not isinstance(editable_fields, dict):
        raise StoryDirectorSkillError("Story-production editable-field map is invalid")
    protected_fields = set(locked_fields) | {
        field_name
        for field_name, provenance in editable_fields.items()
        if provenance == "user"
    }
    for field_name in protected_fields:
        if (locked_fields.get(field_name) or editable_fields.get(field_name) == "user") and field_name in current:
            merged[field_name] = deepcopy(current[field_name])
    merged["editable_fields"] = deepcopy(editable_fields)
    merged["locked_fields"] = deepcopy(locked_fields)
    generation_revision = current.get("generation_revision")
    if not isinstance(generation_revision, int):
        raise StoryDirectorSkillError("Story-production generation revision is invalid")
    merged["generation_revision"] = generation_revision + 1
    return merged


def _record_paths(document: dict[str, object]) -> list[tuple[str, str]]:
    return [
        ("assets", "roles"),
        ("assets", "scenes"),
        ("assets", "props"),
        ("shots", ""),
    ]


def merge_story_production(
    *,
    current: StoryProductionDocument,
    candidate: StoryProductionDocument,
    target_id: str | None,
) -> StoryProductionDocument:
    if (
        current.source_node_id != candidate.source_node_id
        or current.source_revision != candidate.source_revision
        or current.template_lineage != candidate.template_lineage
    ):
        raise StoryDirectorSkillError("Story-production regeneration source drifted")

    current_data = current.model_dump(mode="json")
    candidate_data = candidate.model_dump(mode="json")
    result = deepcopy(candidate_data if target_id is None else current_data)
    matched_target = target_id is None

    for parent_name, collection_name in _record_paths(current_data):
        if collection_name:
            current_items = current_data[parent_name][collection_name]
            candidate_items = candidate_data[parent_name][collection_name]
        else:
            current_items = current_data[parent_name]
            candidate_items = candidate_data[parent_name]
        current_by_id = {_record_id(item): item for item in current_items}
        candidate_by_id = {_record_id(item): item for item in candidate_items}

        if target_id is None:
            merged_items = []
            for candidate_item in candidate_items:
                record_id = _record_id(candidate_item)
                current_item = current_by_id.get(record_id)
                merged_items.append(
                    _merge_record(current_item, candidate_item)
                    if current_item is not None else deepcopy(candidate_item)
                )
        else:
            merged_items = deepcopy(current_items)
            if target_id in current_by_id and target_id in candidate_by_id:
                matched_target = True
                merged_items = [
                    _merge_record(item, candidate_by_id[target_id])
                    if _record_id(item) == target_id else item
                    for item in current_items
                ]

        if collection_name:
            result[parent_name][collection_name] = merged_items
        else:
            result[parent_name] = merged_items

    if not matched_target:
        raise StoryDirectorSkillError("Partial-regeneration target is unresolved")
    result["continuity"] = deepcopy(current_data["continuity"])
    return StoryProductionDocument.model_validate(result)


def reconcile_story_take(
    document: StoryProductionDocument,
    *,
    decision: Literal["accepted", "rejected"],
    take_id: str,
    result_node_id: str,
    result_revision: str,
    observed_end_state: str,
) -> StoryProductionDocument:
    if decision == "rejected":
        return document.model_copy(deep=True)
    data = document.model_dump(mode="json")
    data["continuity"].update({
        "accepted_take_id": take_id,
        "accepted_result_node_id": result_node_id,
        "accepted_result_revision": result_revision,
        "observed_end_state": observed_end_state,
    })
    return StoryProductionDocument.model_validate(data)
