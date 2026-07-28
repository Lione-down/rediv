from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    JSON,
    CheckConstraint,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, utc_now


MYSQL_TABLE_OPTIONS = {
    "mysql_engine": "InnoDB",
    "mysql_charset": "utf8mb4",
    "mysql_collate": "utf8mb4_unicode_ci",
}


class WorkflowRun(Base):
    __tablename__ = "workflow_runs"
    __table_args__ = (
        ForeignKeyConstraint(
            ["owner_user_id", "project_id", "canvas_id", "instance_id"],
            [
                "workflow_template_instances.owner_user_id",
                "workflow_template_instances.project_id",
                "workflow_template_instances.canvas_id",
                "workflow_template_instances.id",
            ],
            ondelete="RESTRICT",
            name="fk_workflow_runs_instance_scope",
        ),
        UniqueConstraint(
            "owner_user_id",
            "client_run_id",
            name="uq_workflow_runs_owner_client",
        ),
        UniqueConstraint(
            "instance_id",
            "id",
            name="uq_workflow_runs_instance_id",
        ),
        CheckConstraint(
            "status IN ('ready', 'submitting', 'queued', 'running', "
            "'persisting', 'succeeded', 'failed', 'cancelled')",
            name="ck_workflow_runs_status",
        ),
        CheckConstraint(
            "BINARY preflight_fingerprint = BINARY LOWER(preflight_fingerprint) "
            "AND preflight_fingerprint REGEXP '^[0-9a-f]{64}$'",
            name="ck_workflow_runs_fingerprint",
        ),
        Index(
            "ix_workflow_runs_instance_status_created",
            "instance_id",
            "status",
            "created_at",
        ),
        {
            **MYSQL_TABLE_OPTIONS,
            "comment": "Explicit durable workflow-run identity and state",
        },
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, comment="Workflow-run unique identifier"
    )
    instance_id: Mapped[str] = mapped_column(
        String(36), nullable=False, comment="Owning template instance identifier"
    )
    owner_user_id: Mapped[str] = mapped_column(
        String(36), nullable=False, comment="Authenticated run owner"
    )
    project_id: Mapped[str] = mapped_column(
        String(36), nullable=False, comment="Run project identifier"
    )
    canvas_id: Mapped[str] = mapped_column(
        String(36), nullable=False, comment="Run canvas identifier"
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="Durable workflow-run state"
    )
    preflight_fingerprint: Mapped[str] = mapped_column(
        String(64), nullable=False, comment="Runtime preflight SHA-256"
    )
    client_run_id: Mapped[str] = mapped_column(
        String(64), nullable=False, comment="Owner-scoped explicit run idempotency key"
    )
    quota_estimate: Mapped[dict] = mapped_column(
        JSON, nullable=False, comment="Backend-authoritative quota-unit estimate"
    )
    cost_class: Mapped[str] = mapped_column(
        String(32), nullable=False, comment="Backend-authoritative cost class"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        comment="Workflow-run creation time",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        comment="Workflow-run update time",
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, comment="Terminal completion time"
    )


class WorkflowRunStep(Base):
    __tablename__ = "workflow_run_steps"
    __table_args__ = (
        ForeignKeyConstraint(
            ["instance_id", "run_id"],
            ["workflow_runs.instance_id", "workflow_runs.id"],
            ondelete="CASCADE",
            name="fk_workflow_run_steps_run_instance",
        ),
        ForeignKeyConstraint(
            ["instance_id", "instance_step_id"],
            [
                "workflow_template_instance_steps.instance_id",
                "workflow_template_instance_steps.id",
            ],
            ondelete="RESTRICT",
            name="fk_workflow_run_steps_instance_step",
        ),
        UniqueConstraint(
            "run_id",
            "instance_step_id",
            name="uq_workflow_run_steps_run_instance_step",
        ),
        CheckConstraint(
            "status IN ('draft', 'ready', 'submitting', 'queued', 'running', "
            "'persisting', 'succeeded', 'failed', 'blocked', 'cancelled')",
            name="ck_workflow_run_steps_status",
        ),
        Index("ix_workflow_run_steps_run_status", "run_id", "status"),
        {
            **MYSQL_TABLE_OPTIONS,
            "comment": "Durable workflow-run step lineage",
        },
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, comment="Run-step unique identifier"
    )
    run_id: Mapped[str] = mapped_column(
        String(36), nullable=False, comment="Owning workflow-run identifier"
    )
    instance_id: Mapped[str] = mapped_column(
        String(36), nullable=False, comment="Owning template instance identifier"
    )
    instance_step_id: Mapped[str] = mapped_column(
        String(36), nullable=False, comment="Source instance-step identifier"
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="Durable run-step state"
    )
    generation_task_id: Mapped[str | None] = mapped_column(
        ForeignKey("generation_tasks.id", ondelete="RESTRICT"),
        nullable=True,
        comment="Existing durable generation job identifier",
    )
    dependency_snapshot: Mapped[dict] = mapped_column(
        JSON, nullable=False, comment="Sanitized dependency fingerprint inputs"
    )
    attempt_count: Mapped[int] = mapped_column(
        mysql.INTEGER(unsigned=True),
        nullable=False,
        default=0,
        comment="Explicit run-step attempt count",
    )
    error_code: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="Sanitized terminal error code"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        comment="Run-step creation time",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        comment="Run-step update time",
    )
