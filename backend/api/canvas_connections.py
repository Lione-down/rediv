from fastapi import APIRouter, Depends, HTTPException, Response, status

from controllers.store import store
from core.security import current_user
from schemas.canvas_connection import (
    CanvasConnectionCreateRequest,
    CanvasConnectionListResponse,
    CanvasConnectionResponse,
    CanvasConnectionUpdateRequest,
)


router = APIRouter(prefix="/projects/{project_id}/connections", tags=["canvas-connections"])


def _verify_project_ownership(project_id: str, user_id: str) -> dict:
    project = store.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project["user_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return project


def _get_project_connection_or_error(project_id: str, connection_id: str) -> dict:
    connection = store.get_connection(connection_id)
    if connection is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Connection not found")
    if connection["project_id"] != project_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return connection


def _connection_error(exc: ValueError) -> HTTPException:
    message = str(exc)
    if "already exists" in message:
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=message)
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)


@router.post("", response_model=CanvasConnectionResponse, status_code=status.HTTP_201_CREATED)
def create_connection(project_id: str, payload: CanvasConnectionCreateRequest, user=Depends(current_user)):
    _verify_project_ownership(project_id, user["id"])
    try:
        return store.create_connection(
            project_id=project_id,
            user_id=user["id"],
            source_node_id=payload.source_node_id,
            source_port=payload.source_port,
            target_node_id=payload.target_node_id,
            target_port=payload.target_port,
            metadata=payload.metadata,
        )
    except ValueError as exc:
        raise _connection_error(exc) from exc


@router.get("", response_model=CanvasConnectionListResponse)
def list_connections(project_id: str, user=Depends(current_user)):
    _verify_project_ownership(project_id, user["id"])
    items = store.list_connections(project_id, user["id"])
    return {"items": items, "total": len(items)}


@router.put("/{connection_id}", response_model=CanvasConnectionResponse)
def update_connection(
    project_id: str,
    connection_id: str,
    payload: CanvasConnectionUpdateRequest,
    user=Depends(current_user),
):
    _verify_project_ownership(project_id, user["id"])
    _get_project_connection_or_error(project_id, connection_id)
    try:
        updated = store.update_connection(connection_id, user["id"], **payload.model_dump(exclude_none=True))
    except ValueError as exc:
        raise _connection_error(exc) from exc
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Connection not found")
    return updated


@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_connection(project_id: str, connection_id: str, user=Depends(current_user)):
    _verify_project_ownership(project_id, user["id"])
    _get_project_connection_or_error(project_id, connection_id)
    deleted = store.delete_connection(connection_id, user["id"])
    if deleted is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Connection not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
