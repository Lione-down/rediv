from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path
from time import monotonic
from typing import Final

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import ValidationError
from starlette.datastructures import FormData, Headers, UploadFile
from starlette.formparsers import MultiPartException, parse_options_header
from starlette.types import Message, Receive

from controllers import assets as asset_controller
from controllers.store import now_iso, store
from core.security import current_user
from core.upload_multipart import (
    ReservedMultiPartParser,
    UploadFileLimitExceeded,
    UploadFormFieldTooLarge,
)
from core.upload_media import (
    UploadEmptyError,
    UploadMediaError,
    UploadStorageFloorError,
    UploadStorageUnavailableError,
    UploadStructureError,
    UploadTooLargeError,
    commit_staged_upload_cancellation_safe,
    is_storage_exhaustion_error,
    remove_upload_file_cancellation_safe,
    validate_staged_upload_in_process,
    validate_upload_metadata,
)
from core.upload_reservation import (
    LocalUploadReservation,
    UploadReservationBusyError,
    UploadUserQuotaError,
)
from schemas.asset import (
    ASSET_CONTENT_TEXT_MAX_LENGTH,
    AssetCreateRequest,
    AssetListResponse,
)
from settings.config import settings


router = APIRouter(prefix="/assets", tags=["assets"])

UPLOAD_REQUEST_OVERHEAD_BYTES: Final = 64 * 1024
UPLOAD_JSON_MAX_BYTES: Final = 128 * 1024
_UPLOAD_MAX_FIELDS: Final = 5
_UPLOAD_FORM_FIELDS: Final = frozenset(
    {"type", "url", "content_text", "project_id", "origin_canvas_id", "file"}
)


class _UploadRequestTooLarge(MultiPartException):
    def __init__(self, limit_error: Exception) -> None:
        super().__init__("Upload request body is too large")
        self.limit_error = limit_error


class _UploadJsonTooLargeError(Exception):
    pass


class _UploadRequestTimeout(Exception):
    pass


def _assert_asset_owner(asset: dict, user_id: str) -> dict:
    if asset["user_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    if asset["status"] != "active":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return asset


def _storage_upload_root() -> Path:
    return Path(settings.storage_local_root) / "uploads"


def _upload_http_error(error: Exception) -> HTTPException:
    if isinstance(error, _UploadRequestTimeout):
        return HTTPException(
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            detail="Upload request timed out",
        )
    if isinstance(error, _UploadJsonTooLargeError):
        return HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Upload JSON body is too large",
        )
    if isinstance(error, UploadReservationBusyError):
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Upload storage is busy",
            headers={"Retry-After": "1"},
        )
    if isinstance(error, UploadUserQuotaError):
        return HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="User upload storage quota exceeded",
        )
    if isinstance(error, UploadStorageFloorError):
        return HTTPException(
            status_code=status.HTTP_507_INSUFFICIENT_STORAGE,
            detail="Insufficient local storage",
        )
    if isinstance(error, UploadStorageUnavailableError):
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Upload storage is unavailable",
            headers={"Retry-After": "1"},
        )
    if isinstance(error, UploadEmptyError):
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")
    if isinstance(error, UploadStructureError):
        return HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="File content does not match file type",
        )
    if isinstance(error, UploadTooLargeError):
        return HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Uploaded file is too large",
        )
    if isinstance(error, UploadMediaError):
        return HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=str(error),
        )
    raise RuntimeError("Unhandled upload error") from error


def _limit_request_body(
    request: Request,
    max_request_bytes: int,
    limit_error: Exception,
    *,
    idle_timeout_seconds: float | None = None,
    total_timeout_seconds: float | None = None,
) -> float | None:
    content_length = request.headers.get("content-length")
    try:
        declared_bytes = int(content_length) if content_length is not None else None
    except ValueError:
        declared_bytes = None
    if declared_bytes is not None and declared_bytes > max_request_bytes:
        raise _upload_http_error(limit_error)

    original_receive: Receive = request._receive
    received_bytes = 0
    deadline = monotonic() + total_timeout_seconds if total_timeout_seconds is not None else None

    async def receive_with_limit() -> Message:
        nonlocal received_bytes
        receive_timeout = idle_timeout_seconds
        if deadline is not None:
            remaining_seconds = deadline - monotonic()
            if remaining_seconds <= 0:
                raise _UploadRequestTimeout
            receive_timeout = min(receive_timeout, remaining_seconds) if receive_timeout else remaining_seconds
        try:
            message = (
                await asyncio.wait_for(original_receive(), timeout=receive_timeout)
                if receive_timeout is not None
                else await original_receive()
            )
        except TimeoutError:
            raise _UploadRequestTimeout from None
        if message["type"] == "http.request":
            received_bytes += len(message.get("body", b""))
            if received_bytes > max_request_bytes:
                raise _UploadRequestTooLarge(limit_error)
        return message

    request._receive = receive_with_limit
    return deadline


