"""Env configuration for Alembic migrations.

Supports both SQLite (testing) and MySQL (production) via environment variable.
"""
import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# Add backend directory to path so we can import models
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from models.base import Base  # noqa: E402
from settings.config import settings  # noqa: E402

# Interpret the config file for Python logging.
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_url():
    """Build database URL from settings.

    Respects REVID_USE_SQLITE for test environments.
    """
    # Check Alembic config first
    alembic_use_sqlite = config.get_main_option("use_sqlite", None)
    if alembic_use_sqlite is not None:
        use_sqlite = alembic_use_sqlite.lower() == "true"
    else:
        # Fall back to environment variable
        env_use_sqlite = os.environ.get("REVID_USE_SQLITE", "").lower()
        if env_use_sqlite:
            use_sqlite = env_use_sqlite == "true"
        else:
            # Final fallback to settings
            use_sqlite = getattr(settings, "use_sqlite", True)
    
    if use_sqlite:
        db_path = getattr(settings, "db_path", "revid.db")
        from models.base import build_sqlite_url
        return build_sqlite_url(db_path)
    else:
        from models.base import build_mysql_url
        return build_mysql_url()


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    Generates SQL statements against a URL.
    """
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,  # SQLite compatibility
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    # Use the dynamic URL builder instead of ini file to avoid hardcoded credentials
    connectable = engine_from_config(
        {"url": get_url()},
        prefix="",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,  # SQLite compatibility
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
