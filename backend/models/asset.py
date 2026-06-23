from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, utc_now


class Asset(Base):
    __tablename__ = "assets"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4", "comment": "资源表"}

    id: Mapped[str] = mapped_column(String(36), primary_key=True, comment="资源唯一标识")
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True, comment="所属用户ID")
    project_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True, comment="关联项目ID")
    canvas_node_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True, comment="关联画布节点ID")
    type: Mapped[str] = mapped_column(String(32), nullable=False, index=True, comment="资源类型: image/video/text/prompt")
    url: Mapped[str | None] = mapped_column(String(2048), nullable=True, comment="资源URL")
    content_text: Mapped[str | None] = mapped_column(Text, nullable=True, comment="文本内容")
    source: Mapped[str] = mapped_column(String(64), nullable=False, default="upload", comment="来源: upload/generation")
    source_model: Mapped[str | None] = mapped_column(String(255), nullable=True, comment="来源模型")
    source_task_id: Mapped[str | None] = mapped_column(String(255), nullable=True, comment="来源任务ID")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active", comment="状态: active/deleted/hidden")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="创建时间")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="更新时间")
