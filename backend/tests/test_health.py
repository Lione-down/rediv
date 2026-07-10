"""Tests for the /health endpoint (T4-003)."""
from __future__ import annotations

import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import MagicMock, patch

# Ensure backend is on sys.path
sys.path.insert(0, str(Path(__file__).parent.parent.resolve()))


class TestHealthEndpointSQLite(unittest.TestCase):
    """Test /health when running in SQLite mode."""

    def setUp(self) -> None:
        from settings.config import settings

        self.temp_dir = TemporaryDirectory()
        self.db_path = str(Path(self.temp_dir.name) / "test-health.db")
        self.original_use_sqlite = settings.use_sqlite
        settings.use_sqlite = True

        # Import and init
        from database import init_db
        from controllers.store import DatabaseStore, configure_store

        init_db(self.db_path)
        store = DatabaseStore()
        configure_store(store)

    def tearDown(self) -> None:
        from settings.config import settings
        from database import close_db

        close_db()
        settings.use_sqlite = self.original_use_sqlite
        self.temp_dir.cleanup()

    def test_health_returns_ok_status(self) -> None:
        """Health endpoint should return status 'ok' in SQLite mode with valid schema."""
        from api.health import health_check

        result = health_check()

        self.assertIn("status", result)
        self.assertIn("database", result)
        self.assertEqual(result["status"], "ok")
        self.assertEqual(result["database"]["dialect"], "sqlite")
        self.assertTrue(result["database"]["connected"])
        self.assertTrue(result["database"]["ready"])

    def test_health_no_secrets_exposed(self) -> None:
        """Health output must not contain passwords or full URLs."""
        from api.health import health_check

        result = health_check()
        result_str = str(result)

        self.assertNotIn("password", result_str.lower().split("=")[0] if "=" in result_str else result_str)
        # Should not contain the actual db path in a way that exposes secrets
        self.assertNotIn("revid.db", result_str)


class TestHealthEndpointNoEngine(unittest.TestCase):
    """Test /health when no engine is initialized."""

    def test_health_with_no_engine(self) -> None:
        """When _engine is None, health should still return gracefully."""
        from models.base import _engine as current_engine

        # If engine is None, health should handle it
        if current_engine is None:
            from api.health import health_check

            result = health_check()
            self.assertIn("status", result)
            self.assertEqual(result["database"]["dialect"], "none")
            self.assertFalse(result["database"]["connected"])
            self.assertFalse(result["database"]["ready"])

    def test_health_reports_failed_connection_as_not_ready(self) -> None:
        from api.health import health_check

        engine = MagicMock()
        engine.dialect.name = "mysql"
        engine.connect.side_effect = RuntimeError("connection failed with secret")

        with patch("models.base._engine", engine):
            result = health_check()

        self.assertEqual("error", result["status"])
        self.assertFalse(result["database"]["connected"])
        self.assertFalse(result["database"]["ready"])
        self.assertNotIn("secret", str(result).lower())

    def test_health_reports_mysql_ready_when_revisions_match(self) -> None:
        from api.health import health_check

        engine = MagicMock()
        engine.dialect.name = "mysql"
        connection = engine.connect.return_value.__enter__.return_value
        revision_result = MagicMock()
        revision_result.fetchone.return_value = ("revision-a",)
        connection.execute.side_effect = [MagicMock(), revision_result]

        with (
            patch("models.base._engine", engine),
            patch("alembic.script.ScriptDirectory.from_config") as from_config,
        ):
            from_config.return_value.get_current_head.return_value = "revision-a"
            result = health_check()

        self.assertEqual("ok", result["status"])
        self.assertTrue(result["database"]["connected"])
        self.assertTrue(result["database"]["ready"])
        self.assertTrue(result["database"]["alembic_match"])


if __name__ == "__main__":
    unittest.main()
