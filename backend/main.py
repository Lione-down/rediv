from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from controllers.store import DatabaseStore, configure_store
from core.agnes_provider import AgnesProvider
from database import check_alembic_revision, close_db, init_mysql_engine
from settings.config import require_runtime_security_settings, settings
from services.generation.job_runner import GenerationJobRunner
from services.generation.provider_dispatch import GenerationProviderDispatcher


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Validate runtime security and initialize the MySQL application state."""
    require_runtime_security_settings()
    init_mysql_engine()
    global _agnes
    if _agnes.is_closed:
        _agnes = AgnesProvider(
            api_key=settings.agnes_api_key,
            base_url=settings.agnes_base_url,
            config=settings,
        )
    runner = None
    try:
        check_alembic_revision()
        configure_store(DatabaseStore())
        runner = GenerationJobRunner(
            dispatcher=GenerationProviderDispatcher(_agnes),
            owner_id=f"fastapi-{uuid4()}",
            lease_seconds=settings.generation_job_runner_lease_seconds,
            poll_interval_seconds=settings.generation_job_runner_poll_seconds,
        )
        runner.start()
        yield
    finally:
        if runner is not None:
            await runner.stop()
        await _agnes.close()
        close_db()

from api.router import include_routers


_agnes = AgnesProvider(
    api_key=settings.agnes_api_key,
    base_url=settings.agnes_base_url,
    config=settings,
)


def get_agnes() -> AgnesProvider:
    """获取 Agnes Provider 实例（供各 router 注入使用）。"""
    return _agnes


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

include_routers(app)
