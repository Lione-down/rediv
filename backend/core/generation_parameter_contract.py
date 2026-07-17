from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from core.image_operation_contract import build_image_operation_capabilities
from core.shot_control_contract import (
    ShotControlContractError,
    build_shot_control_capabilities,
    normalize_shot_controls,
)


CAPABILITY_CONTRACT_VERSION = 3
CONTRACT_VERSION = 1
IMAGE_MODEL = "agnes-image-2.1-flash"
IMAGE_SIZE = "1K"
IMAGE_ASPECT_RATIOS = ("1:1", "3:4", "4:3", "16:9", "9:16", "2:3", "3:2", "21:9")
IMAGE_DEFAULT_ASPECT_RATIO = "4:3"
VIDEO_MODEL = "agnes-video-v2.0"
VIDEO_WIDTH = 1152
VIDEO_HEIGHT = 768
VIDEO_FRAME_RATE = 24
VIDEO_REFERENCE_MODES = ("text-to-video", "image-to-video", "keyframes")
VIDEO_DEFAULT_DURATION_SECONDS = 5
VIDEO_MIN_KEYFRAMES = 2
VIDEO_MAX_KEYFRAMES = 8
VIDEO_DURATION_FRAMES = {3: 81, 5: 121, 10: 241, 18: 441}


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


def build_generation_capabilities() -> dict[str, Any]:
    return {
        "contract_version": CAPABILITY_CONTRACT_VERSION,
        "image": {
            "model": IMAGE_MODEL,
            "size": IMAGE_SIZE,
            "aspect_ratios": list(IMAGE_ASPECT_RATIOS),
            "default_aspect_ratio": IMAGE_DEFAULT_ASPECT_RATIO,
            "operations": build_image_operation_capabilities(),
            "shot_controls": build_shot_control_capabilities("image"),
        },
        "video": {
            "model": VIDEO_MODEL,
            "width": VIDEO_WIDTH,
            "height": VIDEO_HEIGHT,
            "reference_modes": list(VIDEO_REFERENCE_MODES),
            "default_duration_seconds": VIDEO_DEFAULT_DURATION_SECONDS,
            "min_keyframes": VIDEO_MIN_KEYFRAMES,
            "max_keyframes": VIDEO_MAX_KEYFRAMES,
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
    }


def normalize_image_parameters(
    *,
    aspect_ratio: str | None,
    image_ids: list[str] | None,
    recipe_id: str | None = None,
    recipe_version: int | None = None,
    recipe_size: str | None = None,
    shot_controls: object = None,
    provider_shot_controls: tuple[str, ...] = (),
) -> NormalizedImageParameters:
    ordered_image_ids = list(dict.fromkeys(image_ids or []))
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
    shot_controls: object = None,
    provider_shot_controls: tuple[str, ...] = (),
) -> NormalizedVideoParameters:
    ordered_image_ids = list(dict.fromkeys(image_ids or []))
    effective_duration = (
        VIDEO_DEFAULT_DURATION_SECONDS if duration_seconds is None else duration_seconds
    )
    num_frames = VIDEO_DURATION_FRAMES.get(effective_duration)
    if num_frames is None:
        raise GenerationParameterError("unsupported video duration")

    effective_mode = reference_mode
    if effective_mode is None:
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
    if effective_mode == "keyframes" and not (
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
