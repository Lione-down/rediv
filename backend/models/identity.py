from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, utc_now


class Identity(Base):
    __tablename__ = "identities"
    __table_args__ = (
        Index("ix_identities_provider_provider_user_id", "provider", "provider_user_id", unique=True),
        {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4", "comment": "身份绑定表"},
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, comment="身份绑定唯一标识")
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True, comment="关联用户ID")
    provider: Mapped[str] = mapped_column(String(64), nullable=False, comment="提供方: wechat/github")
    provider_user_id: Mapped[str] = mapped_column(String(255), nullable=False, comment="提供方用户ID")
    unionid: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True, comment="微信UnionID")
    raw_profile: Mapped[dict] = mapped_column(JSON, nullable=False, comment="原始用户资料JSON")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="创建时间")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="更新时间")
