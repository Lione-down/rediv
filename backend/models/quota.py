from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, utc_now


class Quota(Base):
    __tablename__ = "quotas"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, unique=True, index=True)
    text_quota: Mapped[int] = mapped_column(nullable=False, default=0)
    image_quota: Mapped[int] = mapped_column(nullable=False, default=0)
    video_quota: Mapped[int] = mapped_column(nullable=False, default=0)


class QuotaLedger(Base):
    __tablename__ = "quota_ledger"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    quota_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    change_amount: Mapped[int] = mapped_column(nullable=False)
    reason: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    related_task_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    admin_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
