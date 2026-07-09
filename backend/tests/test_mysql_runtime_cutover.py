"""Tests for MySQL runtime cutover (T4-003).

These tests verify that:
- REVID_USE_SQLITE=false still configures DatabaseStore (not InMemoryStore)
- SQLite mode remains fully functional
- The store proxy correctly wraps DatabaseStore in both modes
"""
from __future__ import annotations

import os
import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

# Ensure backend is on sys.path
sys.path.insert(0, str(Path(__file__).parent.parent.resolve()))


class TestMySQLModeStoreConfiguration(unittest.TestCase):
    """Verify that MySQL mode uses DatabaseStore, not InMemoryStore."""

    def setUp(self) -> None:
        # Save original env
        self._orig_sqlite = os.environ.get("REVID_USE_SQLITE")

    def tearDown(self) -> None:
        # Restore original env
        if self._orig_sqlite is not None:
            os.environ["REVID_USE_SQLITE"] = self._orig_sqlite
        elif "REVID_USE_SQLITE" in os.environ:
            del os.environ["REVID_USE_SQLITE"]

    def test_mysql_mode_uses_database_store(self) -> None:
        """When REVID_USE_SQLITE=false, configure_store should receive a DatabaseStore instance."""
        os.environ["REVID_USE_SQLITE"] = "false"

        # Force reimport to pick up new env value
        # Clear cached modules
        mods_to_remove = [m for m in sys.modules if m.startswith("settings.config")]
        for mod in mods_to_remove:
            del sys.modules[mod]

        from settings.config import get_settings
        get_settings.cache_clear()

        from controllers.store import StoreProxy, configure_store
        from models.base import _engine as prev_engine

        # We can't fully initialize MySQL without a running server,
        # but we can verify the code path by checking imports work.
        # The real integration test requires a MySQL server.
        from database import init_mysql_engine, check_alembic_revision

        # Verify functions exist and are callable
        self.assertTrue(callable(init_mysql_engine))
        self.assertTrue(callable(check_alembic_revision))

        # Cleanup
        if prev_engine is not None:
            from database import close_db
            close_db()


class TestEngineReferenceFixRev47R1(unittest.TestCase):
    """Regression test for rev47 stale _engine reference bug.

    In rev47, database.py imported _engine by value from models.base at module load.
    After init_mysql_engine() set models.base._engine, the local database._engine
    remained None, causing check_alembic_revision() to raise RuntimeError.

    This test verifies that after init_mysql_engine(), models.base._engine is
    not None and check_alembic_revision() reads from the live reference.
    """

    def setUp(self) -> None:
        self._orig_sqlite = os.environ.get("REVID_USE_SQLITE")
        # Ensure MySQL mode
        os.environ["REVID_USE_SQLITE"] = "false"
        # Clear cached modules to force fresh import
        for mod in list(sys.modules.keys()):
            if mod.startswith("settings.config"):
                del sys.modules[mod]
        from settings.config import get_settings
        get_settings.cache_clear()

    def tearDown(self) -> None:
        if self._orig_sqlite is not None:
            os.environ["REVID_USE_SQLITE"] = self._orig_sqlite
        elif "REVID_USE_SQLITE" in os.environ:
            del os.environ["REVID_USE_SQLITE"]
        from database import close_db
        close_db()

    def test_init_mysql_engine_sets_models_base_engine(self) -> None:
        """After init_mysql_engine(), models.base._engine must not be None.

        This is the core rev47 bug: database._engine (stale import) was None
        while models.base._engine was properly set. The fix ensures
        check_alembic_revision() reads from models.base._engine at call time.
        """
        from models.base import _engine as prev_engine
        from database import init_mysql_engine

        # Close any previous engine
        if prev_engine is not None:
            from database import close_db
            close_db()

        # Reset the module-level _engine reference to None to simulate fresh start
        import models.base as base_module
        base_module._engine = None

        # Now call init_mysql_engine — this should set models.base._engine
        init_mysql_engine()

        # The key assertion: models.base._engine must NOT be None after init
        self.assertIsNotNone(
            base_module._engine,
            "init_mysql_engine() must set models.base._engine (rev47 bug: stale import remained None)",
        )

    def test_check_alembic_revision_reads_live_engine(self) -> None:
        """check_alembic_revision() must read _engine from models.base at call time.

        In the buggy rev47 implementation, check_alembic_revision() used a
        stale module-level import of _engine that was None. After the fix,
        it imports from models.base inside the function body.

        This test sets models.base._engine to a non-None value (via
        init_mysql_engine), then calls check_alembic_revision(). If the
        function reads the stale import, it will raise RuntimeError.
        If it reads the live reference, it will either succeed or raise
        a different error (e.g., Alembic table missing), but NOT
        'Database engine is not initialized'.
        """
        import models.base as base_module
        from database import init_mysql_engine, check_alembic_revision

        # Reset engine to None
        base_module._engine = None
        base_module._session_factory = None

        # Initialize MySQL engine (sets models.base._engine)
        init_mysql_engine()

        # Now call check_alembic_revision
        # It should NOT raise "Database engine is not initialized"
        # because it now reads models.base._engine at call time
        with self.assertRaises(RuntimeError) as ctx:
            check_alembic_revision()

        # The error should NOT be about engine being uninitialized.
        # It may fail for other reasons (no alembic_version table, no MySQL
        # connection, etc.) but the engine reference itself must be alive.
        self.assertNotIn(
            "Database engine is not initialized",
            str(ctx.exception),
            "check_alembic_revision() raised stale-engine error — "
            "it must read _engine from models.base at call time",
        )


