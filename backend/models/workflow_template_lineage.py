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
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, utc_now


MYSQL_TABLE_OPTIONS = {
    "mysql_engine": "InnoDB",
    "mysql_charset": "utf8mb4",
    "mysql_collate": "utf8mb4_unicode_ci",
}


class WorkflowTemplateBinding(Base):
    __tablename__ = "workflow_template_bindings"
    __table_args__ = (
        ForeignKeyConstraint(
            ["version_id", "instance_id"],
            ["workflow_template_instances.version_id", "workflow_template_instances.id"],
            ondelete="CASCADE",
            name="fk_workflow_template_bindings_instance_version",
        ),
        ForeignKeyConstraint(
            ["version_id", "slot_id"],
            ["workflow_template_slots.version_id", "workflow_template_slots.id"],
            ondelete="RESTRICT",
            name="fk_workflow_template_bindings_version_slot",
        ),
        UniqueConstraint(
            "instance_id",
            "slot_id",
            name="uq_workflow_template_bindings_instance_slot",
        ),
        CheckConstraint(
            "(binding_type = 'value' AND value_json IS NOT NULL "
            "AND asset_id IS NULL AND source_revision IS NULL) OR "
            "(binding_type = 'asset' AND value_json IS NULL "
            "AND asset_id IS NOT NULL AND source_revision IS NOT NULL)",
            name="ck_workflow_template_bindings_shape",
        ),
        Index(
            "ix_workflow_template_bindings_instance_type",
            "instance_id",
            "binding_type",
        ),
        {
            **MYSQL_TABLE_OPTIONS,
            "comment": "Resolved variable and target-project asset bindings",
        },
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, comment="Binding unique identifier"
    )
    instance_id: Mapped[str] = mapped_column(
        String(36), nullable=False, comment="Owning instance identifier"
    )
    version_id: Mapped[str] = mapped_column(
        String(36), nullable=False, comment="Pinned slot version identifier"
    )
    slot_id: Mapped[str] = mapped_column(
        String(36), nullable=False, comment="Bound slot identifier"
    )
    binding_type: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="Binding type: value/asset"
    )
    value_json: Mapped[dict | None] = mapped_column(
        JSON, nullable=True, comment="Validated variable value wrapper"
    )
    asset_id: Mapped[str | None] = mapped_column(
        ForeignKey("assets.id", ondelete="RESTRICT"),
        nullable=True,
        comment="Target-project asset identifier",
    )
    source_revision: Mapped[str | None] = mapped_column(
        String(64), nullable=True, comment="Validated source asset revision"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        comment="Binding creation time",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        comment="Binding update time",
    )


class WorkflowTemplateInstanceStep(Base):
    __tablename__ = "workflow_template_instance_steps"
    __table_args__ = (
        ForeignKeyConstraint(
            ["canvas_id", "instance_id"],
            ["workflow_template_instances.canvas_id", "workflow_template_instances.id"],
            ondelete="CASCADE",
            name="fk_workflow_template_instance_steps_instance_canvas",
        ),
        ForeignKeyConstraint(
            ["canvas_id", "canvas_node_id"],
            ["canvas_nodes.canvas_id", "canvas_nodes.id"],
            ondelete="RESTRICT",
            name="fk_workflow_template_instance_steps_canvas_node",
        ),
        UniqueConstraint(
            "instance_id",
            "step_key",
            name="uq_workflow_template_instance_steps_key",
        ),
        UniqueConstraint(
            "instance_id",
            "canvas_node_id",
            name="uq_workflow_template_instance_steps_node",
        ),
        UniqueConstraint(
            "instance_id",
            "id",
            name="uq_workflow_template_instance_steps_instance_id",
        ),
        CheckConstraint(
            "status IN ('pending', 'ready', 'blocked')",
            name="ck_workflow_template_instance_steps_status",
        ),
        Index(
            "ix_workflow_template_instance_steps_instance_status",
            "instance_id",
            "status",
        ),
        {
            **MYSQL_TABLE_OPTIONS,
            "comment": "Instance step to stable Canvas node lineage",
        },
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, comment="Instance-step unique identifier"
    )
    instance_id: Mapped[str] = mapped_column(
        String(36), nullable=False, comment="Owning instance identifier"
    )
    canvas_id: Mapped[str] = mapped_column(
        String(36), nullable=False, comment="Owning canvas identifier"
    )
    step_key: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="Version-local workflow step key"
    )
    node_local_id: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="Template-local node identifier"
    )
    canvas_node_id: Mapped[str | None] = mapped_column(
        String(36), nullable=True, comment="Materialized stable Canvas node identifier"
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="Provider-free instance-step state"
    )
    configuration: Mapped[dict] = mapped_column(
        JSON, nullable=False, default=dict, comment="Sanitized step configuration"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        comment="Instance-step creation time",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        comment="Instance-step update time",
    )
