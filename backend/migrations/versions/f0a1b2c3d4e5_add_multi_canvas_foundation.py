"""add multi-canvas foundation

Revision ID: f0a1b2c3d4e5
Revises: e9f1a2b3c4d5
Create Date: 2026-07-13

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import mysql


revision: str = "f0a1b2c3d4e5"
down_revision: Union[str, Sequence[str], None] = "e9f1a2b3c4d5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _require_mysql() -> None:
    if op.get_bind().dialect.name != "mysql":
        raise RuntimeError("The multi-canvas migration requires MySQL")


def _parent_collation(table_name: str, column_name: str) -> str | None:
    return op.get_bind().execute(
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


def _foreign_keys(table_name: str, column_name: str) -> list[str]:
    rows = op.get_bind().execute(
        sa.text(
            """
            SELECT DISTINCT CONSTRAINT_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = :table_name
              AND COLUMN_NAME = :column_name
              AND REFERENCED_TABLE_NAME IS NOT NULL
            """
        ),
        {"table_name": table_name, "column_name": column_name},
    )
    return [row[0] for row in rows]


def _drop_column_foreign_keys(table_name: str, column_names: tuple[str, ...]) -> None:
    names = {
        constraint_name
        for column_name in column_names
        for constraint_name in _foreign_keys(table_name, column_name)
    }
    for constraint_name in sorted(names):
        op.drop_constraint(constraint_name, table_name, type_="foreignkey")


def _assert_zero(query: str, message: str) -> None:
    count = op.get_bind().execute(sa.text(query)).scalar_one()
    if count:
        raise RuntimeError(f"{message}: {count}")


def upgrade() -> None:
    _require_mysql()
    project_collation = _parent_collation("projects", "id")
    table_kwargs = {"mysql_collate": project_collation} if project_collation else {}

    op.add_column(
        "projects",
        sa.Column(
            "canvas_order_revision",
            mysql.BIGINT(unsigned=True),
            nullable=False,
            server_default=sa.text("0"),
            comment="Canvas ordering revision",
        ),
    )
    op.create_table(
        "canvases",
        sa.Column("id", sa.String(36), primary_key=True, comment="Canvas unique identifier"),
        sa.Column("project_id", sa.String(36), nullable=False, comment="Owning project ID"),
        sa.Column("name", sa.String(255), nullable=False, comment="Canvas display name"),
        sa.Column("sort_order", mysql.INTEGER(unsigned=True), nullable=False, server_default=sa.text("0"), comment="Dense canvas order within the project"),
        sa.Column("status", sa.String(20), nullable=False, server_default="active", comment="Canvas status: active/archived"),
        sa.Column("viewport_x", sa.Float(), nullable=False, server_default=sa.text("0"), comment="Viewport world X coordinate"),
        sa.Column("viewport_y", sa.Float(), nullable=False, server_default=sa.text("0"), comment="Viewport world Y coordinate"),
        sa.Column("viewport_zoom", sa.Numeric(8, 4), nullable=False, server_default=sa.text("1.0000"), comment="Viewport zoom multiplier"),
        sa.Column("graph_revision", mysql.BIGINT(unsigned=True), nullable=False, server_default=sa.text("0"), comment="Current graph document revision"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, comment="Created time"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, comment="Updated time"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True, comment="Soft deletion time"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE", name="fk_canvases_project"),
        sa.UniqueConstraint("project_id", "id", name="uq_canvases_project_id_id"),
        sa.CheckConstraint("status IN ('active', 'archived')", name="ck_canvases_status"),
        comment="Project canvas table",
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
        **table_kwargs,
    )
    op.create_index("ix_canvases_project_status_order", "canvases", ["project_id", "status", "sort_order", "created_at"])

    op.get_bind().execute(
        sa.text(
            """
            INSERT INTO canvases (
                id, project_id, name, sort_order, status,
                viewport_x, viewport_y, viewport_zoom, graph_revision,
                created_at, updated_at, deleted_at
            )
            SELECT
                LOWER(CONCAT(
                    SUBSTRING(SHA2(CONCAT('revid:first-canvas:', id), 256), 1, 8), '-',
                    SUBSTRING(SHA2(CONCAT('revid:first-canvas:', id), 256), 9, 4), '-',
                    SUBSTRING(SHA2(CONCAT('revid:first-canvas:', id), 256), 13, 4), '-',
                    SUBSTRING(SHA2(CONCAT('revid:first-canvas:', id), 256), 17, 4), '-',
                    SUBSTRING(SHA2(CONCAT('revid:first-canvas:', id), 256), 21, 12)
                )),
                id, :default_name, 0, 'active', 0, 0, 1.0000, 0,
                created_at, updated_at, NULL
            FROM projects
            """
        ),
        {"default_name": "画布 1"},
    )
    _assert_zero(
        "SELECT COUNT(*) FROM projects p LEFT JOIN canvases c ON c.project_id = p.id AND c.status = 'active' WHERE c.id IS NULL",
        "A project is missing its first canvas",
    )

    with op.batch_alter_table("canvas_nodes") as batch_op:
        batch_op.add_column(sa.Column("canvas_id", sa.String(36), nullable=True, comment="Owning canvas ID"))
        batch_op.add_column(sa.Column("z_index", sa.Integer(), nullable=False, server_default=sa.text("0"), comment="Canvas stacking order"))
        batch_op.add_column(sa.Column("parent_node_id", sa.String(36), nullable=True, comment="Optional parent group node ID"))
        batch_op.add_column(sa.Column("is_locked", sa.Boolean(), nullable=False, server_default=sa.text("0"), comment="Whether editing is locked"))
        batch_op.add_column(sa.Column("is_collapsed", sa.Boolean(), nullable=False, server_default=sa.text("0"), comment="Whether a group node is collapsed"))

    op.add_column("canvas_connections", sa.Column("canvas_id", sa.String(36), nullable=True, comment="Owning canvas ID"))
    op.get_bind().execute(
        sa.text(
            "UPDATE canvas_nodes n JOIN canvases c ON c.project_id = n.project_id AND c.sort_order = 0 SET n.canvas_id = c.id"
        )
    )
    op.get_bind().execute(
        sa.text(
            "UPDATE canvas_connections e JOIN canvases c ON c.project_id = e.project_id AND c.sort_order = 0 SET e.canvas_id = c.id"
        )
    )
    _assert_zero("SELECT COUNT(*) FROM canvas_nodes WHERE canvas_id IS NULL", "Canvas node backfill left null rows")
    _assert_zero("SELECT COUNT(*) FROM canvas_connections WHERE canvas_id IS NULL", "Canvas connection backfill left null rows")
    _assert_zero(
        """
        SELECT COUNT(*)
        FROM canvas_connections e
        JOIN canvas_nodes s ON s.id = e.source_node_id
        JOIN canvas_nodes t ON t.id = e.target_node_id
        WHERE e.project_id <> s.project_id
           OR e.project_id <> t.project_id
           OR s.canvas_id <> t.canvas_id
           OR e.canvas_id <> s.canvas_id
        """,
        "Cross-scope connections block multi-canvas constraints",
    )

    op.alter_column("canvas_nodes", "canvas_id", existing_type=sa.String(36), nullable=False, existing_comment="Owning canvas ID")
    op.alter_column("canvas_connections", "canvas_id", existing_type=sa.String(36), nullable=False, existing_comment="Owning canvas ID")
    _drop_column_foreign_keys("canvas_nodes", ("project_id",))
    _drop_column_foreign_keys("canvas_connections", ("project_id", "source_node_id", "target_node_id"))
    op.drop_constraint("uq_canvas_connections_edge", "canvas_connections", type_="unique")

    op.create_unique_constraint("uq_canvas_nodes_canvas_id_id", "canvas_nodes", ["canvas_id", "id"])
    op.create_foreign_key(
        "fk_canvas_nodes_project_canvas",
        "canvas_nodes",
        "canvases",
        ["project_id", "canvas_id"],
        ["project_id", "id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_canvas_nodes_parent",
        "canvas_nodes",
        "canvas_nodes",
        ["canvas_id", "parent_node_id"],
        ["canvas_id", "id"],
        ondelete="RESTRICT",
    )
    op.create_index("ix_canvas_nodes_canvas_status_z", "canvas_nodes", ["canvas_id", "status", "z_index"])
    op.create_index("ix_canvas_nodes_canvas_parent", "canvas_nodes", ["canvas_id", "parent_node_id"])

    op.create_unique_constraint(
        "uq_canvas_connections_edge",
        "canvas_connections",
        ["canvas_id", "source_node_id", "source_port", "target_node_id", "target_port"],
    )
    op.create_foreign_key(
        "fk_canvas_connections_project_canvas",
        "canvas_connections",
        "canvases",
        ["project_id", "canvas_id"],
        ["project_id", "id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_canvas_connections_source",
        "canvas_connections",
        "canvas_nodes",
        ["canvas_id", "source_node_id"],
        ["canvas_id", "id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_canvas_connections_target",
        "canvas_connections",
        "canvas_nodes",
        ["canvas_id", "target_node_id"],
        ["canvas_id", "id"],
        ondelete="CASCADE",
    )

    op.create_table(
        "canvas_revisions",
        sa.Column("id", sa.String(36), primary_key=True, comment="Canvas revision unique identifier"),
        sa.Column("canvas_id", sa.String(36), nullable=False, comment="Owning canvas ID"),
        sa.Column("revision_no", mysql.BIGINT(unsigned=True), nullable=False, comment="Committed revision number"),
        sa.Column("base_revision", mysql.BIGINT(unsigned=True), nullable=False, comment="Client base revision number"),
        sa.Column("client_mutation_id", sa.String(64), nullable=False, comment="Client idempotency key"),
        sa.Column("request_fingerprint", sa.String(64), nullable=False, comment="Canonical request SHA-256 fingerprint"),
        sa.Column("operations", sa.JSON(), nullable=False, comment="Normalized graph command batch"),
        sa.Column("checkpoint_snapshot", sa.JSON(), nullable=True, comment="Optional full graph checkpoint"),
        sa.Column("created_by_user_id", sa.String(36), nullable=False, comment="User that committed the revision"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, comment="Created time"),
        sa.ForeignKeyConstraint(["canvas_id"], ["canvases.id"], ondelete="CASCADE", name="fk_canvas_revisions_canvas"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="RESTRICT", name="fk_canvas_revisions_user"),
        sa.UniqueConstraint("canvas_id", "revision_no", name="uq_canvas_revisions_revision"),
        sa.UniqueConstraint("canvas_id", "client_mutation_id", name="uq_canvas_revisions_mutation"),
        comment="Durable canvas graph revision table",
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
        **table_kwargs,
    )
    op.create_index("ix_canvas_revisions_canvas_created", "canvas_revisions", ["canvas_id", "created_at"])


def downgrade() -> None:
    _require_mysql()
    multiple_canvas_projects = op.get_bind().execute(
        sa.text("SELECT COUNT(*) FROM (SELECT project_id FROM canvases GROUP BY project_id HAVING COUNT(*) > 1) multiple")
    ).scalar_one()
    if multiple_canvas_projects:
        raise RuntimeError("Automatic downgrade is prohibited after a project owns multiple canvases")

    op.drop_index("ix_canvas_revisions_canvas_created", table_name="canvas_revisions")
    op.drop_table("canvas_revisions")
    for constraint_name in (
        "fk_canvas_connections_target",
        "fk_canvas_connections_source",
        "fk_canvas_connections_project_canvas",
    ):
        op.drop_constraint(constraint_name, "canvas_connections", type_="foreignkey")
    op.drop_constraint("uq_canvas_connections_edge", "canvas_connections", type_="unique")
    op.create_foreign_key(None, "canvas_connections", "projects", ["project_id"], ["id"], ondelete="CASCADE")
    op.create_foreign_key(None, "canvas_connections", "canvas_nodes", ["source_node_id"], ["id"], ondelete="CASCADE")
    op.create_foreign_key(None, "canvas_connections", "canvas_nodes", ["target_node_id"], ["id"], ondelete="CASCADE")
    op.create_unique_constraint(
        "uq_canvas_connections_edge",
        "canvas_connections",
        ["project_id", "source_node_id", "source_port", "target_node_id", "target_port"],
    )
    op.drop_column("canvas_connections", "canvas_id")

    op.drop_index("ix_canvas_nodes_canvas_parent", table_name="canvas_nodes")
    op.drop_index("ix_canvas_nodes_canvas_status_z", table_name="canvas_nodes")
    op.drop_constraint("fk_canvas_nodes_parent", "canvas_nodes", type_="foreignkey")
    op.drop_constraint("fk_canvas_nodes_project_canvas", "canvas_nodes", type_="foreignkey")
    op.drop_constraint("uq_canvas_nodes_canvas_id_id", "canvas_nodes", type_="unique")
    op.create_foreign_key(None, "canvas_nodes", "projects", ["project_id"], ["id"])
    for column_name in ("is_collapsed", "is_locked", "parent_node_id", "z_index", "canvas_id"):
        op.drop_column("canvas_nodes", column_name)

    op.drop_index("ix_canvases_project_status_order", table_name="canvases")
    op.drop_table("canvases")
    op.drop_column("projects", "canvas_order_revision")
