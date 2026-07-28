from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from sqlalchemy import inspect

from models.base import init_engine
from tests.mysql_test_database import MySQLTestDatabase


PARENT_REVISION = "d9e0f1a2b3c4"
INSTANCE_COMMIT_REVISION = "e0f1a2b3c4d5"
TABLE_NAME = "workflow_template_instance_commits"


def _load_revision_module():
    migration_path = (
        Path(__file__).resolve().parents[1]
        / "migrations"
        / "versions"
        / f"{INSTANCE_COMMIT_REVISION}_add_workflow_template_instance_commits.py"
    )
    spec = importlib.util.spec_from_file_location(
        "workflow_template_instance_commit_migration",
        migration_path,
    )
    if spec is None or spec.loader is None:
        raise RuntimeError("Unable to load instance-commit migration")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class WorkflowTemplateInstanceCommitMigrationTests(unittest.TestCase):
    def test_revision_is_additive_mysql_only_and_downgrade_guarded(self) -> None:
        migration = _load_revision_module()

        self.assertEqual(INSTANCE_COMMIT_REVISION, migration.revision)
        self.assertEqual(PARENT_REVISION, migration.down_revision)
        with patch.object(
            migration.op,
            "get_bind",
            return_value=SimpleNamespace(dialect=SimpleNamespace(name="sqlite")),
        ):
            with self.assertRaisesRegex(RuntimeError, "require MySQL"):
                migration._require_mysql()

        result = SimpleNamespace(scalar_one=lambda: "revid_db")
        binding = SimpleNamespace(
            dialect=SimpleNamespace(name="mysql"),
            execute=lambda _query: result,
        )
        with patch.object(migration.op, "get_bind", return_value=binding):
            with self.assertRaisesRegex(RuntimeError, "revid_test_"):
                migration._require_disposable_database()

    def test_guarded_mysql_upgrade_has_comments_constraints_and_one_head(self) -> None:
        database = MySQLTestDatabase(
            "revid_test_workflow_template_instance_commit_migration",
            revision=PARENT_REVISION,
        )
        database.start()
        self.addCleanup(database.stop)

        database.upgrade_to_head()

        inspector = inspect(init_engine())
        self.assertIn(TABLE_NAME, inspector.get_table_names())
        self.assertTrue(inspector.get_table_comment(TABLE_NAME)["text"])
        self.assertTrue(
            all(column.get("comment") for column in inspector.get_columns(TABLE_NAME))
        )
        self.assertEqual(
            {
                "ck_workflow_template_instance_commits_fingerprint",
                "ck_workflow_template_instance_commits_revision",
            },
            {
                item["name"]
                for item in inspector.get_check_constraints(TABLE_NAME)
            },
        )
        self.assertEqual(
            {"fk_workflow_template_instance_commits_instance"},
            {
                item["name"]
                for item in inspector.get_foreign_keys(TABLE_NAME)
            },
        )
        restart = database.restart_runtime()
        self.assertTrue(restart["match"])
        self.assertEqual(INSTANCE_COMMIT_REVISION, restart["head"])
        self.assertEqual(INSTANCE_COMMIT_REVISION, restart["current"])


if __name__ == "__main__":
    unittest.main()
