from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import JSON, DateTime, String, create_engine
from sqlalchemy.engine import Engine, URL
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker
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
_engine_url: URL | None = None


def build_mysql_url() -> URL:
    """Build MySQL connection URL from settings.

    Uses SQLAlchemy URL API to handle special characters in password safely.
    """
    settings = get_settings()
    required_values = {
        "REVID_DB_HOST": settings.db_host,
        "REVID_DB_NAME": settings.db_name,
        "REVID_DB_USER": settings.db_user,
        "REVID_DB_PASSWORD": settings.db_password,
    }
    missing = [name for name, value in required_values.items() if not value.strip()]
    if missing:
        raise RuntimeError(
            "Missing required MySQL configuration: " + ", ".join(missing)
        )
    if not 1 <= settings.db_port <= 65535:
        raise RuntimeError("REVID_DB_PORT must be between 1 and 65535")

    url = URL.create(
        drivername="mysql+pymysql",
        username=settings.db_user,
        password=settings.db_password,
        host=settings.db_host,
        port=settings.db_port,
        database=settings.db_name,
    )
    return url


def init_engine() -> Engine:
    """Initialize the MySQL database engine."""
    global _engine
    global _engine_url
    global _session_factory

    settings = get_settings()
    engine_url = build_mysql_url()

    if _engine is not None and _engine_url != engine_url:
        _engine.dispose()
        _engine = None
        _session_factory = None

    if _engine is None:
        engine_kwargs: dict = {
            "future": True,
            "pool_pre_ping": True,
            "pool_recycle": getattr(settings, "db_pool_recycle", 3600),
        }

        _engine = create_engine(engine_url, **engine_kwargs)
        _session_factory = sessionmaker(bind=_engine, autoflush=False, expire_on_commit=False)
        _engine_url = engine_url

    return _engine


def get_session() -> Session:
    if _session_factory is None:
        raise RuntimeError("Database engine is not initialized")
    return _session_factory()


def dispose_engine() -> None:
    global _engine
    global _engine_url
    global _session_factory

    if _engine is not None:
        _engine.dispose()
    _engine = None
    _engine_url = None
    _session_factory = None
