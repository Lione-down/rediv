from __future__ import annotations

from dataclasses import dataclass
import re
from types import MappingProxyType
from typing import Any, Mapping

import httpx

from settings.config import Settings, settings, validate_agnes_base_url


_SAFE_CODE_PATTERN = re.compile(r"^[a-z0-9][a-z0-9_-]{0,79}$")
_SAFE_IDENTIFIER_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$")
_SECRET_PATTERNS = (
    re.compile(r"Bearer\s+[^\s,;]+", re.IGNORECASE),
    re.compile(r"(?i)(api[_-]?key|token|authorization)(\s*[=:]\s*)[^\s,;]+"),
    re.compile(r"data:image/[^;]+;base64,[A-Za-z0-9+/=]+", re.IGNORECASE),
)


@dataclass(frozen=True)
class AgnesMediaContract:
    media_type: str
    model: str
    models: tuple[str, ...]
    known_models: tuple[str, ...]
    submit_path: str
    poll_path: str | None = None


@dataclass(frozen=True)
class AgnesContract:
    base_url: str
    media: Mapping[str, AgnesMediaContract]


def resolve_agnes_contract(config: Settings = settings) -> AgnesContract:
    official_models = {
        "text": ("agnes-2.0-flash", "agnes-2.5-flash", "agnes-2.5-pro-alpha"),
        "image": ("agnes-image-2.0-flash", "agnes-image-2.1-flash"),
        "video": ("agnes-video-v2.0",),
    }

    media = {
        "text": AgnesMediaContract(
            media_type="text",
            model=config.agnes_model_text,
            models=tuple(dict.fromkeys((config.agnes_model_text, "agnes-2.5-flash"))),
            known_models=official_models["text"],
            submit_path="/v1/chat/completions",
        ),
        "image": AgnesMediaContract(
            media_type="image",
            model=config.agnes_model_image,
            models=(config.agnes_model_image,),
            known_models=official_models["image"],
            submit_path="/v1/images/generations",
        ),
        "video": AgnesMediaContract(
            media_type="video",
            model=config.agnes_model_video,
            models=(config.agnes_model_video,),
            known_models=official_models["video"],
            submit_path="/v1/videos",
            poll_path="/agnesapi",
        ),
    }
    return AgnesContract(
        base_url=validate_agnes_base_url(config.agnes_base_url, config),
        media=MappingProxyType(media),
    )


AGNES_CONTRACT = resolve_agnes_contract()
TEXT_CONTRACT = AGNES_CONTRACT.media["text"]
IMAGE_CONTRACT = AGNES_CONTRACT.media["image"]
VIDEO_CONTRACT = AGNES_CONTRACT.media["video"]


