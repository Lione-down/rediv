from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, utc_now


class ProviderCostAcknowledgement(Base):
    __tablename__ = "provider_cost_acknowledgements"
    __table_args__ = (
        UniqueConstraint("user_id", "provider_id", name="uq_provider_cost_ack_user_provider"),
        {
            "mysql_engine": "InnoDB",
            "mysql_charset": "utf8mb4",
            "comment": "Time-bounded user acknowledgements for user-billed provider execution",
        },
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, comment="Unique acknowledgement identifier")
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True,
        comment="Authenticated user that accepted the provider cost reminder",
    )
    provider_id: Mapped[str] = mapped_column(
        String(64), nullable=False, comment="Stable provider identity covered by this acknowledgement",
    )
    acknowledged_until: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, comment="Exclusive expiry time after which execution is blocked",
    )
    cancelled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, comment="Cancellation time; non-null acknowledgements are inactive",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False, comment="Creation time",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False, comment="Last update time",
    )
