from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import select

from controllers import quotas as quota_controller
from controllers.generation_records import (
    asset_to_dict as _asset_to_dict,
    ledger_to_dict as _ledger_to_dict,
    quota_to_dict as _quota_to_dict,
    sync_task_cache as _sync_task_cache,
    task_to_dict as _task_to_dict,
)
from controllers.generation_reservations import ACTIVE_TASK_STATUSES, lock_active_reservations
from controllers.resource_scope import resolve_database_resource_scope
from controllers.store import store
from models.asset import Asset
from models.base import get_session, utc_now
from models.generation_task import GenerationTask
from models.quota import Quota, QuotaLedger
from models.user import User


class GenerationTransactionError(Exception):
    pass


class GenerationScopeNotFoundError(GenerationTransactionError):
    pass


class GenerationForbiddenError(GenerationTransactionError):
    pass


class GenerationFrozenError(GenerationTransactionError):
    pass


class GenerationQuotaError(GenerationTransactionError):
    def __init__(self, quota_type: str) -> None:
        self.quota_type = quota_type
        super().__init__(f"Insufficient {quota_type} quota")


class GenerationValidationError(GenerationTransactionError):
    pass


class GenerationPersistenceError(GenerationTransactionError):
    pass


class GenerationTaskStateError(GenerationTransactionError):
    pass


def _map_scope_error(error: KeyError | PermissionError) -> GenerationTransactionError:
    message = str(error.args[0])
    if isinstance(error, KeyError):
        return GenerationScopeNotFoundError(message)
    return GenerationForbiddenError(message)


def _resolve_input_image_urls(
    session,
    *,
    user_id: str,
    project_id: str,
    image_ids: list[str] | None,
) -> list[str] | None:
    if not image_ids:
        return None
    ordered_ids = list(dict.fromkeys(image_ids))
    assets = list(
        session.scalars(
            select(Asset).where(Asset.id.in_(ordered_ids)).with_for_update()
        ).all()
    )
    assets_by_id = {asset.id: asset for asset in assets}
    urls: list[str] = []
    for image_id in ordered_ids:
        asset = assets_by_id.get(image_id)
        if asset is None or asset.status != "active":
            raise GenerationScopeNotFoundError("Image asset not found")
        if asset.user_id != user_id or asset.project_id != project_id:
            raise GenerationForbiddenError("Image asset does not belong to project")
        if asset.type != "image":
            raise GenerationValidationError("Asset must be an image")
        if not asset.url:
            raise GenerationValidationError("Image asset URL is required")
        urls.append(asset.url)
    return urls


def _start_generation_task(
    *,
    user_id: str,
    media_type: str,
    provider: str,
    model: str,
    project_id: str,
    origin_canvas_id: str | None,
    canvas_node_id: str | None,
    image_ids: list[str] | None,
) -> tuple[dict, list[str] | None]:
    try:
        with get_session() as session:
            user = session.scalar(select(User).where(User.id == user_id))
            if user is None:
                raise GenerationScopeNotFoundError("User not found")
            if user.generation_status != "enabled":
                raise GenerationFrozenError("Generation is frozen")
            scope = resolve_database_resource_scope(
                session,
                user_id=user_id,
                project_id=project_id,
                origin_canvas_id=origin_canvas_id,
                canvas_node_id=canvas_node_id,
            )
            quota = session.scalar(
                select(Quota).where(Quota.user_id == user_id).with_for_update()
            )
            if quota is None or getattr(quota, f"{media_type}_quota") < 1:
                raise GenerationQuotaError(media_type)
            input_image_urls = _resolve_input_image_urls(
                session,
                user_id=user_id,
                project_id=scope.project_id,
                image_ids=image_ids,
            )
            reservation_count = lock_active_reservations(
                session,
                user_id=user_id,
                media_type=media_type,
            )
            if getattr(quota, f"{media_type}_quota") <= reservation_count:
                raise GenerationQuotaError(media_type)
            timestamp = utc_now()
            task = GenerationTask(
                id=str(uuid4()),
                user_id=user_id,
                project_id=scope.project_id,
                origin_canvas_id=scope.origin_canvas_id,
                canvas_node_id=canvas_node_id,
                media_type=media_type,
                provider=provider,
                model=model,
                provider_request_id=None,
                status="running",
                duration_ms=None,
                result_asset_id=None,
                error_code=None,
                error_message=None,
                created_at=timestamp,
                updated_at=timestamp,
            )
            session.add(task)
            session.flush()
            task_payload = _task_to_dict(task)
            session.commit()
    except (GenerationTransactionError,):
        raise
    except (KeyError, PermissionError) as error:
        raise _map_scope_error(error) from error

    _sync_task_cache(task_payload)
    return task_payload, input_image_urls


