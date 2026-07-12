"""Focused pure-mock tests for the MySQL-only health contract."""
from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

sys.path.insert(0, str(Path(__file__).parent.parent.resolve()))


class TestHealthEndpoint(unittest.TestCase):
    def test_health_without_engine_is_not_ready(self) -> None:
        from api.health import health_check

        with patch("models.base._engine", None):
            result = health_check()

        self.assertEqual("error", result["status"])
        self.assertEqual("none", result["database"]["dialect"])
        self.assertFalse(result["database"]["connected"])
        self.assertFalse(result["database"]["ready"])

    def test_health_rejects_non_mysql_engine_without_connecting(self) -> None:
        from api.health import health_check

        engine = MagicMock()
        engine.dialect.name = "sqlite"

        with patch("models.base._engine", engine):
            result = health_check()

        self.assertEqual("wrong_dialect", result["status"])
        self.assertFalse(result["database"]["ready"])
        self.assertFalse(result["database"]["alembic_match"])
        engine.connect.assert_not_called()

    def test_health_reports_failed_connection_without_error_details(self) -> None:
        from api.health import health_check

        engine = MagicMock()
        engine.dialect.name = "mysql"
        engine.connect.side_effect = RuntimeError("private connection detail")

        with patch("models.base._engine", engine):
            result = health_check()

        self.assertEqual("error", result["status"])
        self.assertFalse(result["database"]["connected"])
        self.assertFalse(result["database"]["ready"])
        self.assertNotIn("private connection detail", str(result))

    def test_health_reports_mysql_ready_only_when_revisions_match(self) -> None:
        from api.health import health_check

        engine = MagicMock()
        engine.dialect.name = "mysql"
        connection = engine.connect.return_value.__enter__.return_value
        revision_result = MagicMock()
        revision_result.fetchone.return_value = ("revision-a",)
        connection.execute.side_effect = [MagicMock(), revision_result]

        with (
            patch("models.base._engine", engine),
            patch("database.get_alembic_head_revision", return_value="revision-a"),
        ):
            result = health_check()

        self.assertEqual("ok", result["status"])
        self.assertTrue(result["database"]["connected"])
        self.assertTrue(result["database"]["ready"])
        self.assertTrue(result["database"]["alembic_match"])

    def test_health_reports_revision_mismatch_as_not_ready(self) -> None:
        from api.health import health_check

        engine = MagicMock()
        engine.dialect.name = "mysql"
        connection = engine.connect.return_value.__enter__.return_value
        revision_result = MagicMock()
        revision_result.fetchone.return_value = ("revision-old",)
        connection.execute.side_effect = [MagicMock(), revision_result]

        with (
            patch("models.base._engine", engine),
            patch("database.get_alembic_head_revision", return_value="revision-head"),
        ):
            result = health_check()

        self.assertEqual("schema_mismatch", result["status"])
        self.assertTrue(result["database"]["connected"])
        self.assertFalse(result["database"]["ready"])
        self.assertFalse(result["database"]["alembic_match"])


if __name__ == "__main__":
    unittest.main()
