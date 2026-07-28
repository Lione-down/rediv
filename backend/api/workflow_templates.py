from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import ValidationError

from controllers import workflow_templates as workflow_template_controller
from core.security import current_user
from schemas.workflow_template import (
    WorkflowTemplateLifecycleCreateRequest,
    WorkflowTemplateLifecycleListResponse,
    WorkflowTemplateLifecycleNewVersionRequest,
    WorkflowTemplateLifecycleResponse,
    WorkflowTemplateLifecycleUpdateRequest,
    WorkflowTemplateManifest,
)


router = APIRouter(
    prefix="/api/workflow-templates",
    tags=["workflow-templates"],
)


def _map_lifecycle_error(
    error: workflow_template_controller.WorkflowTemplateLifecycleError,
) -> HTTPException:
    detail = {"code": error.code, "message": str(error)}
    if isinstance(
        error,
        workflow_template_controller.WorkflowTemplateNotFoundError,
    ):
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
        )
    if isinstance(
        error,
        workflow_template_controller.WorkflowTemplateForbiddenError,
    ):
        return HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )
    if isinstance(
        error,
        workflow_template_controller.WorkflowTemplateConflictError,
    ):
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        )
    return HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=detail,
    )


def _validated_manifest(payload: dict) -> WorkflowTemplateManifest:
    try:
        return WorkflowTemplateManifest.model_validate(payload)
    except ValidationError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "workflow_template_manifest_invalid",
                "message": "Workflow-template manifest is invalid",
            },
        ) from None


@router.get("", response_model=WorkflowTemplateLifecycleListResponse)
def list_workflow_templates(user=Depends(current_user)):
    return workflow_template_controller.list_workflow_templates(user["id"])


@router.post(
    "",
    response_model=WorkflowTemplateLifecycleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_workflow_template(
    payload: WorkflowTemplateLifecycleCreateRequest,
    user=Depends(current_user),
):
    try:
        return workflow_template_controller.create_workflow_template(
            _validated_manifest(payload.manifest),
            user["id"],
        )
    except workflow_template_controller.WorkflowTemplateLifecycleError as error:
        raise _map_lifecycle_error(error) from error


@router.get(
    "/{template_id}/versions/{version}",
    response_model=WorkflowTemplateLifecycleResponse,
)
def get_workflow_template(
    template_id: str,
    version: int,
    user=Depends(current_user),
):
    try:
        return workflow_template_controller.get_workflow_template(
            template_id,
            version,
            user["id"],
        )
    except workflow_template_controller.WorkflowTemplateLifecycleError as error:
        raise _map_lifecycle_error(error) from error


@router.patch(
    "/{template_id}/versions/{version}",
    response_model=WorkflowTemplateLifecycleResponse,
)
def update_workflow_template_draft(
    template_id: str,
    version: int,
    payload: WorkflowTemplateLifecycleUpdateRequest,
    user=Depends(current_user),
):
    try:
        return workflow_template_controller.update_workflow_template_draft(
            template_id,
            version,
            _validated_manifest(payload.manifest),
            user["id"],
        )
    except workflow_template_controller.WorkflowTemplateLifecycleError as error:
        raise _map_lifecycle_error(error) from error


@router.post(
    "/{template_id}/versions",
    response_model=WorkflowTemplateLifecycleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_workflow_template_version(
    template_id: str,
    payload: WorkflowTemplateLifecycleNewVersionRequest,
    user=Depends(current_user),
):
    try:
        return workflow_template_controller.create_workflow_template_version(
            template_id,
            payload.source_version,
            user["id"],
        )
    except workflow_template_controller.WorkflowTemplateLifecycleError as error:
        raise _map_lifecycle_error(error) from error


@router.post(
    "/{template_id}/versions/{version}/publish",
    response_model=WorkflowTemplateLifecycleResponse,
)
def publish_workflow_template_version(
    template_id: str,
    version: int,
    user=Depends(current_user),
):
    try:
        return workflow_template_controller.publish_workflow_template_version(
            template_id,
            version,
            user["id"],
        )
    except workflow_template_controller.WorkflowTemplateLifecycleError as error:
        raise _map_lifecycle_error(error) from error


@router.post(
    "/{template_id}/versions/{version}/retire",
    response_model=WorkflowTemplateLifecycleResponse,
)
def retire_workflow_template_version(
    template_id: str,
    version: int,
    user=Depends(current_user),
):
    try:
        return workflow_template_controller.retire_workflow_template_version(
            template_id,
            version,
            user["id"],
        )
    except workflow_template_controller.WorkflowTemplateLifecycleError as error:
        raise _map_lifecycle_error(error) from error
