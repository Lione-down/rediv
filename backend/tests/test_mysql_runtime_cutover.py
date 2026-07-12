"""Focused tests for the fail-closed MySQL runtime cutover."""
from __future__ import annotations

import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from fastapi import FastAPI

sys.path.insert(0, str(Path(__file__).parent.parent.resolve()))


class TestMySQLConfiguration(unittest.TestCase):
    def tearDown(self) -> None:
        from database import close_db

        close_db()

    def test_missing_mysql_configuration_fails_closed(self) -> None:
        from models.base import build_mysql_url

        incomplete = SimpleNamespace(
            db_host="",
            db_port=3306,
            db_name="",
            db_user="",
            db_password="",
        )

        with (
            patch("models.base.get_settings", return_value=incomplete),
            self.assertRaisesRegex(RuntimeError, "Missing required MySQL configuration"),
        ):
            build_mysql_url()

    def test_invalid_mysql_port_fails_closed(self) -> None:
        from models.base import build_mysql_url

        invalid = SimpleNamespace(
            db_host="mysql.invalid",
            db_port=0,
            db_name="unit_database",
            db_user="unit_user",
            db_password="unit_password",
        )

        with (
            patch("models.base.get_settings", return_value=invalid),
            self.assertRaisesRegex(RuntimeError, "REVID_DB_PORT"),
        ):
            build_mysql_url()

    def test_mysql_engine_applies_pool_recycle(self) -> None:
        from models.base import init_engine

        configured = SimpleNamespace(
            db_host="mysql.invalid",
            db_port=3306,
            db_name="unit_database",
            db_user="unit_user",
            db_password="unit_password",
            db_pool_recycle=1234,
        )
        engine = MagicMock()

        with (
            patch("models.base.get_settings", return_value=configured),
            patch("models.base.create_engine", return_value=engine) as create_engine,
        ):
            self.assertIs(engine, init_engine())

        self.assertEqual(1234, create_engine.call_args.kwargs["pool_recycle"])


class TestAlembicRevisionGate(unittest.TestCase):
    def tearDown(self) -> None:
        from database import close_db

        close_db()

    def test_check_reads_live_engine_and_accepts_matching_head(self) -> None:
        import models.base as base_module
        from database import check_alembic_revision

        engine = MagicMock()
        engine.dialect.name = "mysql"
        connection = engine.connect.return_value.__enter__.return_value
        connection.execute.return_value.fetchone.return_value = ("revision-a",)
        base_module._engine = engine

        with patch("database.get_alembic_head_revision", return_value="revision-a"):
            result = check_alembic_revision()

        self.assertEqual({"current": "revision-a", "head": "revision-a", "match": True}, result)

    def test_check_rejects_non_mysql_engine_before_connecting(self) -> None:
        import models.base as base_module
        from database import check_alembic_revision

        engine = MagicMock()
        engine.dialect.name = "postgresql"
        base_module._engine = engine

        with self.assertRaisesRegex(RuntimeError, "requires MySQL"):
            check_alembic_revision()

        engine.connect.assert_not_called()

    def test_check_rejects_schema_mismatch(self) -> None:
        import models.base as base_module
        from database import check_alembic_revision

        engine = MagicMock()
        engine.dialect.name = "mysql"
        connection = engine.connect.return_value.__enter__.return_value
        connection.execute.return_value.fetchone.return_value = ("revision-old",)
        base_module._engine = engine

        with (
            patch("database.get_alembic_head_revision", return_value="revision-head"),
            self.assertRaisesRegex(RuntimeError, "alembic upgrade head"),
        ):
            check_alembic_revision()


class TestRuntimeLifespan(unittest.IsolatedAsyncioTestCase):
    async def test_lifespan_initializes_mysql_and_closes_engine(self) -> None:
        from main import lifespan

        database_store = object()
        with (
            patch("main.init_mysql_engine") as init_mysql_engine,
            patch("main.check_alembic_revision") as check_revision,
            patch("main.DatabaseStore", return_value=database_store),
            patch("main.configure_store") as configure_store,
            patch("main.close_db") as close_db,
        ):
            async with lifespan(FastAPI()):
                init_mysql_engine.assert_called_once_with()
                check_revision.assert_called_once_with()
                configure_store.assert_called_once_with(database_store)

        close_db.assert_called_once_with()

    async def test_lifespan_closes_engine_when_revision_gate_fails(self) -> None:
        from main import lifespan

        with (
            patch("main.init_mysql_engine"),
            patch("main.check_alembic_revision", side_effect=RuntimeError("revision mismatch")),
            patch("main.configure_store") as configure_store,
            patch("main.close_db") as close_db,
            self.assertRaisesRegex(RuntimeError, "revision mismatch"),
        ):
            async with lifespan(FastAPI()):
                self.fail("lifespan must not start when revision validation fails")

        configure_store.assert_not_called()
        close_db.assert_called_once_with()


class TestStoreInitializationGate(unittest.TestCase):
    def test_unconfigured_store_fails_closed(self) -> None:
        from controllers.store import StoreProxy

        unconfigured_store = StoreProxy()

        with self.assertRaisesRegex(RuntimeError, "MySQL startup must complete"):
            unconfigured_store.get_user("user-1")


if __name__ == "__main__":
    unittest.main()
