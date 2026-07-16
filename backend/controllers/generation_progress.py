from __future__ import annotations

from math import isfinite
from numbers import Real
from typing import TypeVar

from models.generation_task import GenerationTask


ErrorT = TypeVar("ErrorT", bound=Exception)

TASK_UPDATE_FIELDS = {
    "duration_ms",
    "progress_percent",
    "progress_stage",
    "provider_request_id",
    "status",
}
PROGRESS_STAGE_ORDER = {"queued": 0, "provider": 1, "persisting": 2}


def validate_generation_task_state_updates(
    fields: dict,
    error_type: type[ErrorT],
) -> None:
    unknown_fields = set(fields) - TASK_UPDATE_FIELDS
    if unknown_fields:
        raise error_type(
            f'Unsupported generation task update field "{sorted(unknown_fields)[0]}"'
        )
    if "progress_percent" in fields:
        progress_percent = fields["progress_percent"]
        if progress_percent is not None and (
            isinstance(progress_percent, bool)
            or not isinstance(progress_percent, Real)
            or not isfinite(float(progress_percent))
            or not 0 <= float(progress_percent) <= 100
        ):
            raise error_type("Progress percentage must be finite and between 0 and 100")
    if "progress_stage" in fields:
        progress_stage = fields["progress_stage"]
        if progress_stage is not None and progress_stage not in PROGRESS_STAGE_ORDER:
            raise error_type("Progress stage must be queued, provider, or persisting")


def apply_generation_task_state_updates(task: GenerationTask, fields: dict) -> None:
    for key, value in fields.items():
        if key == "progress_percent":
            if value is None or (
                task.progress_percent is not None and float(value) < task.progress_percent
            ):
                continue
            value = float(value)
        elif key == "progress_stage":
            if value is None or (
                task.progress_stage is not None
                and PROGRESS_STAGE_ORDER[value] < PROGRESS_STAGE_ORDER[task.progress_stage]
            ):
                continue
        setattr(task, key, value)