def _limit_upload_request_body(request: Request, max_file_bytes: int, limit_error: Exception) -> float:
    deadline = _limit_request_body(
        request,
        max_file_bytes + UPLOAD_REQUEST_OVERHEAD_BYTES,
        limit_error,
        idle_timeout_seconds=settings.asset_upload_idle_timeout_seconds,
        total_timeout_seconds=settings.asset_upload_total_timeout_seconds,
    )
    if deadline is None:
        raise RuntimeError("Upload total timeout is not configured")
    return deadline


def _declared_request_bytes(request: Request) -> int | None:
    try:
        declared_bytes = int(request.headers.get("content-length", ""))
    except ValueError:
        return None
    return declared_bytes if declared_bytes > 0 else None


def _request_validation_error(error: ValidationError) -> HTTPException:
    detail = [
        {
            "type": item["type"],
            "loc": ["body", *item["loc"]],
            "msg": item["msg"],
        }
        for item in error.errors(include_url=False, include_context=False, include_input=False)
    ]
    return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)


def _asset_scope_http_error(error: KeyError | PermissionError) -> HTTPException:
    status_code = status.HTTP_404_NOT_FOUND if isinstance(error, KeyError) else status.HTTP_403_FORBIDDEN
    return HTTPException(status_code=status_code, detail=str(error.args[0]))


def _asset_query_http_error(error: asset_controller.AssetQueryError) -> HTTPException:
    if isinstance(error, asset_controller.AssetProjectNotFoundError | asset_controller.AssetOriginNotFoundError):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))


def _content_media_type(raw_content_type: str) -> str:
    media_type, _ = parse_options_header(raw_content_type)
    return media_type.decode("latin-1").lower()


def _multipart_headers(raw_content_type: str) -> Headers:
    _, separator, parameters = raw_content_type.partition(";")
    normalized = "multipart/form-data" + (separator + parameters if separator else "")
    return Headers({"content-type": normalized})


def _form_contract_error(field: str, error_type: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=[{"type": error_type, "loc": ["body", field], "msg": message}],
    )


def _form_asset_payload(form: FormData) -> AssetCreateRequest:
    values: dict[str, str] = {}
    seen_fields: set[str] = set()
    for key, value in form.multi_items():
        if key not in _UPLOAD_FORM_FIELDS:
            raise _form_contract_error(key, "extra_forbidden", "Extra inputs are not permitted")
        if key in seen_fields:
            raise _form_contract_error(key, "duplicate_field", "Field must not be repeated")
        seen_fields.add(key)
        if key == "file":
            if not isinstance(value, UploadFile):
                raise _form_contract_error(key, "value_error", "File must be a file upload")
            continue
        if isinstance(value, UploadFile):
            raise _form_contract_error(key, "string_type", "Input should be a valid string")
        values[key] = value
    try:
        return AssetCreateRequest.model_validate(values)
    except ValidationError as error:
        raise _request_validation_error(error) from error


async def _persist_asset(
    request_payload: AssetCreateRequest,
    user_id: str,
    asset_url: str | None,
    saved_path: Path | None,
) -> dict:
    if asset_url is None and request_payload.content_text is None:
        if saved_path is not None:
            await remove_upload_file_cancellation_safe(saved_path)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Asset content is required")
    try:
        return store.create_asset(
            user_id,
            request_payload.type,
            asset_url,
            request_payload.content_text,
            project_id=request_payload.project_id,
            origin_canvas_id=request_payload.origin_canvas_id,
            source="upload",
        )
    except Exception as error:
        if saved_path is not None:
            await remove_upload_file_cancellation_safe(saved_path)
        if isinstance(error, (KeyError, PermissionError)):
            raise _asset_scope_http_error(error) from error
        raise


