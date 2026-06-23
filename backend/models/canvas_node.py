from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, utc_now


class CanvasNode(Base):
    __tablename__ = "canvas_nodes"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4", "comment": "画布节点表"}

    id: Mapped[str] = mapped_column(String(36), primary_key=True, comment="节点唯一标识")
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), nullable=False, index=True, comment="所属项目ID")
    node_type: Mapped[str] = mapped_column(String(50), nullable=False, comment="节点类型")
    content: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict, comment="节点内容JSON")
    position_x: Mapped[float] = mapped_column(Float, nullable=False, default=0.0, comment="X坐标")
    position_y: Mapped[float] = mapped_column(Float, nullable=False, default=0.0, comment="Y坐标")
    width: Mapped[int] = mapped_column(Integer, nullable=False, default=300, comment="宽度")
    height: Mapped[int] = mapped_column(Integer, nullable=False, default=200, comment="高度")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", comment="状态: active/deleted")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="创建时间")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="更新时间")
