from __future__ import annotations

from datetime import timedelta

from sqlalchemy import select

from controllers.generation_errors import (
    GenerationIdempotencyConflictError,
    GenerationProviderBusyError,
    GenerationRequestInProgressError,
    GenerationRequestTerminalError,
)
from models.agnes_admission_guard import AgnesAdmissionGuard
from models.base import get_session, utc_now
from models.generation_task import GenerationTask
from settings.config import settings


ACTIVE_TASK_STATUSES = ("queued", "running")

def _reservation_lease() -> timedelta:
    return timedelta(seconds=settings.agnes_admission_lease_seconds)


def _expire_task(task: GenerationTask, timestamp) -> None:
    task.status = "timed_out"
    task.error_code = "reservation_expired"
    task.error_message = "Generation reservation expired before completion"
    task.updated_at = timestamp


def lock_active_reservations(session, *, user_id: str, media_type: str) -> int:
    timestamp = utc_now()
    cutoff = timestamp - _reservation_lease()
    tasks = list(
        session.scalars(
            select(GenerationTask)
            .where(
                GenerationTask.user_id == user_id,
                GenerationTask.media_type == media_type,
                GenerationTask.status.in_(ACTIVE_TASK_STATUSES),
            )
            .with_for_update()
        ).all()
    )
    active_count = 0
    for task in tasks:
        task_cutoff = cutoff if task.updated_at.tzinfo is not None else cutoff.replace(tzinfo=None)
        if task.updated_at < task_cutoff:
            _expire_task(task, timestamp)
        else:
            active_count += 1
    return active_count


def _lock_admission_guard(session, timestamp) -> AgnesAdmissionGuard:
    guard = session.scalar(
        select(AgnesAdmissionGuard)
        .where(AgnesAdmissionGuard.id == 1)
        .with_for_update()
    )
    if guard is None:
        guard = AgnesAdmissionGuard(id=1, updated_at=timestamp)
        session.add(guard)
        session.flush()
    guard.updated_at = timestamp
    return guard


def admit_generation_request(
    session,
    *,
    user_id: str,
    media_type: str,
    project_id: str,
    origin_canvas_id: str | None,
    canvas_node_id: str | None,
    client_request_id: str,
    request_fingerprint: str,
) -> GenerationTask | None:
    timestamp = utc_now()
    cutoff = timestamp - _reservation_lease()
    _lock_admission_guard(session, timestamp)
    existing = session.scalar(
        select(GenerationTask).where(
            GenerationTask.user_id == user_id,
            GenerationTask.client_request_id == client_request_id,
        )
    )
    if existing is not None:
        if existing.request_fingerprint != request_fingerprint:
            raise GenerationIdempotencyConflictError(existing.id)
        if existing.status in ACTIVE_TASK_STATUSES:
            raise GenerationRequestInProgressError(existing.id, duplicate=True)
        if existing.status == "succeeded":
            return existing
        raise GenerationRequestTerminalError(existing.id, existing.status)

    active_tasks = list(
        session.scalars(
            select(GenerationTask)
            .where(GenerationTask.status.in_(ACTIVE_TASK_STATUSES))
            .with_for_update()
        ).all()
    )
    active: list[GenerationTask] = []
    for task in active_tasks:
        task_cutoff = cutoff if task.updated_at.tzinfo is not None else cutoff.replace(tzinfo=None)
        if task.updated_at < task_cutoff:
            _expire_task(task, timestamp)
        else:
            active.append(task)

    same_node = next((task for task in active if (
        task.user_id == user_id and task.project_id == project_id and
        task.origin_canvas_id == origin_canvas_id and task.canvas_node_id == canvas_node_id and
        canvas_node_id is not None
    )), None)
    if same_node is not None:
        raise GenerationRequestInProgressError(same_node.id, duplicate=False)

    media_limit = getattr(settings, f"agnes_admission_{media_type}_limit")
    is_busy = (
        len(active) >= settings.agnes_admission_global_limit or
        sum(task.user_id == user_id for task in active) >= settings.agnes_admission_per_user_limit or
        sum(task.media_type == media_type for task in active) >= media_limit
    )
    if is_busy:
        raise GenerationProviderBusyError(settings.agnes_admission_retry_after_seconds)
    return None


def reconcile_stale_generation_reservations() -> int:
    timestamp = utc_now()
    cutoff = timestamp - _reservation_lease()
    with get_session() as session:
        _lock_admission_guard(session, timestamp)
        tasks = list(
            session.scalars(
                select(GenerationTask)
                .where(
                    GenerationTask.status.in_(ACTIVE_TASK_STATUSES),
                    GenerationTask.updated_at < cutoff,
                )
                .with_for_update()
            ).all()
        )
        for task in tasks:
            _expire_task(task, timestamp)
        session.commit()
    return len(tasks)
