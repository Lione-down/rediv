from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, utc_now


class AuthAttemptWindow(Base):
    __tablename__ = "auth_attempt_windows"
    __table_args__ = {
        "mysql_engine": "InnoDB",
        "mysql_charset": "utf8mb4",
        "comment": "Cross-process fixed windows for authentication throttling",
    }

    bucket: Mapped[str] = mapped_column(
        String(32),
        primary_key=True,
        comment="Authentication endpoint bucket",
    )
    subject_digest: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        comment="HMAC-SHA256 digest of the private throttle subject",
    )
    window_started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        comment="UTC start time of the current fixed attempt window",
    )
    attempt_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        comment="Recorded attempts in the current fixed window",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
        comment="UTC time of the latest throttle decision",
    )
