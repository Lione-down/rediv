from __future__ import annotations

import os
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL, make_url


TEST_SCHEMA_PREFIX = "revid_test_"
_DATABASE_ENV_NAMES = (
    "REVID_DB_HOST",
    "REVID_DB_PORT",
    "REVID_DB_NAME",
    "REVID_DB_USER",
    "REVID_DB_PASSWORD",
)


def assert_test_schema_name(schema_name: str) -> None:
    suffix = schema_name.removeprefix(TEST_SCHEMA_PREFIX)
    if (
        not schema_name.startswith(TEST_SCHEMA_PREFIX)
        or not suffix
        or not suffix.isascii()
        or not suffix.replace("_", "").isalnum()
    ):
        raise RuntimeError("Test schema name must match revid_test_*")


def assert_selected_database(engine, expected_schema: str) -> None:
    assert_test_schema_name(expected_schema)
    with engine.connect() as connection:
        selected_schema = connection.execute(text("SELECT DATABASE()")).scalar()
    if selected_schema != expected_schema:
        raise RuntimeError("Test database identity gate failed")


class MySQLTestDatabase:
    def __init__(self, schema_name: str, revision: str = "head") -> None:
        assert_test_schema_name(schema_name)
        self.schema_name = schema_name
        self.revision = revision
        self._admin_url: URL | None = None
        self._target_url: URL | None = None
        self._original_environment: dict[str, str | None] = {}
        self._original_settings: dict[str, object] = {}
        self._is_started = False

    def start(self) -> None:
        if self._is_started:
            raise RuntimeError("MySQL test database is already started")

        self._load_urls()
        self._capture_runtime_settings()
        try:
            self._drop_schema_if_present()
            self._create_schema()
            self._apply_runtime_settings()
            self._upgrade_to_revision(self.revision)
            from models.base import init_engine

            init_engine()
            self._is_started = True
        except Exception:
            from models.base import dispose_engine

            dispose_engine()
            try:
                self._drop_schema_if_present()
            finally:
                self._restore_runtime_settings()
            raise

    def stop(self) -> None:
        from models.base import dispose_engine

        dispose_engine()
        try:
            self._drop_schema_if_present()
        finally:
            self._restore_runtime_settings()
            self._is_started = False

    def upgrade_to_head(self) -> None:
        if not self._is_started:
            raise RuntimeError("MySQL test database is not started")
        from models.base import dispose_engine, init_engine

        dispose_engine()
        self._upgrade_to_revision("head")
        init_engine()

    def _load_urls(self) -> None:
        raw_admin_url = os.environ.get("REVID_TEST_MYSQL_ADMIN_URL", "").strip()
        if not raw_admin_url:
            raise RuntimeError(
                "BLOCKED: REVID_TEST_MYSQL_ADMIN_URL is required for "
                "database-backed tests"
            )

        try:
            supplied_url = make_url(raw_admin_url)
        except Exception:
            raise RuntimeError("Invalid MySQL test admin URL") from None
        if supplied_url.get_backend_name() != "mysql":
            raise RuntimeError("MySQL test admin URL must use the MySQL dialect")
        if not supplied_url.host or not supplied_url.username:
            raise RuntimeError("MySQL test admin URL is missing connection fields")

        self._admin_url = supplied_url.set(database=None)
        self._target_url = supplied_url.set(database=self.schema_name)
        if self._target_url.database != self.schema_name:
            raise RuntimeError("MySQL test database URL identity mismatch")

    def _capture_runtime_settings(self) -> None:
        from settings.config import settings

        self._original_environment = {
            name: os.environ.get(name) for name in _DATABASE_ENV_NAMES
        }
        self._original_settings = {
            "db_host": settings.db_host,
            "db_port": settings.db_port,
            "db_name": settings.db_name,
            "db_user": settings.db_user,
            "db_password": settings.db_password,
        }

    def _apply_runtime_settings(self) -> None:
        from settings.config import settings

        if self._target_url is None:
            raise RuntimeError("MySQL test database URL is not initialized")

        values = {
            "REVID_DB_HOST": self._target_url.host or "",
            "REVID_DB_PORT": str(self._target_url.port or 3306),
            "REVID_DB_NAME": self.schema_name,
            "REVID_DB_USER": self._target_url.username or "",
            "REVID_DB_PASSWORD": self._target_url.password or "",
        }
        os.environ.update(values)
        settings.db_host = values["REVID_DB_HOST"]
        settings.db_port = int(values["REVID_DB_PORT"])
        settings.db_name = values["REVID_DB_NAME"]
        settings.db_user = values["REVID_DB_USER"]
        settings.db_password = values["REVID_DB_PASSWORD"]

    def _restore_runtime_settings(self) -> None:
        if not self._original_settings:
            return

        from settings.config import settings

        for name, value in self._original_environment.items():
            if value is None:
                os.environ.pop(name, None)
            else:
                os.environ[name] = value
        for name, value in self._original_settings.items():
            setattr(settings, name, value)
        self._original_environment = {}
        self._original_settings = {}

    def _schema_exists(self) -> bool:
        if self._admin_url is None:
            raise RuntimeError("MySQL test admin URL is not initialized")

        admin_engine = create_engine(self._admin_url, future=True, pool_pre_ping=True)
        try:
            with admin_engine.connect() as connection:
                return connection.execute(
                    text(
                        "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA "
                        "WHERE SCHEMA_NAME = :schema_name"
                    ),
                    {"schema_name": self.schema_name},
                ).scalar() is not None
        finally:
            admin_engine.dispose()

    def _create_schema(self) -> None:
        assert_test_schema_name(self.schema_name)
        if self._admin_url is None or self._target_url is None:
            raise RuntimeError("MySQL test database URLs are not initialized")

        admin_engine = create_engine(self._admin_url, future=True, pool_pre_ping=True)
        try:
            with admin_engine.begin() as connection:
                connection.execute(
                    text(
                        f"CREATE DATABASE `{self.schema_name}` "
                        "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                    )
                )
        finally:
            admin_engine.dispose()

        target_engine = create_engine(self._target_url, future=True, pool_pre_ping=True)
        try:
            assert_selected_database(target_engine, self.schema_name)
        finally:
            target_engine.dispose()

    def _drop_schema_if_present(self) -> None:
        assert_test_schema_name(self.schema_name)
        if self._admin_url is None or self._target_url is None:
            return
        if not self._schema_exists():
            return

        target_engine = create_engine(self._target_url, future=True, pool_pre_ping=True)
        try:
            assert_selected_database(target_engine, self.schema_name)
        finally:
            target_engine.dispose()

        admin_engine = create_engine(self._admin_url, future=True, pool_pre_ping=True)
        try:
            with admin_engine.begin() as connection:
                connection.execute(text(f"DROP DATABASE `{self.schema_name}`"))
        finally:
            admin_engine.dispose()

    def _upgrade_to_revision(self, revision: str) -> None:
        backend_dir = Path(__file__).resolve().parents[1]
        config = Config(str(backend_dir / "alembic.ini"))
        config.set_main_option(
            "script_location",
            str((backend_dir / "migrations").resolve()),
        )
        command.upgrade(config, revision)
