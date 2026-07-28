from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    JSON,
    CheckConstraint,
    DateTime,
    ForeignKeyConstraint,
    Index,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, utc_now


class WorkflowTemplateInstanceLifecycleCommit(Base):
    __tablename__ = "workflow_template_instance_lifecycle_commits"
    __table_args__ = (
        ForeignKeyConstraint(
            ["canvas_id", "instance_id"],
            [
                "workflow_template_instances.canvas_id",
                "workflow_template_instances.id",
            ],
            ondelete="CASCADE",
            name="fk_workflow_template_lifecycle_commits_instance",
        ),
        UniqueConstraint(
            "canvas_id",
            "client_mutation_id",
            name="uq_workflow_template_lifecycle_commits_canvas_mutation",
        ),
        CheckConstraint(
            "action IN ('upgrade', 'detach')",
            name="ck_workflow_template_lifecycle_commits_action",
        ),
        CheckConstraint(
            "BINARY request_fingerprint = BINARY LOWER(request_fingerprint) "
            "AND request_fingerprint REGEXP '^[0-9a-f]{64}$'",
            name="ck_workflow_template_lifecycle_commits_fingerprint",
        ),
        CheckConstraint(
            "canvas_revision >= 1",
            name="ck_workflow_template_lifecycle_commits_revision",
        ),
        Index(
            "ix_workflow_template_lifecycle_commits_instance_created",
            "instance_id",
            "created_at",
        ),
        {
            "mysql_engine": "InnoDB",
            "mysql_charset": "utf8mb4",
            "mysql_collate": "utf8mb4_unicode_ci",
            "comment": "Durable replay snapshots for instance upgrade and detach",
        },
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, comment="Lifecycle commit unique identifier"
    )
    instance_id: Mapped[str] = mapped_column(
        String(36), nullable=False, comment="Owning template instance identifier"
    )
    canvas_id: Mapped[str] = mapped_column(
        String(36), nullable=False, comment="Owning Canvas identifier"
    )
    client_mutation_id: Mapped[str] = mapped_column(
        String(64), nullable=False, comment="Canvas-scoped lifecycle idempotency key"
    )
    action: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="Lifecycle action: upgrade/detach"
    )
    request_fingerprint: Mapped[str] = mapped_column(
        String(64), nullable=False, comment="Canonical lifecycle request SHA-256"
    )
    source_version: Mapped[int] = mapped_column(
        mysql.INTEGER(unsigned=True),
        nullable=False,
        comment="Exact instance version before the action",
    )
    target_version: Mapped[int | None] = mapped_column(
        mysql.INTEGER(unsigned=True),
        nullable=True,
        comment="Exact target version for upgrade; null for detach",
    )
    canvas_revision: Mapped[int] = mapped_column(
        mysql.INTEGER(unsigned=True),
        nullable=False,
        comment="Canvas revision committed by the lifecycle action",
    )
    response_snapshot: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        comment="Sanitized immutable lifecycle response snapshot",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        comment="Lifecycle commit creation time",
    )
