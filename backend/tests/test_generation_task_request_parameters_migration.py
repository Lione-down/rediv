from __future__ import annotations

import json
import sys
import unittest
from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import inspect, text

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from models.base import init_engine
from tests.mysql_test_database import MySQLTestDatabase


class GenerationTaskRequestParametersMigrationTestCase(unittest.TestCase):
    def test_upgrade_adds_nullable_commented_json_and_preserves_legacy_rows(self) -> None:
        database = MySQLTestDatabase(
            "revid_test_generation_task_request_parameters_migration",
            revision="c9d0e1f2a3b4",
        )
        database.start()
        self.addCleanup(database.stop)
        engine = init_engine()
        self.assertNotIn(
            "request_parameters",
            {column["name"] for column in inspect(engine).get_columns("generation_tasks")},
        )
        timestamp = datetime.now(UTC).replace(tzinfo=None)
        with engine.begin() as connection:
            connection.execute(
                text(
                    "INSERT INTO users "
                    "(id, nickname, avatar_url, role, status, generation_status, created_at, updated_at, last_login_at) "
                    "VALUES ('generation-parameters-user', 'Generation Parameters', '', 'user', 'active', "
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
                    "VALUES ('legacy-generation-task', 'generation-parameters-user', 'image', 'agnes', "
                    "'agnes-image-2.1-flash', 'succeeded', :created_at, :updated_at)"
                ),
                {"created_at": timestamp, "updated_at": timestamp},
            )

        database.upgrade_to_head()
        engine = init_engine()
        columns = {
            column["name"]: column
            for column in inspect(engine).get_columns("generation_tasks")
        }
        request_parameters = columns["request_parameters"]
        self.assertTrue(request_parameters["nullable"])
        self.assertEqual("Immutable sanitized generation request parameters", request_parameters["comment"])
        self.assertEqual("JSON", str(request_parameters["type"]).upper())

        snapshot = {
            "contract_version": 1,
            "media_type": "video",
            "reference_mode": "keyframes",
            "duration_seconds": 10,
            "num_frames": 241,
            "frame_rate": 24,
            "image_ids": ["asset-a", "asset-b"],
        }
        with engine.begin() as connection:
            legacy_value = connection.execute(
                text(
                    "SELECT request_parameters FROM generation_tasks "
                    "WHERE id = 'legacy-generation-task'"
                )
            ).scalar_one()
            self.assertIsNone(legacy_value)
            connection.execute(
                text(
                    "UPDATE generation_tasks SET request_parameters = :snapshot "
                    "WHERE id = 'legacy-generation-task'"
                ),
                {"snapshot": json.dumps(snapshot)},
            )
            stored = connection.execute(
                text(
                    "SELECT JSON_UNQUOTE(JSON_EXTRACT(request_parameters, '$.reference_mode')), "
                    "CAST(JSON_UNQUOTE(JSON_EXTRACT(request_parameters, '$.num_frames')) AS UNSIGNED) "
                    "FROM generation_tasks WHERE id = 'legacy-generation-task'"
                )
            ).one()
        self.assertEqual(("keyframes", 241), tuple(stored))


if __name__ == "__main__":
    unittest.main()
