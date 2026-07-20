from __future__ import annotations

from typing import Any

from pydantic import ValidationError

from schemas.cinematic_sequence import (
    CinematicDirectorBrief,
    CinematicReferenceTransfer,
    CinematicRetakeContext,
)


class CinematicDirectorContractError(ValueError):
    pass


def _parse(model, value: object) -> dict[str, Any]:
    try:
        return model.model_validate(value).model_dump(mode="json")
    except ValidationError as error:
        raise CinematicDirectorContractError("invalid cinematic director contract") from error


def parse_cinematic_director_brief(value: object) -> dict[str, Any]:
    return _parse(CinematicDirectorBrief, value)


def parse_cinematic_reference_transfer(value: object) -> dict[str, Any]:
    return _parse(CinematicReferenceTransfer, value)


def parse_cinematic_retake_context(value: object) -> dict[str, Any]:
    return _parse(CinematicRetakeContext, value)
