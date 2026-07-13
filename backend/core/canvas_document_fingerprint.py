from __future__ import annotations

import hashlib
import json
import math
from typing import Any


FINGERPRINT_FIELDS = (
    "base_revision",
    "node_upserts",
    "node_deletes",
    "connection_upserts",
    "connection_deletes",
)
MAX_SAFE_JSON_INTEGER = 9_007_199_254_740_991


def _validate_string(value: str) -> None:
    if any(0xD800 <= ord(character) <= 0xDFFF for character in value):
        raise ValueError("RFC 8785 canonical JSON rejects lone surrogate code points")


def _serialize_number(value: int | float) -> str:
    if isinstance(value, int):
        if abs(value) > MAX_SAFE_JSON_INTEGER:
            raise ValueError("RFC 8785 canonical JSON requires I-JSON safe integers")
        return str(value)
    if not math.isfinite(value):
        raise ValueError("RFC 8785 canonical JSON requires finite numbers")
    if value == 0:
        return "0"

    rendered = repr(value).lower()
    absolute = abs(value)
    if "e" not in rendered:
        return rendered[:-2] if rendered.endswith(".0") else rendered

    coefficient, exponent_text = rendered.split("e", 1)
    exponent = int(exponent_text)
    if 1e-6 <= absolute < 1e21:
        sign = ""
        if coefficient.startswith("-"):
            sign = "-"
            coefficient = coefficient[1:]
        digits = coefficient.replace(".", "")
        decimal_position = 1 + exponent
        if decimal_position <= 0:
            return f"{sign}0.{('0' * -decimal_position)}{digits}"
        if decimal_position >= len(digits):
            return f"{sign}{digits}{'0' * (decimal_position - len(digits))}"
        return f"{sign}{digits[:decimal_position]}.{digits[decimal_position:]}"

    if coefficient.endswith(".0"):
        coefficient = coefficient[:-2]
    exponent_sign = "+" if exponent >= 0 else "-"
    return f"{coefficient}e{exponent_sign}{abs(exponent)}"


def _key_order(value: str) -> bytes:
    _validate_string(value)
    return value.encode("utf-16-be", "surrogatepass")


def canonical_json(value: Any) -> str:
    if value is None:
        return "null"
    if value is True:
        return "true"
    if value is False:
        return "false"
    if isinstance(value, int | float) and not isinstance(value, bool):
        return _serialize_number(value)
    if isinstance(value, str):
        _validate_string(value)
        return json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    if isinstance(value, list | tuple):
        return "[" + ",".join(canonical_json(item) for item in value) + "]"
    if isinstance(value, dict):
        if not all(isinstance(key, str) for key in value):
            raise TypeError("RFC 8785 canonical JSON object keys must be strings")
        entries = (
            f"{canonical_json(key)}:{canonical_json(value[key])}"
            for key in sorted(value, key=_key_order)
        )
        return "{" + ",".join(entries) + "}"
    raise TypeError(f"Unsupported canonical JSON value: {type(value).__name__}")


def mutation_fingerprint(payload: dict[str, Any]) -> str:
    canonical_payload = {field: payload[field] for field in FINGERPRINT_FIELDS}
    return hashlib.sha256(canonical_json(canonical_payload).encode("utf-8")).hexdigest()
