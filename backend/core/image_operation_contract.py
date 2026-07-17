from __future__ import annotations

import math
from typing import Any, Iterable


IMAGE_OPERATION_CONTRACT_VERSION = 1
IMAGE_OPERATION_IDS = (
    "expand",
    "inpaint",
    "erase",
    "cutout",
    "upscale",
    "region",
    "fusion",
)
LOCAL_IMAGE_OPERATIONS = ("region",)
PROVIDER_IMAGE_OPERATIONS: tuple[str, ...] = ()
REGION_COORDINATE_SPACE = "source-normalized"
MAX_FUSION_IMAGES = 8
UPSCALE_FACTORS = (2, 4)


class ImageOperationContractError(ValueError):
    pass


def build_image_operation_capabilities() -> dict[str, Any]:
    return {
        "contract_version": IMAGE_OPERATION_CONTRACT_VERSION,
        "supported_operations": list(LOCAL_IMAGE_OPERATIONS + PROVIDER_IMAGE_OPERATIONS),
        "provider_operations": list(PROVIDER_IMAGE_OPERATIONS),
        "region_coordinate_space": REGION_COORDINATE_SPACE,
        "max_fusion_images": MAX_FUSION_IMAGES,
        "upscale_factors": list(UPSCALE_FACTORS),
    }


def _exact_record(value: object, keys: set[str], label: str) -> dict[str, Any]:
    if not isinstance(value, dict) or set(value) != keys:
        raise ImageOperationContractError(f"invalid {label} fields")
    return value


def _number(value: object, label: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ImageOperationContractError(f"invalid {label}")
    return float(value)


def _normalize_region(value: object) -> dict[str, Any]:
    region = _exact_record(
        value,
        {"contract_version", "coordinate_space", "x", "y", "width", "height"},
        "region",
    )
    if region["contract_version"] != 1:
        raise ImageOperationContractError("invalid region version")
    if region["coordinate_space"] != REGION_COORDINATE_SPACE:
        raise ImageOperationContractError("invalid region coordinate space")
    x = _number(region["x"], "region bounds")
    y = _number(region["y"], "region bounds")
    width = _number(region["width"], "region bounds")
    height = _number(region["height"], "region bounds")
    if x < 0 or y < 0 or width <= 0 or height <= 0 or x + width > 1 or y + height > 1:
        raise ImageOperationContractError("invalid region bounds")
    return {**region, "x": x, "y": y, "width": width, "height": height}


def _normalize_mask(value: object) -> dict[str, Any]:
    mask = _exact_record(value, {"contract_version", "kind", "feather", "invert"}, "mask")
    if mask["contract_version"] != 1:
        raise ImageOperationContractError("invalid mask version")
    if mask["kind"] != "region":
        raise ImageOperationContractError("invalid mask kind")
    feather = _number(mask["feather"], "mask feather")
    if feather < 0 or feather > 1:
        raise ImageOperationContractError("invalid mask feather")
    if not isinstance(mask["invert"], bool):
        raise ImageOperationContractError("invalid mask invert")
    return {**mask, "feather": feather}


def _normalize_expansion(value: object) -> dict[str, Any]:
    expansion = _exact_record(
        value,
        {"contract_version", "top", "right", "bottom", "left"},
        "expansion",
    )
    if expansion["contract_version"] != 1:
        raise ImageOperationContractError("invalid expansion version")
    margins = {
        key: _number(expansion[key], "expansion bounds")
        for key in ("top", "right", "bottom", "left")
    }
    if any(value < 0 or value > 1 for value in margins.values()):
        raise ImageOperationContractError("invalid expansion bounds")
    if not any(margins.values()):
        raise ImageOperationContractError("expansion requires a positive margin")
    return {"contract_version": 1, **margins}


def normalize_image_operation(
    value: object,
    *,
    image_ids: list[str] | None,
    prompt: str | None,
    provider_operations: Iterable[str] = PROVIDER_IMAGE_OPERATIONS,
) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ImageOperationContractError("invalid image operation fields")
    if value.get("contract_version") != IMAGE_OPERATION_CONTRACT_VERSION:
        raise ImageOperationContractError("invalid image operation version")
    operation_id = value.get("id")
    if not isinstance(operation_id, str) or operation_id not in IMAGE_OPERATION_IDS:
        raise ImageOperationContractError("unknown image operation")
    if operation_id == "region":
        raise ImageOperationContractError("region operation is local-only")

    ordered_image_ids = list(image_ids or [])
    if len(set(ordered_image_ids)) != len(ordered_image_ids):
        raise ImageOperationContractError("image operation requires unique image references")
    if operation_id == "fusion":
        if not 2 <= len(ordered_image_ids) <= MAX_FUSION_IMAGES:
            raise ImageOperationContractError("fusion requires 2 to 8 image references")
    elif len(ordered_image_ids) != 1:
        raise ImageOperationContractError("image operation requires exactly one image reference")

    normalized: dict[str, Any] = {"contract_version": 1, "id": operation_id}
    if operation_id == "expand":
        _exact_record(value, {"contract_version", "id", "expansion"}, "image operation")
        normalized["expansion"] = _normalize_expansion(value["expansion"])
    elif operation_id in {"inpaint", "erase"}:
        if "region" not in value:
            raise ImageOperationContractError("image operation region is required")
        if "mask" not in value:
            raise ImageOperationContractError("image operation mask is required")
        _exact_record(value, {"contract_version", "id", "region", "mask"}, "image operation")
        normalized["region"] = _normalize_region(value["region"])
        normalized["mask"] = _normalize_mask(value["mask"])
    elif operation_id == "upscale":
        _exact_record(value, {"contract_version", "id", "upscale_factor"}, "image operation")
        factor = value["upscale_factor"]
        if isinstance(factor, bool) or factor not in UPSCALE_FACTORS:
            raise ImageOperationContractError("unsupported upscale factor")
        normalized["upscale_factor"] = factor
    else:
        _exact_record(value, {"contract_version", "id"}, "image operation")

    requires_prompt = operation_id in {"expand", "inpaint", "fusion"}
    has_prompt = isinstance(prompt, str) and bool(prompt.strip())
    if requires_prompt and not has_prompt:
        raise ImageOperationContractError("image operation prompt is required")
    if not requires_prompt and has_prompt:
        raise ImageOperationContractError("image operation does not accept a prompt")
    if operation_id not in tuple(provider_operations):
        raise ImageOperationContractError("unsupported image operation")
    return normalized
