import sys

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from controllers.store import store
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

    try:
        response = await _get_agnes().chat(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": payload.prompt}],
        )
        generated_text = response["choices"][0]["message"]["content"]
    except HTTPException:
        raise
    except Exception as exc:
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
        )
    except Exception as exc:
        store.grant_quota(user["id"], "text", 1, "text_generate_refund", None)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save generated asset") from exc

    return {"content": generated_text, "asset": asset}
