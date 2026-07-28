from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    String,
    Text,
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


class WorkflowTemplateDefinition(Base):
    __tablename__ = "workflow_template_definitions"
    __table_args__ = (
        UniqueConstraint(
            "template_key",
            name="uq_workflow_template_definitions_template_key",
        ),
        CheckConstraint(
            "(scope = 'built_in' AND owner_user_id IS NULL) OR "
            "(scope = 'private' AND owner_user_id IS NOT NULL)",
            name="ck_workflow_template_definitions_scope_owner",
        ),
        CheckConstraint(
            "status IN ('active', 'retired')",
            name="ck_workflow_template_definitions_status",
        ),
        Index(
            "ix_workflow_template_definitions_owner_scope_status",
            "owner_user_id",
            "scope",
            "status",
        ),
        {
            **MYSQL_TABLE_OPTIONS,
            "comment": "Stable workflow-template identities",
        },
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, comment="Definition unique identifier"
    )
    template_key: Mapped[str] = mapped_column(
        String(160), nullable=False, comment="Globally stable template key"
    )
    owner_user_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=True,
        comment="Private-template owner; null only for built-ins",
    )
    scope: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="Template scope: built_in/private"
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="active", comment="Definition status"
    )
    name: Mapped[str] = mapped_column(
        String(255), nullable=False, comment="Template display name"
    )
    category: Mapped[str] = mapped_column(
        String(64), nullable=False, comment="Template category"
    )
    description: Mapped[str] = mapped_column(
        Text, nullable=False, default="", comment="Template description"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        comment="Definition creation time",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        comment="Definition update time",
    )


class WorkflowTemplateVersion(Base):
    __tablename__ = "workflow_template_versions"
    __table_args__ = (
        UniqueConstraint(
            "definition_id",
            "version",
            name="uq_workflow_template_versions_definition_version",
        ),
        UniqueConstraint(
            "definition_id",
            "id",
            name="uq_workflow_template_versions_definition_id",
        ),
        CheckConstraint(
            "version >= 1 AND schema_version = 1",
            name="ck_workflow_template_versions_numbers",
        ),
        CheckConstraint(
            "lifecycle IN ('draft', 'published', 'retired')",
            name="ck_workflow_template_versions_lifecycle",
        ),
        CheckConstraint(
            "BINARY fingerprint = BINARY LOWER(fingerprint) "
            "AND fingerprint REGEXP '^[0-9a-f]{64}$'",
            name="ck_workflow_template_versions_fingerprint",
        ),
        Index(
            "ix_workflow_template_versions_definition_lifecycle_version",
            "definition_id",
            "lifecycle",
            "version",
        ),
        {
            **MYSQL_TABLE_OPTIONS,
            "comment": "Immutable workflow-template version payloads",
        },
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, comment="Version unique identifier"
    )
    definition_id: Mapped[str] = mapped_column(
        ForeignKey("workflow_template_definitions.id", ondelete="RESTRICT"),
        nullable=False,
        comment="Owning definition identifier",
    )
    version: Mapped[int] = mapped_column(
        mysql.INTEGER(unsigned=True),
        nullable=False,
        comment="Monotonic definition version",
    )
    schema_id: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="Manifest schema identifier"
    )
    schema_version: Mapped[int] = mapped_column(
        mysql.INTEGER(unsigned=True),
        nullable=False,
        comment="Manifest schema version",
    )
    lifecycle: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="Version lifecycle"
    )
    manifest: Mapped[dict] = mapped_column(
        JSON, nullable=False, comment="Strict normalized portable manifest"
    )
    fingerprint: Mapped[str] = mapped_column(
        String(64), nullable=False, comment="Canonical manifest SHA-256"
    )
    created_by_user_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=True,
        comment="User that created this version; null for system seed",
    )
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, comment="Immutable publish time"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        comment="Version creation time",
    )


