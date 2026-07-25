from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from uuid import UUID

from core.agnes_contract import AGNES_CONTRACT, AgnesContract
from core.audio_generation_contract import build_audio_generation_capabilities
from core.image_operation_contract import build_image_operation_capabilities
from core.shot_control_contract import (
    ShotControlContractError,
    build_shot_control_capabilities,
    normalize_shot_controls,
)
from core.script_authoring_contract import build_script_authoring_capabilities


CAPABILITY_CONTRACT_VERSION = 6
CONTRACT_VERSION = 1
IMAGE_MODEL = AGNES_CONTRACT.media["image"].model
IMAGE_SIZE = "1K"
IMAGE_ASPECT_RATIOS = ("1:1", "3:4", "4:3", "16:9", "9:16", "2:3", "3:2", "21:9")
IMAGE_DEFAULT_ASPECT_RATIO = "4:3"
IMAGE_OUTPUT_COUNTS = (1, 2, 3, 4)
IMAGE_DEFAULT_OUTPUT_COUNT = 1
VIDEO_MODEL = AGNES_CONTRACT.media["video"].model
VIDEO_WIDTH = 1152
VIDEO_HEIGHT = 768
VIDEO_FRAME_RATE = 24
VIDEO_REFERENCE_MODES = ("text-to-video", "image-to-video", "keyframes")
VIDEO_DEFAULT_DURATION_SECONDS = 5
VIDEO_MIN_KEYFRAMES = 2
VIDEO_MAX_KEYFRAMES = 8
VIDEO_REFERENCE_ROLES = ("first-frame", "last-frame", "reference")
VIDEO_MAX_REFERENCES = 9
VIDEO_DURATION_FRAMES = {3: 81, 5: 121, 10: 241, 18: 441}
TEXT_WORKFLOW_MODES = ("text-to-video",)
TEXT_MODEL_LABELS = {
    "agnes-2.0-flash": "Agnes 2.0 Flash",
    "agnes-2.5-flash": "Agnes 2.5 Flash",
}


class GenerationParameterError(ValueError):
    pass


@dataclass(frozen=True)
class NormalizedImageParameters:
    provider_size: str
    provider_ratio: str | None
    request_parameters: dict[str, Any]


@dataclass(frozen=True)
class NormalizedVideoParameters:
    reference_mode: str
    duration_seconds: int
    num_frames: int
    frame_rate: int
    width: int
    height: int
    request_parameters: dict[str, Any]


def build_generation_capabilities(*, agnes_contract: AgnesContract = AGNES_CONTRACT) -> dict[str, Any]:
    text_capabilities = build_script_authoring_capabilities(
        model=agnes_contract.media["text"].model
    )
    model_label = text_capabilities["model_label"]
    text_capabilities["contract_version"] = 2
    text_capabilities["models"] = [
        {
            "id": model,
            "label": TEXT_MODEL_LABELS.get(
                model,
                model_label if model == agnes_contract.media["text"].model else model,
            ),
            "workflow_modes": list(TEXT_WORKFLOW_MODES),
        }
        for model in agnes_contract.media["text"].models
    ]
    text_capabilities["known_models"] = [
        {
            "id": model,
            "availability": (
                "allowed"
                if model in agnes_contract.media["text"].models
                else "gray"
                if model == "agnes-2.5-flash"
                else "paid-human-gated"
            ),
        }
        for model in agnes_contract.media["text"].known_models
    ]
    return {
        "contract_version": CAPABILITY_CONTRACT_VERSION,
        "text": text_capabilities,
        "image": {
            "model": agnes_contract.media["image"].model,
            "models": [
                {"id": model, "label": model}
                for model in agnes_contract.media["image"].models
            ],
            "known_models": [
                {"id": model, "label": model}
                for model in agnes_contract.media["image"].known_models
            ],
            "size": IMAGE_SIZE,
            "aspect_ratios": list(IMAGE_ASPECT_RATIOS),
            "default_aspect_ratio": IMAGE_DEFAULT_ASPECT_RATIO,
            "output_counts": list(IMAGE_OUTPUT_COUNTS),
            "default_output_count": IMAGE_DEFAULT_OUTPUT_COUNT,
            "operations": build_image_operation_capabilities(),
            "shot_controls": build_shot_control_capabilities("image"),
        },
        "video": {
            "model": agnes_contract.media["video"].model,
            "models": [
                {"id": model, "label": model}
                for model in agnes_contract.media["video"].models
            ],
            "known_models": [
                {"id": model, "label": model}
                for model in agnes_contract.media["video"].known_models
            ],
            "width": VIDEO_WIDTH,
            "height": VIDEO_HEIGHT,
            "reference_modes": list(VIDEO_REFERENCE_MODES),
            "default_duration_seconds": VIDEO_DEFAULT_DURATION_SECONDS,
            "min_keyframes": VIDEO_MIN_KEYFRAMES,
            "max_keyframes": VIDEO_MAX_KEYFRAMES,
            "reference_roles": list(VIDEO_REFERENCE_ROLES),
            "max_references": VIDEO_MAX_REFERENCES,
            "duration_presets": [
                {
                    "duration_seconds": duration_seconds,
                    "num_frames": num_frames,
                    "frame_rate": VIDEO_FRAME_RATE,
                }
                for duration_seconds, num_frames in VIDEO_DURATION_FRAMES.items()
            ],
            "shot_controls": build_shot_control_capabilities("video"),
        },
        "audio": build_audio_generation_capabilities(),
    }


