from __future__ import annotations

from typing import Any

from pydantic import ValidationError

from schemas.cinematic_sequence import CinematicSequenceState


class CinematicSequenceContractError(ValueError):
    pass


def parse_cinematic_sequence_state(value: object) -> dict[str, Any]:
    try:
        return CinematicSequenceState.model_validate(value).model_dump(mode="json")
    except ValidationError as error:
        raise CinematicSequenceContractError("invalid cinematic sequence contract") from error
