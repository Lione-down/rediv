from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, utc_now


class Guest(Base):
    __tablename__ = "guests"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4", "comment": "访客表"}

    id: Mapped[str] = mapped_column(String(36), primary_key=True, comment="访客唯一标识")
    session_id: Mapped[str] = mapped_column(String(36), nullable=False, unique=True, index=True, comment="会话ID")
    local_project_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict, comment="本地项目快照JSON")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="创建时间")
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, comment="过期时间")
    converted_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True, comment="转化后的用户ID")
