from __future__ import annotations

from collections.abc import Generator
from pathlib import Path

from sqlalchemy.orm import Session

from models.base import build_sqlite_url, create_tables, dispose_engine, get_session, init_engine


SQLITE_BASELINE_REVISION = "a1b2c3d4e5f6"


def _ensure_sqlite_schema_is_current(db_path: str) -> None:
    from alembic import command
    from alembic.config import Config
    from sqlalchemy import inspect, text

    from models.base import _engine as engine

    if engine is None:
        raise RuntimeError("Database engine is not initialized")

    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    user_columns = {column["name"] for column in inspector.get_columns("users")}
    required_columns = {"username", "email", "password_hash"}
    if required_columns.issubset(user_columns):
        return

    backend_dir = Path(__file__).resolve().parent
    alembic_cfg = Config(str(backend_dir / "alembic.ini"))
    alembic_cfg.set_main_option("script_location", str((backend_dir / "migrations").resolve()))
    alembic_cfg.set_main_option("use_sqlite", "true")
    alembic_cfg.set_main_option("sqlite_db_path", db_path)
    alembic_cfg.set_main_option("sqlalchemy.url", build_sqlite_url(db_path))

    with engine.begin() as connection:
        if "alembic_version" not in inspector.get_table_names():
            connection.execute(
                text(
                    "CREATE TABLE alembic_version ("
                    "version_num VARCHAR(32) NOT NULL PRIMARY KEY)"
                )
            )
            connection.execute(
                text("INSERT INTO alembic_version (version_num) VALUES (:revision)"),
                {"revision": SQLITE_BASELINE_REVISION},
            )
            current_revision = SQLITE_BASELINE_REVISION
        else:
            current_revision = connection.execute(text("SELECT version_num FROM alembic_version LIMIT 1")).scalar_one_or_none()
            if current_revision is None:
                connection.execute(
                    text("INSERT INTO alembic_version (version_num) VALUES (:revision)"),
                    {"revision": SQLITE_BASELINE_REVISION},
                )
                current_revision = SQLITE_BASELINE_REVISION

    if current_revision != get_alembic_head_revision():
        command.upgrade(alembic_cfg, "head")


def init_db(db_path: str | None = None) -> None:
    """Initialize the database engine and (for SQLite only) create tables."""
    init_engine(db_path)
    # Only create tables in SQLite mode; MySQL relies on Alembic revisions.
    if db_path and db_path.strip():
        create_tables()
        _ensure_sqlite_schema_is_current(db_path)


def init_mysql_engine() -> None:
    """Initialize the MySQL engine without calling create_all()."""
    init_engine(None)


def get_alembic_head_revision() -> str:
    """Return the migration head without depending on the process cwd."""
    from pathlib import Path

    from alembic.config import Config
    from alembic.script import ScriptDirectory

    backend_dir = Path(__file__).resolve().parent
    alembic_cfg = Config(str(backend_dir / "alembic.ini"))
    alembic_cfg.set_main_option(
        "script_location",
        str((backend_dir / "migrations").resolve()),
    )
    head_revision = ScriptDirectory.from_config(alembic_cfg).get_current_head()
    if not head_revision:
        raise RuntimeError("Alembic has no head revision")
    return head_revision


def check_alembic_revision() -> dict:
    """Check that the current database schema matches the Alembic head revision.

    Returns a dict with ``current``, ``head`` and ``match`` keys.
    Raises RuntimeError when the database is unreachable or the revision
    table is missing (schema may not have been migrated yet).
    """
    from sqlalchemy import text

    # Read _engine from models.base at call time, not via stale module-level import.
    from models.base import _engine as engine

    if engine is None:
        raise RuntimeError("Database engine is not initialized")
    if engine.dialect.name != "mysql":
        raise RuntimeError("Unsupported database dialect; Revid requires MySQL")

    # Try to read the Alembic version table to determine current revision.
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT version_num FROM alembic_version LIMIT 1")
            )
            row = result.fetchone()
            current_rev = row[0] if row else None
    except Exception as exc:
        raise RuntimeError(
            "Database schema check failed; verify the REVID_DB_* connection "
            "settings and run `alembic upgrade head`."
        ) from exc

    # Read the Alembic head revision from the migration environment.
    try:
        head_rev = get_alembic_head_revision()
    except Exception as exc:
        raise RuntimeError(
            "Unable to determine the Alembic head revision; verify alembic.ini "
            "and the migration scripts."
        ) from exc

    if current_rev != head_rev:
        current_label = current_rev or "none"
        head_label = head_rev or "none"
        raise RuntimeError(
            "Database schema revision mismatch "
            f"(current={current_label}, head={head_label}); "
            "run `alembic upgrade head`."
        )

    return {
        "current": current_rev,
        "head": head_rev,
        "match": True,
    }


def get_db_session() -> Generator[Session, None, None]:
    session = get_session()
    try:
        yield session
    finally:
        session.close()


def close_db() -> None:
    dispose_engine()
