from fastapi import FastAPI

from api import (
    admin,
    agent_skills,
    assets,
    auth,
    canvas_documents,
    canvases,
    generation_capabilities,
    generation_jobs,
    generation_tasks,
    health,
    image_generate,
    projects,
    provider_cost_acknowledgements,
    shot_schemas,
    templates,
    text_generate,
    video_generate,
    workflow_templates,
)


def include_routers(app: FastAPI) -> None:
    app.include_router(health.router)
    app.include_router(auth.router)
    app.include_router(auth.me_router)
    app.include_router(admin.router)
    app.include_router(assets.router)
    app.include_router(projects.router)
    app.include_router(provider_cost_acknowledgements.router)
    app.include_router(canvases.router)
    app.include_router(canvas_documents.router)
    app.include_router(agent_skills.router)
    app.include_router(generation_capabilities.router)
    app.include_router(generation_jobs.router)
    app.include_router(generation_tasks.router)
    app.include_router(shot_schemas.router)
    app.include_router(templates.router)
    app.include_router(templates.canvas_router)
    app.include_router(text_generate.router)
    app.include_router(image_generate.router)
    app.include_router(video_generate.router)
    app.include_router(workflow_templates.router)
    app.include_router(workflow_templates.capture_router)
