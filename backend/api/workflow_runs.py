from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import ValidationError

from core.security import current_user
from schemas.workflow_run import (
    WorkflowRunPreflightRequest,
    WorkflowRunResponse,
    WorkflowRunStartRequest,
)
from services.workflow_templates import runs as run_service


router = APIRouter(
    prefix=(
        "/api/projects/{project_id}/canvases/{canvas_id}"
        "/workflow-template-instances/{instance_id}/runs"
    ),
    tags=["workflow-runs"],
)


def _validated(payload: dict, model, *, code: str):
    try:
        return model.model_validate(payload)
    except ValidationError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": code, "message": "Workflow-run request is invalid"},
        ) from None


def _service_error(error: run_service.WorkflowRunServiceError) -> HTTPException:
    detail = {"code": error.code, "message": str(error)}
    if isinstance(error, run_service.WorkflowRunNotFoundError):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)
    if isinstance(error, run_service.WorkflowRunConflictError):
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)
    return HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=detail,
    )


@router.post("/preflight")
def preflight_workflow_run(
    project_id: str,
    canvas_id: str,
    instance_id: str,
    payload: dict,
    user=Depends(current_user),
):
    request = _validated(
        payload,
        WorkflowRunPreflightRequest,
        code="workflow_run_preflight_invalid",
    )
    try:
        return run_service.preflight_workflow_run(
            owner_user_id=user["id"],
            project_id=project_id,
            canvas_id=canvas_id,
            instance_id=instance_id,
            cost_confirmed=request.cost_confirmed,
        )
    except run_service.WorkflowRunServiceError as error:
        raise _service_error(error) from error


@router.post("", response_model=WorkflowRunResponse, status_code=status.HTTP_202_ACCEPTED)
def start_workflow_run(
    project_id: str,
    canvas_id: str,
    instance_id: str,
    payload: dict,
    response: Response,
    user=Depends(current_user),
):
    request = _validated(
        payload,
        WorkflowRunStartRequest,
        code="workflow_run_start_invalid",
    )
    try:
        result = run_service.start_workflow_run(
            owner_user_id=user["id"],
            project_id=project_id,
            canvas_id=canvas_id,
            instance_id=instance_id,
            request=request,
        )
    except run_service.WorkflowRunServiceError as error:
        raise _service_error(error) from error
    is_replay = result.pop("_is_replay", False)
    response.status_code = status.HTTP_200_OK if is_replay else status.HTTP_202_ACCEPTED
    return result


@router.get("/latest", response_model=WorkflowRunResponse)
def get_latest_workflow_run(
    project_id: str,
    canvas_id: str,
    instance_id: str,
    user=Depends(current_user),
):
    try:
        return run_service.get_workflow_run(
            owner_user_id=user["id"],
            project_id=project_id,
            canvas_id=canvas_id,
            instance_id=instance_id,
            run_id=None,
        )
    except run_service.WorkflowRunServiceError as error:
        raise _service_error(error) from error


@router.get("/{run_id}", response_model=WorkflowRunResponse)
def get_workflow_run(
    project_id: str,
    canvas_id: str,
    instance_id: str,
    run_id: str,
    user=Depends(current_user),
):
    try:
        return run_service.get_workflow_run(
            owner_user_id=user["id"],
            project_id=project_id,
            canvas_id=canvas_id,
            instance_id=instance_id,
            run_id=run_id,
        )
    except run_service.WorkflowRunServiceError as error:
        raise _service_error(error) from error


@router.post("/{run_id}/cancel", response_model=WorkflowRunResponse)
def cancel_workflow_run(
    project_id: str,
    canvas_id: str,
    instance_id: str,
    run_id: str,
    user=Depends(current_user),
):
    try:
        return run_service.cancel_workflow_run(
            owner_user_id=user["id"],
            project_id=project_id,
            canvas_id=canvas_id,
            instance_id=instance_id,
            run_id=run_id,
        )
    except run_service.WorkflowRunServiceError as error:
        raise _service_error(error) from error
