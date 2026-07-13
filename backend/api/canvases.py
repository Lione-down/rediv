from fastapi import APIRouter, Depends, HTTPException, status

from controllers import canvases as canvas_controller
from core.security import current_user
from schemas.canvas import (
    CanvasCreateRequest,
    CanvasDuplicateRequest,
    CanvasListResponse,
    CanvasMutationResponse,
    CanvasReorderRequest,
    CanvasResponse,
    CanvasUpdateRequest,
)


router = APIRouter(prefix="/api/projects/{project_id}/canvases", tags=["canvases"])


def map_canvas_domain_error(error: canvas_controller.CanvasDomainError) -> HTTPException:
    if isinstance(error, canvas_controller.ProjectNotFoundError | canvas_controller.CanvasNotFoundError):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Canvas or project not found")
    if isinstance(error, canvas_controller.CanvasForbiddenError):
        return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    if isinstance(error, canvas_controller.CanvasConflictError):
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": error.code,
                "current_order_revision": error.current_order_revision,
            },
        )
    return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error))


@router.post("", response_model=CanvasMutationResponse, status_code=status.HTTP_201_CREATED)
def create_canvas(project_id: str, payload: CanvasCreateRequest, user=Depends(current_user)):
    try:
        return canvas_controller.create_canvas(
            project_id,
            user["id"],
            payload.name,
            payload.base_order_revision,
        )
    except canvas_controller.CanvasDomainError as error:
        raise map_canvas_domain_error(error) from error


@router.get("", response_model=CanvasListResponse)
def list_canvases(project_id: str, user=Depends(current_user)):
    try:
        return canvas_controller.list_canvases(project_id, user["id"])
    except canvas_controller.CanvasDomainError as error:
        raise map_canvas_domain_error(error) from error


@router.patch("/order", response_model=CanvasListResponse)
def reorder_canvases(project_id: str, payload: CanvasReorderRequest, user=Depends(current_user)):
    try:
        return canvas_controller.reorder_canvases(
            project_id,
            user["id"],
            payload.base_order_revision,
            payload.ordered_canvas_ids,
        )
    except canvas_controller.CanvasDomainError as error:
        raise map_canvas_domain_error(error) from error


@router.get("/{canvas_id}", response_model=CanvasResponse)
def get_canvas(project_id: str, canvas_id: str, user=Depends(current_user)):
    try:
        return canvas_controller.get_canvas(project_id, canvas_id, user["id"])
    except canvas_controller.CanvasDomainError as error:
        raise map_canvas_domain_error(error) from error


@router.patch("/{canvas_id}", response_model=CanvasMutationResponse)
def update_canvas(
    project_id: str,
    canvas_id: str,
    payload: CanvasUpdateRequest,
    user=Depends(current_user),
):
    try:
        return canvas_controller.update_canvas(
            project_id,
            canvas_id,
            user["id"],
            name=payload.name,
            status=payload.status,
            base_order_revision=payload.base_order_revision,
        )
    except canvas_controller.CanvasDomainError as error:
        raise map_canvas_domain_error(error) from error


@router.post(
    "/{canvas_id}/duplicate",
    response_model=CanvasMutationResponse,
    status_code=status.HTTP_201_CREATED,
)
def duplicate_canvas(
    project_id: str,
    canvas_id: str,
    payload: CanvasDuplicateRequest,
    user=Depends(current_user),
):
    try:
        return canvas_controller.duplicate_canvas(
            project_id,
            canvas_id,
            user["id"],
            payload.base_order_revision,
            payload.name,
        )
    except canvas_controller.CanvasDomainError as error:
        raise map_canvas_domain_error(error) from error
