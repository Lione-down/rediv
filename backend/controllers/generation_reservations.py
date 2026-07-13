from __future__ import annotations

from datetime import timedelta

from sqlalchemy import select

from models.base import get_session, utc_now
from models.generation_task import GenerationTask


ACTIVE_TASK_STATUSES = ("queued", "running")
GENERATION_RESERVATION_LEASE = timedelta(minutes=15)


def _expire_task(task: GenerationTask, timestamp) -> None:
    task.status = "timed_out"
    task.error_code = "reservation_expired"
    task.error_message = "Generation reservation expired before completion"
    task.updated_at = timestamp


def lock_active_reservations(session, *, user_id: str, media_type: str) -> int:
    timestamp = utc_now()
    cutoff = timestamp - GENERATION_RESERVATION_LEASE
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


def reconcile_stale_generation_reservations() -> int:
    timestamp = utc_now()
    cutoff = timestamp - GENERATION_RESERVATION_LEASE
    with get_session() as session:
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
