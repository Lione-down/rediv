from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from controllers.store import DatabaseStore, InMemoryStore, configure_store
from core.agnes_provider import AgnesProvider
from database import init_db, init_mysql_engine, check_alembic_revision
from settings.config import settings

if settings.use_sqlite:
    init_db(settings.db_path)
    configure_store(DatabaseStore())
else:
    # MySQL mode: initialize engine (no create_all), verify schema via Alembic
    init_mysql_engine()
    check_alembic_revision()
    configure_store(DatabaseStore())

from api.router import include_routers


_agnes = AgnesProvider(
    api_key=settings.agnes_api_key,
    base_url=settings.agnes_base_url,
)


def get_agnes() -> AgnesProvider:
    """获取 Agnes Provider 实例（供各 router 注入使用）。"""
    return _agnes


app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

include_routers(app)
