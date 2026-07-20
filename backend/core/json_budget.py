from __future__ import annotations

import json
from dataclasses import dataclass

from starlette.requests import Request


CANVAS_DOCUMENT_MAX_BODY_BYTES = 2 * 1024 * 1024
CANVAS_NODE_CONTENT_MAX_BYTES = 64 * 1024
CANVAS_CONNECTION_METADATA_MAX_BYTES = 16 * 1024
CANVAS_DOCUMENT_MAX_DEPTH = 16
CANVAS_DOCUMENT_MAX_KEYS = 50_000
CANVAS_DOCUMENT_MAX_STRINGS = 75_000
CANVAS_DOCUMENT_MAX_STRING_BYTES = 1536 * 1024


class JsonBudgetError(ValueError):
    pass


class JsonBodyTooLargeError(JsonBudgetError):
    pass


class JsonAggregateTooLargeError(JsonBudgetError):
    pass


class JsonShapeBudgetError(JsonBudgetError):
    pass


class JsonMalformedError(JsonBudgetError):
    pass


@dataclass(frozen=True)
class JsonMeasurement:
    serialized_bytes: int
    max_depth: int
    key_count: int
    string_count: int
    string_bytes: int


async def read_canvas_document_json(request: Request) -> object:
    raw_body = await _read_limited_body(request, CANVAS_DOCUMENT_MAX_BODY_BYTES)
    _validate_raw_depth(raw_body, CANVAS_DOCUMENT_MAX_DEPTH)
    try:
        payload = json.loads(raw_body, parse_constant=_reject_nonfinite_constant)
    except (UnicodeDecodeError, json.JSONDecodeError, JsonMalformedError):
        raise JsonMalformedError("Malformed JSON body") from None
    validate_canvas_document_budget(payload)
    return payload


async def _read_limited_body(request: Request, max_bytes: int) -> bytes:
    content_length = request.headers.get("content-length")
    if content_length is not None:
        try:
            declared_bytes = int(content_length)
        except ValueError:
            declared_bytes = None
        if declared_bytes is not None and declared_bytes > max_bytes:
            raise JsonBodyTooLargeError("Canvas document body is too large")

    body = bytearray()
    async for chunk in request.stream():
        body.extend(chunk)
        if len(body) > max_bytes:
            raise JsonBodyTooLargeError("Canvas document body is too large")
    return bytes(body)


def validate_canvas_document_budget(payload: object) -> None:
    measurement = measure_json(payload)
    if measurement.max_depth > CANVAS_DOCUMENT_MAX_DEPTH:
        raise JsonShapeBudgetError("Canvas document JSON is too deeply nested")
    if measurement.key_count > CANVAS_DOCUMENT_MAX_KEYS:
        raise JsonAggregateTooLargeError("Canvas document has too many JSON keys")
    if measurement.string_count > CANVAS_DOCUMENT_MAX_STRINGS:
        raise JsonAggregateTooLargeError("Canvas document has too many JSON strings")
    if measurement.string_bytes > CANVAS_DOCUMENT_MAX_STRING_BYTES:
        raise JsonAggregateTooLargeError("Canvas document strings exceed the aggregate budget")

    if not isinstance(payload, dict):
        return
    _validate_field_budgets(
        payload.get("node_upserts"),
        field="content",
        max_bytes=CANVAS_NODE_CONTENT_MAX_BYTES,
        label="Canvas node content",
    )
    _validate_field_budgets(
        payload.get("connection_upserts"),
        field="metadata",
        max_bytes=CANVAS_CONNECTION_METADATA_MAX_BYTES,
        label="Canvas connection metadata",
    )


def _validate_field_budgets(
    candidates: object,
    *,
    field: str,
    max_bytes: int,
    label: str,
) -> None:
    if not isinstance(candidates, list):
        return
    for candidate in candidates:
        if not isinstance(candidate, dict) or field not in candidate:
            continue
        measurement = measure_json(candidate[field])
        if measurement.serialized_bytes > max_bytes:
            raise JsonShapeBudgetError(f"{label} is too large")


def measure_json(value: object) -> JsonMeasurement:
    serialized_bytes = 0
    max_depth = 0
    key_count = 0
    string_count = 0
    string_bytes = 0
    stack: list[tuple[object, int]] = [(value, 1)]

    while stack:
        current, depth = stack.pop()
        max_depth = max(max_depth, depth)
        if isinstance(current, dict):
            item_count = len(current)
            serialized_bytes += 2 + max(0, item_count - 1)
            key_count += item_count
            for key, item in current.items():
                key_text = str(key)
                serialized_bytes += _serialized_string_bytes(key_text) + 1
                string_count += 1
                string_bytes += len(key_text.encode("utf-8"))
                stack.append((item, depth + 1))
        elif isinstance(current, list):
            serialized_bytes += 2 + max(0, len(current) - 1)
            stack.extend((item, depth + 1) for item in current)
        elif isinstance(current, str):
            serialized_bytes += _serialized_string_bytes(current)
            string_count += 1
            string_bytes += len(current.encode("utf-8"))
        elif current is None:
            serialized_bytes += 4
        elif current is True:
            serialized_bytes += 4
        elif current is False:
            serialized_bytes += 5
        elif isinstance(current, (int, float)):
            serialized_bytes += len(
                json.dumps(current, allow_nan=False, separators=(",", ":")).encode("utf-8")
            )
        else:
            raise JsonMalformedError("Unsupported JSON value")

    return JsonMeasurement(
        serialized_bytes=serialized_bytes,
        max_depth=max_depth,
        key_count=key_count,
        string_count=string_count,
        string_bytes=string_bytes,
    )


def _serialized_string_bytes(value: str) -> int:
    return len(json.dumps(value, ensure_ascii=False).encode("utf-8"))


def _reject_nonfinite_constant(_value: str) -> None:
    raise JsonMalformedError("Non-finite JSON number")


def _validate_raw_depth(raw_body: bytes, max_depth: int) -> None:
    depth = 0
    in_string = False
    escaped = False
    for byte in raw_body:
        if in_string:
            if escaped:
                escaped = False
            elif byte == 0x5C:
                escaped = True
            elif byte == 0x22:
                in_string = False
            continue
        if byte == 0x22:
            in_string = True
        elif byte in (0x7B, 0x5B):
            depth += 1
            if depth > max_depth:
                raise JsonShapeBudgetError("Canvas document JSON is too deeply nested")
        elif byte in (0x7D, 0x5D):
            depth -= 1
