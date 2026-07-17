from __future__ import annotations

from typing import Any, Iterable


SHOT_CONTROL_CONTRACT_VERSION = 1
SHOT_CONTROL_IDS = ("angle", "framing", "focus", "lighting", "temporal")
SHOT_CONTROL_VALUES = {
    "angle": ("eye-level", "high-angle", "low-angle", "overhead"),
    "framing": ("wide", "medium", "close-up"),
    "focus": ("deep", "shallow"),
    "lighting": ("natural", "soft", "dramatic"),
    "temporal": ("hold", "advance", "rewind"),
}
SHOT_CONTROL_DEFAULTS = {
    "angle": "eye-level",
    "framing": "medium",
    "focus": "deep",
    "lighting": "natural",
    "temporal": "hold",
}
MEDIA_SHOT_CONTROLS = {
    "image": ("angle", "framing", "focus", "lighting"),
    "video": SHOT_CONTROL_IDS,
}


class ShotControlContractError(ValueError):
    pass


def build_shot_control_capabilities(media_type: str) -> dict[str, Any]:
    if media_type not in MEDIA_SHOT_CONTROLS:
        raise ShotControlContractError("unknown shot control media type")
    return {
        "contract_version": SHOT_CONTROL_CONTRACT_VERSION,
        "supported_controls": [],
        "provider_controls": [],
        "defaults": dict(SHOT_CONTROL_DEFAULTS),
    }


def normalize_shot_controls(
    value: object,
    *,
    media_type: str,
    reference_mode: str | None,
    image_ids: list[str],
    provider_shot_controls: Iterable[str] = (),
) -> dict[str, Any] | None:
    if value is None:
        return None
    if media_type not in MEDIA_SHOT_CONTROLS:
        raise ShotControlContractError("unknown shot control media type")
    if not isinstance(value, dict) or set(value) != {"contract_version", *SHOT_CONTROL_IDS}:
        raise ShotControlContractError("invalid shot control fields")
    if value["contract_version"] != SHOT_CONTROL_CONTRACT_VERSION:
        raise ShotControlContractError("invalid shot control version")

    provider_controls = tuple(provider_shot_controls)
    allowed_controls = set(MEDIA_SHOT_CONTROLS[media_type])
    if (
        len(set(provider_controls)) != len(provider_controls)
        or any(control not in allowed_controls for control in provider_controls)
    ):
        raise ShotControlContractError("invalid provider shot controls")

    normalized = {"contract_version": SHOT_CONTROL_CONTRACT_VERSION}
    has_explicit_override = False
    for control in SHOT_CONTROL_IDS:
        selected = value[control]
        if selected not in SHOT_CONTROL_VALUES[control]:
            raise ShotControlContractError("unsupported shot control value")
        if selected != SHOT_CONTROL_DEFAULTS[control]:
            has_explicit_override = True
            if control not in provider_controls:
                raise ShotControlContractError("unsupported shot controls")
        normalized[control] = selected
    if not has_explicit_override:
        raise ShotControlContractError("shot controls require an explicit override")
    if normalized["temporal"] != "hold" and (
        media_type != "video" or reference_mode != "image-to-video" or len(image_ids) != 1
    ):
        raise ShotControlContractError("temporal direction requires video image-to-video")
    return normalized
