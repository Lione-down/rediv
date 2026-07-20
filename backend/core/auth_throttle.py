from __future__ import annotations

import hashlib
import hmac
import math
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, select
from sqlalchemy.dialects.mysql import insert as mysql_insert

from models.auth_attempt import AuthAttemptWindow
from models.base import get_session
from settings.config import settings


class AuthThrottleExceeded(Exception):
    def __init__(self, retry_after_seconds: int) -> None:
        super().__init__("Authentication attempt limit exceeded")
        self.retry_after_seconds = retry_after_seconds


def _naive_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value
    return value.astimezone(UTC).replace(tzinfo=None)


def _subject_digest(bucket: str, subject: str) -> str:
    secret = settings.jwt_secret.strip()
    if len(secret) < 32:
        raise RuntimeError("Authentication throttling requires the configured JWT secret")
    return hmac.new(
        secret.encode("utf-8"),
        f"{bucket}\0{subject}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def record_auth_attempt(
    bucket: str,
    subject: str,
    *,
    limit: int,
    window_seconds: int,
    now: datetime | None = None,
) -> int:
    if not bucket or len(bucket) > 32 or not subject:
        raise ValueError("Authentication throttle bucket and subject are required")
    if limit <= 0 or window_seconds <= 0:
        raise ValueError("Authentication throttle limit and window must be positive")

    timestamp = _naive_utc(now or datetime.now(UTC))
    digest = _subject_digest(bucket, subject)
    retry_after_seconds: int | None = None
    attempt_count = 0

    with get_session() as session, session.begin():
        session.execute(
            mysql_insert(AuthAttemptWindow)
            .values(
                bucket=bucket,
                subject_digest=digest,
                window_started_at=timestamp,
                attempt_count=0,
                updated_at=timestamp,
            )
            .on_duplicate_key_update(updated_at=AuthAttemptWindow.updated_at)
        )
        row = session.scalars(
            select(AuthAttemptWindow)
            .where(
                AuthAttemptWindow.bucket == bucket,
                AuthAttemptWindow.subject_digest == digest,
            )
            .with_for_update()
        ).one()
        window_started_at = _naive_utc(row.window_started_at)
        window_ends_at = window_started_at + timedelta(seconds=window_seconds)

        if timestamp >= window_ends_at:
            row.window_started_at = timestamp
            row.attempt_count = 1
        elif row.attempt_count >= limit:
            retry_after_seconds = max(
                1,
                math.ceil((window_ends_at - timestamp).total_seconds()),
            )
        else:
            row.attempt_count += 1
        row.updated_at = timestamp
        attempt_count = row.attempt_count

    if retry_after_seconds is not None:
        raise AuthThrottleExceeded(retry_after_seconds)
    return attempt_count


def clear_auth_attempts(bucket: str, subject: str) -> None:
    digest = _subject_digest(bucket, subject)
    with get_session() as session, session.begin():
        session.execute(
            delete(AuthAttemptWindow).where(
                AuthAttemptWindow.bucket == bucket,
                AuthAttemptWindow.subject_digest == digest,
            )
        )
