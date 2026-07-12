from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, utc_now


class Project(Base):
    __tablename__ = "projects"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4", "comment": "项目表"}

    id: Mapped[str] = mapped_column(String(36), primary_key=True, comment="项目唯一标识")
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True, comment="所属用户ID")
    name: Mapped[str] = mapped_column(String(255), nullable=False, comment="项目名称")
    canvas_order_revision: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        nullable=False,
        default=0,
        comment="Canvas ordering revision",
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="创建时间")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="更新时间")
