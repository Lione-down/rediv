from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from sqlalchemy import inspect

from models.base import init_engine
from tests.mysql_test_database import MySQLTestDatabase


PARENT_REVISION = "c8d9e0f1a2b3"
ASSET_ITEM_REVISION = "d9e0f1a2b3c4"
CURRENT_HEAD_REVISION = "g2b3c4d5e6f7"
TABLE_NAME = "workflow_template_asset_binding_items"


def _load_revision_module():
    migration_path = (
        Path(__file__).resolve().parents[1]
        / "migrations"
        / "versions"
        / f"{ASSET_ITEM_REVISION}_add_workflow_template_asset_binding_items.py"
    )
    spec = importlib.util.spec_from_file_location(
        "workflow_template_asset_binding_items_migration",
        migration_path,
    )
    if spec is None or spec.loader is None:
        raise RuntimeError("Unable to load asset-binding-item migration")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class WorkflowTemplateAssetBindingMigrationTests(unittest.TestCase):
    def test_revision_is_additive_mysql_only_and_downgrade_guarded(self) -> None:
        migration = _load_revision_module()

        self.assertEqual(ASSET_ITEM_REVISION, migration.revision)
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
            "revid_test_workflow_template_asset_binding_migration",
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
                "uq_workflow_template_asset_binding_items_position",
                "uq_workflow_template_asset_binding_items_asset",
            },
            {
                item["name"]
                for item in inspector.get_unique_constraints(TABLE_NAME)
            },
        )
        self.assertEqual(
            {
                "ck_workflow_template_asset_binding_items_position",
                "ck_workflow_template_asset_binding_items_revision",
            },
            {
                item["name"]
                for item in inspector.get_check_constraints(TABLE_NAME)
            },
        )
        self.assertEqual(
            {
                "fk_workflow_template_asset_binding_items_binding",
                "fk_workflow_template_asset_binding_items_asset",
            },
            {
                item["name"]
                for item in inspector.get_foreign_keys(TABLE_NAME)
            },
        )
        restart = database.restart_runtime()
        self.assertTrue(restart["match"])
        self.assertEqual(CURRENT_HEAD_REVISION, restart["head"])
        self.assertEqual(CURRENT_HEAD_REVISION, restart["current"])


if __name__ == "__main__":
    unittest.main()
