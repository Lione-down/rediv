"""add immutable workflow-template instance commit snapshots

Revision ID: e0f1a2b3c4d5
Revises: d9e0f1a2b3c4
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import mysql


revision: str = "e0f1a2b3c4d5"
down_revision: Union[str, Sequence[str], None] = "d9e0f1a2b3c4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _require_mysql() -> None:
    if op.get_bind().dialect.name != "mysql":
        raise RuntimeError("Workflow-template instance commits require MySQL")


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
    op.create_table(
        "workflow_template_instance_commits",
        sa.Column(
            "instance_id",
            sa.String(36, collation=instance_collation),
            primary_key=True,
            comment="Committed workflow-template instance identifier",
        ),
        sa.Column(
            "request_fingerprint",
            sa.String(64),
            nullable=False,
            comment="Canonical instantiate request SHA-256",
        ),
        sa.Column(
            "canvas_revision",
            mysql.INTEGER(unsigned=True),
            nullable=False,
            comment="Canvas revision committed by instantiate",
        ),
        sa.Column(
            "response_snapshot",
            sa.JSON(),
            nullable=False,
            comment="Sanitized immutable instantiate response snapshot",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            comment="Instance commit creation time",
        ),
        sa.ForeignKeyConstraint(
            ["instance_id"],
            ["workflow_template_instances.id"],
            ondelete="CASCADE",
            name="fk_workflow_template_instance_commits_instance",
        ),
        sa.CheckConstraint(
            "BINARY request_fingerprint = BINARY LOWER(request_fingerprint) "
            "AND request_fingerprint REGEXP '^[0-9a-f]{64}$'",
            name="ck_workflow_template_instance_commits_fingerprint",
        ),
        sa.CheckConstraint(
            "canvas_revision >= 1",
            name="ck_workflow_template_instance_commits_revision",
        ),
        comment="Immutable instantiate replay snapshot independent of Canvas retention",
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
        mysql_collate=instance_collation,
    )


def downgrade() -> None:
    _require_mysql()
    _require_disposable_database()
    op.drop_table("workflow_template_instance_commits")
