from __future__ import annotations

import sys
import unittest
from datetime import UTC, datetime
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect, text

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from models.base import dispose_engine, init_engine
from tests.mysql_test_database import MySQLTestDatabase


class GenerationTaskProgressMigrationTestCase(unittest.TestCase):
    def test_upgrade_adds_nullable_commented_progress_fields_and_checks(self) -> None:
        database = MySQLTestDatabase(
            "revid_test_generation_task_progress_migration",
            revision="d0e1f2a3b4c5",
        )
        database.start()
        self.addCleanup(database.stop)
        engine = init_engine()
        timestamp = datetime.now(UTC).replace(tzinfo=None)
        with engine.begin() as connection:
            connection.execute(
                text(
                    "INSERT INTO users "
                    "(id, nickname, avatar_url, role, status, generation_status, created_at, updated_at, last_login_at) "
                    "VALUES ('progress-migration-user', 'Progress Migration', '', 'user', 'active', "
                    "'enabled', :created_at, :updated_at, :last_login_at)"
                ),
                {
                    "created_at": timestamp,
                    "updated_at": timestamp,
                    "last_login_at": timestamp,
                },
            )
            connection.execute(
                text(
                    "INSERT INTO generation_tasks "
                    "(id, user_id, media_type, provider, model, status, created_at, updated_at) "
                    "VALUES ('legacy-progress-task', 'progress-migration-user', 'image', 'agnes', "
                    "'agnes-image-2.1-flash', 'succeeded', :created_at, :updated_at)"
                ),
                {"created_at": timestamp, "updated_at": timestamp},
            )

        database.upgrade_to_head()
        engine = init_engine()
        inspector = inspect(engine)
        columns = {column["name"]: column for column in inspector.get_columns("generation_tasks")}
        self.assertTrue(columns["progress_percent"]["nullable"])
        self.assertEqual("Last valid provider progress percentage", columns["progress_percent"]["comment"])
        self.assertTrue(columns["progress_stage"]["nullable"])
        self.assertEqual("Durable progress stage: queued/provider/persisting", columns["progress_stage"]["comment"])

        checks = {constraint["name"]: constraint["sqltext"] for constraint in inspector.get_check_constraints("generation_tasks")}
        self.assertIn("ck_generation_tasks_progress_percent", checks)
        self.assertIn("ck_generation_tasks_progress_stage", checks)
        with engine.begin() as connection:
            legacy_progress = connection.execute(
                text(
                    "SELECT progress_percent, progress_stage FROM generation_tasks "
                    "WHERE id = 'legacy-progress-task'"
                )
            ).one()
            self.assertEqual((None, None), tuple(legacy_progress))
            with self.assertRaises(Exception):
                connection.execute(
                    text(
                        "UPDATE generation_tasks SET progress_percent = 101 "
                        "WHERE id = 'legacy-progress-task'"
                    )
                )

        dispose_engine()
        backend_dir = Path(__file__).resolve().parents[1]
        config = Config(str(backend_dir / "alembic.ini"))
        config.set_main_option("script_location", str((backend_dir / "migrations").resolve()))
        command.downgrade(config, "d0e1f2a3b4c5")
        downgraded_columns = {
            column["name"] for column in inspect(init_engine()).get_columns("generation_tasks")
        }
        self.assertNotIn("progress_percent", downgraded_columns)
        self.assertNotIn("progress_stage", downgraded_columns)


if __name__ == "__main__":
    unittest.main()
