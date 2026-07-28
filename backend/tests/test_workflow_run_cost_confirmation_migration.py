from __future__ import annotations

import unittest

from sqlalchemy import inspect

from models.base import init_engine
from tests.mysql_test_database import MySQLTestDatabase


PARENT_REVISION = "e0f1a2b3c4d5"
CURRENT_HEAD_REVISION = "g2b3c4d5e6f7"


class WorkflowRunCostConfirmationMigrationTests(unittest.TestCase):
    def test_guarded_mysql_upgrade_adds_commented_exact_confirmation_fact(self) -> None:
        database = MySQLTestDatabase(
            "revid_test_workflow_run_cost_confirmation_migration",
            revision=PARENT_REVISION,
        )
        database.start()
        self.addCleanup(database.stop)

        database.upgrade_to_head()

        columns = {
            column["name"]: column
            for column in inspect(init_engine()).get_columns("workflow_runs")
        }
        cost_confirmed = columns["cost_confirmed"]
        self.assertFalse(cost_confirmed["nullable"])
        self.assertTrue(cost_confirmed["comment"])
        self.assertIsNone(cost_confirmed["default"])
        restart = database.restart_runtime()
        self.assertTrue(restart["match"])
        self.assertEqual(CURRENT_HEAD_REVISION, restart["head"])
        self.assertEqual(CURRENT_HEAD_REVISION, restart["current"])


if __name__ == "__main__":
    unittest.main()
