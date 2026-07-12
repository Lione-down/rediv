from fastapi import APIRouter, Depends, HTTPException, Response, status

from controllers.store import store
from core.security import current_user
from schemas.canvas_node import (
    CanvasNodeCreateRequest,
    CanvasNodeListResponse,
    CanvasNodeResponse,
    CanvasNodeUpdateRequest,
)


router = APIRouter(prefix="/projects/{project_id}/nodes", tags=["canvas-nodes"])


def _verify_project_ownership(project_id: str, user_id: str) -> dict:
    project = store.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project["user_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return project


def _get_project_node_or_error(project_id: str, node_id: str) -> dict:
    node = store.get_node(node_id)
    if node is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Node not found")
    if node["project_id"] != project_id or node.get("canvas_id") != store.get_first_canvas_id(project_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return node


@router.post("", response_model=CanvasNodeResponse, status_code=status.HTTP_201_CREATED)
def create_node(project_id: str, payload: CanvasNodeCreateRequest, user=Depends(current_user)):
    """在项目中创建新节点"""
    _verify_project_ownership(project_id, user["id"])
    return store.create_node(
        project_id=project_id,
        user_id=user["id"],
        node_type=payload.node_type,
        content=payload.content,
        position_x=payload.position_x,
        position_y=payload.position_y,
        width=payload.width,
        height=payload.height,
    )


@router.get("", response_model=CanvasNodeListResponse)
def list_nodes(project_id: str, user=Depends(current_user)):
    """获取项目的节点列表"""
    _verify_project_ownership(project_id, user["id"])
    items = store.list_nodes(project_id, user["id"])
    return {"items": items, "total": len(items)}


@router.get("/{node_id}", response_model=CanvasNodeResponse)
def get_node(project_id: str, node_id: str, user=Depends(current_user)):
    """获取节点详情"""
    _verify_project_ownership(project_id, user["id"])
    return _get_project_node_or_error(project_id, node_id)


@router.put("/{node_id}", response_model=CanvasNodeResponse)
def update_node(project_id: str, node_id: str, payload: CanvasNodeUpdateRequest, user=Depends(current_user)):
    """更新节点"""
    _verify_project_ownership(project_id, user["id"])
    _get_project_node_or_error(project_id, node_id)
    updated = store.update_node(node_id, user["id"], **payload.model_dump(exclude_none=True))
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Node not found")
    return updated


@router.delete("/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_node(project_id: str, node_id: str, user=Depends(current_user)):
    """删除节点"""
    _verify_project_ownership(project_id, user["id"])
    _get_project_node_or_error(project_id, node_id)
    deleted = store.delete_node(node_id, user["id"])
    if deleted is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Node not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
