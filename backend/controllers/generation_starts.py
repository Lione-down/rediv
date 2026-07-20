from __future__ import annotations

from dataclasses import dataclass
from uuid import uuid4

from sqlalchemy import select

from controllers.generation_errors import (
    GenerationForbiddenError,
    GenerationFrozenError,
    GenerationPersistenceError,
    GenerationQuotaError,
    GenerationRequestTerminalError,
    GenerationScopeNotFoundError,
    GenerationTransactionError,
    GenerationValidationError,
)
from controllers.generation_records import (
    asset_to_dict as _asset_to_dict,
    quota_to_dict as _quota_to_dict,
    task_to_dict as _task_to_dict,
)
from controllers.generation_reservations import admit_generation_request, lock_active_reservations
from controllers.resource_scope import resolve_database_resource_scope
from core.agnes_image_reference import AgnesImageReferenceError, resolve_agnes_image_reference
from models.asset import Asset
from models.base import get_session, utc_now
from models.generation_task import GenerationTask
from models.quota import Quota
from models.user import User


@dataclass(frozen=True)
class GenerationStartResult:
    task: dict
    input_image_urls: list[str] | None
    replay_outcome: dict | None = None

    @property
    def is_replay(self) -> bool:
        return self.replay_outcome is not None


def _load_replay_outcome(session, task: GenerationTask) -> dict:
    if task.status != "succeeded" or task.result_asset_id is None:
        raise GenerationRequestTerminalError(task.id, task.status)
    asset = session.get(Asset, task.result_asset_id)
    quota = session.scalar(select(Quota).where(Quota.user_id == task.user_id))
    if asset is None or asset.source_task_id != task.id or quota is None:
        raise GenerationPersistenceError("Succeeded generation replay outcome is incomplete")
    return {
        "asset": _asset_to_dict(asset),
        "generation_task": _task_to_dict(task),
        "quotas": _quota_to_dict(quota),
        "quota_revision": quota.revision,
    }


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
        try:
            urls.append(resolve_agnes_image_reference(asset.url, user_id=user_id))
        except AgnesImageReferenceError as error:
            raise GenerationValidationError(str(error)) from error
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
    request_parameters: dict | None,
    client_request_id: str,
    request_fingerprint: str,
) -> GenerationStartResult:
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
            existing_request_id = session.scalar(
                select(GenerationTask.id).where(
                    GenerationTask.user_id == user_id,
                    GenerationTask.client_request_id == client_request_id,
                )
            )
            input_image_urls = None
            if image_ids and existing_request_id is None:
                input_image_urls = _resolve_input_image_urls(
                    session,
                    user_id=user_id,
                    project_id=scope.project_id,
                    image_ids=image_ids,
                )
            existing = admit_generation_request(
                session,
                user_id=user_id,
                media_type=media_type,
                project_id=scope.project_id,
                origin_canvas_id=scope.origin_canvas_id,
                canvas_node_id=canvas_node_id,
                client_request_id=client_request_id,
                request_fingerprint=request_fingerprint,
            )
            if existing is not None:
                replay_outcome = _load_replay_outcome(session, existing)
                session.commit()
                return GenerationStartResult(
                    task=replay_outcome["generation_task"],
                    input_image_urls=None,
                    replay_outcome=replay_outcome,
                )
            quota = session.scalar(
                select(Quota).where(Quota.user_id == user_id).with_for_update()
            )
            if quota is None or getattr(quota, f"{media_type}_quota") < 1:
                raise GenerationQuotaError(media_type)
            if input_image_urls is None:
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
                client_request_id=client_request_id,
                request_fingerprint=request_fingerprint,
                request_parameters=request_parameters,
                progress_percent=None,
                progress_stage="queued" if media_type in {"image", "video"} else None,
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
    except GenerationTransactionError:
        raise
    except (KeyError, PermissionError) as error:
        raise _map_scope_error(error) from error

    return GenerationStartResult(task=task_payload, input_image_urls=input_image_urls)


