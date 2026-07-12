from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKeyConstraint, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, utc_now


class CanvasConnection(Base):
    __tablename__ = "canvas_connections"
    __table_args__ = (
        UniqueConstraint(
            "canvas_id",
            "source_node_id",
            "source_port",
            "target_node_id",
            "target_port",
            name="uq_canvas_connections_edge",
        ),
        ForeignKeyConstraint(
            ["project_id", "canvas_id"],
            ["canvases.project_id", "canvases.id"],
            ondelete="CASCADE",
            name="fk_canvas_connections_project_canvas",
        ),
        ForeignKeyConstraint(
            ["canvas_id", "source_node_id"],
            ["canvas_nodes.canvas_id", "canvas_nodes.id"],
            ondelete="CASCADE",
            name="fk_canvas_connections_source",
        ),
        ForeignKeyConstraint(
            ["canvas_id", "target_node_id"],
            ["canvas_nodes.canvas_id", "canvas_nodes.id"],
            ondelete="CASCADE",
            name="fk_canvas_connections_target",
        ),
        {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4", "comment": "Canvas node connection table"},
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, comment="Connection unique identifier")
    project_id: Mapped[str] = mapped_column(
        String(36),
        nullable=False,
        index=True,
        comment="Owning project ID",
    )
    canvas_id: Mapped[str] = mapped_column(String(36), nullable=False, comment="Owning canvas ID")
    source_node_id: Mapped[str] = mapped_column(
        String(36),
        nullable=False,
        index=True,
        comment="Source canvas node ID",
    )
    source_port: Mapped[str] = mapped_column(String(100), nullable=False, comment="Source node port key")
    target_node_id: Mapped[str] = mapped_column(
        String(36),
        nullable=False,
        index=True,
        comment="Target canvas node ID",
    )
    target_port: Mapped[str] = mapped_column(String(100), nullable=False, comment="Target node port key")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", comment="Connection status")
    metadata_: Mapped[dict] = mapped_column(
        "metadata",
        JSON,
        nullable=False,
        default=dict,
        comment="Connection metadata JSON; directed cycles are allowed",
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="Created time")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="Updated time")
