from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import ValidationError

from controllers import canvas_document_mutations as mutation_controller
from controllers import workflow_template_instance_clone as clone_controller
from controllers import workflow_template_instance_lifecycle as lifecycle_controller
from controllers import workflow_template_instances as instance_controller
from controllers import workflow_templates as workflow_template_controller
from core.security import current_user
from schemas.workflow_template_instance import (
    WorkflowTemplateCloneRequest,
    WorkflowTemplateDetachRequest,
    WorkflowTemplateInstanceLifecycleResponse,
    WorkflowTemplateInstanceStateResponse,
    WorkflowTemplateInstantiateRequest,
    WorkflowTemplateInstantiateResponse,
    WorkflowTemplateUpgradeRequest,
    WorkflowTemplateVersionDiffRequest,
    WorkflowTemplateVersionDiffResponse,
)


router = APIRouter(
    prefix="/api/projects/{project_id}/canvases/{canvas_id}/workflow-template-instances",
    tags=["workflow-template-instances"],
)


def _validated_request(payload: dict) -> WorkflowTemplateInstantiateRequest:
    try:
        return WorkflowTemplateInstantiateRequest.model_validate(payload)
    except ValidationError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "workflow_template_instantiate_invalid",
                "message": "Workflow-template instantiate request is invalid",
            },
        ) from None


def _validated_lifecycle_request(payload: dict, model, code: str):
    try:
        return model.model_validate(payload)
    except ValidationError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": code,
                "message": "Workflow-template instance lifecycle request is invalid",
            },
        ) from None


def _lifecycle_error(
    error: workflow_template_controller.WorkflowTemplateLifecycleError,
) -> HTTPException:
    detail = {"code": error.code, "message": str(error)}
    if isinstance(error, workflow_template_controller.WorkflowTemplateNotFoundError):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)
    if isinstance(error, workflow_template_controller.WorkflowTemplateForbiddenError):
        return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)
    if isinstance(error, workflow_template_controller.WorkflowTemplateConflictError):
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)
    return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)


@router.post(
    "",
    response_model=WorkflowTemplateInstantiateResponse,
    status_code=status.HTTP_201_CREATED,
)
def instantiate_workflow_template(
    project_id: str,
    canvas_id: str,
    payload: dict,
    response: Response,
    user=Depends(current_user),
):
    try:
        result = instance_controller.instantiate_workflow_template(
            project_id=project_id,
            canvas_id=canvas_id,
            owner_user_id=user["id"],
            request=_validated_request(payload),
        )
    except workflow_template_controller.WorkflowTemplateLifecycleError as error:
        raise _lifecycle_error(error) from error
    except mutation_controller.CanvasDocumentConflictError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": error.code,
                "message": "Canvas document conflict",
                "current_revision": error.current_revision,
            },
        ) from error
    except mutation_controller.CanvasDocumentValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": str(error),
                "message": "Canvas document mutation is invalid",
            },
        ) from error
    is_replay = result.pop("_is_replay", False)
    response.status_code = status.HTTP_200_OK if is_replay else status.HTTP_201_CREATED
    return result


@router.get(
    "/{instance_id}",
    response_model=WorkflowTemplateInstanceStateResponse,
)
def get_workflow_template_instance(
    project_id: str,
    canvas_id: str,
    instance_id: str,
    user=Depends(current_user),
):
    try:
        return lifecycle_controller.read_instance_state(
            project_id=project_id,
            canvas_id=canvas_id,
            instance_id=instance_id,
            owner_user_id=user["id"],
        )
    except workflow_template_controller.WorkflowTemplateLifecycleError as error:
        raise _lifecycle_error(error) from error


