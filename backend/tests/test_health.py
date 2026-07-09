"""Tests for the /health endpoint (T4-003)."""
from __future__ import annotations

import os
import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

# Ensure backend is on sys.path
sys.path.insert(0, str(Path(__file__).parent.parent.resolve()))


class TestHealthEndpointSQLite(unittest.TestCase):
    """Test /health when running in SQLite mode."""

    def setUp(self) -> None:
        self.temp_dir = TemporaryDirectory()
        self.db_path = str(Path(self.temp_dir.name) / "test-health.db")

        # Set SQLite mode
        os.environ["REVID_USE_SQLITE"] = "true"

        # Clear cached modules
        mods_to_remove = [m for m in list(sys.modules.keys()) if m.startswith("settings.config")]
        for mod in mods_to_remove:
            del sys.modules[mod]

        from settings.config import get_settings
        get_settings.cache_clear()

        # Import and init
        from database import init_db
        from controllers.store import DatabaseStore, configure_store

        init_db(self.db_path)
        store = DatabaseStore()
        configure_store(store)

    def tearDown(self) -> None:
        from database import close_db
        close_db()
        self.temp_dir.cleanup()

        if "REVID_USE_SQLITE" in os.environ:
            del os.environ["REVID_USE_SQLITE"]

    def test_health_returns_ok_status(self) -> None:
        """Health endpoint should return status 'ok' in SQLite mode with valid schema."""
        from api.health import health_check

        result = health_check()

        self.assertIn("status", result)
        self.assertIn("database", result)
        self.assertEqual(result["status"], "ok")
        self.assertEqual(result["database"]["dialect"], "sqlite")
        self.assertTrue(result["database"]["connected"])

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


if __name__ == "__main__":
    unittest.main()
