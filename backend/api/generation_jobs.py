from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from core.security import current_user
from repositories.generation_tasks import (
    GenerationJobForbiddenError,
    GenerationJobIdempotencyConflictError,
    GenerationJobNotFoundError,
    GenerationJobStateError,
)
from schemas.generation_job import (
    GenerationJobDeltaPage,
    GenerationJobResult,
    GenerationJobStatus,
    GenerationJobSubmitReceipt,
    GenerationJobSubmitRequest,
)
from services.generation.job_service import (
    GenerationJobResultUnavailableError,
    GenerationJobService,
)


router = APIRouter(prefix="/api/v2", tags=["generation-jobs-v2"])


def _service() -> GenerationJobService:
    return GenerationJobService()


def _map_error(error: Exception) -> HTTPException:
    if isinstance(error, GenerationJobIdempotencyConflictError):
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "generation_job_idempotency_conflict",
                "message": str(error),
            },
        )
    if isinstance(error, GenerationJobNotFoundError):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    if isinstance(error, GenerationJobForbiddenError):
        return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    if isinstance(error, GenerationJobResultUnavailableError | GenerationJobStateError):
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))
    if isinstance(error, ValueError):
        return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error))
    return HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Generation job operation failed")


@router.post(
    "/generation-jobs",
    response_model=GenerationJobSubmitReceipt,
    status_code=status.HTTP_202_ACCEPTED,
)
def submit_generation_job(
    payload: GenerationJobSubmitRequest,
    user=Depends(current_user),
):
    try:
        return _service().submit(
            user_id=user["id"],
            project_id=payload.project_id,
            canvas_id=payload.canvas_id,
            node_id=payload.node_id,
            media_type=payload.media_type,
            provider_id=payload.provider_id,
            model_id=payload.model_id,
            client_request_id=payload.client_request_id,
            input_payload=payload.input.model_dump(mode="json"),
        )
    except Exception as error:
        raise _map_error(error) from error


@router.get("/generation-jobs/{job_id}", response_model=GenerationJobStatus)
def get_generation_job(job_id: str, user=Depends(current_user)):
    try:
        return _service().get_status(user["id"], job_id)
    except Exception as error:
        raise _map_error(error) from error


@router.get("/generation-jobs/{job_id}/result", response_model=GenerationJobResult)
def get_generation_job_result(job_id: str, user=Depends(current_user)):
    try:
        return _service().get_result(user["id"], job_id)
    except Exception as error:
        raise _map_error(error) from error


@router.get(
    "/projects/{project_id}/generation-jobs",
    response_model=GenerationJobDeltaPage,
)
def list_generation_job_delta(
    project_id: str,
    canvas_id: str,
    after: str | None = None,
    limit: int = Query(default=100, ge=1, le=100),
    user=Depends(current_user),
):
    try:
        return _service().list_delta(
            user_id=user["id"],
            project_id=project_id,
            canvas_id=canvas_id,
            after=after,
            limit=limit,
        )
    except Exception as error:
        raise _map_error(error) from error


@router.post("/generation-jobs/{job_id}/cancel", response_model=GenerationJobStatus)
def cancel_generation_job(job_id: str, user=Depends(current_user)):
    try:
        return _service().cancel(user["id"], job_id)
    except Exception as error:
        raise _map_error(error) from error


@router.post("/generation-jobs/{job_id}/retry", response_model=GenerationJobStatus)
def retry_generation_job(job_id: str, user=Depends(current_user)):
    try:
        return _service().retry(user["id"], job_id)
    except Exception as error:
        raise _map_error(error) from error