def build_text_request(
    *,
    model: str,
    messages: list[dict[str, Any]],
    temperature: float | None = None,
    stream: bool = False,
    tools: list[dict[str, Any]] | None = None,
    tool_choice: str | dict[str, Any] | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {"model": model, "messages": messages}
    if temperature is not None:
        payload["temperature"] = temperature
    if stream:
        payload["stream"] = True
    if tools is not None:
        payload["tools"] = tools
    if tool_choice is not None:
        payload["tool_choice"] = tool_choice
    return payload


def build_image_request(
    *,
    model: str,
    prompt: str,
    size: str,
    ratio: str | None = None,
    images: list[str] | None = None,
    return_base64: bool = False,
    response_format: str = "url",
) -> dict[str, Any]:
    payload: dict[str, Any] = {"model": model, "prompt": prompt, "size": size}
    if ratio is not None:
        payload["ratio"] = ratio
    if return_base64:
        payload["return_base64"] = True
    extra_body: dict[str, Any] = {"response_format": response_format}
    if images is not None:
        extra_body["image"] = images
    payload["extra_body"] = extra_body
    return payload


def build_video_request(
    *,
    model: str,
    prompt: str,
    width: int,
    height: int,
    num_frames: int,
    frame_rate: int,
    image: str | None = None,
    extra_images: list[str] | None = None,
    mode: str = "ti2vid",
    negative_prompt: str | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "model": model,
        "prompt": prompt,
        "height": height,
        "width": width,
        "num_frames": num_frames,
        "frame_rate": frame_rate,
    }
    if mode != "keyframes" and image:
        payload["image"] = image
    elif mode == "keyframes" and extra_images:
        payload["extra_body"] = {"image": extra_images, "mode": "keyframes"}
    if negative_prompt:
        payload["negative_prompt"] = negative_prompt
    return payload


def build_video_poll_request(video_id: str) -> tuple[str, dict[str, str]]:
    poll_path = VIDEO_CONTRACT.poll_path
    if poll_path is None:
        raise RuntimeError("Agnes video polling is not configured")
    return poll_path, {"video_id": video_id}


def _safe_message(value: object, limit: int = 240) -> str:
    message = value if isinstance(value, str) else "Provider request failed"
    for pattern in _SECRET_PATTERNS:
        message = pattern.sub(
            lambda match: f"{match.group(1)}<redacted>" if match.lastindex else "<redacted>",
            message,
        )
    message = re.sub(r"[A-Za-z0-9+/=]{120,}", "<redacted-long-value>", message)
    return message.strip()[:limit] or "Provider request failed"


def _safe_identifier(value: object) -> str | None:
    if isinstance(value, str) and _SAFE_IDENTIFIER_PATTERN.fullmatch(value):
        return value
    return None


def _response_payload(response: httpx.Response) -> dict[str, Any]:
    try:
        payload = response.json()
    except (ValueError, UnicodeDecodeError):
        return {}
    return payload if isinstance(payload, dict) else {}


def _error_envelope(payload: dict[str, Any]) -> dict[str, Any]:
    error = payload.get("error")
    return error if isinstance(error, dict) else payload


def _classify_provider_error(status_code: int, provider_code: str | None, message: str) -> tuple[str, bool]:
    if status_code in {408, 504}:
        return "timeout", True
    if status_code == 429:
        return "rate_limited", True
    if status_code >= 500:
        return "provider_unavailable", True
    if status_code == 400:
        evidence = " ".join(filter(None, (provider_code, message.lower())))
        if "unsupported" in evidence:
            return "unsupported_parameter", False
        if "invalid" in evidence or "malformed" in evidence:
            return "invalid_request", False
    return "provider_rejected", False


class AgnesProviderError(RuntimeError):
    def __init__(
        self,
        *,
        status_code: int,
        code: str,
        safe_message: str,
        request_id: str | None,
        retryable: bool,
        retry_after_seconds: int | None = None,
    ) -> None:
        super().__init__(f"{code}: {safe_message}")
        self.status_code = status_code
        self.code = code
        self.safe_message = safe_message
        self.request_id = request_id
        self.retryable = retryable
        self.retry_after_seconds = retry_after_seconds

    @classmethod
    def from_response(cls, response: httpx.Response) -> AgnesProviderError:
        payload = _response_payload(response)
        envelope = _error_envelope(payload)
        raw_code = envelope.get("code") or envelope.get("type")
        provider_code = (
            raw_code.lower()
            if isinstance(raw_code, str) and _SAFE_CODE_PATTERN.fullmatch(raw_code.lower())
            else None
        )
        message = _safe_message(envelope.get("message") or envelope.get("detail"))
        code, retryable = _classify_provider_error(response.status_code, provider_code, message)
        request_id = next(
            (
                identifier
                for identifier in (
                    _safe_identifier(response.headers.get(header))
                    for header in ("x-request-id", "request-id", "x-correlation-id")
                )
                if identifier is not None
            ),
            None,
        )
        if request_id is None:
            request_id = _safe_identifier(payload.get("request_id"))
        retry_after = response.headers.get("Retry-After", "").strip()
        retry_after_seconds = (
            int(retry_after)
            if retry_after.isascii() and retry_after.isdigit() and 1 <= int(retry_after) <= 300
            else None
        )
        return cls(
            status_code=response.status_code,
            code=code,
            safe_message=message,
            request_id=request_id,
            retryable=retryable,
            retry_after_seconds=retry_after_seconds,
        )
