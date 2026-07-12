from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, DateTime, Float, ForeignKey, Index, Numeric, String, UniqueConstraint
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, utc_now


class Canvas(Base):
    __tablename__ = "canvases"
    __table_args__ = (
        UniqueConstraint("project_id", "id", name="uq_canvases_project_id_id"),
        CheckConstraint("status IN ('active', 'archived')", name="ck_canvases_status"),
        Index("ix_canvases_project_status_order", "project_id", "status", "sort_order", "created_at"),
        {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4", "comment": "Project canvas table"},
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, comment="Canvas unique identifier")
    project_id: Mapped[str] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        comment="Owning project ID",
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, comment="Canvas display name")
    sort_order: Mapped[int] = mapped_column(
        mysql.INTEGER(unsigned=True),
        nullable=False,
        default=0,
        comment="Dense canvas order within the project",
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", comment="Canvas status: active/archived")
    viewport_x: Mapped[float] = mapped_column(Float, nullable=False, default=0.0, comment="Viewport world X coordinate")
    viewport_y: Mapped[float] = mapped_column(Float, nullable=False, default=0.0, comment="Viewport world Y coordinate")
    viewport_zoom: Mapped[Decimal] = mapped_column(
        Numeric(8, 4),
        nullable=False,
        default=Decimal("1.0000"),
        comment="Viewport zoom multiplier",
    )
    graph_revision: Mapped[int] = mapped_column(
        mysql.BIGINT(unsigned=True),
        nullable=False,
        default=0,
        comment="Current graph document revision",
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="Created time")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="Updated time")
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, comment="Soft deletion time")
