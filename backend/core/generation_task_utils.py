from __future__ import annotations

import re
import time

import httpx


SECRET_PATTERNS = [
    re.compile(r"Bearer\s+[A-Za-z0-9._~+/=-]+", re.IGNORECASE),
    re.compile(r"(?i)(api[_-]?key|token|authorization)(\s*[=:]\s*)[^\s,;]+"),
    re.compile(r"data:image/[^;]+;base64,[A-Za-z0-9+/=]+", re.IGNORECASE),
]


def elapsed_ms(start: float) -> int:
    return max(0, int((time.perf_counter() - start) * 1000))


def sanitize_error_message(exc: Exception | str, limit: int = 500) -> str:
    message = str(exc)
    for pattern in SECRET_PATTERNS:
        message = pattern.sub(lambda match: f"{match.group(1)}<redacted>" if match.lastindex else "<redacted>", message)
    message = re.sub(r"[A-Za-z0-9+/=]{120,}", "<redacted-long-value>", message)
    return message[:limit]


def error_code_for_exception(exc: Exception, fallback: str = "provider_error") -> str:
    if isinstance(exc, httpx.TimeoutException | TimeoutError):
        return "timeout"
    if isinstance(exc, httpx.NetworkError):
        return "network_error"
    if isinstance(exc, httpx.HTTPStatusError):
        return "provider_error"
    if isinstance(exc, httpx.RequestError):
        return "network_error"
    return fallback


def status_for_error_code(error_code: str) -> str:
    if error_code == "timeout":
        return "timed_out"
    return "failed"


def extract_provider_request_id(response: dict, *keys: str) -> str | None:
    for key in keys:
        value = response.get(key)
        if isinstance(value, str) and value:
            return value
    data = response.get("data")
    if isinstance(data, dict):
        for key in keys:
            value = data.get(key)
            if isinstance(value, str) and value:
                return value
    return None
