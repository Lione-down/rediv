from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, utc_now


class Quota(Base):
    __tablename__ = "quotas"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4", "comment": "用户配额表"}

    id: Mapped[str] = mapped_column(String(36), primary_key=True, comment="配额记录唯一标识")
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, unique=True, index=True, comment="所属用户ID")
    text_quota: Mapped[int] = mapped_column(nullable=False, default=0, comment="文本生成剩余次数")
    image_quota: Mapped[int] = mapped_column(nullable=False, default=0, comment="图片生成剩余次数")
    video_quota: Mapped[int] = mapped_column(nullable=False, default=0, comment="视频生成剩余次数")


class QuotaLedger(Base):
    __tablename__ = "quota_ledger"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4", "comment": "配额变动流水表"}

    id: Mapped[str] = mapped_column(String(36), primary_key=True, comment="流水记录唯一标识")
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True, comment="所属用户ID")
    quota_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True, comment="配额类型: text/image/video")
    change_amount: Mapped[int] = mapped_column(nullable=False, comment="变动数量(正数增加,负数减少)")
    reason: Mapped[str] = mapped_column(String(64), nullable=False, index=True, comment="变动原因")
    related_task_id: Mapped[str | None] = mapped_column(String(255), nullable=True, comment="关联任务ID")
    admin_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True, comment="操作管理员ID")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="创建时间")
