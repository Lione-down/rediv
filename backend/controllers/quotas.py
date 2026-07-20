from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select

from models.base import get_session
from models.quota import Quota, QuotaLedger


def _datetime_to_iso(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.isoformat()


def _quota_to_dict(quota: Quota) -> dict[str, int]:
    return {
        "text": quota.text_quota,
        "image": quota.image_quota,
        "video": quota.video_quota,
    }


def _ledger_to_dict(record: QuotaLedger) -> dict:
    return {
        "id": record.id,
        "user_id": record.user_id,
        "quota_type": record.quota_type,
        "change_amount": record.change_amount,
        "reason": record.reason,
        "related_task_id": record.related_task_id,
        "admin_id": record.admin_id,
        "created_at": _datetime_to_iso(record.created_at),
    }


def get_quota_balances(user_id: str) -> dict[str, int] | None:
    snapshot = get_quota_snapshot(user_id)
    return snapshot[0] if snapshot is not None else None


def get_quota_snapshot(user_id: str) -> tuple[dict[str, int], int] | None:
    with get_session() as session:
        quota = session.scalar(select(Quota).where(Quota.user_id == user_id))
        if quota is None:
            return None
        payload = _quota_to_dict(quota)
        revision = quota.revision

    return payload, revision


def list_quota_ledger(user_id: str | None = None) -> list[dict]:
    statement = select(QuotaLedger)
    if user_id is not None:
        statement = statement.where(QuotaLedger.user_id == user_id)
    statement = statement.order_by(QuotaLedger.created_at.desc(), QuotaLedger.id.desc())
    with get_session() as session:
        return [_ledger_to_dict(record) for record in session.scalars(statement).all()]
