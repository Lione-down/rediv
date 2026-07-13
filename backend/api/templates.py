from fastapi import APIRouter, Depends, HTTPException, Response, status

from api.canvases import map_canvas_domain_error
from controllers import canvas_document_mutations as mutation_controller
from controllers import canvases as canvas_controller
from controllers import template_graphs as template_controller
from controllers import template_projects as template_project_controller
from controllers.store import store
from core.security import current_user
from schemas.template import (
    CanvasTemplateCreateRequest,
    TemplateCreateRequest,
    TemplateInstantiateRequest,
    TemplateInstantiateResponse,
    TemplateListResponse,
    TemplateResponse,
    TemplateUseResponse,
)


router = APIRouter(prefix="/templates", tags=["templates"])
canvas_router = APIRouter(
    prefix="/api/projects/{project_id}/canvases/{canvas_id}/templates",
    tags=["canvas-templates"],
)


def _map_template_error(error: template_controller.TemplateGraphError) -> HTTPException:
    if isinstance(error, template_controller.TemplateGraphNotFoundError):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    if isinstance(error, template_controller.TemplateGraphForbiddenError):
        return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error))


def _owned_template_or_error(template_id: str, user_id: str) -> dict:
    template = store.get_template(template_id)
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    if template["user_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return template


@router.post("", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(payload: TemplateCreateRequest, user=Depends(current_user)):
    try:
        return store.create_template(user["id"], payload.name, payload.project_id)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden") from exc


@router.get("", response_model=TemplateListResponse)
def list_templates(user=Depends(current_user)):
    items = store.list_templates(user["id"])
    return {"items": items, "total": len(items)}


@router.get("/{template_id}", response_model=TemplateResponse)
def get_template(template_id: str, user=Depends(current_user)):
    return _owned_template_or_error(template_id, user["id"])


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(template_id: str, user=Depends(current_user)):
    _owned_template_or_error(template_id, user["id"])
    deleted = store.delete_template(template_id, user["id"])
    if deleted is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{template_id}/use", response_model=TemplateUseResponse)
def use_template(template_id: str, user=Depends(current_user)):
    try:
        return template_project_controller.use_template_in_new_project(template_id, user["id"])
    except template_controller.TemplateGraphError as error:
        raise _map_template_error(error) from error
    except mutation_controller.CanvasDocumentValidationError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
    except canvas_controller.CanvasDomainError as error:
        raise map_canvas_domain_error(error) from error


@canvas_router.post("", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
def capture_canvas_template(
    project_id: str,
    canvas_id: str,
    payload: CanvasTemplateCreateRequest,
    user=Depends(current_user),
):
    try:
        return template_controller.capture_canvas_template(
            project_id,
            canvas_id,
            user["id"],
            payload.name,
        )
    except template_controller.TemplateGraphError as error:
        raise _map_template_error(error) from error


@canvas_router.post(
    "/{template_id}/instantiate",
    response_model=TemplateInstantiateResponse,
    status_code=status.HTTP_201_CREATED,
)
def instantiate_canvas_template(
    project_id: str,
    canvas_id: str,
    template_id: str,
    payload: TemplateInstantiateRequest,
    user=Depends(current_user),
):
    try:
        return template_controller.instantiate_canvas_template(
            project_id,
            canvas_id,
            template_id,
            user["id"],
            payload.model_dump(mode="json"),
        )
    except template_controller.TemplateGraphError as error:
        raise _map_template_error(error) from error
    except mutation_controller.CanvasDocumentConflictError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": error.code, "current_revision": error.current_revision},
        ) from error
    except mutation_controller.CanvasDocumentValidationError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
    except canvas_controller.CanvasDomainError as error:
        raise map_canvas_domain_error(error) from error
