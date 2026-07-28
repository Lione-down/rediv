"""add workflow-template persistence foundation

Revision ID: c8d9e0f1a2b3
Revises: b7c8d9e0f1a2
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import mysql


revision: str = "c8d9e0f1a2b3"
down_revision: Union[str, Sequence[str], None] = "b7c8d9e0f1a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _require_mysql() -> None:
    if op.get_bind().dialect.name != "mysql":
        raise RuntimeError("The workflow-template foundation migration requires MySQL")


def _column_collation(table_name: str, column_name: str) -> str:
    collation = op.get_bind().execute(
        sa.text(
            """
            SELECT COLLATION_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = :table_name
              AND COLUMN_NAME = :column_name
            """
        ),
        {"table_name": table_name, "column_name": column_name},
    ).scalar_one_or_none()
    if not collation:
        raise RuntimeError(
            f"Unable to resolve collation for {table_name}.{column_name}"
        )
    return collation


def _identifier(collation: str) -> sa.String:
    return sa.String(36, collation=collation)


def _table_options(collation: str) -> dict[str, str]:
    return {
        "mysql_engine": "InnoDB",
        "mysql_charset": "utf8mb4",
        "mysql_collate": collation,
    }


def _require_disposable_database() -> None:
    database_name = op.get_bind().execute(sa.text("SELECT DATABASE()")).scalar_one()
    suffix = database_name.removeprefix("revid_test_")
    if (
        not database_name.startswith("revid_test_")
        or not suffix
        or not suffix.isascii()
        or not suffix.replace("_", "").isalnum()
    ):
        raise RuntimeError(
            "Destructive downgrade is restricted to a guarded revid_test_* database"
        )


def upgrade() -> None:
    _require_mysql()
    internal_collation = _column_collation("users", "id")
    user_collation = internal_collation
    project_collation = _column_collation("projects", "id")
    canvas_collation = _column_collation("canvases", "id")
    canvas_node_collation = _column_collation("canvas_nodes", "id")
    asset_collation = _column_collation("assets", "id")
    generation_task_collation = _column_collation("generation_tasks", "id")
    options = _table_options(internal_collation)

    op.create_table(
        "workflow_template_definitions",
        sa.Column("id", _identifier(internal_collation), primary_key=True, comment="Definition unique identifier"),
        sa.Column("template_key", sa.String(160), nullable=False, comment="Globally stable template key"),
        sa.Column("owner_user_id", _identifier(user_collation), nullable=True, comment="Private-template owner; null only for built-ins"),
        sa.Column("scope", sa.String(20), nullable=False, comment="Template scope: built_in/private"),
        sa.Column("status", sa.String(20), nullable=False, comment="Definition status"),
        sa.Column("name", sa.String(255), nullable=False, comment="Template display name"),
        sa.Column("category", sa.String(64), nullable=False, comment="Template category"),
        sa.Column("description", sa.Text(), nullable=False, comment="Template description"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, comment="Definition creation time"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, comment="Definition update time"),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], ondelete="RESTRICT", name="fk_workflow_template_definitions_owner"),
        sa.UniqueConstraint("template_key", name="uq_workflow_template_definitions_template_key"),
        sa.CheckConstraint("(scope = 'built_in' AND owner_user_id IS NULL) OR (scope = 'private' AND owner_user_id IS NOT NULL)", name="ck_workflow_template_definitions_scope_owner"),
        sa.CheckConstraint("status IN ('active', 'retired')", name="ck_workflow_template_definitions_status"),
        comment="Stable workflow-template identities",
        **options,
    )
    op.create_index("ix_workflow_template_definitions_owner_scope_status", "workflow_template_definitions", ["owner_user_id", "scope", "status"])

    op.create_table(
        "workflow_template_versions",
        sa.Column("id", _identifier(internal_collation), primary_key=True, comment="Version unique identifier"),
        sa.Column("definition_id", _identifier(internal_collation), nullable=False, comment="Owning definition identifier"),
        sa.Column("version", mysql.INTEGER(unsigned=True), nullable=False, comment="Monotonic definition version"),
        sa.Column("schema_id", sa.String(100), nullable=False, comment="Manifest schema identifier"),
        sa.Column("schema_version", mysql.INTEGER(unsigned=True), nullable=False, comment="Manifest schema version"),
        sa.Column("lifecycle", sa.String(20), nullable=False, comment="Version lifecycle"),
        sa.Column("manifest", sa.JSON(), nullable=False, comment="Strict normalized portable manifest"),
        sa.Column("fingerprint", sa.String(64), nullable=False, comment="Canonical manifest SHA-256"),
        sa.Column("created_by_user_id", _identifier(user_collation), nullable=True, comment="User that created this version; null for system seed"),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True, comment="Immutable publish time"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, comment="Version creation time"),
        sa.ForeignKeyConstraint(["definition_id"], ["workflow_template_definitions.id"], ondelete="RESTRICT", name="fk_workflow_template_versions_definition"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="RESTRICT", name="fk_workflow_template_versions_creator"),
        sa.UniqueConstraint("definition_id", "version", name="uq_workflow_template_versions_definition_version"),
        sa.UniqueConstraint("definition_id", "id", name="uq_workflow_template_versions_definition_id"),
        sa.CheckConstraint("version >= 1 AND schema_version = 1", name="ck_workflow_template_versions_numbers"),
        sa.CheckConstraint("lifecycle IN ('draft', 'published', 'retired')", name="ck_workflow_template_versions_lifecycle"),
        sa.CheckConstraint("BINARY fingerprint = BINARY LOWER(fingerprint) AND fingerprint REGEXP '^[0-9a-f]{64}$'", name="ck_workflow_template_versions_fingerprint"),
        comment="Immutable workflow-template version payloads",
        **options,
    )
    op.create_index("ix_workflow_template_versions_definition_lifecycle_version", "workflow_template_versions", ["definition_id", "lifecycle", "version"])

    op.create_table(
        "workflow_template_slots",
        sa.Column("id", _identifier(internal_collation), primary_key=True, comment="Slot unique identifier"),
        sa.Column("version_id", _identifier(internal_collation), nullable=False, comment="Owning version identifier"),
        sa.Column("slot_key", sa.String(100), nullable=False, comment="Version-local slot key"),
        sa.Column("slot_kind", sa.String(20), nullable=False, comment="Slot kind: variable/asset"),
        sa.Column("value_type", sa.String(32), nullable=False, comment="Frozen slot value type"),
        sa.Column("is_required", sa.Boolean(), nullable=False, comment="Whether binding is required"),
        sa.Column("position", mysql.INTEGER(unsigned=True), nullable=False, comment="Stable slot display order"),
        sa.Column("definition", sa.JSON(), nullable=False, comment="Bounded normalized slot definition"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, comment="Slot creation time"),
        sa.ForeignKeyConstraint(["version_id"], ["workflow_template_versions.id"], ondelete="CASCADE", name="fk_workflow_template_slots_version"),
        sa.UniqueConstraint("version_id", "slot_key", name="uq_workflow_template_slots_version_key"),
        sa.UniqueConstraint("version_id", "id", name="uq_workflow_template_slots_version_id"),
        sa.CheckConstraint("slot_kind IN ('variable', 'asset')", name="ck_workflow_template_slots_kind"),
        comment="Typed variable and asset slots by version",
        **options,
    )
    op.create_index("ix_workflow_template_slots_version_position", "workflow_template_slots", ["version_id", "position"])

    op.create_table(
        "workflow_template_instances",
        sa.Column("id", _identifier(internal_collation), primary_key=True, comment="Instance unique identifier"),
        sa.Column("definition_id", _identifier(internal_collation), nullable=False, comment="Pinned definition identifier"),
        sa.Column("version_id", _identifier(internal_collation), nullable=False, comment="Pinned version identifier"),
        sa.Column("owner_user_id", _identifier(user_collation), nullable=False, comment="Authenticated instance owner"),
        sa.Column("project_id", _identifier(project_collation), nullable=False, comment="Target project identifier"),
        sa.Column("canvas_id", _identifier(canvas_collation), nullable=False, comment="Target canvas identifier"),
        sa.Column("status", sa.String(32), nullable=False, comment="Instance lifecycle state"),
        sa.Column("preflight_fingerprint", sa.String(64), nullable=True, comment="Accepted preflight SHA-256"),
        sa.Column("client_mutation_id", sa.String(64), nullable=True, comment="Canvas-scoped instantiate idempotency key"),
        sa.Column("node_id_map", sa.JSON(), nullable=False, comment="Template-local to Canvas node map"),
        sa.Column("local_overrides", sa.JSON(), nullable=False, comment="Sanitized instance-local overrides"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, comment="Instance creation time"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, comment="Instance update time"),
        sa.Column("detached_at", sa.DateTime(timezone=True), nullable=True, comment="Explicit detach time"),
        sa.ForeignKeyConstraint(["definition_id", "version_id"], ["workflow_template_versions.definition_id", "workflow_template_versions.id"], ondelete="RESTRICT", name="fk_workflow_template_instances_definition_version"),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], ondelete="RESTRICT", name="fk_workflow_template_instances_owner"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="RESTRICT", name="fk_workflow_template_instances_project"),
        sa.ForeignKeyConstraint(["project_id", "canvas_id"], ["canvases.project_id", "canvases.id"], ondelete="RESTRICT", name="fk_workflow_template_instances_project_canvas"),
        sa.UniqueConstraint("canvas_id", "client_mutation_id", name="uq_workflow_template_instances_canvas_mutation"),
        sa.UniqueConstraint("definition_id", "version_id", "id", name="uq_workflow_template_instances_definition_version"),
        sa.UniqueConstraint("version_id", "id", name="uq_workflow_template_instances_version_id"),
        sa.UniqueConstraint("canvas_id", "id", name="uq_workflow_template_instances_canvas_id"),
        sa.UniqueConstraint("owner_user_id", "project_id", "canvas_id", "id", name="uq_workflow_template_instances_scope_id"),
        sa.CheckConstraint("status IN ('configuring', 'ready', 'instantiated', 'locally_modified', 'detached', 'upgrade_available')", name="ck_workflow_template_instances_status"),
        sa.CheckConstraint("preflight_fingerprint IS NULL OR (BINARY preflight_fingerprint = BINARY LOWER(preflight_fingerprint) AND preflight_fingerprint REGEXP '^[0-9a-f]{64}$')", name="ck_workflow_template_instances_fingerprint"),
        comment="Exact-version workflow-template instance lineage",
        **options,
    )
    op.create_index("ix_workflow_template_instances_scope_status", "workflow_template_instances", ["owner_user_id", "project_id", "canvas_id", "status"])

    op.create_table(
        "workflow_template_bindings",
        sa.Column("id", _identifier(internal_collation), primary_key=True, comment="Binding unique identifier"),
        sa.Column("instance_id", _identifier(internal_collation), nullable=False, comment="Owning instance identifier"),
        sa.Column("version_id", _identifier(internal_collation), nullable=False, comment="Pinned slot version identifier"),
        sa.Column("slot_id", _identifier(internal_collation), nullable=False, comment="Bound slot identifier"),
        sa.Column("binding_type", sa.String(20), nullable=False, comment="Binding type: value/asset"),
        sa.Column("value_json", sa.JSON(), nullable=True, comment="Validated variable value wrapper"),
        sa.Column("asset_id", _identifier(asset_collation), nullable=True, comment="Target-project asset identifier"),
        sa.Column("source_revision", sa.String(64), nullable=True, comment="Validated source asset revision"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, comment="Binding creation time"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, comment="Binding update time"),
        sa.ForeignKeyConstraint(["version_id", "instance_id"], ["workflow_template_instances.version_id", "workflow_template_instances.id"], ondelete="CASCADE", name="fk_workflow_template_bindings_instance_version"),
        sa.ForeignKeyConstraint(["version_id", "slot_id"], ["workflow_template_slots.version_id", "workflow_template_slots.id"], ondelete="RESTRICT", name="fk_workflow_template_bindings_version_slot"),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"], ondelete="RESTRICT", name="fk_workflow_template_bindings_asset"),
        sa.UniqueConstraint("instance_id", "slot_id", name="uq_workflow_template_bindings_instance_slot"),
        sa.CheckConstraint("(binding_type = 'value' AND value_json IS NOT NULL AND asset_id IS NULL AND source_revision IS NULL) OR (binding_type = 'asset' AND value_json IS NULL AND asset_id IS NOT NULL AND source_revision IS NOT NULL)", name="ck_workflow_template_bindings_shape"),
        comment="Resolved variable and target-project asset bindings",
        **options,
    )
    op.create_index("ix_workflow_template_bindings_instance_type", "workflow_template_bindings", ["instance_id", "binding_type"])

    op.create_table(
        "workflow_template_instance_steps",
        sa.Column("id", _identifier(internal_collation), primary_key=True, comment="Instance-step unique identifier"),
        sa.Column("instance_id", _identifier(internal_collation), nullable=False, comment="Owning instance identifier"),
        sa.Column("canvas_id", _identifier(canvas_collation), nullable=False, comment="Owning canvas identifier"),
        sa.Column("step_key", sa.String(100), nullable=False, comment="Version-local workflow step key"),
        sa.Column("node_local_id", sa.String(100), nullable=False, comment="Template-local node identifier"),
        sa.Column("canvas_node_id", _identifier(canvas_node_collation), nullable=True, comment="Materialized stable Canvas node identifier"),
        sa.Column("status", sa.String(20), nullable=False, comment="Provider-free instance-step state"),
        sa.Column("configuration", sa.JSON(), nullable=False, comment="Sanitized step configuration"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, comment="Instance-step creation time"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, comment="Instance-step update time"),
        sa.ForeignKeyConstraint(["canvas_id", "instance_id"], ["workflow_template_instances.canvas_id", "workflow_template_instances.id"], ondelete="CASCADE", name="fk_workflow_template_instance_steps_instance_canvas"),
        sa.ForeignKeyConstraint(["canvas_id", "canvas_node_id"], ["canvas_nodes.canvas_id", "canvas_nodes.id"], ondelete="RESTRICT", name="fk_workflow_template_instance_steps_canvas_node"),
        sa.UniqueConstraint("instance_id", "step_key", name="uq_workflow_template_instance_steps_key"),
        sa.UniqueConstraint("instance_id", "canvas_node_id", name="uq_workflow_template_instance_steps_node"),
        sa.UniqueConstraint("instance_id", "id", name="uq_workflow_template_instance_steps_instance_id"),
        sa.CheckConstraint("status IN ('pending', 'ready', 'blocked')", name="ck_workflow_template_instance_steps_status"),
        comment="Instance step to stable Canvas node lineage",
        **options,
    )
    op.create_index("ix_workflow_template_instance_steps_instance_status", "workflow_template_instance_steps", ["instance_id", "status"])

    op.create_table(
        "workflow_runs",
        sa.Column("id", _identifier(internal_collation), primary_key=True, comment="Workflow-run unique identifier"),
        sa.Column("instance_id", _identifier(internal_collation), nullable=False, comment="Owning template instance identifier"),
        sa.Column("owner_user_id", _identifier(user_collation), nullable=False, comment="Authenticated run owner"),
        sa.Column("project_id", _identifier(project_collation), nullable=False, comment="Run project identifier"),
        sa.Column("canvas_id", _identifier(canvas_collation), nullable=False, comment="Run canvas identifier"),
        sa.Column("status", sa.String(20), nullable=False, comment="Durable workflow-run state"),
        sa.Column("preflight_fingerprint", sa.String(64), nullable=False, comment="Runtime preflight SHA-256"),
        sa.Column("client_run_id", sa.String(64), nullable=False, comment="Owner-scoped explicit run idempotency key"),
        sa.Column("quota_estimate", sa.JSON(), nullable=False, comment="Backend-authoritative quota-unit estimate"),
        sa.Column("cost_class", sa.String(32), nullable=False, comment="Backend-authoritative cost class"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, comment="Workflow-run creation time"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, comment="Workflow-run update time"),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True, comment="Terminal completion time"),
        sa.ForeignKeyConstraint(["owner_user_id", "project_id", "canvas_id", "instance_id"], ["workflow_template_instances.owner_user_id", "workflow_template_instances.project_id", "workflow_template_instances.canvas_id", "workflow_template_instances.id"], ondelete="RESTRICT", name="fk_workflow_runs_instance_scope"),
        sa.UniqueConstraint("owner_user_id", "client_run_id", name="uq_workflow_runs_owner_client"),
        sa.UniqueConstraint("instance_id", "id", name="uq_workflow_runs_instance_id"),
        sa.CheckConstraint("status IN ('ready', 'submitting', 'queued', 'running', 'persisting', 'succeeded', 'failed', 'cancelled')", name="ck_workflow_runs_status"),
        sa.CheckConstraint("BINARY preflight_fingerprint = BINARY LOWER(preflight_fingerprint) AND preflight_fingerprint REGEXP '^[0-9a-f]{64}$'", name="ck_workflow_runs_fingerprint"),
        comment="Explicit durable workflow-run identity and state",
        **options,
    )
    op.create_index("ix_workflow_runs_instance_status_created", "workflow_runs", ["instance_id", "status", "created_at"])

    op.create_table(
        "workflow_run_steps",
        sa.Column("id", _identifier(internal_collation), primary_key=True, comment="Run-step unique identifier"),
        sa.Column("run_id", _identifier(internal_collation), nullable=False, comment="Owning workflow-run identifier"),
        sa.Column("instance_id", _identifier(internal_collation), nullable=False, comment="Owning template instance identifier"),
        sa.Column("instance_step_id", _identifier(internal_collation), nullable=False, comment="Source instance-step identifier"),
        sa.Column("status", sa.String(20), nullable=False, comment="Durable run-step state"),
        sa.Column("generation_task_id", _identifier(generation_task_collation), nullable=True, comment="Existing durable generation job identifier"),
        sa.Column("dependency_snapshot", sa.JSON(), nullable=False, comment="Sanitized dependency fingerprint inputs"),
        sa.Column("attempt_count", mysql.INTEGER(unsigned=True), nullable=False, comment="Explicit run-step attempt count"),
        sa.Column("error_code", sa.String(100), nullable=True, comment="Sanitized terminal error code"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, comment="Run-step creation time"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, comment="Run-step update time"),
        sa.ForeignKeyConstraint(["instance_id", "run_id"], ["workflow_runs.instance_id", "workflow_runs.id"], ondelete="CASCADE", name="fk_workflow_run_steps_run_instance"),
        sa.ForeignKeyConstraint(["instance_id", "instance_step_id"], ["workflow_template_instance_steps.instance_id", "workflow_template_instance_steps.id"], ondelete="RESTRICT", name="fk_workflow_run_steps_instance_step"),
        sa.ForeignKeyConstraint(["generation_task_id"], ["generation_tasks.id"], ondelete="RESTRICT", name="fk_workflow_run_steps_generation_task"),
        sa.UniqueConstraint("run_id", "instance_step_id", name="uq_workflow_run_steps_run_instance_step"),
        sa.CheckConstraint("status IN ('draft', 'ready', 'submitting', 'queued', 'running', 'persisting', 'succeeded', 'failed', 'blocked', 'cancelled')", name="ck_workflow_run_steps_status"),
        comment="Durable workflow-run step lineage",
        **options,
    )
    op.create_index("ix_workflow_run_steps_run_status", "workflow_run_steps", ["run_id", "status"])


def downgrade() -> None:
    _require_mysql()
    _require_disposable_database()
    for table_name in (
        "workflow_run_steps",
        "workflow_runs",
        "workflow_template_instance_steps",
        "workflow_template_bindings",
        "workflow_template_instances",
        "workflow_template_slots",
        "workflow_template_versions",
        "workflow_template_definitions",
    ):
        op.drop_table(table_name)
