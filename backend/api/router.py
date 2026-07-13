from fastapi import FastAPI

from api import (
    admin,
    assets,
    auth,
    canvas_connections,
    canvas_documents,
    canvas_nodes,
    canvases,
    generation_tasks,
    health,
    image_generate,
    projects,
    templates,
    text_generate,
    video_generate,
)


def include_routers(app: FastAPI) -> None:
    app.include_router(health.router)
    app.include_router(auth.router)
    app.include_router(auth.me_router)
    app.include_router(admin.router)
    app.include_router(assets.router)
    app.include_router(projects.router)
    app.include_router(canvases.router)
    app.include_router(canvas_documents.router)
    app.include_router(canvas_nodes.router)
    app.include_router(canvas_connections.router)
    app.include_router(generation_tasks.router)
    app.include_router(templates.router)
    app.include_router(text_generate.router)
    app.include_router(image_generate.router)
    app.include_router(video_generate.router)
