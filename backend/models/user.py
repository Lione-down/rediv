from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, utc_now


class User(Base):
    __tablename__ = "users"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4", "comment": "用户表"}

    id: Mapped[str] = mapped_column(String(36), primary_key=True, comment="用户唯一标识")
    nickname: Mapped[str] = mapped_column(String(255), nullable=False, comment="用户昵称")
    avatar_url: Mapped[str] = mapped_column(String(1024), nullable=False, default="", comment="头像URL")
    role: Mapped[str] = mapped_column(String(32), nullable=False, index=True, comment="用户角色: user/admin")
    status: Mapped[str] = mapped_column(String(32), nullable=False, index=True, comment="用户状态: active/banned")
    generation_status: Mapped[str] = mapped_column(String(32), nullable=False, comment="生成状态: enabled/disabled")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="创建时间")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="更新时间")
    last_login_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="最后登录时间")