def _normalize_image_batch(value: object) -> dict[str, Any] | None:
    if value is None:
        return None
    if not isinstance(value, dict) or set(value) != {"batch_id", "slot_index", "slot_count"}:
        raise GenerationParameterError("image batch fields are invalid")
    batch_id = value["batch_id"]
    try:
        parsed_batch_id = UUID(batch_id, version=4) if isinstance(batch_id, str) else None
    except ValueError as error:
        raise GenerationParameterError("image batch ID must be a UUID4") from error
    if parsed_batch_id is None or str(parsed_batch_id) != batch_id:
        raise GenerationParameterError("image batch ID must be a UUID4")
    slot_count = value["slot_count"]
    slot_index = value["slot_index"]
    if isinstance(slot_count, bool) or slot_count not in IMAGE_OUTPUT_COUNTS:
        raise GenerationParameterError("image batch slot count is unsupported")
    if isinstance(slot_index, bool) or not isinstance(slot_index, int) or not 1 <= slot_index <= slot_count:
        raise GenerationParameterError("image batch slot index is invalid")
    return {
        "batch_id": batch_id,
        "slot_index": slot_index,
        "slot_count": slot_count,
    }


def _normalize_video_references(value: object) -> list[dict[str, Any]] | None:
    if value is None:
        return None
    if not isinstance(value, list):
        raise GenerationParameterError("video reference bindings must be a list")
    if len(value) > VIDEO_MAX_REFERENCES:
        raise GenerationParameterError("video reference bindings have a maximum 9 entries")
    normalized: list[dict[str, Any]] = []
    identities: set[tuple[str, str, str]] = set()
    role_counts = {role: 0 for role in VIDEO_REFERENCE_ROLES}
    for index, binding in enumerate(value):
        if not isinstance(binding, dict) or set(binding) != {"node_id", "asset_id", "role", "order"}:
            raise GenerationParameterError("video reference binding fields are invalid")
        node_id = binding["node_id"]
        asset_id = binding["asset_id"]
        role = binding["role"]
        order = binding["order"]
        if not isinstance(node_id, str) or not node_id.strip() or len(node_id) > 96:
            raise GenerationParameterError("video reference node ID is invalid")
        if not isinstance(asset_id, str) or not asset_id.strip() or len(asset_id) > 36:
            raise GenerationParameterError("video reference asset ID is invalid")
        if role not in VIDEO_REFERENCE_ROLES:
            raise GenerationParameterError("video reference role is invalid")
        if isinstance(order, bool) or not isinstance(order, int) or order != index:
            raise GenerationParameterError("video reference order must be contiguous from zero")
        identity = (node_id, asset_id, role)
        if identity in identities:
            raise GenerationParameterError("duplicate video reference binding")
        identities.add(identity)
        role_counts[role] += 1
        normalized.append({"node_id": node_id, "asset_id": asset_id, "role": role, "order": order})
    if role_counts["first-frame"] > 1:
        raise GenerationParameterError("video references allow at most one first-frame")
    if role_counts["last-frame"] > 1:
        raise GenerationParameterError("video references allow at most one last-frame")
    return normalized