def start_generation_task(
    *,
    user_id: str,
    media_type: str,
    provider: str,
    model: str,
    project_id: str,
    origin_canvas_id: str | None,
    canvas_node_id: str | None,
    request_parameters: dict | None = None,
) -> dict:
    result = _start_generation_task(
        user_id=user_id,
        media_type=media_type,
        provider=provider,
        model=model,
        project_id=project_id,
        origin_canvas_id=origin_canvas_id,
        canvas_node_id=canvas_node_id,
        image_ids=None,
        request_parameters=request_parameters,
        client_request_id=str(uuid4()),
        request_fingerprint=str(uuid4()).replace("-", "") * 2,
    )
    return result.task


def start_generation_request(
    *,
    user_id: str,
    media_type: str,
    provider: str,
    model: str,
    project_id: str,
    origin_canvas_id: str | None,
    canvas_node_id: str | None,
    request_parameters: dict | None,
    client_request_id: str,
    request_fingerprint: str,
) -> GenerationStartResult:
    return _start_generation_task(
        user_id=user_id,
        media_type=media_type,
        provider=provider,
        model=model,
        project_id=project_id,
        origin_canvas_id=origin_canvas_id,
        canvas_node_id=canvas_node_id,
        image_ids=None,
        request_parameters=request_parameters,
        client_request_id=client_request_id,
        request_fingerprint=request_fingerprint,
    )


def start_image_generation_task(
    *,
    user_id: str,
    provider: str,
    model: str,
    project_id: str,
    origin_canvas_id: str | None,
    canvas_node_id: str | None,
    image_ids: list[str] | None,
    request_parameters: dict,
) -> tuple[dict, list[str] | None]:
    result = start_image_generation_request(
        user_id=user_id,
        provider=provider,
        model=model,
        project_id=project_id,
        origin_canvas_id=origin_canvas_id,
        canvas_node_id=canvas_node_id,
        image_ids=image_ids,
        request_parameters=request_parameters,
        client_request_id=str(uuid4()),
        request_fingerprint=str(uuid4()).replace("-", "") * 2,
    )
    return result.task, result.input_image_urls


def start_image_generation_request(
    *,
    user_id: str,
    provider: str,
    model: str,
    project_id: str,
    origin_canvas_id: str | None,
    canvas_node_id: str | None,
    image_ids: list[str] | None,
    request_parameters: dict,
    client_request_id: str,
    request_fingerprint: str,
) -> GenerationStartResult:
    return _start_generation_task(
        user_id=user_id,
        media_type="image",
        provider=provider,
        model=model,
        project_id=project_id,
        origin_canvas_id=origin_canvas_id,
        canvas_node_id=canvas_node_id,
        image_ids=image_ids,
        request_parameters=request_parameters,
        client_request_id=client_request_id,
        request_fingerprint=request_fingerprint,
    )


def start_video_generation_task(
    *,
    user_id: str,
    provider: str,
    model: str,
    project_id: str,
    origin_canvas_id: str | None,
    canvas_node_id: str | None,
    image_ids: list[str] | None,
    request_parameters: dict,
) -> tuple[dict, list[str] | None]:
    result = start_video_generation_request(
        user_id=user_id,
        provider=provider,
        model=model,
        project_id=project_id,
        origin_canvas_id=origin_canvas_id,
        canvas_node_id=canvas_node_id,
        image_ids=image_ids,
        request_parameters=request_parameters,
        client_request_id=str(uuid4()),
        request_fingerprint=str(uuid4()).replace("-", "") * 2,
    )
    return result.task, result.input_image_urls


def start_video_generation_request(
    *,
    user_id: str,
    provider: str,
    model: str,
    project_id: str,
    origin_canvas_id: str | None,
    canvas_node_id: str | None,
    image_ids: list[str] | None,
    request_parameters: dict,
    client_request_id: str,
    request_fingerprint: str,
) -> GenerationStartResult:
    return _start_generation_task(
        user_id=user_id,
        media_type="video",
        provider=provider,
        model=model,
        project_id=project_id,
        origin_canvas_id=origin_canvas_id,
        canvas_node_id=canvas_node_id,
        image_ids=image_ids,
        request_parameters=request_parameters,
        client_request_id=client_request_id,
        request_fingerprint=request_fingerprint,
    )
