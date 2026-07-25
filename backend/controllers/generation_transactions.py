from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import select

from controllers.generation_errors import (
    GenerationDeterministicFailureError,
    GenerationForbiddenError,
    GenerationFrozenError,
    GenerationIdempotencyConflictError,
    GenerationPersistenceError,
    GenerationProviderBusyError,
    GenerationQuotaError,
    GenerationRequestInProgressError,
    GenerationRequestTerminalError,
    GenerationScopeNotFoundError,
    GenerationTaskStateError,
    GenerationTransactionError,
    GenerationValidationError,
)
from controllers.generation_records import (
    asset_to_dict as _asset_to_dict,
    ledger_to_dict as _ledger_to_dict,
    quota_to_dict as _quota_to_dict,
    task_to_dict as _task_to_dict,
)
from controllers.generation_progress import (
    apply_generation_task_state_updates,
    validate_generation_task_state_updates,
)
from controllers.generation_reservations import ACTIVE_TASK_STATUSES
from controllers.generation_starts import (
    GenerationStartResult,
    start_generation_request,
    start_generation_task,
    start_image_generation_request,
    start_image_generation_task,
    start_video_generation_request,
    start_video_generation_task,
)
from controllers.resource_scope import resolve_database_resource_scope
from models.asset import Asset
from models.base import get_session, utc_now
from models.generation_task import GenerationTask
from models.quota import Quota, QuotaLedger


def _map_scope_error(error: KeyError | PermissionError) -> GenerationTransactionError:
    message = str(error.args[0])
    if isinstance(error, KeyError):
        return GenerationScopeNotFoundError(message)
    return GenerationForbiddenError(message)


def update_generation_task_state(task_id: str, **fields) -> dict:
    validate_generation_task_state_updates(fields, GenerationTaskStateError)
    with get_session() as session:
        task = session.scalar(
            select(GenerationTask).where(GenerationTask.id == task_id).with_for_update()
        )
        if task is None:
            raise GenerationScopeNotFoundError("Generation task not found")
        if task.status in ACTIVE_TASK_STATUSES:
            if fields.get("status", task.status) not in ACTIVE_TASK_STATUSES:
                raise GenerationTaskStateError("Running task updates cannot set a terminal state")
            previous_state = tuple(
                getattr(task, field)
                for field in (
                    "duration_ms",
                    "progress_percent",
                    "progress_stage",
                    "provider_request_id",
                    "status",
                )
            )
            apply_generation_task_state_updates(task, fields)
            current_state = tuple(
                getattr(task, field)
                for field in (
                    "duration_ms",
                    "progress_percent",
                    "progress_stage",
                    "provider_request_id",
                    "status",
                )
            )
            if current_state != previous_state:
                task.job_version += 1
                task.updated_at = utc_now()
        session.flush()
        task_payload = _task_to_dict(task)
        session.commit()
    return task_payload


def fail_generation_task(
    task_id: str,
    *,
    status: str,
    duration_ms: int,
    provider_request_id: str | None,
    error_code: str,
    error_message: str,
) -> dict:
    if status not in {"failed", "timed_out"}:
        raise GenerationTaskStateError("Failure status must be failed or timed_out")
    with get_session() as session:
        task = session.scalar(
            select(GenerationTask).where(GenerationTask.id == task_id).with_for_update()
        )
        if task is None:
            raise GenerationScopeNotFoundError("Generation task not found")
        if task.status in ACTIVE_TASK_STATUSES:
            task.status = status
            task.duration_ms = duration_ms
            task.provider_request_id = provider_request_id
            task.result_asset_id = None
            task.error_code = error_code
            task.error_message = error_message
            task.job_version += 1
            task.updated_at = utc_now()
        session.flush()
        task_payload = _task_to_dict(task)
        session.commit()
    return task_payload


def _insert_generated_asset(
    session,
    *,
    task: GenerationTask,
    asset_type: str,
    url: str | None,
    content_text: str | None,
    source_model: str,
    timestamp: datetime,
) -> Asset:
    asset = Asset(
        id=str(uuid4()),
        user_id=task.user_id,
        project_id=task.project_id,
        origin_canvas_id=task.origin_canvas_id,
        canvas_node_id=task.canvas_node_id,
        type=asset_type,
        url=url,
        content_text=content_text,
        source="generation",
        source_model=source_model,
        source_task_id=task.id,
        status="active",
        created_at=timestamp,
        updated_at=timestamp,
    )
    session.add(asset)
    session.flush()
    return asset


