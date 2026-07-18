from __future__ import annotations

import re
import time

import httpx

from core.agnes_contract import AgnesProviderError


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
    if isinstance(exc, AgnesProviderError):
        return exc.code
    if isinstance(exc, httpx.PoolTimeout):
        return "provider_pool_timeout"
    if isinstance(exc, httpx.ConnectTimeout):
        return "provider_connect_timeout"
    if isinstance(exc, httpx.ReadTimeout):
        return "provider_response_timeout"
    if isinstance(exc, httpx.WriteTimeout):
        return "provider_write_timeout"
    if isinstance(exc, TimeoutError):
        return "provider_response_timeout"
    if isinstance(exc, httpx.NetworkError):
        return "network_error"
    if isinstance(exc, httpx.HTTPStatusError):
        if exc.response.status_code == 429:
            return "provider_rate_limited"
        if exc.response.status_code == 503:
            return "provider_unavailable"
        return "provider_error"
    if isinstance(exc, httpx.RequestError):
        return "network_error"
    return fallback


def status_for_error_code(error_code: str) -> str:
    if error_code in {
        "provider_pool_timeout",
        "provider_connect_timeout",
        "provider_response_timeout",
        "provider_write_timeout",
        "timeout",
    }:
        return "timed_out"
    return "failed"


def safe_retry_after_seconds(exc: Exception, maximum: int = 300) -> int | None:
    if isinstance(exc, AgnesProviderError):
        value = exc.retry_after_seconds
        return value if value is not None and value <= maximum else None
    if not isinstance(exc, httpx.HTTPStatusError):
        return None
    raw_value = exc.response.headers.get("Retry-After", "").strip()
    if not raw_value.isascii() or not raw_value.isdigit():
        return None
    value = int(raw_value)
    return value if 1 <= value <= maximum else None


def provider_failure_http_status(error_code: str) -> int:
    if error_code in {"provider_rate_limited", "rate_limited"}:
        return 429
    if error_code in {"invalid_request", "unsupported_parameter", "provider_rejected"}:
        return 422
    if error_code == "provider_unavailable":
        return 503
    if error_code in {
        "provider_pool_timeout",
        "provider_connect_timeout",
        "provider_response_timeout",
        "provider_write_timeout",
        "timeout",
    }:
        return 504
    return 500


def provider_failure_detail(exc: Exception, media_type: str) -> str | dict:
    if not isinstance(exc, AgnesProviderError):
        return f"Agnes {media_type} generation failed"
    return {
        "code": exc.code,
        "message": exc.safe_message,
        "provider_request_id": exc.request_id,
        "retryable": exc.retryable,
    }


def provider_request_id_for_exception(exc: Exception) -> str | None:
    return exc.request_id if isinstance(exc, AgnesProviderError) else None


def provider_error_message(exc: Exception) -> str:
    return exc.safe_message if isinstance(exc, AgnesProviderError) else sanitize_error_message(exc)


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
