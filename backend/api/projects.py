from fastapi import APIRouter, Depends, HTTPException, Response, status

from controllers.store import store
from core.security import current_user
from schemas.project import ProjectCreateRequest, ProjectListResponse, ProjectResponse


router = APIRouter(prefix="/projects", tags=["projects"])


def _owned_project_or_error(project_id: str, user_id: str) -> dict:
    project = store.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project["user_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return project


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreateRequest, user=Depends(current_user)):
    """创建新项目"""
    return store.create_project(user["id"], payload.name)


@router.get("", response_model=ProjectListResponse)
def list_projects(user=Depends(current_user)):
    """获取当前用户的项目列表"""
    items = store.list_projects(user["id"])
    return {"items": items, "total": len(items)}


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, user=Depends(current_user)):
    """获取项目详情，只能访问自己的项目"""
    return _owned_project_or_error(project_id, user["id"])


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str, user=Depends(current_user)):
    """删除项目，只能删除自己的项目"""
    _owned_project_or_error(project_id, user["id"])
    deleted = store.delete_project(project_id, user["id"])
    if deleted is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