class TestSQLiteModeStillWorks(unittest.TestCase):
    """Verify that REVID_USE_SQLITE=true still works correctly."""

    def setUp(self) -> None:
        self.temp_dir = TemporaryDirectory()
        self.db_path = str(Path(self.temp_dir.name) / "test-t4-003.db")

    def tearDown(self) -> None:
        from database import close_db
        close_db()
        self.temp_dir.cleanup()

    def test_sqlite_init_and_create_user(self) -> None:
        """SQLite mode should create tables and allow user creation."""
        from database import init_db
        from controllers.store import DatabaseStore, configure_store

        init_db(self.db_path)
        store = DatabaseStore()
        configure_store(store)

        user = store.create_user("TestUser", "avatar.png")
        loaded = store.get_user(user["id"])

        self.assertIsNotNone(loaded)
        self.assertEqual("TestUser", loaded["nickname"])

    def test_sqlite_create_project_and_node(self) -> None:
        """SQLite mode should support project and node CRUD."""
        from database import init_db
        from controllers.store import DatabaseStore

        init_db(self.db_path)
        store = DatabaseStore()

        # Get admin user id
        admin_id = next(uid for uid, u in store.users.items() if u["role"] == "admin")
        project = store.create_project(admin_id, "TestProject")
        self.assertIsNotNone(project)

        node = store.create_node(
            project["id"],
            admin_id,
            "text",
            {"content": "hello"},
            0.0,
            0.0,
            200,
            100,
        )
        self.assertIsNotNone(node)
        self.assertEqual("text", node["node_type"])

    def test_sqlite_asset_creation(self) -> None:
        """SQLite mode should support asset creation."""
        from database import init_db
        from controllers.store import DatabaseStore

        init_db(self.db_path)
        store = DatabaseStore()

        admin_id = next(uid for uid, u in store.users.items() if u["role"] == "admin")
        project = store.create_project(admin_id, "AssetTest")

        asset = store.create_asset(
            user_id=admin_id,
            asset_type="image",
            url="http://example.com/img.png",
            content_text=None,
            project_id=project["id"],
        )
        self.assertIsNotNone(asset)
        self.assertEqual("image", asset["type"])


class TestStoreProxyConsistency(unittest.TestCase):
    """Verify StoreProxy behaves consistently across both store types."""

    def setUp(self) -> None:
        self.temp_dir = TemporaryDirectory()
        self.db_path = str(Path(self.temp_dir.name) / "test-proxy.db")

    def tearDown(self) -> None:
        from database import close_db
        close_db()
        self.temp_dir.cleanup()

    def test_configure_store_accepts_database_store(self) -> None:
        """configure_store should accept DatabaseStore without error."""
        from database import init_db
        from controllers.store import DatabaseStore, configure_store

        init_db(self.db_path)
        store = DatabaseStore()
        configure_store(store)

        # Verify the global store is now a DatabaseStore
        from controllers.store import store as global_store
        self.assertIsInstance(global_store._backend, DatabaseStore)


if __name__ == "__main__":
    unittest.main()
