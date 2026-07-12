"""MySQL-only environment configuration for Alembic migrations."""
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# Add backend directory to path so we can import models
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from models.base import Base  # noqa: E402

# Interpret the config file for Python logging.
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_url():
    """Build a validated MySQL URL from process-supplied settings."""
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
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
