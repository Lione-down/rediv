from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, CheckConstraint, DateTime, Float, ForeignKey, ForeignKeyConstraint, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, utc_now


class GenerationTask(Base):
    __tablename__ = "generation_tasks"
    __table_args__ = (
        ForeignKeyConstraint(
            ["project_id", "origin_canvas_id"],
            ["canvases.project_id", "canvases.id"],
            ondelete="RESTRICT",
            name="fk_generation_tasks_project_origin_canvas",
        ),
        ForeignKeyConstraint(
            ["origin_canvas_id", "canvas_node_id"],
            ["canvas_nodes.canvas_id", "canvas_nodes.id"],
            ondelete="RESTRICT",
            name="fk_generation_tasks_origin_node",
        ),
        CheckConstraint(
            "(origin_canvas_id IS NULL OR project_id IS NOT NULL) "
            "AND (canvas_node_id IS NULL OR origin_canvas_id IS NOT NULL)",
            name="ck_generation_tasks_origin_scope",
        ),
        CheckConstraint(
            "progress_percent IS NULL OR (progress_percent >= 0 AND progress_percent <= 100)",
            name="ck_generation_tasks_progress_percent",
        ),
        CheckConstraint(
            "progress_stage IS NULL OR progress_stage IN ('queued', 'provider', 'persisting')",
            name="ck_generation_tasks_progress_stage",
        ),
        Index("ix_generation_tasks_origin_canvas_id", "origin_canvas_id"),
        Index("ix_generation_tasks_project_status_created", "project_id", "status", "created_at"),
        {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4", "comment": "Generation task diagnostics table"},
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, comment="Generation task unique identifier")
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True, comment="Owning user ID"
    )
    project_id: Mapped[str | None] = mapped_column(
        ForeignKey("projects.id", ondelete="RESTRICT"), nullable=True, index=True, comment="Related project ID"
    )
    origin_canvas_id: Mapped[str | None] = mapped_column(
        String(36), nullable=True, comment="Origin canvas attribution for filtering"
    )
    canvas_node_id: Mapped[str | None] = mapped_column(
        String(36),
        nullable=True,
        index=True,
        comment="Related canvas node ID",
    )
    media_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True, comment="Generated media type: text/image/video")
    provider: Mapped[str] = mapped_column(String(64), nullable=False, default="agnes", comment="Provider name")
    model: Mapped[str | None] = mapped_column(String(255), nullable=True, comment="Provider model name")
    provider_request_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True, comment="Provider request or task ID")
    request_parameters: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Immutable sanitized generation request parameters",
    )
    progress_percent: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        comment="Last valid provider progress percentage",
    )
    progress_stage: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        comment="Durable progress stage: queued/provider/persisting",
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, index=True, comment="Task status: queued/running/succeeded/failed/timed_out")
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="Task duration in milliseconds")
    result_asset_id: Mapped[str | None] = mapped_column(
        ForeignKey("assets.id", ondelete="SET NULL"), nullable=True, index=True, comment="Result asset ID"
    )
    error_code: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="Sanitized error code")
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True, comment="Sanitized error message")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="Created time")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="Updated time")
