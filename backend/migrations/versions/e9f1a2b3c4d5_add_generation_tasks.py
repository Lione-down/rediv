"""add generation tasks

Revision ID: e9f1a2b3c4d5
Revises: d8c5b9a4e2f0
Create Date: 2026-07-10

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "e9f1a2b3c4d5"
down_revision: Union[str, Sequence[str], None] = "d8c5b9a4e2f0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _mysql_generation_task_table_kwargs() -> dict[str, str]:
    bind = op.get_bind()
    if bind.dialect.name != "mysql":
        return {}

    parent_collation = bind.execute(
        sa.text(
            """
            SELECT COLLATION_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'users'
              AND COLUMN_NAME = 'id'
            """
        )
    ).scalar_one_or_none()
    if not parent_collation:
        return {}
    return {"mysql_collate": parent_collation}


def upgrade() -> None:
    table_kwargs = _mysql_generation_task_table_kwargs()
    op.create_table(
        "generation_tasks",
        sa.Column("id", sa.String(length=36), primary_key=True, comment="Generation task unique identifier"),
        sa.Column("user_id", sa.String(length=36), nullable=False, comment="Owning user ID"),
        sa.Column("project_id", sa.String(length=36), nullable=True, comment="Related project ID"),
        sa.Column("canvas_node_id", sa.String(length=36), nullable=True, comment="Related canvas node ID"),
        sa.Column("media_type", sa.String(length=32), nullable=False, comment="Generated media type: text/image/video"),
        sa.Column("provider", sa.String(length=64), nullable=False, server_default="agnes", comment="Provider name"),
        sa.Column("model", sa.String(length=255), nullable=True, comment="Provider model name"),
        sa.Column("provider_request_id", sa.String(length=255), nullable=True, comment="Provider request or task ID"),
        sa.Column("status", sa.String(length=32), nullable=False, comment="Task status: queued/running/succeeded/failed/timed_out"),
        sa.Column("duration_ms", sa.Integer(), nullable=True, comment="Task duration in milliseconds"),
        sa.Column("result_asset_id", sa.String(length=36), nullable=True, comment="Result asset ID"),
        sa.Column("error_code", sa.String(length=100), nullable=True, comment="Sanitized error code"),
        sa.Column("error_message", sa.Text(), nullable=True, comment="Sanitized error message"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, comment="Created time"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, comment="Updated time"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["canvas_node_id"], ["canvas_nodes.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["result_asset_id"], ["assets.id"], ondelete="SET NULL"),
        comment="Generation task diagnostics table",
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
        **table_kwargs,
    )
    op.create_index("ix_generation_tasks_user_id", "generation_tasks", ["user_id"])
    op.create_index("ix_generation_tasks_project_id", "generation_tasks", ["project_id"])
    op.create_index("ix_generation_tasks_canvas_node_id", "generation_tasks", ["canvas_node_id"])
    op.create_index("ix_generation_tasks_media_type", "generation_tasks", ["media_type"])
    op.create_index("ix_generation_tasks_provider_request_id", "generation_tasks", ["provider_request_id"])
    op.create_index("ix_generation_tasks_status", "generation_tasks", ["status"])
    op.create_index("ix_generation_tasks_result_asset_id", "generation_tasks", ["result_asset_id"])


def downgrade() -> None:
    op.drop_index("ix_generation_tasks_result_asset_id", table_name="generation_tasks")
    op.drop_index("ix_generation_tasks_status", table_name="generation_tasks")
    op.drop_index("ix_generation_tasks_provider_request_id", table_name="generation_tasks")
    op.drop_index("ix_generation_tasks_media_type", table_name="generation_tasks")
    op.drop_index("ix_generation_tasks_canvas_node_id", table_name="generation_tasks")
    op.drop_index("ix_generation_tasks_project_id", table_name="generation_tasks")
    op.drop_index("ix_generation_tasks_user_id", table_name="generation_tasks")
    op.drop_table("generation_tasks")
