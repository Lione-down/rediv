from __future__ import annotations

from copy import deepcopy
import hashlib
import json
from typing import Any

from pydantic import ValidationError

from schemas.provider_storyboard import ProviderStoryboardDocument
from schemas.story_production import StoryProductionDocument


MAX_STORY_DIRECTOR_OUTPUT_BYTES = 256 * 1024


class StoryDirectorOutputError(ValueError):
    pass


STORY_DIRECTOR_TOOL_NAME = "submit_revid_storyboard"


def build_story_director_tool_contract() -> tuple[list[dict[str, Any]], dict[str, Any]]:
    tool = {
        "type": "function",
        "function": {
            "name": STORY_DIRECTOR_TOOL_NAME,
            "description": "Submit one strict Revid provider storyboard.",
            "parameters": ProviderStoryboardDocument.model_json_schema(),
        },
    }
    tool_choice = {
        "type": "function",
        "function": {"name": STORY_DIRECTOR_TOOL_NAME},
    }
    return [tool], tool_choice


def extract_story_director_tool_arguments(response: object) -> str:
    if not isinstance(response, dict):
        raise StoryDirectorOutputError("Story director tool response must be an object")
    choices = response.get("choices")
    if not isinstance(choices, list) or len(choices) != 1:
        raise StoryDirectorOutputError("Story director tool response must have one choice")
    choice = choices[0]
    message = choice.get("message") if isinstance(choice, dict) else None
    tool_calls = message.get("tool_calls") if isinstance(message, dict) else None
    if not isinstance(tool_calls, list) or len(tool_calls) != 1:
        raise StoryDirectorOutputError("Story director response has no single tool call")
    tool_call = tool_calls[0]
    function = tool_call.get("function") if isinstance(tool_call, dict) else None
    arguments = function.get("arguments") if isinstance(function, dict) else None
    if (
        tool_call.get("type") != "function" or
        function.get("name") != STORY_DIRECTOR_TOOL_NAME or
        not isinstance(arguments, str) or
        not arguments.strip() or
        len(arguments.encode("utf-8")) > MAX_STORY_DIRECTOR_OUTPUT_BYTES
    ):
        raise StoryDirectorOutputError("Story director tool call is invalid")
    return arguments


def _unwrap_whole_response_json_fence(value: str) -> str:
    stripped = value.strip()
    lines = stripped.splitlines()
    if len(lines) < 3 or lines[-1].strip() != "```":
        return stripped
    opening = lines[0].strip().lower()
    if opening not in {"```", "```json"}:
        return stripped
    return "\n".join(lines[1:-1]).strip()


def _structured_payload(value: object) -> dict[str, Any]:
    if isinstance(value, str):
        if len(value.encode("utf-8")) > MAX_STORY_DIRECTOR_OUTPUT_BYTES:
            raise StoryDirectorOutputError("Story director output exceeds the size limit")
        value = _unwrap_whole_response_json_fence(value)
        try:
            value = json.loads(value)
        except json.JSONDecodeError as error:
            raise StoryDirectorOutputError("Story director output is not strict JSON") from error
    if not isinstance(value, dict):
        raise StoryDirectorOutputError("Story director output must be an object")
    if set(value) == {"story_production"}:
        value = value["story_production"]
    if not isinstance(value, dict):
        raise StoryDirectorOutputError("Story director output wrapper is invalid")
    if len(json.dumps(value, ensure_ascii=False).encode("utf-8")) > MAX_STORY_DIRECTOR_OUTPUT_BYTES:
        raise StoryDirectorOutputError("Story director output exceeds the size limit")
    return deepcopy(value)


def _stable_id(kind: str, value: str) -> str:
    digest = hashlib.sha256(f"{kind}\n{value}".encode("utf-8")).hexdigest()[:16]
    return f"{kind}-{digest}"


def _record_metadata(*, source_node_id: str, editable_fields: tuple[str, ...]) -> dict[str, Any]:
    return {
        "editable_fields": {field: "provider" for field in editable_fields},
        "locked_fields": {},
        "generation_revision": 1,
        "source_ids": [source_node_id],
        "validation_state": "valid",
    }


