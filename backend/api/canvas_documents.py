from fastapi import APIRouter, Depends, HTTPException, Response, status

from api.canvases import map_canvas_domain_error
from controllers import canvas_documents as document_controller
from controllers import canvas_document_mutations as mutation_controller
from controllers import canvases as canvas_controller
from core.security import current_user
from schemas.canvas import CanvasResponse
from schemas.canvas_connection import CanvasConnectionCreateRequest, CanvasConnectionResponse
from schemas.canvas_document import (
    CanvasDocumentPatchRequest,
    CanvasDocumentPatchResponse,
    CanvasDocumentResponse,
    CanvasViewportUpdateRequest,
)
from schemas.canvas_node import CanvasNodeCreateRequest, CanvasNodeResponse, CanvasNodeUpdateRequest


router = APIRouter(
    prefix="/api/projects/{project_id}/canvases/{canvas_id}",
    tags=["canvas-documents"],
)


def _connection_error(error: ValueError) -> HTTPException:
    if "already exists" in str(error):
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))


@router.get("/document", response_model=CanvasDocumentResponse)
def get_document(project_id: str, canvas_id: str, user=Depends(current_user)):
    try:
        return document_controller.get_document(project_id, canvas_id, user["id"])
    except canvas_controller.CanvasDomainError as error:
        raise map_canvas_domain_error(error) from error


@router.patch("/document", response_model=CanvasDocumentPatchResponse)
def patch_document(
    project_id: str,
    canvas_id: str,
    payload: CanvasDocumentPatchRequest,
    user=Depends(current_user),
):
    try:
        return mutation_controller.patch_document(
            project_id,
            canvas_id,
            user["id"],
            payload.model_dump(mode="json"),
        )
    except mutation_controller.CanvasDocumentConflictError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": error.code, "current_revision": error.current_revision},
        ) from error
    except mutation_controller.CanvasDocumentValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        ) from error
    except canvas_controller.CanvasDomainError as error:
        raise map_canvas_domain_error(error) from error


@router.patch("/viewport", response_model=CanvasResponse)
def update_viewport(
    project_id: str,
    canvas_id: str,
    payload: CanvasViewportUpdateRequest,
    user=Depends(current_user),
):
    try:
        return document_controller.update_viewport(
            project_id,
            canvas_id,
            user["id"],
            x=payload.x,
            y=payload.y,
            zoom=payload.zoom,
        )
    except canvas_controller.CanvasDomainError as error:
        raise map_canvas_domain_error(error) from error


@router.post("/nodes", response_model=CanvasNodeResponse, status_code=status.HTTP_201_CREATED)
def create_node(
    project_id: str,
    canvas_id: str,
    payload: CanvasNodeCreateRequest,
    user=Depends(current_user),
):
    try:
        return document_controller.create_node(
            project_id=project_id,
            user_id=user["id"],
            canvas_id=canvas_id,
            node_type=payload.node_type,
            content=payload.content,
            position_x=payload.position_x,
            position_y=payload.position_y,
            width=payload.width,
            height=payload.height,
            z_index=payload.z_index,
            parent_node_id=payload.parent_node_id,
            is_locked=payload.is_locked,
            is_collapsed=payload.is_collapsed,
        )
    except ValueError as error:
        raise _connection_error(error) from error
    except canvas_controller.CanvasDomainError as error:
        raise map_canvas_domain_error(error) from error


@router.put("/nodes/{node_id}", response_model=CanvasNodeResponse)
def update_node(
    project_id: str,
    canvas_id: str,
    node_id: str,
    payload: CanvasNodeUpdateRequest,
    user=Depends(current_user),
):
    try:
        return document_controller.update_node(
            project_id,
            canvas_id,
            node_id,
            user["id"],
            **payload.model_dump(exclude_unset=True),
        )
    except ValueError as error:
        raise _connection_error(error) from error
    except canvas_controller.CanvasDomainError as error:
        raise map_canvas_domain_error(error) from error


@router.delete("/nodes/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_node(project_id: str, canvas_id: str, node_id: str, user=Depends(current_user)):
    try:
        document_controller.delete_node(project_id, canvas_id, node_id, user["id"])
    except canvas_controller.CanvasDomainError as error:
        raise map_canvas_domain_error(error) from error
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/connections", response_model=CanvasConnectionResponse, status_code=status.HTTP_201_CREATED)
def create_connection(
    project_id: str,
    canvas_id: str,
    payload: CanvasConnectionCreateRequest,
    user=Depends(current_user),
):
    try:
        return document_controller.create_connection(
            project_id=project_id,
            user_id=user["id"],
            canvas_id=canvas_id,
            source_node_id=payload.source_node_id,
            source_port=payload.source_port,
            target_node_id=payload.target_node_id,
            target_port=payload.target_port,
            metadata=payload.metadata,
        )
    except canvas_controller.CanvasDomainError as error:
        raise map_canvas_domain_error(error) from error
    except ValueError as error:
        raise _connection_error(error) from error


@router.delete("/connections/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_connection(
    project_id: str,
    canvas_id: str,
    connection_id: str,
    user=Depends(current_user),
):
    try:
        document_controller.delete_connection(project_id, canvas_id, connection_id, user["id"])
    except canvas_controller.CanvasDomainError as error:
        raise map_canvas_domain_error(error) from error
    return Response(status_code=status.HTTP_204_NO_CONTENT)
