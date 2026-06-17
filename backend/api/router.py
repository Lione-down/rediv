from fastapi import FastAPI

from api import admin, assets, auth, health


def include_routers(app: FastAPI) -> None:
    app.include_router(health.router)
    app.include_router(auth.router)
    app.include_router(auth.me_router)
    app.include_router(admin.router)
    app.include_router(assets.router)