class WorkflowTemplateSlot(Base):
    __tablename__ = "workflow_template_slots"
    __table_args__ = (
        UniqueConstraint(
            "version_id",
            "slot_key",
            name="uq_workflow_template_slots_version_key",
        ),
        UniqueConstraint(
            "version_id",
            "id",
            name="uq_workflow_template_slots_version_id",
        ),
        CheckConstraint(
            "slot_kind IN ('variable', 'asset')",
            name="ck_workflow_template_slots_kind",
        ),
        Index(
            "ix_workflow_template_slots_version_position",
            "version_id",
            "position",
        ),
        {
            **MYSQL_TABLE_OPTIONS,
            "comment": "Typed variable and asset slots by version",
        },
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, comment="Slot unique identifier"
    )
    version_id: Mapped[str] = mapped_column(
        ForeignKey("workflow_template_versions.id", ondelete="CASCADE"),
        nullable=False,
        comment="Owning version identifier",
    )
    slot_key: Mapped[str] = mapped_column(
        String(100), nullable=False, comment="Version-local slot key"
    )
    slot_kind: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="Slot kind: variable/asset"
    )
    value_type: Mapped[str] = mapped_column(
        String(32), nullable=False, comment="Frozen slot value type"
    )
    is_required: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, comment="Whether binding is required"
    )
    position: Mapped[int] = mapped_column(
        mysql.INTEGER(unsigned=True),
        nullable=False,
        comment="Stable slot display order",
    )
    definition: Mapped[dict] = mapped_column(
        JSON, nullable=False, comment="Bounded normalized slot definition"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        comment="Slot creation time",
    )


class WorkflowTemplateInstance(Base):
    __tablename__ = "workflow_template_instances"
    __table_args__ = (
        ForeignKeyConstraint(
            ["definition_id", "version_id"],
            [
                "workflow_template_versions.definition_id",
                "workflow_template_versions.id",
            ],
            ondelete="RESTRICT",
            name="fk_workflow_template_instances_definition_version",
        ),
        ForeignKeyConstraint(
            ["project_id", "canvas_id"],
            ["canvases.project_id", "canvases.id"],
            ondelete="RESTRICT",
            name="fk_workflow_template_instances_project_canvas",
        ),
        UniqueConstraint(
            "canvas_id",
            "client_mutation_id",
            name="uq_workflow_template_instances_canvas_mutation",
        ),
        UniqueConstraint(
            "definition_id",
            "version_id",
            "id",
            name="uq_workflow_template_instances_definition_version",
        ),
        UniqueConstraint(
            "version_id",
            "id",
            name="uq_workflow_template_instances_version_id",
        ),
        UniqueConstraint(
            "canvas_id",
            "id",
            name="uq_workflow_template_instances_canvas_id",
        ),
        UniqueConstraint(
            "owner_user_id",
            "project_id",
            "canvas_id",
            "id",
            name="uq_workflow_template_instances_scope_id",
        ),
        CheckConstraint(
            "status IN ('configuring', 'ready', 'instantiated', "
            "'locally_modified', 'detached', 'upgrade_available')",
            name="ck_workflow_template_instances_status",
        ),
        CheckConstraint(
            "preflight_fingerprint IS NULL OR "
            "(BINARY preflight_fingerprint = BINARY LOWER(preflight_fingerprint) "
            "AND preflight_fingerprint REGEXP '^[0-9a-f]{64}$')",
            name="ck_workflow_template_instances_fingerprint",
        ),
        Index(
            "ix_workflow_template_instances_scope_status",
            "owner_user_id",
            "project_id",
            "canvas_id",
            "status",
        ),
        {
            **MYSQL_TABLE_OPTIONS,
            "comment": "Exact-version workflow-template instance lineage",
        },
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, comment="Instance unique identifier"
    )
    definition_id: Mapped[str] = mapped_column(
        String(36), nullable=False, comment="Pinned definition identifier"
    )
    version_id: Mapped[str] = mapped_column(
        String(36), nullable=False, comment="Pinned version identifier"
    )
    owner_user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        comment="Authenticated instance owner",
    )
    project_id: Mapped[str] = mapped_column(
        ForeignKey("projects.id", ondelete="RESTRICT"),
        nullable=False,
        comment="Target project identifier",
    )
    canvas_id: Mapped[str] = mapped_column(
        String(36), nullable=False, comment="Target canvas identifier"
    )
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, comment="Instance lifecycle state"
    )
    preflight_fingerprint: Mapped[str | None] = mapped_column(
        String(64), nullable=True, comment="Accepted preflight SHA-256"
    )
    client_mutation_id: Mapped[str | None] = mapped_column(
        String(64), nullable=True, comment="Canvas-scoped instantiate idempotency key"
    )
    node_id_map: Mapped[dict] = mapped_column(
        JSON, nullable=False, default=dict, comment="Template-local to Canvas node map"
    )
    local_overrides: Mapped[dict] = mapped_column(
        JSON, nullable=False, default=dict, comment="Sanitized instance-local overrides"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        comment="Instance creation time",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        comment="Instance update time",
    )
    detached_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, comment="Explicit detach time"
    )


from models.workflow_run import WorkflowRun, WorkflowRunStep  # noqa: E402
from models.workflow_template_lineage import (  # noqa: E402
    WorkflowTemplateBinding,
    WorkflowTemplateInstanceStep,
)
