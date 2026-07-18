from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import select

from core.cinematic_skill_billing import acknowledgement_expiry, is_provider_acknowledged
from models.base import get_session, utc_now
from models.provider_cost_acknowledgement import ProviderCostAcknowledgement


def _aware(value: datetime | None) -> datetime | None:
    if value is None or value.tzinfo is not None:
        return value
    return value.replace(tzinfo=UTC)


def _payload(record: ProviderCostAcknowledgement | None, *, user_id: str, provider_id: str) -> dict:
    now = utc_now()
    if record is None:
        return {
            "user_id": user_id,
            "provider_id": provider_id,
            "acknowledged_until": None,
            "cancelled_at": None,
            "active": False,
        }
    acknowledged_until = _aware(record.acknowledged_until)
    cancelled_at = _aware(record.cancelled_at)
    raw = {
        "user_id": record.user_id,
        "provider_id": record.provider_id,
        "acknowledged_until": acknowledged_until,
        "cancelled_at": cancelled_at,
    }
    return {**raw, "active": is_provider_acknowledged(raw, user_id=user_id, provider_id=provider_id, now=now)}


def get_acknowledgement(user_id: str, provider_id: str) -> dict:
    with get_session() as session:
        record = session.scalar(select(ProviderCostAcknowledgement).where(
            ProviderCostAcknowledgement.user_id == user_id,
            ProviderCostAcknowledgement.provider_id == provider_id,
        ))
        return _payload(record, user_id=user_id, provider_id=provider_id)


def acknowledge_provider_cost(user_id: str, provider_id: str, duration_hours: int | None) -> dict:
    now = utc_now()
    expires_at = acknowledgement_expiry(now=now, duration_hours=duration_hours)
    with get_session() as session:
        record = session.scalar(select(ProviderCostAcknowledgement).where(
            ProviderCostAcknowledgement.user_id == user_id,
            ProviderCostAcknowledgement.provider_id == provider_id,
        ).with_for_update())
        if record is None:
            record = ProviderCostAcknowledgement(
                id=str(uuid4()), user_id=user_id, provider_id=provider_id,
                acknowledged_until=expires_at, cancelled_at=None, created_at=now, updated_at=now,
            )
            session.add(record)
        else:
            record.acknowledged_until = expires_at
            record.cancelled_at = None
            record.updated_at = now
        session.flush()
        payload = _payload(record, user_id=user_id, provider_id=provider_id)
        session.commit()
        return payload


def cancel_acknowledgement(user_id: str, provider_id: str) -> dict:
    now = utc_now()
    with get_session() as session:
        record = session.scalar(select(ProviderCostAcknowledgement).where(
            ProviderCostAcknowledgement.user_id == user_id,
            ProviderCostAcknowledgement.provider_id == provider_id,
        ).with_for_update())
        if record is not None:
            record.cancelled_at = now
            record.updated_at = now
            session.flush()
        payload = _payload(record, user_id=user_id, provider_id=provider_id)
        session.commit()
        return payload
