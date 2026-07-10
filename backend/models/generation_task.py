from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, utc_now


class GenerationTask(Base):
    __tablename__ = "generation_tasks"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4", "comment": "Generation task diagnostics table"}

    id: Mapped[str] = mapped_column(String(36), primary_key=True, comment="Generation task unique identifier")
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True, comment="Owning user ID")
    project_id: Mapped[str | None] = mapped_column(ForeignKey("projects.id"), nullable=True, index=True, comment="Related project ID")
    canvas_node_id: Mapped[str | None] = mapped_column(
        ForeignKey("canvas_nodes.id"),
        nullable=True,
        index=True,
        comment="Related canvas node ID",
    )
    media_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True, comment="Generated media type: text/image/video")
    provider: Mapped[str] = mapped_column(String(64), nullable=False, default="agnes", comment="Provider name")
    model: Mapped[str | None] = mapped_column(String(255), nullable=True, comment="Provider model name")
    provider_request_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True, comment="Provider request or task ID")
    status: Mapped[str] = mapped_column(String(32), nullable=False, index=True, comment="Task status: queued/running/succeeded/failed/timed_out")
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="Task duration in milliseconds")
    result_asset_id: Mapped[str | None] = mapped_column(ForeignKey("assets.id"), nullable=True, index=True, comment="Result asset ID")
    error_code: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="Sanitized error code")
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True, comment="Sanitized error message")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="Created time")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="Updated time")
