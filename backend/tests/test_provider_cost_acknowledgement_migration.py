from __future__ import annotations

import unittest

from sqlalchemy import inspect

from models.base import init_engine
from tests.mysql_test_database import MySQLTestDatabase


class ProviderCostAcknowledgementMigrationTests(unittest.TestCase):
    def test_upgrade_adds_commented_user_provider_isolated_table(self):
        database = MySQLTestDatabase(
            "revid_test_provider_cost_acknowledgement_migration",
            revision="e1f2a3b4c5d6",
        )
        database.start()
        self.addCleanup(database.stop)
        database.upgrade_to_head()
        inspector = inspect(init_engine())
        columns = {column["name"]: column for column in inspector.get_columns("provider_cost_acknowledgements")}
        self.assertEqual(
            {"id", "user_id", "provider_id", "acknowledged_until", "cancelled_at", "created_at", "updated_at"},
            set(columns),
        )
        self.assertTrue(all(column.get("comment") for column in columns.values()))
        unique_constraints = inspector.get_unique_constraints("provider_cost_acknowledgements")
        self.assertIn(
            ["user_id", "provider_id"],
            [constraint["column_names"] for constraint in unique_constraints],
        )
