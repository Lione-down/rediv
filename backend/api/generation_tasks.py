from fastapi import APIRouter, Depends, HTTPException, Query, status

from controllers.store import store
from core.security import current_user
from schemas.generation_task import GenerationTaskItem, GenerationTaskListResponse


router = APIRouter(prefix="/api/generation-tasks", tags=["generation-tasks"])


@router.get("", response_model=GenerationTaskListResponse)
def list_generation_tasks(
    project_id: str | None = None,
    media_type: str | None = Query(default=None, pattern="^(text|image|video)$"),
    task_status: str | None = Query(default=None, alias="status", pattern="^(queued|running|succeeded|failed|timed_out)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user=Depends(current_user),
):
    items, total = store.list_generation_tasks(
        user["id"],
        project_id=project_id,
        media_type=media_type,
        status=task_status,
        page=page,
        page_size=page_size,
    )
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/{task_id}", response_model=GenerationTaskItem)
def get_generation_task(task_id: str, user=Depends(current_user)):
    task = store.get_generation_task(task_id)
    if task is None or task["user_id"] != user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Generation task not found")
    return task
