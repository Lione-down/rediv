from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import JSON, DateTime, String, create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker


def utc_now() -> datetime:
    return datetime.now(UTC)


class Base(DeclarativeBase):
    pass


class StoreConfig(Base):
    __tablename__ = "store_configs"

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[dict] = mapped_column(JSON, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


_engine: Engine | None = None
_session_factory: sessionmaker[Session] | None = None
_engine_url: str | None = None


def build_sqlite_url(db_path: str) -> str:
    path = Path(db_path)
    if not path.is_absolute():
        path = Path.cwd() / path
    path.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{path.resolve().as_posix()}"


def init_engine(db_path: str) -> Engine:
    global _engine
    global _engine_url
    global _session_factory

    engine_url = build_sqlite_url(db_path)
    if _engine is not None and _engine_url != engine_url:
        _engine.dispose()
        _engine = None
        _session_factory = None

    if _engine is None:
        _engine = create_engine(
            engine_url,
            future=True,
            connect_args={"check_same_thread": False},
        )
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
