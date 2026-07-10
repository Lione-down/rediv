from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import JSON, DateTime, String, create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker
from sqlalchemy.pool import NullPool
from sqlalchemy.sql.elements import TextClause

from settings.config import get_settings


def utc_now() -> datetime:
    return datetime.now(UTC)


class Base(DeclarativeBase):
    pass


class StoreConfig(Base):
    __tablename__ = "store_configs"
    __table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4", "comment": "系统配置表"}

    key: Mapped[str] = mapped_column(String(100), primary_key=True, comment="配置键名")
    value: Mapped[dict] = mapped_column(JSON, nullable=False, comment="配置值JSON")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, comment="更新时间")


_engine: Engine | None = None
_session_factory: sessionmaker[Session] | None = None
_engine_url: str | None = None


def build_sqlite_url(db_path: str) -> str:
    path = Path(db_path)
    if not path.is_absolute():
        path = Path.cwd() / path
    path.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{path.resolve().as_posix()}"


def build_mysql_url() -> str:
    """Build MySQL connection URL from settings.

    Uses SQLAlchemy URL API to handle special characters in password safely.
    """
    from sqlalchemy.engine.url import URL

    settings = get_settings()
    url = URL.create(
        drivername="mysql+pymysql",
        username=settings.db_user,
        password=settings.db_password,
        host=settings.db_host,
        port=settings.db_port,
        database=settings.db_name,
    )
    return url.render_as_string(hide_password=False)


def init_engine(db_path: str | None = None) -> Engine:
    """Initialize the database engine.

    Args:
        db_path: SQLite database file path. When None or empty, uses MySQL
                 settings from environment/config.
    """
    global _engine
    global _engine_url
    global _session_factory

    settings = get_settings()

    if db_path and db_path.strip():
        # SQLite mode
        engine_url = build_sqlite_url(db_path)
        poolclass = NullPool  # SQLite needs NullPool
        connect_args: dict = {"check_same_thread": False}
    else:
        # MySQL mode
        engine_url = build_mysql_url()
        poolclass = None
        connect_args = {}

    if _engine is not None and _engine_url != engine_url:
        _engine.dispose()
        _engine = None
        _session_factory = None

    if _engine is None:
        engine_kwargs: dict = {
            "future": True,
            "pool_pre_ping": True,
            "connect_args": connect_args,
        }

        if poolclass is not None:
            engine_kwargs["poolclass"] = poolclass

        # MySQL pool settings
        if "mysql" in engine_url:
            pool_recycle = getattr(settings, "db_pool_recycle", 3600)
            engine_kwargs["pool_recycle"] = pool_recycle

        _engine = create_engine(engine_url, **engine_kwargs)
        _session_factory = sessionmaker(bind=_engine, autoflush=False, expire_on_commit=False)
        _engine_url = engine_url

    return _engine


def get_session() -> Session:
    if _session_factory is None:
        raise RuntimeError("Database engine is not initialized")
    return _session_factory()


def create_tables() -> None:
    if _engine is None:
        raise RuntimeError("Database engine is not initialized")
    Base.metadata.create_all(_engine)


def dispose_engine() -> None:
    global _engine
    global _engine_url
    global _session_factory

    if _engine is not None:
        _engine.dispose()
    _engine = None
    _engine_url = None
    _session_factory = None