@router.post(
    "/{instance_id}/version-diff",
    response_model=WorkflowTemplateVersionDiffResponse,
)
def preview_workflow_template_version_diff(
    project_id: str,
    canvas_id: str,
    instance_id: str,
    payload: dict,
    user=Depends(current_user),
):
    try:
        return lifecycle_controller.preview_version_diff(
            project_id=project_id,
            canvas_id=canvas_id,
            instance_id=instance_id,
            owner_user_id=user["id"],
            request=_validated_lifecycle_request(
                payload,
                WorkflowTemplateVersionDiffRequest,
                "workflow_template_version_diff_invalid",
            ),
        )
    except workflow_template_controller.WorkflowTemplateLifecycleError as error:
        raise _lifecycle_error(error) from error


@router.post(
    "/{instance_id}/upgrade",
    response_model=WorkflowTemplateInstanceLifecycleResponse,
)
def upgrade_workflow_template_instance(
    project_id: str,
    canvas_id: str,
    instance_id: str,
    payload: dict,
    user=Depends(current_user),
):
    try:
        result = lifecycle_controller.upgrade_instance(
            project_id=project_id,
            canvas_id=canvas_id,
            instance_id=instance_id,
            owner_user_id=user["id"],
            request=_validated_lifecycle_request(
                payload,
                WorkflowTemplateUpgradeRequest,
                "workflow_template_upgrade_invalid",
            ),
        )
    except workflow_template_controller.WorkflowTemplateLifecycleError as error:
        raise _lifecycle_error(error) from error
    except mutation_controller.CanvasDocumentConflictError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": error.code,
                "message": "Canvas document conflict",
                "current_revision": error.current_revision,
            },
        ) from error
    except mutation_controller.CanvasDocumentValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": str(error), "message": "Canvas document mutation is invalid"},
        ) from error
    result.pop("_is_replay", False)
    return result


@router.post(
    "/{instance_id}/clone",
    response_model=WorkflowTemplateInstanceLifecycleResponse,
    status_code=status.HTTP_201_CREATED,
)
def clone_workflow_template_instance(
    project_id: str,
    canvas_id: str,
    instance_id: str,
    payload: dict,
    response: Response,
    user=Depends(current_user),
):
    try:
        result = clone_controller.clone_instance(
            project_id=project_id,
            canvas_id=canvas_id,
            instance_id=instance_id,
            owner_user_id=user["id"],
            request=_validated_lifecycle_request(
                payload,
                WorkflowTemplateCloneRequest,
                "workflow_template_clone_invalid",
            ),
        )
    except workflow_template_controller.WorkflowTemplateLifecycleError as error:
        raise _lifecycle_error(error) from error
    except mutation_controller.CanvasDocumentConflictError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": error.code,
                "message": "Canvas document conflict",
                "current_revision": error.current_revision,
            },
        ) from error
    except mutation_controller.CanvasDocumentValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": str(error), "message": "Canvas document mutation is invalid"},
        ) from error
    is_replay = result.pop("_is_replay", False)
    response.status_code = status.HTTP_200_OK if is_replay else status.HTTP_201_CREATED
    return result


@router.post(
    "/{instance_id}/detach",
    response_model=WorkflowTemplateInstanceLifecycleResponse,
)
def detach_workflow_template_instance(
    project_id: str,
    canvas_id: str,
    instance_id: str,
    payload: dict,
    user=Depends(current_user),
):
    try:
        result = lifecycle_controller.detach_instance(
            project_id=project_id,
            canvas_id=canvas_id,
            instance_id=instance_id,
            owner_user_id=user["id"],
            request=_validated_lifecycle_request(
                payload,
                WorkflowTemplateDetachRequest,
                "workflow_template_detach_invalid",
            ),
        )
    except workflow_template_controller.WorkflowTemplateLifecycleError as error:
        raise _lifecycle_error(error) from error
    except mutation_controller.CanvasDocumentConflictError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": error.code,
                "message": "Canvas document conflict",
                "current_revision": error.current_revision,
            },
        ) from error
    except mutation_controller.CanvasDocumentValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": str(error), "message": "Canvas document mutation is invalid"},
        ) from error
    result.pop("_is_replay", False)
    return result
