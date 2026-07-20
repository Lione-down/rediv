from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, ForeignKey, String
from sqlalchemy.dialects.mysql import DATETIME
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, utc_now


class AdminLog(Base):
    __tablename__ = "admin_logs"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4", "comment": "管理员操作日志表"}

    id: Mapped[str] = mapped_column(String(36), primary_key=True, comment="日志唯一标识")
    admin_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True, comment="操作管理员ID")
    action: Mapped[str] = mapped_column(String(64), nullable=False, index=True, comment="操作类型")
    target_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True, comment="目标类型")
    target_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True, comment="目标ID")
    detail: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict, comment="操作详情JSON")
    created_at: Mapped[datetime] = mapped_column(
        DATETIME(fsp=6),
        default=utc_now,
        nullable=False,
        comment="创建时间",
    )
