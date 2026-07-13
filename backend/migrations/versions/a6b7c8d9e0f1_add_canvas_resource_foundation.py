"""add canvas resource foundation

Revision ID: a6b7c8d9e0f1
Revises: f0a1b2c3d4e5
Create Date: 2026-07-13

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import mysql


revision: str = "a6b7c8d9e0f1"
down_revision: Union[str, Sequence[str], None] = "f0a1b2c3d4e5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _require_mysql() -> None:
    if op.get_bind().dialect.name != "mysql":
        raise RuntimeError("The canvas resource migration requires MySQL")


def _assert_zero(query: str, message: str) -> None:
    count = op.get_bind().execute(sa.text(query)).scalar_one()
    if count:
        raise RuntimeError(f"{message}: {count}")


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


def _validate_legacy_rows() -> None:
    _assert_zero(
        """
        SELECT COUNT(*)
        FROM assets a
        LEFT JOIN projects p ON p.id = a.project_id
        WHERE a.project_id IS NOT NULL
          AND (p.id IS NULL OR p.user_id <> a.user_id)
        """,
        "Legacy assets contain missing or cross-owner projects",
    )
    _assert_zero(
        """
        SELECT COUNT(*)
        FROM assets a
        LEFT JOIN canvas_nodes n ON n.id = a.canvas_node_id
        LEFT JOIN projects p ON p.id = n.project_id
        WHERE a.canvas_node_id IS NOT NULL
          AND (
            n.id IS NULL OR p.user_id <> a.user_id
            OR (a.project_id IS NOT NULL AND a.project_id <> n.project_id)
          )
        """,
        "Legacy assets contain orphan or cross-scope node links",
    )
    _assert_zero(
        """
        SELECT COUNT(*)
        FROM generation_tasks t
        LEFT JOIN projects p ON p.id = t.project_id
        WHERE t.project_id IS NOT NULL
          AND (p.id IS NULL OR p.user_id <> t.user_id)
        """,
        "Legacy generation tasks contain missing or cross-owner projects",
    )
    _assert_zero(
        """
        SELECT COUNT(*)
        FROM generation_tasks t
        LEFT JOIN canvas_nodes n ON n.id = t.canvas_node_id
        LEFT JOIN projects p ON p.id = n.project_id
        WHERE t.canvas_node_id IS NOT NULL
          AND (
            n.id IS NULL OR p.user_id <> t.user_id
            OR (t.project_id IS NOT NULL AND t.project_id <> n.project_id)
          )
        """,
        "Legacy generation tasks contain orphan or cross-scope node links",
    )
    _assert_zero(
        """
        SELECT COUNT(*)
        FROM generation_tasks t
        LEFT JOIN assets a ON a.id = t.result_asset_id
        WHERE t.result_asset_id IS NOT NULL
          AND (
            a.id IS NULL OR a.user_id <> t.user_id
            OR (t.project_id IS NOT NULL AND a.project_id IS NOT NULL AND t.project_id <> a.project_id)
          )
        """,
        "Legacy generation tasks contain orphan or cross-scope result assets",
    )
    _assert_zero(
        "SELECT COUNT(*) FROM templates WHERE JSON_TYPE(node_data) <> 'ARRAY'",
        "Legacy templates contain non-array node_data",
    )
    _assert_zero(
        """
        SELECT COUNT(*)
        FROM quota_ledger q
        LEFT JOIN generation_tasks t ON t.id = q.related_task_id
        WHERE q.related_task_id IS NOT NULL
          AND (CHAR_LENGTH(q.related_task_id) > 36 OR t.id IS NULL)
        """,
        "Quota ledger contains orphan generation task references",
    )


def upgrade() -> None:
    _require_mysql()
    _validate_legacy_rows()

    op.add_column(
        "assets",
        sa.Column(
            "origin_canvas_id",
            sa.String(36),
            nullable=True,
            comment="Origin canvas attribution for filtering",
        ),
    )
    op.add_column(
        "generation_tasks",
        sa.Column(
            "origin_canvas_id",
            sa.String(36),
            nullable=True,
            comment="Origin canvas attribution for filtering",
        ),
    )
    op.add_column(
        "templates",
        sa.Column(
            "schema_version",
            mysql.INTEGER(unsigned=True),
            nullable=True,
            comment="Template graph schema version",
        ),
    )
    op.add_column(
        "templates",
        sa.Column(
            "graph_data",
            sa.JSON(),
            nullable=True,
            comment="Versioned template graph with nodes and connections",
        ),
    )

    op.get_bind().execute(
        sa.text(
            """
            UPDATE assets a
            JOIN canvas_nodes n ON n.id = a.canvas_node_id
            SET a.project_id = COALESCE(a.project_id, n.project_id),
                a.origin_canvas_id = n.canvas_id
            WHERE a.canvas_node_id IS NOT NULL
            """
        )
    )
    op.get_bind().execute(
        sa.text(
            """
            UPDATE generation_tasks t
            JOIN canvas_nodes n ON n.id = t.canvas_node_id
            SET t.project_id = COALESCE(t.project_id, n.project_id),
                t.origin_canvas_id = n.canvas_id
            WHERE t.canvas_node_id IS NOT NULL
            """
        )
    )
    op.get_bind().execute(
        sa.text(
            """
            UPDATE templates
            SET schema_version = 1,
                graph_data = JSON_OBJECT(
                    'schema_version', 1,
                    'nodes', node_data,
                    'connections', JSON_ARRAY()
                )
            """
        )
    )

    _assert_zero(
        """
        SELECT COUNT(*)
        FROM assets a
        JOIN canvas_nodes n ON n.id = a.canvas_node_id
        WHERE a.project_id <> n.project_id OR a.origin_canvas_id <> n.canvas_id
        """,
        "Asset origin backfill is inconsistent",
    )
    _assert_zero(
        """
        SELECT COUNT(*)
        FROM generation_tasks t
        JOIN canvas_nodes n ON n.id = t.canvas_node_id
        WHERE t.project_id <> n.project_id OR t.origin_canvas_id <> n.canvas_id
        """,
        "Generation task origin backfill is inconsistent",
    )
    _assert_zero(
        """
        SELECT COUNT(*)
        FROM templates
        WHERE schema_version IS NULL
           OR graph_data IS NULL
           OR JSON_CONTAINS_PATH(graph_data, 'all', '$.schema_version', '$.nodes', '$.connections') <> 1
           OR JSON_TYPE(JSON_EXTRACT(graph_data, '$.nodes')) <> 'ARRAY'
           OR JSON_TYPE(JSON_EXTRACT(graph_data, '$.connections')) <> 'ARRAY'
        """,
        "Template graph backfill is incomplete",
    )

    op.alter_column(
        "templates",
        "schema_version",
        existing_type=mysql.INTEGER(unsigned=True),
        nullable=False,
        server_default=sa.text("1"),
        existing_comment="Template graph schema version",
    )
    op.alter_column(
        "templates",
        "graph_data",
        existing_type=sa.JSON(),
        nullable=False,
        existing_comment="Versioned template graph with nodes and connections",
    )
    op.alter_column(
        "quota_ledger",
        "related_task_id",
        existing_type=sa.String(255),
        type_=sa.String(36),
        existing_nullable=True,
        existing_comment="关联任务ID",
        comment="Related generation task ID",
    )

    op.create_index("ix_assets_origin_canvas_id", "assets", ["origin_canvas_id"])
    op.create_index("ix_assets_project_status_created", "assets", ["project_id", "status", "created_at"])
    op.create_foreign_key("fk_assets_project", "assets", "projects", ["project_id"], ["id"], ondelete="RESTRICT")
    op.create_foreign_key(
        "fk_assets_origin_canvas",
        "assets",
        "canvases",
        ["project_id", "origin_canvas_id"],
        ["project_id", "id"],
        ondelete="RESTRICT",
    )
    op.create_foreign_key(
        "fk_assets_canvas_node",
        "assets",
        "canvas_nodes",
        ["canvas_node_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_check_constraint(
        "ck_assets_origin_requires_project",
        "assets",
        "origin_canvas_id IS NULL OR project_id IS NOT NULL",
    )
    _drop_column_foreign_keys("generation_tasks", ("project_id", "canvas_node_id"))
    op.create_index("ix_generation_tasks_origin_canvas_id", "generation_tasks", ["origin_canvas_id"])
    op.create_index(
        "ix_generation_tasks_project_status_created",
        "generation_tasks",
        ["project_id", "status", "created_at"],
    )
    op.create_foreign_key(
        "fk_generation_tasks_project",
        "generation_tasks",
        "projects",
        ["project_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_foreign_key(
        "fk_generation_tasks_project_origin_canvas",
        "generation_tasks",
        "canvases",
        ["project_id", "origin_canvas_id"],
        ["project_id", "id"],
        ondelete="RESTRICT",
    )
    op.create_foreign_key(
        "fk_generation_tasks_origin_node",
        "generation_tasks",
        "canvas_nodes",
        ["origin_canvas_id", "canvas_node_id"],
        ["canvas_id", "id"],
        ondelete="RESTRICT",
    )
    op.create_check_constraint(
        "ck_generation_tasks_origin_scope",
        "generation_tasks",
        "(origin_canvas_id IS NULL OR project_id IS NOT NULL) "
        "AND (canvas_node_id IS NULL OR origin_canvas_id IS NOT NULL)",
    )

    op.create_check_constraint(
        "ck_templates_graph_schema_version",
        "templates",
        "schema_version >= 1",
    )
    op.create_check_constraint(
        "ck_templates_graph_data_shape",
        "templates",
        "JSON_CONTAINS_PATH(graph_data, 'all', '$.schema_version', '$.nodes', '$.connections') = 1 "
        "AND CAST(JSON_UNQUOTE(JSON_EXTRACT(graph_data, '$.schema_version')) AS UNSIGNED) = schema_version "
        "AND JSON_TYPE(JSON_EXTRACT(graph_data, '$.nodes')) = 'ARRAY' "
        "AND JSON_TYPE(JSON_EXTRACT(graph_data, '$.connections')) = 'ARRAY'",
    )
    op.create_index("ix_templates_user_created", "templates", ["user_id", "created_at"])

    op.create_index("ix_quota_ledger_related_task_id", "quota_ledger", ["related_task_id"])
    op.create_foreign_key(
        "fk_quota_ledger_generation_task",
        "quota_ledger",
        "generation_tasks",
        ["related_task_id"],
        ["id"],
        ondelete="RESTRICT",
    )


def downgrade() -> None:
    _require_mysql()
    blockers = op.get_bind().execute(
        sa.text(
            """
            SELECT
                (SELECT COUNT(*) FROM assets
                 WHERE origin_canvas_id IS NOT NULL AND canvas_node_id IS NULL)
              + (SELECT COUNT(*) FROM generation_tasks
                 WHERE origin_canvas_id IS NOT NULL AND canvas_node_id IS NULL)
              + (SELECT COUNT(*) FROM templates
                 WHERE schema_version <> 1
                    OR JSON_CONTAINS_PATH(graph_data, 'all', '$.schema_version', '$.nodes', '$.connections') <> 1
                    OR JSON_TYPE(JSON_EXTRACT(graph_data, '$.nodes')) <> 'ARRAY'
                    OR JSON_TYPE(JSON_EXTRACT(graph_data, '$.connections')) <> 'ARRAY'
                    OR JSON_LENGTH(JSON_EXTRACT(graph_data, '$.connections')) > 0)
            """
        )
    ).scalar_one()
    if blockers:
        raise RuntimeError(
            "Automatic downgrade is prohibited with retained resource origin or template graph connections"
        )

    _assert_zero(
        """
        SELECT COUNT(*)
        FROM assets a
        JOIN canvas_nodes n ON n.id = a.canvas_node_id
        WHERE a.origin_canvas_id IS NOT NULL AND a.origin_canvas_id <> n.canvas_id
        """,
        "Asset origin cannot be derived during downgrade",
    )
    op.get_bind().execute(
        sa.text(
            """
            UPDATE templates
            SET node_data = JSON_EXTRACT(graph_data, '$.nodes'),
                node_count = JSON_LENGTH(JSON_EXTRACT(graph_data, '$.nodes'))
            """
        )
    )

    op.drop_constraint("fk_quota_ledger_generation_task", "quota_ledger", type_="foreignkey")
    op.drop_index("ix_quota_ledger_related_task_id", table_name="quota_ledger")
    op.alter_column(
        "quota_ledger",
        "related_task_id",
        existing_type=sa.String(36),
        type_=sa.String(255),
        existing_nullable=True,
        existing_comment="Related generation task ID",
        comment="关联任务ID",
    )

    op.drop_index("ix_templates_user_created", table_name="templates")
    op.drop_constraint("ck_templates_graph_data_shape", "templates", type_="check")
    op.drop_constraint("ck_templates_graph_schema_version", "templates", type_="check")
    op.drop_column("templates", "graph_data")
    op.drop_column("templates", "schema_version")

    op.drop_constraint("fk_generation_tasks_origin_node", "generation_tasks", type_="foreignkey")
    op.drop_constraint("fk_generation_tasks_project_origin_canvas", "generation_tasks", type_="foreignkey")
    op.drop_constraint("fk_generation_tasks_project", "generation_tasks", type_="foreignkey")
    op.drop_constraint("ck_generation_tasks_origin_scope", "generation_tasks", type_="check")
    op.drop_index("ix_generation_tasks_project_status_created", table_name="generation_tasks")
    op.drop_index("ix_generation_tasks_origin_canvas_id", table_name="generation_tasks")
    op.create_foreign_key(
        "fk_generation_tasks_project_id_projects",
        "generation_tasks",
        "projects",
        ["project_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_generation_tasks_canvas_node",
        "generation_tasks",
        "canvas_nodes",
        ["canvas_node_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.drop_column("generation_tasks", "origin_canvas_id")

    op.drop_constraint("fk_assets_canvas_node", "assets", type_="foreignkey")
    op.drop_constraint("fk_assets_origin_canvas", "assets", type_="foreignkey")
    op.drop_constraint("fk_assets_project", "assets", type_="foreignkey")
    op.drop_constraint("ck_assets_origin_requires_project", "assets", type_="check")
    op.drop_index("ix_assets_project_status_created", table_name="assets")
    op.drop_index("ix_assets_origin_canvas_id", table_name="assets")
    op.drop_column("assets", "origin_canvas_id")
