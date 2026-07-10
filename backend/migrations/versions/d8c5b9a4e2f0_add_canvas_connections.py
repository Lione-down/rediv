"""add canvas connections

Revision ID: d8c5b9a4e2f0
Revises: b7d4c2e9f001
Create Date: 2026-07-10

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "d8c5b9a4e2f0"
down_revision: Union[str, Sequence[str], None] = "b7d4c2e9f001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "canvas_connections",
        sa.Column("id", sa.String(length=36), primary_key=True, comment="Connection unique identifier"),
        sa.Column("project_id", sa.String(length=36), nullable=False, comment="Owning project ID"),
        sa.Column("source_node_id", sa.String(length=36), nullable=False, comment="Source canvas node ID"),
        sa.Column("source_port", sa.String(length=100), nullable=False, comment="Source node port key"),
        sa.Column("target_node_id", sa.String(length=36), nullable=False, comment="Target canvas node ID"),
        sa.Column("target_port", sa.String(length=100), nullable=False, comment="Target node port key"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="active", comment="Connection status"),
        sa.Column(
            "metadata",
            sa.JSON(),
            nullable=False,
            comment="Connection metadata JSON; directed cycles are allowed",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, comment="Created time"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, comment="Updated time"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_node_id"], ["canvas_nodes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["target_node_id"], ["canvas_nodes.id"], ondelete="CASCADE"),
        sa.UniqueConstraint(
            "project_id",
            "source_node_id",
            "source_port",
            "target_node_id",
            "target_port",
            name="uq_canvas_connections_edge",
        ),
        comment="Canvas node connection table",
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
    )
    op.create_index("ix_canvas_connections_project_id", "canvas_connections", ["project_id"])
    op.create_index("ix_canvas_connections_source_node_id", "canvas_connections", ["source_node_id"])
    op.create_index("ix_canvas_connections_target_node_id", "canvas_connections", ["target_node_id"])


def downgrade() -> None:
    op.drop_index("ix_canvas_connections_target_node_id", table_name="canvas_connections")
    op.drop_index("ix_canvas_connections_source_node_id", table_name="canvas_connections")
    op.drop_index("ix_canvas_connections_project_id", table_name="canvas_connections")
    op.drop_table("canvas_connections")
