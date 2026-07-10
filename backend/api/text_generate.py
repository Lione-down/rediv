import sys
import time

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from controllers.store import store
from core.generation_task_utils import (
    elapsed_ms,
    error_code_for_exception,
    extract_provider_request_id,
    sanitize_error_message,
    status_for_error_code,
)
from core.security import current_user


MODEL_NAME = "agnes-2.0-flash"

router = APIRouter(prefix="/api", tags=["text-generate"])


class TextGenerateRequest(BaseModel):
    project_id: str = Field(..., min_length=1)
    node_id: str = Field(..., min_length=1)
    prompt: str = Field(..., min_length=1)


def _get_project_or_error(project_id: str, user_id: str) -> dict:
    project = store.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project["user_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return project


def _get_node_or_error(project_id: str, node_id: str) -> dict:
    node = store.get_node(node_id)
    if node is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Node not found")
    if node["project_id"] != project_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return node


def _get_agnes():
    # `main` imports `api.router`, so importing `main` here would create a circular import.
    main_module = sys.modules.get("main") or sys.modules.get("backend.main")
    if main_module is None or not hasattr(main_module, "get_agnes"):
        raise RuntimeError("Agnes provider is unavailable")
    return main_module.get_agnes()


@router.post("/text-generate")
async def text_generate(payload: TextGenerateRequest, user=Depends(current_user)):
    _get_project_or_error(payload.project_id, user["id"])
    _get_node_or_error(payload.project_id, payload.node_id)

    quotas = store.quotas.get(user["id"], {"text": 0, "image": 0, "video": 0})
    if quotas.get("text", 0) < 1:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient text quota")

    started_at = time.perf_counter()
    task = store.create_generation_task(
        user["id"],
        "text",
        "agnes",
        MODEL_NAME,
        project_id=payload.project_id,
        canvas_node_id=payload.node_id,
        status="queued",
    )
    store.update_generation_task(task["id"], status="running")
    provider_request_id: str | None = None

    try:
        response = await _get_agnes().chat(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": payload.prompt}],
        )
        provider_request_id = extract_provider_request_id(response, "id", "request_id")
        generated_text = response["choices"][0]["message"]["content"]
    except HTTPException:
        raise
    except Exception as exc:
        error_code = error_code_for_exception(exc)
        store.update_generation_task(
            task["id"],
            status=status_for_error_code(error_code),
            duration_ms=elapsed_ms(started_at),
            provider_request_id=provider_request_id,
            error_code=error_code,
            error_message=sanitize_error_message(exc),
        )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Agnes text generation failed") from exc

    store.grant_quota(user["id"], "text", -1, "text_generate", None)
    try:
        asset = store.create_asset(
            user["id"],
            "prompt",
            None,
            generated_text,
            project_id=payload.project_id,
            canvas_node_id=payload.node_id,
            source="generation",
            source_model=MODEL_NAME,
            source_task_id=task["id"],
        )
    except Exception as exc:
        store.grant_quota(user["id"], "text", 1, "text_generate_refund", None)
        store.update_generation_task(
            task["id"],
            status="failed",
            duration_ms=elapsed_ms(started_at),
            provider_request_id=provider_request_id,
            error_code="asset_persistence_error",
            error_message=sanitize_error_message(exc),
        )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save generated asset") from exc

    task = store.update_generation_task(
        task["id"],
        status="succeeded",
        duration_ms=elapsed_ms(started_at),
        provider_request_id=provider_request_id,
        result_asset_id=asset["id"],
    )
    return {"content": generated_text, "asset": asset, "generation_task": task}
