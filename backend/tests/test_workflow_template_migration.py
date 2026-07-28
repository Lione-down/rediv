from __future__ import annotations

import importlib.util
import unittest
from datetime import UTC, datetime
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from sqlalchemy import inspect, select

from models.base import get_session, init_engine
from models.template import Template
from models.user import User
from tests.mysql_test_database import MySQLTestDatabase


BASE_REVISION = "b7c8d9e0f1a2"
FOUNDATION_REVISION = "c8d9e0f1a2b3"
CURRENT_HEAD_REVISION = "g2b3c4d5e6f7"
FOUNDATION_TABLES = {
    "workflow_template_definitions",
    "workflow_template_versions",
    "workflow_template_slots",
    "workflow_template_instances",
    "workflow_template_bindings",
    "workflow_template_instance_steps",
    "workflow_runs",
    "workflow_run_steps",
    "workflow_template_instance_lifecycle_commits",
}


def _load_revision_module():
    migration_path = (
        Path(__file__).resolve().parents[1]
        / "migrations"
        / "versions"
        / f"{FOUNDATION_REVISION}_add_workflow_template_foundation.py"
    )
    spec = importlib.util.spec_from_file_location(
        "workflow_template_foundation_migration",
        migration_path,
    )
    if spec is None or spec.loader is None:
        raise RuntimeError("Unable to load workflow-template foundation migration")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class WorkflowTemplateMigrationTests(unittest.TestCase):
    def test_revision_descends_from_current_head_and_rejects_other_dialects(self) -> None:
        migration = _load_revision_module()

        self.assertEqual(FOUNDATION_REVISION, migration.revision)
        self.assertEqual(BASE_REVISION, migration.down_revision)
        with patch.object(
            migration.op,
            "get_bind",
            return_value=SimpleNamespace(dialect=SimpleNamespace(name="sqlite")),
        ):
            with self.assertRaisesRegex(RuntimeError, "requires MySQL"):
                migration._require_mysql()

    def test_destructive_downgrade_guard_allows_only_disposable_database(self) -> None:
        migration = _load_revision_module()
        result = SimpleNamespace(scalar_one=lambda: "revid_db")
        binding = SimpleNamespace(
            dialect=SimpleNamespace(name="mysql"),
            execute=lambda _query: result,
        )

        with patch.object(migration.op, "get_bind", return_value=binding):
            with self.assertRaisesRegex(RuntimeError, "revid_test_"):
                migration._require_disposable_database()

    def test_upgrade_is_commented_additive_and_preserves_legacy_rows(self) -> None:
        database = MySQLTestDatabase(
            "revid_test_workflow_template_migration",
            revision=BASE_REVISION,
        )
        database.start()
        self.addCleanup(database.stop)

        now = datetime.now(UTC)
        with get_session() as session:
            session.add(
                User(
                    id="legacy-template-owner",
                    username="legacy-template-owner",
                    email=None,
                    password_hash=None,
                    nickname="Legacy Template Owner",
                    avatar_url="",
                    role="user",
                    status="active",
                    generation_status="enabled",
                    created_at=now,
                    updated_at=now,
                    last_login_at=now,
                )
            )
            session.flush()
            session.add(
                Template(
                    id="legacy-template-row",
                    user_id="legacy-template-owner",
                    name="Legacy Graph Template",
                    node_data=[{"id": "legacy-node"}],
                    schema_version=1,
                    graph_data={
                        "schema_version": 1,
                        "nodes": [{"id": "legacy-node"}],
                        "connections": [],
                    },
                    node_count=1,
                    created_at=now,
                )
            )
            session.commit()
            before = session.execute(
                select(
                    Template.id,
                    Template.user_id,
                    Template.name,
                    Template.node_data,
                    Template.schema_version,
                    Template.graph_data,
                    Template.node_count,
                    Template.created_at,
                ).where(Template.id == "legacy-template-row")
            ).one()

        before_columns = {
            column["name"]
            for column in inspect(init_engine()).get_columns("templates")
        }
        database.upgrade_to_head()

        inspector = inspect(init_engine())
        self.assertTrue(FOUNDATION_TABLES.issubset(set(inspector.get_table_names())))
        for table_name in FOUNDATION_TABLES:
            self.assertTrue(inspector.get_table_comment(table_name)["text"])
            self.assertTrue(
                all(column.get("comment") for column in inspector.get_columns(table_name))
            )
        self.assertEqual(
            before_columns,
            {column["name"] for column in inspector.get_columns("templates")},
        )

        with get_session() as session:
            after = session.execute(
                select(
                    Template.id,
                    Template.user_id,
                    Template.name,
                    Template.node_data,
                    Template.schema_version,
                    Template.graph_data,
                    Template.node_count,
                    Template.created_at,
                ).where(Template.id == "legacy-template-row")
            ).one()
        self.assertEqual(before, after)

        restart = database.restart_runtime()
        self.assertTrue(restart["match"])
        self.assertEqual(CURRENT_HEAD_REVISION, restart["head"])
        self.assertEqual(CURRENT_HEAD_REVISION, restart["current"])


if __name__ == "__main__":
    unittest.main()