def _load_task_for_update(session, task_id: str) -> GenerationTask | None:
    statement = (
        select(GenerationTask)
        .where(GenerationTask.id == task_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    return session.scalar(statement)


def _set_task_failure(
    task: GenerationTask,
    *,
    status: str,
    duration_ms: int,
    provider_request_id: str | None,
    error_code: str,
    error_message: str,
) -> None:
    task.status = status
    task.duration_ms = duration_ms
    task.provider_request_id = provider_request_id
    task.result_asset_id = None
    task.error_code = error_code
    task.error_message = error_message
    task.job_version += 1
    task.updated_at = utc_now()


def _require_execution_lease(task: GenerationTask, lease_owner: str | None) -> None:
    if lease_owner is None:
        return
    if task.status != "running" or task.lease_owner != lease_owner:
        raise GenerationTaskStateError("Generation task execution lease is no longer owned")


def complete_generation_task(
    task_id: str,
    *,
    asset_type: str,
    url: str | None,
    content_text: str | None,
    source_model: str,
    duration_ms: int,
    provider_request_id: str | None,
    lease_owner: str | None = None,
) -> dict:
    quota_unavailable = False
    ledger_payload = None
    try:
        with get_session() as session:
            task_snapshot = session.get(GenerationTask, task_id)
            if task_snapshot is None:
                raise GenerationScopeNotFoundError("Generation task not found")
            try:
                resolve_database_resource_scope(
                    session,
                    user_id=task_snapshot.user_id,
                    project_id=task_snapshot.project_id,
                    origin_canvas_id=task_snapshot.origin_canvas_id,
                    canvas_node_id=task_snapshot.canvas_node_id,
                    require_active=False,
                )
            except (KeyError, PermissionError) as error:
                mapped_error = _map_scope_error(error)
                task = _load_task_for_update(session, task_id)
                if task is not None:
                    _require_execution_lease(task, lease_owner)
                if task is not None and task.status in ACTIVE_TASK_STATUSES:
                    _set_task_failure(
                        task,
                        status="failed",
                        duration_ms=duration_ms,
                        provider_request_id=provider_request_id,
                        error_code="scope_invalidated",
                        error_message=str(mapped_error),
                    )
                    session.flush()
                    task_payload = _task_to_dict(task)
                    session.commit()
                raise mapped_error from error
            quota = session.scalar(
                select(Quota).where(Quota.user_id == task_snapshot.user_id).with_for_update()
            )
            task = _load_task_for_update(session, task_id)
            if task is None:
                raise GenerationScopeNotFoundError("Generation task not found")
            _require_execution_lease(task, lease_owner)
            quota_payload = _quota_to_dict(quota) if quota is not None else {
                "text": 0,
                "image": 0,
                "video": 0,
            }
            if task.status == "succeeded":
                if task.result_asset_id is None:
                    raise GenerationPersistenceError("Succeeded task has no result asset")
                asset = session.scalar(
                    select(Asset)
                    .where(Asset.id == task.result_asset_id)
                    .with_for_update()
                    .execution_options(populate_existing=True)
                )
                if asset is None or asset.source_task_id != task.id:
                    raise GenerationPersistenceError("Succeeded task result asset is missing")
                asset_payload = _asset_to_dict(asset)
                task_payload = _task_to_dict(task)
                quota_revision = quota.revision
                session.commit()
            elif task.status not in ACTIVE_TASK_STATUSES:
                raise GenerationTaskStateError(
                    f'Generation task is already terminal with status "{task.status}"'
                )
            else:
                quota_type = "text" if task.media_type == "script" else task.media_type
                quota_field = f"{quota_type}_quota"
                if quota is None or getattr(quota, quota_field) < 1:
                    _set_task_failure(
                        task,
                        status="failed",
                        duration_ms=duration_ms,
                        provider_request_id=provider_request_id,
                        error_code="quota_exhausted",
                        error_message=f"Insufficient {task.media_type} quota",
                    )
                    session.flush()
                    task_payload = _task_to_dict(task)
                    session.commit()
                    quota_unavailable = True
                else:
                    timestamp = utc_now()
                    asset = _insert_generated_asset(
                        session,
                        task=task,
                        asset_type=asset_type,
                        url=url,
                        content_text=content_text,
                        source_model=source_model,
                        timestamp=timestamp,
                    )
                    task.status = "succeeded"
                    task.progress_percent = 100
                    if lease_owner is not None:
                        task.progress_stage = None
                    task.duration_ms = duration_ms
                    task.provider_request_id = provider_request_id
                    task.result_asset_id = asset.id
                    task.error_code = None
                    task.error_message = None
                    task.job_version += 1
                    task.updated_at = timestamp
                    setattr(quota, quota_field, getattr(quota, quota_field) - 1)
                    quota.revision += 1
                    ledger = QuotaLedger(
                        id=str(uuid4()),
                        user_id=task.user_id,
                        quota_type=quota_type,
                        change_amount=-1,
                        reason=f"{quota_type}_generate",
                        related_task_id=task.id,
                        admin_id=None,
                        created_at=timestamp,
                    )
                    session.add(ledger)
                    session.flush()
                    asset_payload = _asset_to_dict(asset)
                    task_payload = _task_to_dict(task)
                    quota_payload = _quota_to_dict(quota)
                    ledger_payload = _ledger_to_dict(ledger)
                    quota_revision = quota.revision
                    session.commit()
    except GenerationTransactionError:
        raise
    except Exception as error:
        raise GenerationPersistenceError("Failed to persist generated asset") from error

    if quota_unavailable:
        raise GenerationQuotaError(task_payload["media_type"])
    return {
        "asset": asset_payload,
        "generation_task": task_payload,
        "quotas": quota_payload,
        "quota_revision": quota_revision,
    }
