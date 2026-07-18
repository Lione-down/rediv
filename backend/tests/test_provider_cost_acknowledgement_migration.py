from __future__ import annotations

import unittest

from sqlalchemy import inspect, text

from models.base import init_engine
from tests.mysql_test_database import MySQLTestDatabase


def _force_legacy_users_collation(engine) -> str:
    with engine.begin() as connection:
        server_default = connection.execute(
            text("SELECT @@default_collation_for_utf8mb4")
        ).scalar_one()
        legacy_collation = (
            "utf8mb4_unicode_ci"
            if server_default != "utf8mb4_unicode_ci"
            else "utf8mb4_general_ci"
        )
        referencing_foreign_keys = connection.execute(
            text(
                """
                SELECT TABLE_NAME, CONSTRAINT_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                WHERE REFERENCED_TABLE_SCHEMA = DATABASE()
                  AND REFERENCED_TABLE_NAME = 'users'
                  AND REFERENCED_COLUMN_NAME = 'id'
                """
            )
        ).all()
        quote = connection.dialect.identifier_preparer.quote
        for table_name, constraint_name in referencing_foreign_keys:
            connection.exec_driver_sql(
                f"ALTER TABLE {quote(table_name)} "
                f"DROP FOREIGN KEY {quote(constraint_name)}"
            )
        connection.exec_driver_sql(
            "ALTER TABLE `users` CONVERT TO CHARACTER SET utf8mb4 "
            f"COLLATE {legacy_collation}"
        )
    return legacy_collation


class ProviderCostAcknowledgementMigrationTests(unittest.TestCase):
    def test_upgrade_adds_commented_user_provider_isolated_table(self):
        database = MySQLTestDatabase(
            "revid_test_provider_cost_acknowledgement_migration",
            revision="e1f2a3b4c5d6",
        )
        database.start()
        self.addCleanup(database.stop)
        legacy_collation = _force_legacy_users_collation(init_engine())
        database.upgrade_to_head()
        engine = init_engine()
        inspector = inspect(engine)
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
        with engine.connect() as connection:
            collations = dict(
                connection.execute(
                    text(
                        """
                        SELECT CONCAT(TABLE_NAME, '.', COLUMN_NAME), COLLATION_NAME
                        FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_SCHEMA = DATABASE()
                          AND (TABLE_NAME, COLUMN_NAME) IN (
                              ('users', 'id'),
                              ('provider_cost_acknowledgements', 'user_id')
                          )
                        """
                    )
                ).all()
            )
        self.assertEqual(legacy_collation, collations["users.id"])
        self.assertEqual(collations["users.id"], collations["provider_cost_acknowledgements.user_id"])
