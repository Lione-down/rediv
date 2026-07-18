from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any


DEFAULT_ACKNOWLEDGEMENT_HOURS = 24
MAX_ACKNOWLEDGEMENT_HOURS = 30 * 24


class CinematicSkillBillingError(ValueError):
    pass


def acknowledgement_expiry(*, now: datetime, duration_hours: int | None) -> datetime:
    hours = DEFAULT_ACKNOWLEDGEMENT_HOURS if duration_hours is None else duration_hours
    if type(hours) is not int or hours < 1 or hours > MAX_ACKNOWLEDGEMENT_HOURS:
        raise CinematicSkillBillingError("acknowledgement duration must be between 1 hour and 30 days")
    return now + timedelta(hours=hours)


def is_provider_acknowledged(
    record: dict[str, Any] | None,
    *,
    user_id: str,
    provider_id: str,
    now: datetime,
) -> bool:
    if not isinstance(record, dict):
        return False
    acknowledged_until = record.get("acknowledged_until")
    return (
        record.get("user_id") == user_id
        and record.get("provider_id") == provider_id
        and record.get("cancelled_at") is None
        and isinstance(acknowledged_until, datetime)
        and acknowledged_until > now
    )