def start_generation_task(
    *,
    user_id: str,
    media_type: str,
    provider: str,
    model: str,
    project_id: str,
    origin_canvas_id: str | None,
    canvas_node_id: str | None,
) -> dict:
    task, _input_image_urls = _start_generation_task(
        user_id=user_id,
        media_type=media_type,
        provider=provider,
        model=model,
        project_id=project_id,
        origin_canvas_id=origin_canvas_id,
        canvas_node_id=canvas_node_id,
        image_ids=None,
    )
    return task


def start_image_generation_task(
    *,
    user_id: str,
    provider: str,
    model: str,
    project_id: str,
    origin_canvas_id: str | None,
    canvas_node_id: str | None,
    image_ids: list[str] | None,
) -> tuple[dict, list[str] | None]:
    return _start_generation_task(
        user_id=user_id,
        media_type="image",
        provider=provider,
        model=model,
        project_id=project_id,
        origin_canvas_id=origin_canvas_id,
        canvas_node_id=canvas_node_id,
        image_ids=image_ids,
    )


def update_generation_task_state(task_id: str, **fields) -> dict:
    with get_session() as session:
        task = session.scalar(
            select(GenerationTask).where(GenerationTask.id == task_id).with_for_update()
        )
        if task is None:
            raise GenerationScopeNotFoundError("Generation task not found")
        if task.status in ACTIVE_TASK_STATUSES:
            if fields.get("status", "running") not in ACTIVE_TASK_STATUSES:
                raise GenerationTaskStateError("Running task updates cannot set a terminal state")
            for key, value in fields.items():
                setattr(task, key, value)
            task.updated_at = utc_now()
        session.flush()
        task_payload = _task_to_dict(task)
        session.commit()
    _sync_task_cache(task_payload)
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
            task.updated_at = utc_now()
        session.flush()
        task_payload = _task_to_dict(task)
        session.commit()
    _sync_task_cache(task_payload)
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
    task.updated_at = utc_now()


def complete_generation_task(
    task_id: str,
    *,
    asset_type: str,
    url: str | None,
    content_text: str | None,
    source_model: str,
    duration_ms: int,
    provider_request_id: str | None,
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
                    _sync_task_cache(task_payload)
                raise mapped_error from error
            quota = session.scalar(
                select(Quota).where(Quota.user_id == task_snapshot.user_id).with_for_update()
            )
            task = _load_task_for_update(session, task_id)
            if task is None:
                raise GenerationScopeNotFoundError("Generation task not found")
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
                quota_field = f"{task.media_type}_quota"
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
                    task.duration_ms = duration_ms
                    task.provider_request_id = provider_request_id
                    task.result_asset_id = asset.id
                    task.error_code = None
                    task.error_message = None
                    task.updated_at = timestamp
                    setattr(quota, quota_field, getattr(quota, quota_field) - 1)
                    quota.revision += 1
                    ledger = QuotaLedger(
                        id=str(uuid4()),
                        user_id=task.user_id,
                        quota_type=task.media_type,
                        change_amount=-1,
                        reason=f"{task.media_type}_generate",
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

    _sync_task_cache(task_payload)
    quota_controller.sync_quota_snapshot(
        task_payload["user_id"], quota_payload, quota_revision
    )
    if quota_unavailable:
        raise GenerationQuotaError(task_payload["media_type"])
    store.assets[asset_payload["id"]] = asset_payload
    if ledger_payload is not None:
        store.quota_ledger.append(ledger_payload)
    return {
        "asset": asset_payload,
        "generation_task": task_payload,
        "quotas": quota_payload,
        "quota_revision": quota_revision,
    }