def _normalize_provider_storyboard(
    payload: dict[str, Any],
    *,
    source_node_id: str,
    source_revision: str,
    model_id: str,
) -> dict[str, Any]:
    provider = ProviderStoryboardDocument.model_validate(payload)
    asset_ids = {
        asset.name: _stable_id(kind, asset.name)
        for kind, assets in (
            ("role", provider.assets.roles),
            ("scene", provider.assets.scenes),
            ("prop", provider.assets.props),
        )
        for asset in assets
    }

    def normalize_assets(kind: str, assets: list) -> list[dict[str, Any]]:
        normalized = []
        for asset in assets:
            record = {
                **_record_metadata(
                    source_node_id=source_node_id,
                    editable_fields=("name", "description", "image_prompt"),
                ),
                "asset_id": asset_ids[asset.name],
                "name": asset.name,
                "description": asset.description,
                "image_prompt": asset.image_prompt,
            }
            if asset.image_prompt_zh is not None:
                record["editable_fields"]["image_prompt_zh"] = asset.image_prompt_zh
            normalized.append(record)
        return normalized

    events = [
        {
            "event_id": _stable_id("event", f"{shot.shot_number}:{shot.visual_description}"),
            "summary": shot.visual_description,
        }
        for shot in provider.shots
    ]
    shots = []
    for shot in provider.shots:
        record = {
            **_record_metadata(
                source_node_id=source_node_id,
                editable_fields=(
                    "duration_seconds",
                    "visual_description",
                    "framing",
                    "scene_id",
                    "role_ids",
                    "prop_ids",
                    "dialogue",
                    "music_sfx",
                    "camera_movement",
                    "image_prompt",
                    "video_prompt",
                ),
            ),
            "shot_id": _stable_id("shot", f"{shot.shot_number}:{shot.visual_description}"),
            "shot_number": shot.shot_number,
            "duration_seconds": shot.duration_seconds,
            "visual_description": shot.visual_description,
            "framing": shot.framing,
            "scene_id": asset_ids[shot.scene],
            "role_ids": [asset_ids[name] for name in shot.roles],
            "prop_ids": [asset_ids[name] for name in shot.props],
            "dialogue": shot.dialogue,
            "music_sfx": shot.music_sfx,
            "camera_movement": shot.camera_movement,
            "image_prompt": shot.image_prompt,
            "video_prompt": shot.video_prompt,
            "reference_ids": [],
            "continuity_locks": [asset_ids[name] for name in shot.roles],
            "reserved_beat_ids": [],
        }
        for field_name in ("framing_zh", "image_prompt_zh", "video_prompt_zh"):
            value = getattr(shot, field_name)
            if value is not None:
                record["editable_fields"][field_name] = value
        shots.append(record)
    return {
        "schema_id": "revid.story-production",
        "schema_version": 1,
        "skill_id": "revid.story-director",
        "skill_version": 1,
        "source_node_id": source_node_id,
        "source_revision": source_revision,
        "model_id": model_id,
        "story": {"summary": provider.summary, "events": events},
        "references": [],
        "continuity": {
            "canonical_revision": 0,
            "identity_locks": [asset_ids[asset.name] for asset in provider.assets.roles],
            "accepted_take_id": None,
            "accepted_result_node_id": None,
            "accepted_result_revision": None,
            "observed_end_state": None,
        },
        "assets": {
            "roles": normalize_assets("role", provider.assets.roles),
            "scenes": normalize_assets("scene", provider.assets.scenes),
            "props": normalize_assets("prop", provider.assets.props),
        },
        "shots": shots,
    }


def parse_story_director_output(
    value: object,
    *,
    source_node_id: str,
    source_revision: str,
    model_id: str,
) -> StoryProductionDocument:
    payload = _structured_payload(value)
    try:
        if payload.get("schema_id") == "revid.provider-storyboard":
            payload = _normalize_provider_storyboard(
                payload,
                source_node_id=source_node_id,
                source_revision=source_revision,
                model_id=model_id,
            )
        else:
            payload.update({
                "schema_id": "revid.story-production",
                "schema_version": 1,
                "skill_id": "revid.story-director",
                "skill_version": 1,
                "source_node_id": source_node_id,
                "source_revision": source_revision,
                "model_id": model_id,
            })
        return StoryProductionDocument.model_validate(payload)
    except ValidationError as error:
        raise StoryDirectorOutputError("Story director output violates the production schema") from error
