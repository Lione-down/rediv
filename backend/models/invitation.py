from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, utc_now


class InvitationCode(Base):
    __tablename__ = "invitation_codes"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4", "comment": "邀请码表"}

    id: Mapped[str] = mapped_column(String(36), primary_key=True, comment="邀请码唯一标识")
    code: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True, comment="邀请码字符串")
    status: Mapped[str] = mapped_column(String(32), nullable=False, index=True, comment="状态: active/expired/exhausted")
    max_uses: Mapped[int] = mapped_column(nullable=False, comment="最大使用次数")
    used_count: Mapped[int] = mapped_column(nullable=False, default=0, comment="已使用次数")
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, comment="过期时间")
    quota_package_id: Mapped[str | None] = mapped_column(String(255), nullable=True, comment="关联配额包ID")
    created_by_admin_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True, comment="创建者管理员ID")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="创建时间")
