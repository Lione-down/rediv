from __future__ import annotations

from collections.abc import Generator

from sqlalchemy.orm import Session

from models.base import create_tables, dispose_engine, get_session, init_engine
from settings.config import settings


def init_db(db_path: str | None = None) -> None:
    init_engine(db_path or settings.db_path)
    create_tables()


def get_db_session() -> Generator[Session, None, None]:
    session = get_session()
    try:
        yield session
    finally:
        session.close()


def close_db() -> None:
    dispose_engine()
