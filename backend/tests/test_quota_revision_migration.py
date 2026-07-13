from __future__ import annotations

import sys
import unittest
from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import inspect, text

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from controllers.store import DatabaseStore
from models.base import init_engine
from tests.mysql_test_database import MySQLTestDatabase


class QuotaRevisionMigrationTestCase(unittest.TestCase):
    def test_upgrade_backfills_revision_and_atomic_grant_increments_it(self) -> None:
        database = MySQLTestDatabase(
            "revid_test_quota_revision_migration",
            revision="b8c9d0e1f2a3",
        )
        database.start()
        self.addCleanup(database.stop)
        engine = init_engine()
        self.assertNotIn("revision", {column["name"] for column in inspect(engine).get_columns("quotas")})
        timestamp = datetime.now(UTC).replace(tzinfo=None)
        with engine.begin() as connection:
            connection.execute(
                text(
                    "INSERT INTO users "
                    "(id, nickname, avatar_url, role, status, generation_status, created_at, updated_at, last_login_at) "
                    "VALUES (:id, :nickname, '', 'user', 'active', 'enabled', :created_at, :updated_at, :last_login_at)"
                ),
                {
                    "id": "quota-revision-user",
                    "nickname": "Quota Revision User",
                    "created_at": timestamp,
                    "updated_at": timestamp,
                    "last_login_at": timestamp,
                },
            )
            connection.execute(
                text(
                    "INSERT INTO quotas (id, user_id, text_quota, image_quota, video_quota) "
                    "VALUES ('quota-revision-row', 'quota-revision-user', 2, 3, 4)"
                )
            )

        database.upgrade_to_head()
        engine = init_engine()
        columns = {column["name"]: column for column in inspect(engine).get_columns("quotas")}
        self.assertIn("revision", columns)
        self.assertFalse(columns["revision"]["nullable"])
        self.assertEqual("Monotonic quota balance revision", columns["revision"]["comment"])
        ledger_columns = {
            column["name"]: column for column in inspect(engine).get_columns("quota_ledger")
        }
        self.assertEqual(6, ledger_columns["created_at"]["type"].fsp)
        with engine.connect() as connection:
            revision = connection.execute(
                text("SELECT revision FROM quotas WHERE user_id = 'quota-revision-user'")
            ).scalar_one()
        self.assertEqual(0, revision)

        store = DatabaseStore()
        store.grant_quota("quota-revision-user", "image", 1, "admin_grant", None)
        with engine.connect() as connection:
            snapshot = connection.execute(
                text(
                    "SELECT image_quota, revision FROM quotas "
                    "WHERE user_id = 'quota-revision-user'"
                )
            ).one()
        self.assertEqual((4, 1), tuple(snapshot))


if __name__ == "__main__":
    unittest.main()
