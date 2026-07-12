from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, JSON, String, UniqueConstraint
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, utc_now


class CanvasRevision(Base):
    __tablename__ = "canvas_revisions"
    __table_args__ = (
        UniqueConstraint("canvas_id", "revision_no", name="uq_canvas_revisions_revision"),
        UniqueConstraint("canvas_id", "client_mutation_id", name="uq_canvas_revisions_mutation"),
        Index("ix_canvas_revisions_canvas_created", "canvas_id", "created_at"),
        {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4", "comment": "Durable canvas graph revision table"},
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, comment="Canvas revision unique identifier")
    canvas_id: Mapped[str] = mapped_column(
        ForeignKey("canvases.id", ondelete="CASCADE"),
        nullable=False,
        comment="Owning canvas ID",
    )
    revision_no: Mapped[int] = mapped_column(mysql.BIGINT(unsigned=True), nullable=False, comment="Committed revision number")
    base_revision: Mapped[int] = mapped_column(mysql.BIGINT(unsigned=True), nullable=False, comment="Client base revision number")
    client_mutation_id: Mapped[str] = mapped_column(String(64), nullable=False, comment="Client idempotency key")
    request_fingerprint: Mapped[str] = mapped_column(String(64), nullable=False, comment="Canonical request SHA-256 fingerprint")
    operations: Mapped[dict | list] = mapped_column(JSON, nullable=False, comment="Normalized graph command batch")
    checkpoint_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True, comment="Optional full graph checkpoint")
    created_by_user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        comment="User that committed the revision",
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="Created time")
