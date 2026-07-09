from __future__ import annotations

from collections.abc import Generator

from sqlalchemy.orm import Session

from models.base import create_tables, dispose_engine, get_session, init_engine


def init_db(db_path: str | None = None) -> None:
    """Initialize the database engine and (for SQLite only) create tables."""
    init_engine(db_path)
    # Only create tables in SQLite mode; MySQL relies on Alembic revisions.
    if db_path and db_path.strip():
        create_tables()


def init_mysql_engine() -> None:
    """Initialize the MySQL engine without calling create_all()."""
    init_engine(None)


def check_alembic_revision() -> dict:
    """Check that the current database schema matches the Alembic head revision.

    Returns a dict with ``current``, ``head`` and ``match`` keys.
    Raises RuntimeError when the database is unreachable or the revision
    table is missing (schema may not have been migrated yet).
    """
    from pathlib import Path

    from sqlalchemy import text

    # Read _engine from models.base at call time, not via stale module-level import.
    from models.base import _engine as engine

    if engine is None:
        raise RuntimeError("Database engine is not initialized")

    # Try to read the Alembic version table to determine current revision.
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT version_num FROM alembic_version LIMIT 1")
            )
            row = result.fetchone()
            current_rev = row[0] if row else None
    except Exception as exc:
        # Alembic version table does not exist yet — schema needs migration.
        raise RuntimeError(
            f"Alembic version table not found; run `alembic upgrade head` first. "
            f"Underlying error: {exc}"
        ) from exc

    # Read the Alembic head revision from the migration environment.
    try:
        from alembic.config import Config
        from alembic.script import ScriptDirectory

        alembic_ini = Path(__file__).resolve().parent / "alembic.ini"
        alembic_cfg = Config(str(alembic_ini))
        script = ScriptDirectory.from_config(alembic_cfg)
        head_rev = script.get_current_head()
    except Exception:
        head_rev = None

    return {
        "current": current_rev,
        "head": head_rev,
        "match": current_rev == head_rev,
    }


def get_db_session() -> Generator[Session, None, None]:
    session = get_session()
    try:
        yield session
    finally:
        session.close()


def close_db() -> None:
    dispose_engine()
