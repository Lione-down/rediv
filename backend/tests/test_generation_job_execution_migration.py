from __future__ import annotations

import unittest
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect

from models.base import dispose_engine, init_engine
from tests.mysql_test_database import MySQLTestDatabase


class GenerationJobExecutionMigrationTests(unittest.TestCase):
    def test_upgrade_adds_commented_lease_version_cancel_and_retry_fields(self) -> None:
        database = MySQLTestDatabase(
            "revid_test_generation_job_execution_migration",
            revision="c5d6e7f8a9b0",
        )
        database.start()
        self.addCleanup(database.stop)

        database.upgrade_to_head()
        inspector = inspect(init_engine())
        columns = {
            column["name"]: column
            for column in inspector.get_columns("generation_tasks")
        }
        expected = {
            "job_version",
            "lease_owner",
            "lease_expires_at",
            "attempt_count",
            "retry_count",
            "cancel_requested_at",
        }
        self.assertTrue(expected.issubset(columns))
        self.assertTrue(all(columns[name].get("comment") for name in expected))
        self.assertFalse(columns["job_version"]["nullable"])
        self.assertFalse(columns["attempt_count"]["nullable"])
        self.assertFalse(columns["retry_count"]["nullable"])
        indexes = {
            index["name"]: index["column_names"]
            for index in inspector.get_indexes("generation_tasks")
        }
        self.assertEqual(
            ["status", "lease_expires_at"],
            indexes["ix_generation_tasks_status_lease"],
        )

        dispose_engine()
        backend_dir = Path(__file__).resolve().parents[1]
        config = Config(str(backend_dir / "alembic.ini"))
        config.set_main_option(
            "script_location",
            str((backend_dir / "migrations").resolve()),
        )
        command.downgrade(config, "c5d6e7f8a9b0")
        downgraded = {
            column["name"]
            for column in inspect(init_engine()).get_columns("generation_tasks")
        }
        self.assertTrue(expected.isdisjoint(downgraded))


if __name__ == "__main__":
    unittest.main()
