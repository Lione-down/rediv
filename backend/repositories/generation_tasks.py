from __future__ import annotations

from datetime import datetime, timedelta
from uuid import uuid4

from sqlalchemy import and_, or_, select
from sqlalchemy.exc import IntegrityError

from controllers.resource_scope import resolve_database_resource_scope
from models.base import get_session
from models.base import utc_now
from models.generation_task import GenerationTask
from models.quota import Quota
from models.user import User
from repositories.records import generation_task_record


class GenerationJobRepositoryError(Exception):
    pass


class GenerationJobNotFoundError(GenerationJobRepositoryError):
    pass


class GenerationJobForbiddenError(GenerationJobRepositoryError):
    pass


class GenerationJobIdempotencyConflictError(GenerationJobRepositoryError):
    pass


class GenerationJobStateError(GenerationJobRepositoryError):
    pass


class GenerationTaskRepository:
    def get(self, task_id: str) -> dict | None:
        with get_session() as session:
            row = session.get(GenerationTask, task_id)
            return generation_task_record(row) if row is not None else None

    def submit_job(
        self,
        *,
        user_id: str,
        project_id: str,
        canvas_id: str,
        node_id: str,
        media_type: str,
        provider_id: str,
        model_id: str,
        client_request_id: str,
        request_fingerprint: str,
        request_parameters: dict,
    ) -> tuple[dict, int]:
        timestamp = utc_now()
        try:
            with get_session() as session:
                user = session.get(User, user_id)
                if user is None:
                    raise GenerationJobNotFoundError("User not found")
                existing = session.scalar(
                    select(GenerationTask)
                    .where(
                        GenerationTask.user_id == user_id,
                        GenerationTask.client_request_id == client_request_id,
                    )
                    .with_for_update()
                )
                if existing is not None:
                    if existing.request_fingerprint != request_fingerprint:
                        raise GenerationJobIdempotencyConflictError(
                            "Client request ID already owns a different generation request"
                        )
                    quota = session.scalar(select(Quota).where(Quota.user_id == user_id))
                    return generation_task_record(existing), quota.revision if quota else 0
                if user.generation_status != "enabled":
                    raise GenerationJobStateError("Generation is frozen")
                try:
                    scope = resolve_database_resource_scope(
                        session,
                        user_id=user_id,
                        project_id=project_id,
                        origin_canvas_id=canvas_id,
                        canvas_node_id=node_id,
                    )
                except KeyError as error:
                    raise GenerationJobNotFoundError(str(error.args[0])) from error
                except PermissionError as error:
                    raise GenerationJobForbiddenError(str(error.args[0])) from error
                quota = session.scalar(
                    select(Quota).where(Quota.user_id == user_id).with_for_update()
                )
                quota_type = "text" if media_type == "script" else media_type
                if quota is None or getattr(quota, f"{quota_type}_quota", 0) < 1:
                    raise GenerationJobStateError(f"Insufficient {media_type} quota")
                task = GenerationTask(
                    id=str(uuid4()),
                    user_id=user_id,
                    project_id=scope.project_id,
                    origin_canvas_id=scope.origin_canvas_id,
                    canvas_node_id=node_id,
                    media_type=media_type,
                    provider=provider_id,
                    model=model_id,
                    client_request_id=client_request_id,
                    request_fingerprint=request_fingerprint,
                    request_parameters=request_parameters,
                    progress_stage="queued",
                    status="queued",
                    job_version=1,
                    attempt_count=0,
                    retry_count=0,
                    created_at=timestamp,
                    updated_at=timestamp,
                )
                session.add(task)
                session.flush()
                payload = generation_task_record(task)
                quota_revision = quota.revision
                session.commit()
                return payload, quota_revision
        except IntegrityError:
            existing = self.get_by_client_request(user_id, client_request_id)
            if existing is None or existing["request_fingerprint"] != request_fingerprint:
                raise GenerationJobIdempotencyConflictError(
                    "Client request ID already owns a different generation request"
                ) from None
            with get_session() as session:
                quota = session.scalar(select(Quota).where(Quota.user_id == user_id))
                return existing, quota.revision if quota else 0

    def get_by_client_request(self, user_id: str, client_request_id: str) -> dict | None:
        with get_session() as session:
            task = session.scalar(
                select(GenerationTask).where(
                    GenerationTask.user_id == user_id,
                    GenerationTask.client_request_id == client_request_id,
                )
            )
            return generation_task_record(task) if task is not None else None

    def get_owned(self, user_id: str, task_id: str) -> dict:
        with get_session() as session:
            task = session.get(GenerationTask, task_id)
            if task is None or task.user_id != user_id:
                raise GenerationJobNotFoundError("Generation job not found")
            return generation_task_record(task)

    def claim_next(
        self,
        *,
        owner_id: str,
        lease_seconds: int,
        now: datetime | None = None,
    ) -> dict | None:
        timestamp = now or utc_now()
        with get_session() as session:
            task = session.scalar(
                select(GenerationTask)
                .where(
                    GenerationTask.request_parameters["contract"].as_string()
                    == "revid.generation-job.v2",
                    or_(
                        GenerationTask.status == "queued",
                        and_(
                            GenerationTask.status == "running",
                            GenerationTask.lease_expires_at.is_not(None),
                            GenerationTask.lease_expires_at <= timestamp,
                        ),
                    )
                )
                .order_by(GenerationTask.created_at, GenerationTask.id)
                .limit(1)
                .with_for_update(skip_locked=True)
            )
            if task is None:
                return None
            task.status = "running"
            task.progress_stage = "provider"
            task.lease_owner = owner_id
            task.lease_expires_at = timestamp + timedelta(seconds=lease_seconds)
            task.attempt_count += 1
            task.job_version += 1
            task.updated_at = timestamp
            session.flush()
            payload = generation_task_record(task)
            session.commit()
            return payload

    def heartbeat(
        self,
        task_id: str,
        *,
        owner_id: str,
        lease_seconds: int,
        progress: float | None = None,
    ) -> dict:
        timestamp = utc_now()
        with get_session() as session:
            task = session.scalar(
                select(GenerationTask)
                .where(
                    GenerationTask.id == task_id,
                    GenerationTask.status.in_(("running", "cancel_requested")),
                    GenerationTask.lease_owner == owner_id,
                )
                .with_for_update()
            )
            if task is None:
                raise GenerationJobStateError("Generation job lease is no longer owned")
            task.lease_expires_at = timestamp + timedelta(seconds=lease_seconds)
            if progress is not None:
                task.progress_percent = progress
            task.job_version += 1
            task.updated_at = timestamp
            session.flush()
            payload = generation_task_record(task)
            session.commit()
            return payload

    def record_provider_request(
        self,
        task_id: str,
        *,
        owner_id: str,
        provider_request_id: str,
    ) -> dict:
        with get_session() as session:
            task = session.scalar(
                select(GenerationTask)
                .where(
                    GenerationTask.id == task_id,
                    GenerationTask.status.in_(("running", "cancel_requested")),
                    GenerationTask.lease_owner == owner_id,
                )
                .with_for_update()
            )
            if task is None:
                raise GenerationJobStateError("Generation job lease is no longer owned")
            task.provider_request_id = provider_request_id
            task.job_version += 1
            task.updated_at = utc_now()
            session.flush()
            payload = generation_task_record(task)
            session.commit()
            return payload

    def release_after_terminal(self, task_id: str, *, owner_id: str) -> dict:
        with get_session() as session:
            task = session.scalar(
                select(GenerationTask)
                .where(
                    GenerationTask.id == task_id,
                    GenerationTask.lease_owner == owner_id,
                )
                .with_for_update()
            )
            if task is None:
                raise GenerationJobStateError("Generation job lease is no longer owned")
            if task.status not in {"succeeded", "failed", "timed_out", "cancelled"}:
                raise GenerationJobStateError("Generation job is not terminal")
            task.lease_owner = None
            task.lease_expires_at = None
            task.job_version += 1
            task.updated_at = utc_now()
            session.flush()
            payload = generation_task_record(task)
            session.commit()
            return payload

    def fail_execution(
        self,
        task_id: str,
        *,
        owner_id: str,
        error_code: str,
        error_message: str,
    ) -> dict:
        with get_session() as session:
            task = session.scalar(
                select(GenerationTask)
                .where(
                    GenerationTask.id == task_id,
                    GenerationTask.status == "running",
                    GenerationTask.lease_owner == owner_id,
                )
                .with_for_update()
            )
            if task is None:
                raise GenerationJobStateError("Generation job lease is no longer owned")
            task.status = "failed"
            task.progress_stage = None
            task.error_code = error_code
            task.error_message = error_message
            task.lease_owner = None
            task.lease_expires_at = None
            task.job_version += 1
            task.updated_at = utc_now()
            session.flush()
            payload = generation_task_record(task)
            session.commit()
            return payload

    def finish_cancellation(self, task_id: str, *, owner_id: str) -> dict:
        with get_session() as session:
            task = session.scalar(
                select(GenerationTask)
                .where(
                    GenerationTask.id == task_id,
                    GenerationTask.status == "cancel_requested",
                    GenerationTask.lease_owner == owner_id,
                )
                .with_for_update()
            )
            if task is None:
                raise GenerationJobStateError("Generation job cancellation is no longer owned")
            task.status = "cancelled"
            task.progress_stage = None
            task.error_code = None
            task.error_message = None
            task.lease_owner = None
            task.lease_expires_at = None
            task.job_version += 1
            task.updated_at = utc_now()
            session.flush()
            payload = generation_task_record(task)
            session.commit()
            return payload

    def cancel(self, user_id: str, task_id: str) -> dict:
        with get_session() as session:
            task = session.scalar(
                select(GenerationTask)
                .where(
                    GenerationTask.id == task_id,
                    GenerationTask.user_id == user_id,
                )
                .with_for_update()
            )
            if task is None:
                raise GenerationJobNotFoundError("Generation job not found")
            if task.status == "queued":
                task.status = "cancelled"
                task.progress_stage = None
            elif task.status == "running":
                task.status = "cancel_requested"
            elif task.status not in {"cancel_requested", "cancelled"}:
                raise GenerationJobStateError("Only active generation jobs can be cancelled")
            task.cancel_requested_at = task.cancel_requested_at or utc_now()
            task.job_version += 1
            task.updated_at = utc_now()
            session.flush()
            payload = generation_task_record(task)
            session.commit()
            return payload

    def retry(self, user_id: str, task_id: str) -> dict:
        with get_session() as session:
            task = session.scalar(
                select(GenerationTask)
                .where(
                    GenerationTask.id == task_id,
                    GenerationTask.user_id == user_id,
                )
                .with_for_update()
            )
            if task is None:
                raise GenerationJobNotFoundError("Generation job not found")
            if task.status not in {"failed", "timed_out", "cancelled"}:
                raise GenerationJobStateError("Only terminal retryable generation jobs can be retried")
            task.status = "queued"
            task.progress_stage = "queued"
            task.progress_percent = None
            task.provider_request_id = None
            task.result_asset_id = None
            task.error_code = None
            task.error_message = None
            task.lease_owner = None
            task.lease_expires_at = None
            task.cancel_requested_at = None
            task.retry_count += 1
            task.job_version += 1
            task.updated_at = utc_now()
            session.flush()
            payload = generation_task_record(task)
            session.commit()
            return payload

    def list_for_canvas(
        self,
        *,
        user_id: str,
        project_id: str,
        canvas_id: str,
        after_updated_at: datetime | None,
        after_id: str | None,
        limit: int,
    ) -> list[dict]:
        with get_session() as session:
            try:
                resolve_database_resource_scope(
                    session,
                    user_id=user_id,
                    project_id=project_id,
                    origin_canvas_id=canvas_id,
                    canvas_node_id=None,
                )
            except KeyError as error:
                raise GenerationJobNotFoundError(str(error.args[0])) from error
            except PermissionError as error:
                raise GenerationJobForbiddenError(str(error.args[0])) from error
            statement = select(GenerationTask).where(
                GenerationTask.user_id == user_id,
                GenerationTask.project_id == project_id,
                GenerationTask.origin_canvas_id == canvas_id,
            )
            if after_updated_at is not None and after_id is not None:
                statement = statement.where(
                    or_(
                        GenerationTask.updated_at > after_updated_at,
                        and_(
                            GenerationTask.updated_at == after_updated_at,
                            GenerationTask.id > after_id,
                        ),
                    )
                )
            statement = statement.order_by(
                GenerationTask.updated_at,
                GenerationTask.id,
            ).limit(limit)
            return [
                generation_task_record(task)
                for task in session.scalars(statement).all()
            ]
