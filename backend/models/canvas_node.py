from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKeyConstraint, Index, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, utc_now


class CanvasNode(Base):
    __tablename__ = "canvas_nodes"
    __table_args__ = (
        UniqueConstraint("canvas_id", "id", name="uq_canvas_nodes_canvas_id_id"),
        ForeignKeyConstraint(
            ["project_id", "canvas_id"],
            ["canvases.project_id", "canvases.id"],
            ondelete="CASCADE",
            name="fk_canvas_nodes_project_canvas",
        ),
        ForeignKeyConstraint(
            ["canvas_id", "parent_node_id"],
            ["canvas_nodes.canvas_id", "canvas_nodes.id"],
            ondelete="RESTRICT",
            name="fk_canvas_nodes_parent",
        ),
        Index("ix_canvas_nodes_canvas_status_z", "canvas_id", "status", "z_index"),
        Index("ix_canvas_nodes_canvas_parent", "canvas_id", "parent_node_id"),
        {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4", "comment": "画布节点表"},
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, comment="节点唯一标识")
    project_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True, comment="所属项目ID")
    canvas_id: Mapped[str] = mapped_column(String(36), nullable=False, comment="Owning canvas ID")
    node_type: Mapped[str] = mapped_column(String(50), nullable=False, comment="节点类型")
    content: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict, comment="节点内容JSON")
    position_x: Mapped[float] = mapped_column(Float, nullable=False, default=0.0, comment="X坐标")
    position_y: Mapped[float] = mapped_column(Float, nullable=False, default=0.0, comment="Y坐标")
    width: Mapped[int] = mapped_column(Integer, nullable=False, default=300, comment="宽度")
    height: Mapped[int] = mapped_column(Integer, nullable=False, default=200, comment="高度")
    z_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="Canvas stacking order")
    parent_node_id: Mapped[str | None] = mapped_column(String(36), nullable=True, comment="Optional parent group node ID")
    is_locked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, comment="Whether editing is locked")
    is_collapsed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, comment="Whether a group node is collapsed")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", comment="状态: active/deleted")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="创建时间")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="更新时间")
