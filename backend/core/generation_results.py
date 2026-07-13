from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, StrictStr, ValidationError, field_validator


class ProviderResultError(ValueError):
    pass


class _TextMessage(BaseModel):
    model_config = ConfigDict(extra="ignore", strict=True)

    content: StrictStr = Field(min_length=1, max_length=16_000)


class _TextChoice(BaseModel):
    model_config = ConfigDict(extra="ignore", strict=True)

    message: _TextMessage


class _TextResponse(BaseModel):
    model_config = ConfigDict(extra="ignore", strict=True)

    choices: list[_TextChoice] = Field(min_length=1)


class _ImageData(BaseModel):
    model_config = ConfigDict(extra="ignore", strict=True)

    url: HttpUrl = Field(max_length=2048)

    @field_validator("url")
    @classmethod
    def require_https(cls, value: HttpUrl) -> HttpUrl:
        if value.scheme != "https":
            raise ValueError("Image URL must use HTTPS")
        return value


class _ImageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore", strict=True)

    data: list[_ImageData] = Field(min_length=1)


def extract_text_content(response: object) -> str:
    try:
        parsed = _TextResponse.model_validate(response)
    except ValidationError as error:
        raise ProviderResultError("Provider returned invalid text content") from error
    return parsed.choices[0].message.content


def extract_image_url(response: object) -> str:
    try:
        parsed = _ImageResponse.model_validate(response)
    except ValidationError as error:
        raise ProviderResultError("Provider returned invalid image URL") from error
    return str(parsed.data[0].url)


def validate_https_url(value: object, *, media_type: str) -> str:
    try:
        parsed = _ImageData.model_validate({"url": value})
    except ValidationError as error:
        raise ProviderResultError(f"Provider returned invalid {media_type} URL") from error
    return str(parsed.url)


def validate_provider_identifier(value: object) -> str:
    if not isinstance(value, str):
        raise ProviderResultError("Provider returned invalid task identifier")
    normalized = value.strip()
    if not normalized or len(normalized) > 255:
        raise ProviderResultError("Provider returned invalid task identifier")
    return normalized


def validate_optional_provider_identifier(value: object | None) -> str | None:
    return None if value is None else validate_provider_identifier(value)
