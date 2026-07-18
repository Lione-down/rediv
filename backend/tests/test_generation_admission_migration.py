from __future__ import annotations

import unittest

from sqlalchemy import inspect, text

from models.base import init_engine
from tests.mysql_test_database import MySQLTestDatabase


class GenerationAdmissionMigrationTests(unittest.TestCase):
    def test_upgrade_adds_commented_idempotency_fields_unique_scope_and_singleton_guard(self):
        database = MySQLTestDatabase(
            "revid_test_generation_admission_migration",
            revision="f2a3b4c5d6e7",
        )
        database.start()
        self.addCleanup(database.stop)
        database.upgrade_to_head()
        engine = init_engine()
        inspector = inspect(engine)
        task_columns = {column["name"]: column for column in inspector.get_columns("generation_tasks")}
        self.assertTrue(task_columns["client_request_id"].get("comment"))
        self.assertTrue(task_columns["request_fingerprint"].get("comment"))
        unique_constraints = inspector.get_unique_constraints("generation_tasks")
        self.assertIn(
            ["user_id", "client_request_id"],
            [constraint["column_names"] for constraint in unique_constraints],
        )
        guard_columns = inspector.get_columns("agnes_admission_guard")
        self.assertEqual({"id", "updated_at"}, {column["name"] for column in guard_columns})
        self.assertTrue(all(column.get("comment") for column in guard_columns))
        with engine.connect() as connection:
            guard_ids = list(connection.execute(text("SELECT id FROM agnes_admission_guard" )).scalars())
        self.assertEqual([1], guard_ids)
