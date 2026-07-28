"""add workflow-template instance lifecycle commits

Revision ID: g2b3c4d5e6f7
Revises: f1a2b3c4d5e6
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import mysql


revision: str = "g2b3c4d5e6f7"
down_revision: Union[str, Sequence[str], None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _require_mysql() -> None:
    if op.get_bind().dialect.name != "mysql":
        raise RuntimeError("Workflow-template lifecycle commits require MySQL")


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
        raise RuntimeError(f"Unable to resolve collation for {table_name}.{column_name}")
    return collation


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
    instance_collation = _column_collation("workflow_template_instances", "id")
    canvas_collation = _column_collation("workflow_template_instances", "canvas_id")
    op.create_table(
        "workflow_template_instance_lifecycle_commits",
        sa.Column(
            "id",
            sa.String(36, collation=instance_collation),
            primary_key=True,
            comment="Lifecycle commit unique identifier",
        ),
        sa.Column(
            "instance_id",
            sa.String(36, collation=instance_collation),
            nullable=False,
            comment="Owning template instance identifier",
        ),
        sa.Column(
            "canvas_id",
            sa.String(36, collation=canvas_collation),
            nullable=False,
            comment="Owning Canvas identifier",
        ),
        sa.Column(
            "client_mutation_id",
            sa.String(64),
            nullable=False,
            comment="Canvas-scoped lifecycle idempotency key",
        ),
        sa.Column(
            "action",
            sa.String(20),
            nullable=False,
            comment="Lifecycle action: upgrade/detach",
        ),
        sa.Column(
            "request_fingerprint",
            sa.String(64),
            nullable=False,
            comment="Canonical lifecycle request SHA-256",
        ),
        sa.Column(
            "source_version",
            mysql.INTEGER(unsigned=True),
            nullable=False,
            comment="Exact instance version before the action",
        ),
        sa.Column(
            "target_version",
            mysql.INTEGER(unsigned=True),
            nullable=True,
            comment="Exact target version for upgrade; null for detach",
        ),
        sa.Column(
            "canvas_revision",
            mysql.INTEGER(unsigned=True),
            nullable=False,
            comment="Canvas revision committed by the lifecycle action",
        ),
        sa.Column(
            "response_snapshot",
            sa.JSON(),
            nullable=False,
            comment="Sanitized immutable lifecycle response snapshot",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            comment="Lifecycle commit creation time",
        ),
        sa.ForeignKeyConstraint(
            ["canvas_id", "instance_id"],
            [
                "workflow_template_instances.canvas_id",
                "workflow_template_instances.id",
            ],
            ondelete="CASCADE",
            name="fk_workflow_template_lifecycle_commits_instance",
        ),
        sa.UniqueConstraint(
            "canvas_id",
            "client_mutation_id",
            name="uq_workflow_template_lifecycle_commits_canvas_mutation",
        ),
        sa.CheckConstraint(
            "action IN ('upgrade', 'detach')",
            name="ck_workflow_template_lifecycle_commits_action",
        ),
        sa.CheckConstraint(
            "BINARY request_fingerprint = BINARY LOWER(request_fingerprint) "
            "AND request_fingerprint REGEXP '^[0-9a-f]{64}$'",
            name="ck_workflow_template_lifecycle_commits_fingerprint",
        ),
        sa.CheckConstraint(
            "canvas_revision >= 1",
            name="ck_workflow_template_lifecycle_commits_revision",
        ),
        comment="Durable replay snapshots for instance upgrade and detach",
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
        mysql_collate=instance_collation,
    )
    op.create_index(
        "ix_workflow_template_lifecycle_commits_instance_created",
        "workflow_template_instance_lifecycle_commits",
        ["instance_id", "created_at"],
    )


def downgrade() -> None:
    _require_mysql()
    _require_disposable_database()
    op.drop_index(
        "ix_workflow_template_lifecycle_commits_instance_created",
        table_name="workflow_template_instance_lifecycle_commits",
    )
    op.drop_table("workflow_template_instance_lifecycle_commits")
