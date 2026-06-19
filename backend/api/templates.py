from fastapi import APIRouter, Depends, HTTPException, Response, status

from controllers.store import store
from core.security import current_user
from schemas.template import TemplateCreateRequest, TemplateListResponse, TemplateResponse, TemplateUseResponse


router = APIRouter(prefix="/templates", tags=["templates"])


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
        return store.use_template(template_id, user["id"])
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found") from exc
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden") from exc