@router.get("", response_model=AssetListResponse)
def list_assets(
    asset_type: str | None = None,
    project_id: str | None = None,
    origin_canvas_id: str | None = None,
    page: int = 1,
    page_size: int = 20,
    user=Depends(current_user),
):
    if page < 1 or page_size < 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid pagination")
    try:
        items, total = asset_controller.list_assets(
            user["id"],
            asset_type=asset_type,
            project_id=project_id,
            origin_canvas_id=origin_canvas_id,
            page=page,
            page_size=page_size,
        )
    except asset_controller.AssetQueryError as error:
        raise _asset_query_http_error(error) from error
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("/upload")
async def upload_asset(request: Request, user=Depends(current_user)):
    raw_content_type = request.headers.get("content-type", "")
    media_type = _content_media_type(raw_content_type)
    if media_type == "application/x-www-form-urlencoded":
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Unsupported content type")
    if media_type == "application/json":
        _limit_request_body(
            request,
            UPLOAD_JSON_MAX_BYTES,
            _UploadJsonTooLargeError(),
            idle_timeout_seconds=settings.asset_upload_idle_timeout_seconds,
            total_timeout_seconds=settings.asset_upload_total_timeout_seconds,
        )
        try:
            raw_payload = await request.json()
        except _UploadRequestTooLarge as error:
            raise _upload_http_error(error.limit_error) from None
        except _UploadRequestTimeout as error:
            raise _upload_http_error(error) from None
        except (json.JSONDecodeError, UnicodeDecodeError):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed JSON body") from None
        try:
            request_payload = AssetCreateRequest.model_validate(raw_payload)
        except ValidationError as error:
            raise _request_validation_error(error) from error
        return await _persist_asset(request_payload, user["id"], request_payload.url, None)
    if media_type != "multipart/form-data":
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Unsupported content type")

    try:
        async with LocalUploadReservation(
            user["id"],
            _storage_upload_root(),
            declared_request_bytes=_declared_request_bytes(request),
        ) as reservation:
            upload_deadline = _limit_upload_request_body(
                request,
                reservation.max_file_bytes,
                reservation.limit_error(),
            )
            stage_file = await reservation.open_stage_file()
            parser = ReservedMultiPartParser(
                _multipart_headers(raw_content_type),
                request.stream(),
                stage_file,
                max_file_bytes=reservation.max_file_bytes,
                max_part_size=ASSET_CONTENT_TEXT_MAX_LENGTH,
                max_files=1,
                max_fields=_UPLOAD_MAX_FIELDS,
            )
            form: FormData | None = None
            try:
                try:
                    form = await parser.parse()
                except _UploadRequestTooLarge as error:
                    raise _upload_http_error(error.limit_error) from None
                except UploadFileLimitExceeded as error:
                    raise _upload_http_error(reservation.limit_error()) from error
                except UploadFormFieldTooLarge as error:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=error.message,
                    ) from error
                except MultiPartException as error:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error.message) from error

                request_payload = _form_asset_payload(form)
                asset_url = request_payload.url
                saved_path: Path | None = None
                maybe_file = form.get("file")
                if isinstance(maybe_file, UploadFile):
                    extension = validate_upload_metadata(
                        maybe_file.filename,
                        maybe_file.content_type,
                        request_payload.type,
                    )
                    if maybe_file.size is not None:
                        reservation.assert_file_size(maybe_file.size)
                    await parser.close_stage_file()
                    if reservation.stage_path is None:
                        raise RuntimeError("Upload reservation has no staging path")
                    remaining_seconds = upload_deadline - monotonic()
                    if remaining_seconds <= 0:
                        raise _UploadRequestTimeout
                    try:
                        await asyncio.wait_for(
                            validate_staged_upload_in_process(
                                reservation.stage_path,
                                extension,
                                reservation.max_file_bytes,
                                settings.asset_upload_min_free_bytes,
                            ),
                            timeout=remaining_seconds,
                        )
                    except TimeoutError:
                        raise _UploadRequestTimeout from None
                    if monotonic() >= upload_deadline:
                        raise _UploadRequestTimeout
                    filename, saved_path = await commit_staged_upload_cancellation_safe(
                        reservation.stage_path,
                        reservation.user_dir,
                        extension,
                    )
                    try:
                        await reservation.complete()
                    except BaseException:
                        await remove_upload_file_cancellation_safe(saved_path)
                        raise
                    asset_url = f"/uploads/{user['id']}/{filename}"
                return await _persist_asset(request_payload, user["id"], asset_url, saved_path)
            finally:
                await parser.close_stage_file(active_error=sys.exception())
    except OSError as error:
        if is_storage_exhaustion_error(error):
            raise _upload_http_error(UploadStorageFloorError()) from error
        raise _upload_http_error(UploadStorageUnavailableError()) from error
    except (_UploadRequestTimeout, UploadMediaError, UploadReservationBusyError, UploadUserQuotaError) as error:
        raise _upload_http_error(error) from error


@router.get("/{asset_id}")
def get_asset(asset_id: str, user=Depends(current_user)):
    asset = store.get_asset(asset_id)
    if asset is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return _assert_asset_owner(asset, user["id"])


@router.delete("/{asset_id}")
def delete_asset(asset_id: str, user=Depends(current_user)):
    asset = store.get_asset(asset_id)
    if asset is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    if asset["user_id"] != user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    deleted = store.delete_asset(asset_id, user["id"])
    if deleted is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    deleted["updated_at"] = deleted.get("updated_at") or now_iso()
    return deleted
