"""add ordered workflow-template asset binding items

Revision ID: d9e0f1a2b3c4
Revises: c8d9e0f1a2b3
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import mysql


revision: str = "d9e0f1a2b3c4"
down_revision: Union[str, Sequence[str], None] = "c8d9e0f1a2b3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _require_mysql() -> None:
    if op.get_bind().dialect.name != "mysql":
        raise RuntimeError("Workflow-template asset binding items require MySQL")


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


def _identifier(collation: str) -> sa.String:
    return sa.String(36, collation=collation)


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
    binding_collation = _column_collation("workflow_template_bindings", "id")
    asset_collation = _column_collation("assets", "id")
    op.create_table(
        "workflow_template_asset_binding_items",
        sa.Column(
            "id",
            _identifier(binding_collation),
            primary_key=True,
            comment="Asset-binding item unique identifier",
        ),
        sa.Column(
            "binding_id",
            _identifier(binding_collation),
            nullable=False,
            comment="Owning per-slot binding identifier",
        ),
        sa.Column(
            "asset_id",
            _identifier(asset_collation),
            nullable=False,
            comment="Validated target-project asset identifier",
        ),
        sa.Column(
            "source_revision",
            sa.String(64),
            nullable=False,
            comment="Validated asset source revision",
        ),
        sa.Column(
            "position",
            mysql.INTEGER(unsigned=True),
            nullable=False,
            comment="Stable zero-based item order within the slot",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            comment="Asset-binding item creation time",
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            comment="Asset-binding item update time",
        ),
        sa.ForeignKeyConstraint(
            ["binding_id"],
            ["workflow_template_bindings.id"],
            ondelete="CASCADE",
            name="fk_workflow_template_asset_binding_items_binding",
        ),
        sa.ForeignKeyConstraint(
            ["asset_id"],
            ["assets.id"],
            ondelete="RESTRICT",
            name="fk_workflow_template_asset_binding_items_asset",
        ),
        sa.UniqueConstraint(
            "binding_id",
            "position",
            name="uq_workflow_template_asset_binding_items_position",
        ),
        sa.UniqueConstraint(
            "binding_id",
            "asset_id",
            name="uq_workflow_template_asset_binding_items_asset",
        ),
        sa.CheckConstraint(
            "position >= 0 AND position < 9",
            name="ck_workflow_template_asset_binding_items_position",
        ),
        sa.CheckConstraint(
            "BINARY source_revision = BINARY LOWER(source_revision) "
            "AND source_revision REGEXP '^[0-9a-f]{64}$'",
            name="ck_workflow_template_asset_binding_items_revision",
        ),
        comment="Ordered asset items for one workflow-template slot binding",
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
        mysql_collate=binding_collation,
    )
    op.create_index(
        "ix_workflow_template_asset_binding_items_binding",
        "workflow_template_asset_binding_items",
        ["binding_id", "position"],
    )


def downgrade() -> None:
    _require_mysql()
    _require_disposable_database()
    op.drop_table("workflow_template_asset_binding_items")
