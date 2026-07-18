from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, utc_now


class AgnesAdmissionGuard(Base):
    __tablename__ = "agnes_admission_guard"
    __table_args__ = (
        {
            "mysql_engine": "InnoDB",
            "mysql_charset": "utf8mb4",
            "comment": "Singleton row serializing cross-process Agnes admission decisions",
        },
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        comment="Singleton guard identifier; the only valid runtime row is 1",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
        comment="Last admission decision time",
    )