def normalize_image_parameters(
    *,
    aspect_ratio: str | None,
    image_ids: list[str] | None,
    batch: object = None,
    recipe_id: str | None = None,
    recipe_version: int | None = None,
    recipe_size: str | None = None,
    shot_controls: object = None,
    provider_shot_controls: tuple[str, ...] = (),
) -> NormalizedImageParameters:
    ordered_image_ids = list(dict.fromkeys(image_ids or []))
    normalized_batch = _normalize_image_batch(batch)
    if recipe_id is not None:
        if shot_controls is not None:
            raise GenerationParameterError("generation recipe cannot use shot controls")
        if aspect_ratio is not None:
            raise GenerationParameterError("generation recipe controls output size")
        if recipe_version is None or recipe_size is None:
            raise GenerationParameterError("generation recipe metadata is incomplete")
        request_parameters = {
            "contract_version": CONTRACT_VERSION,
            "media_type": "image",
            "model": IMAGE_MODEL,
            "size": recipe_size,
            "aspect_ratio": "4:3",
            "image_ids": ordered_image_ids,
            "generation_recipe_id": recipe_id,
            "generation_recipe_version": recipe_version,
        }
        if normalized_batch is not None:
            request_parameters["batch"] = normalized_batch
        return NormalizedImageParameters(
            provider_size=recipe_size,
            provider_ratio=None,
            request_parameters=request_parameters,
        )

    effective_ratio = IMAGE_DEFAULT_ASPECT_RATIO if aspect_ratio is None else aspect_ratio
    if effective_ratio not in IMAGE_ASPECT_RATIOS:
        raise GenerationParameterError("unsupported image aspect ratio")
    try:
        normalized_shot_controls = normalize_shot_controls(
            shot_controls,
            media_type="image",
            reference_mode=None,
            image_ids=ordered_image_ids,
            provider_shot_controls=provider_shot_controls,
        )
    except ShotControlContractError as error:
        raise GenerationParameterError(str(error)) from error
    request_parameters = {
        "contract_version": CONTRACT_VERSION,
        "media_type": "image",
        "model": IMAGE_MODEL,
        "size": IMAGE_SIZE,
        "aspect_ratio": effective_ratio,
        "image_ids": ordered_image_ids,
    }
    if normalized_shot_controls is not None:
        request_parameters["shot_controls"] = normalized_shot_controls
    if normalized_batch is not None:
        request_parameters["batch"] = normalized_batch
    return NormalizedImageParameters(
        provider_size=IMAGE_SIZE,
        provider_ratio=effective_ratio,
        request_parameters=request_parameters,
    )


def normalize_video_parameters(
    *,
    reference_mode: str | None,
    duration_seconds: int | None,
    image_ids: list[str] | None,
    video_references: object = None,
    shot_controls: object = None,
    provider_shot_controls: tuple[str, ...] = (),
) -> NormalizedVideoParameters:
    normalized_references = _normalize_video_references(video_references)
    if normalized_references is not None and (reference_mode is not None or image_ids is not None):
        raise GenerationParameterError("legacy and structured video references are mutually exclusive")
    ordered_image_ids = (
        [binding["asset_id"] for binding in normalized_references]
        if normalized_references is not None
        else list(dict.fromkeys(image_ids or []))
    )
    effective_duration = (
        VIDEO_DEFAULT_DURATION_SECONDS if duration_seconds is None else duration_seconds
    )
    num_frames = VIDEO_DURATION_FRAMES.get(effective_duration)
    if num_frames is None:
        raise GenerationParameterError("unsupported video duration")

    effective_mode = reference_mode
    if normalized_references is not None:
        effective_mode = (
            "text-to-video"
            if not normalized_references
            else "image-to-video"
            if len(normalized_references) == 1 and normalized_references[0]["role"] == "first-frame"
            else "keyframes"
        )
    elif effective_mode is None:
        effective_mode = (
            "text-to-video"
            if not ordered_image_ids
            else "image-to-video"
            if len(ordered_image_ids) == 1
            else "keyframes"
        )
    if effective_mode not in VIDEO_REFERENCE_MODES:
        raise GenerationParameterError("unsupported video reference mode")
    if effective_mode == "text-to-video" and ordered_image_ids:
        raise GenerationParameterError("text-to-video requires zero image references")
    if effective_mode == "image-to-video" and len(ordered_image_ids) != 1:
        raise GenerationParameterError("image-to-video requires exactly one image reference")
    if normalized_references is None and effective_mode == "keyframes" and not (
        VIDEO_MIN_KEYFRAMES <= len(ordered_image_ids) <= VIDEO_MAX_KEYFRAMES
    ):
        raise GenerationParameterError("keyframes requires 2 to 8 image references")

    try:
        normalized_shot_controls = normalize_shot_controls(
            shot_controls,
            media_type="video",
            reference_mode=effective_mode,
            image_ids=ordered_image_ids,
            provider_shot_controls=provider_shot_controls,
        )
    except ShotControlContractError as error:
        raise GenerationParameterError(str(error)) from error

    request_parameters = {
        "contract_version": CONTRACT_VERSION,
        "media_type": "video",
        "model": VIDEO_MODEL,
        "reference_mode": effective_mode,
        "duration_seconds": effective_duration,
        "num_frames": num_frames,
        "frame_rate": VIDEO_FRAME_RATE,
        "width": VIDEO_WIDTH,
        "height": VIDEO_HEIGHT,
        "image_ids": ordered_image_ids,
    }
    if normalized_references is not None:
        request_parameters["video_references"] = normalized_references
    if normalized_shot_controls is not None:
        request_parameters["shot_controls"] = normalized_shot_controls
    return NormalizedVideoParameters(
        reference_mode=effective_mode,
        duration_seconds=effective_duration,
        num_frames=num_frames,
        frame_rate=VIDEO_FRAME_RATE,
        width=VIDEO_WIDTH,
        height=VIDEO_HEIGHT,
        request_parameters=request_parameters,
    )
