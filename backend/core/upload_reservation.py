from __future__ import annotations

import asyncio
import hashlib
import json
import os
import shutil
import time
from contextlib import suppress
from dataclasses import dataclass
from pathlib import Path
from typing import BinaryIO, Final
from uuid import uuid4

from sqlalchemy import text
from sqlalchemy.engine import Connection
from starlette.concurrency import run_in_threadpool

from core.async_lifecycle import await_with_deferred_cancellation
from core.upload_media import UploadStorageFloorError, UploadTooLargeError
from models.base import init_engine
from settings.config import settings


class UploadReservationBusyError(Exception):
    pass


class UploadUserQuotaError(Exception):
    pass


class UploadReservationCleanupError(OSError):
    def __init__(self, failures: list[tuple[Path, OSError]]) -> None:
        self.failures = tuple(failures)
        self.failed_paths = tuple(path for path, _ in failures)
        detail = "; ".join(f"{path}: {type(error).__name__}: {error}" for path, error in failures)
        super().__init__(f"Upload reservation cleanup failed: {detail}")


_RESERVATION_VERSION: Final = 1
_RESERVATION_DIR: Final = ".uploading"
_RESERVATION_INDEX_DIR: Final = ".upload-reservations"
_RESERVATION_GRACE_SECONDS: Final = 120
_MAX_SIDECAR_BYTES: Final = 4096


@dataclass(frozen=True)
class _ActiveReservation:
    user_dir: Path
    stage_path: Path
    marker_path: Path
    reserved_bytes: int
    stage_bytes: int


def upload_lock_name(upload_root: Path) -> str:
    resolved_root = str(upload_root.resolve(strict=False)).casefold().encode("utf-8")
    digest = hashlib.sha256(resolved_root).hexdigest()[:40]
    return f"revid-upload:{digest}"


def upload_user_lock_name(upload_root: Path, user_id: str) -> str:
    lock_identity = f"{upload_root.resolve(strict=False)}\0{user_id}".casefold().encode("utf-8")
    digest = hashlib.sha256(lock_identity).hexdigest()[:40]
    return f"revid-upload-user:{digest}"


def _directory_bytes(directory: Path, file_sizes: dict[Path, int] | None = None) -> int:
    total = 0
    if not directory.exists():
        return total
    scanned_entries = 0
    pending_directories = [directory]
    while pending_directories:
        current = pending_directories.pop()
        with os.scandir(current) as entries:
            for entry in entries:
                path = Path(entry.path)
                scanned_entries += 1
                if scanned_entries > settings.asset_upload_user_file_count_limit:
                    raise UploadUserQuotaError
                try:
                    if entry.is_symlink() or entry.is_file(follow_symlinks=False):
                        size = entry.stat(follow_symlinks=False).st_size
                        total += size
                        if file_sizes is not None:
                            file_sizes[path] = size
                    elif entry.is_dir(follow_symlinks=False):
                        pending_directories.append(path)
                except FileNotFoundError:
                    continue
    return total


def _is_safe_user_id(user_id: object) -> bool:
    return (
        isinstance(user_id, str)
        and bool(user_id)
        and user_id not in {".", ".."}
        and "/" not in user_id
        and "\\" not in user_id
    )


def _read_active_reservation(upload_root: Path, marker_path: Path) -> _ActiveReservation | None:
    try:
        if marker_path.is_symlink():
            return None
        if marker_path.stat().st_size > _MAX_SIDECAR_BYTES:
            return None
        payload = json.loads(marker_path.read_text(encoding="utf-8"))
        reservation_id = marker_path.name.removesuffix(".reservation.json")
        stage_name = f"{reservation_id}.part"
        if set(payload) != {"version", "reservation_id", "user_id", "stage_name", "reserved_bytes"}:
            return None
        user_id = payload["user_id"]
        reserved_bytes = payload["reserved_bytes"]
        if (
            payload["version"] != _RESERVATION_VERSION
            or payload["reservation_id"] != reservation_id
            or not _is_safe_user_id(user_id)
            or payload["stage_name"] != stage_name
            or not isinstance(reserved_bytes, int)
            or isinstance(reserved_bytes, bool)
            or reserved_bytes <= 0
        ):
            return None
        user_dir = upload_root / user_id
        stage_path = user_dir / _RESERVATION_DIR / stage_name
        try:
            stage_bytes = stage_path.stat().st_size
        except FileNotFoundError:
            stage_bytes = 0
        return _ActiveReservation(user_dir, stage_path, marker_path, reserved_bytes, stage_bytes)
    except (FileNotFoundError, OSError, UnicodeDecodeError, json.JSONDecodeError, TypeError):
        return None


def _active_reservations(upload_root: Path) -> list[_ActiveReservation]:
    active: list[_ActiveReservation] = []
    has_invalid_entry = False
    stale_after = settings.asset_upload_total_timeout_seconds + _RESERVATION_GRACE_SECONDS
    now = time.time()
    marker_dir = upload_root / _RESERVATION_INDEX_DIR
    if not marker_dir.exists():
        return active
    with os.scandir(marker_dir) as entries:
        for entry_index, entry in enumerate(entries, start=1):
            if entry_index > settings.asset_upload_reservation_scan_limit:
                raise UploadReservationBusyError
            marker_path = Path(entry.path)
            try:
                is_stale = now - entry.stat(follow_symlinks=False).st_mtime > stale_after
            except FileNotFoundError:
                continue
            reservation = _read_active_reservation(upload_root, marker_path)
            if reservation is None:
                if is_stale and entry.is_file(follow_symlinks=False):
                    _remove_reservation_files(None, marker_path)
                    continue
                has_invalid_entry = True
                continue
            if not is_stale:
                active.append(reservation)
                continue
            _remove_reservation_files(reservation.stage_path, marker_path)
    if has_invalid_entry or len(active) > settings.asset_upload_max_active_reservations:
        raise UploadReservationBusyError
    return active


def _calculate_capacity(
    upload_root: Path,
    user_dir: Path,
    used_bytes: int,
    active: list[_ActiveReservation],
    scanned_file_sizes: dict[Path, int],
) -> tuple[int, int, int]:
    for reservation in active:
        if reservation.user_dir != user_dir:
            continue
        scanned_stage_bytes = scanned_file_sizes.get(reservation.stage_path, 0)
        reserved_usage = max(reservation.reserved_bytes, reservation.stage_bytes, scanned_stage_bytes)
        used_bytes += reserved_usage - scanned_stage_bytes
    user_remaining = max(0, settings.asset_upload_user_quota_bytes - used_bytes)
    free_bytes = shutil.disk_usage(upload_root).free
    pending_bytes = sum(
        max(0, reservation.reserved_bytes - reservation.stage_bytes)
        for reservation in active
    )
    storage_remaining = max(
        0,
        free_bytes - settings.asset_upload_min_free_bytes - pending_bytes,
    )
    max_file_bytes = min(settings.asset_upload_max_bytes, user_remaining, storage_remaining)
    return max_file_bytes, user_remaining, storage_remaining


def _reservation_payload(reservation_id: str, user_id: str, reserved_bytes: int) -> dict[str, int | str]:
    return {
        "version": _RESERVATION_VERSION,
        "reservation_id": reservation_id,
        "user_id": user_id,
        "stage_name": f"{reservation_id}.part",
        "reserved_bytes": reserved_bytes,
    }


def _remove_reservation_files(stage_path: Path | None, marker_path: Path | None) -> None:
    failures: list[tuple[Path, OSError]] = []
    for path in (stage_path, marker_path):
        if path is None:
            continue
        try:
            path.unlink(missing_ok=True)
        except OSError as error:
            failures.append((path, error))
    if failures:
        raise UploadReservationCleanupError(failures)


def _release_upload_lock(connection: Connection, lock_name: str) -> bool:
    try:
        released = connection.execute(
            text("SELECT RELEASE_LOCK(:lock_name)"),
            {"lock_name": lock_name},
        ).scalar()
        return released == 1
    except Exception:
        return False


def _acquire_upload_lock(connection: Connection, lock_name: str) -> None:
    acquired = connection.execute(
        text("SELECT GET_LOCK(:lock_name, 0)"),
        {"lock_name": lock_name},
    ).scalar()
    if acquired != 1:
        raise UploadReservationBusyError


def _release_held_locks(connection: Connection, held_locks: list[str]) -> None:
    release_failed = False
    for lock_name in reversed(held_locks):
        if not _release_upload_lock(connection, lock_name):
            release_failed = True
    held_locks.clear()
    if not release_failed:
        return
    with suppress(Exception):
        connection.invalidate()
    raise UploadReservationBusyError


def _release_one_lock(connection: Connection, held_locks: list[str], lock_name: str) -> None:
    if lock_name in held_locks and _release_upload_lock(connection, lock_name):
        held_locks.remove(lock_name)
        return
    held_locks.clear()
    with suppress(Exception):
        connection.invalidate()
    raise UploadReservationBusyError


def _complete_reservation(
    user_id: str,
    upload_root: Path,
    marker_path: Path,
) -> None:
    connection = init_engine().connect()
    held_locks: list[str] = []
    operation_error: BaseException | None = None
    try:
        try:
            user_lock_name = upload_user_lock_name(upload_root, user_id)
            _acquire_upload_lock(connection, user_lock_name)
            held_locks.append(user_lock_name)
            global_lock_name = upload_lock_name(upload_root)
            _acquire_upload_lock(connection, global_lock_name)
            held_locks.append(global_lock_name)
            marker_path.unlink(missing_ok=True)
        except BaseException as error:
            operation_error = error
        try:
            _release_held_locks(connection, held_locks)
        except UploadReservationBusyError as release_error:
            raise release_error from operation_error
        if operation_error is not None:
            raise operation_error
    finally:
        connection.close()


def _create_reservation(
    user_id: str,
    upload_root: Path,
    desired_bytes: int,
) -> tuple[Path, Path, tuple[int, int, int]]:
    if not _is_safe_user_id(user_id):
        raise ValueError("Upload user ID must be one safe path component")
    upload_root.mkdir(parents=True, exist_ok=True)
    connection = init_engine().connect()
    held_locks: list[str] = []
    stage_path: Path | None = None
    marker_path: Path | None = None
    result: tuple[Path, Path, tuple[int, int, int]] | None = None
    operation_error: BaseException | None = None
    try:
        try:
            user_lock_name = upload_user_lock_name(upload_root, user_id)
            _acquire_upload_lock(connection, user_lock_name)
            held_locks.append(user_lock_name)
            user_dir = upload_root / user_id
            user_dir.mkdir(parents=True, exist_ok=True)
            global_lock_name = upload_lock_name(upload_root)
            _acquire_upload_lock(connection, global_lock_name)
            held_locks.append(global_lock_name)
            active = _active_reservations(upload_root)
            if len(active) >= settings.asset_upload_max_active_reservations:
                raise UploadReservationBusyError
            user_active = sum(reservation.user_dir == user_dir for reservation in active)
            if user_active >= settings.asset_upload_max_active_reservations_per_user:
                raise UploadReservationBusyError
            reservation_id = str(uuid4())
            staging_dir = user_dir / _RESERVATION_DIR
            marker_dir = upload_root / _RESERVATION_INDEX_DIR
            staging_dir.mkdir(parents=True, exist_ok=True)
            marker_dir.mkdir(parents=True, exist_ok=True)
            stage_path = staging_dir / f"{reservation_id}.part"
            marker_path = marker_dir / f"{reservation_id}.reservation.json"
            marker_path.write_text(
                json.dumps(
                    _reservation_payload(reservation_id, user_id, desired_bytes),
                    separators=(",", ":"),
                ),
                encoding="utf-8",
                newline="\n",
            )
            stage_path.open("xb").close()
            _release_one_lock(connection, held_locks, global_lock_name)

            scanned_file_sizes: dict[Path, int] = {}
            used_bytes = _directory_bytes(user_dir, scanned_file_sizes)
            _acquire_upload_lock(connection, global_lock_name)
            held_locks.append(global_lock_name)
            refreshed_active = _active_reservations(upload_root)
            own_reservations = [r for r in refreshed_active if r.marker_path == marker_path]
            if len(own_reservations) != 1:
                raise UploadReservationBusyError
            other_active = [r for r in refreshed_active if r.marker_path != marker_path]
            capacity = _calculate_capacity(
                upload_root,
                user_dir,
                used_bytes,
                other_active,
                scanned_file_sizes,
            )
            max_file_bytes, user_remaining, storage_remaining = capacity
            if desired_bytes > max_file_bytes:
                if user_remaining < desired_bytes and user_remaining <= storage_remaining:
                    raise UploadUserQuotaError
                if storage_remaining < desired_bytes:
                    raise UploadStorageFloorError
                raise UploadTooLargeError
            result = (
                stage_path,
                marker_path,
                (desired_bytes, user_remaining, storage_remaining),
            )
        except BaseException as error:
            operation_error = error

        cleanup_error: OSError | None = None
        if operation_error is not None:
            try:
                _remove_reservation_files(stage_path, marker_path)
            except OSError as error:
                cleanup_error = error
        try:
            _release_held_locks(connection, held_locks)
        except UploadReservationBusyError as release_error:
            if operation_error is None:
                try:
                    _remove_reservation_files(stage_path, marker_path)
                except OSError as error:
                    cleanup_error = error
            raise release_error from operation_error or cleanup_error
        if cleanup_error is not None:
            raise cleanup_error from operation_error
        if operation_error is not None:
            raise operation_error
        if result is None:
            raise RuntimeError("Upload reservation was not created")
        return result
    finally:
        connection.close()


def _open_stage_file(stage_path: Path) -> BinaryIO:
    return stage_path.open("r+b", buffering=0)


class LocalUploadReservation:
    def __init__(
        self,
        user_id: str,
        upload_root: Path,
        declared_request_bytes: int | None = None,
    ) -> None:
        self.user_id = user_id
        self.upload_root = upload_root
        self.user_dir = upload_root / user_id
        self.max_file_bytes = 0
        self.user_remaining_bytes = 0
        self.storage_remaining_bytes = 0
        self.stage_path: Path | None = None
        self.marker_path: Path | None = None
        self._declared_request_bytes = declared_request_bytes
        self._is_complete = False

    async def __aenter__(self) -> LocalUploadReservation:
        desired_bytes = self._declared_request_bytes
        if desired_bytes is None:
            desired_bytes = settings.asset_upload_max_bytes
        desired_bytes = min(max(1, desired_bytes), settings.asset_upload_max_bytes)
        result, cancellation = await await_with_deferred_cancellation(
            run_in_threadpool(
                _create_reservation,
                self.user_id,
                self.upload_root,
                desired_bytes,
            )
        )
        stage_path, marker_path, capacity = result
        if cancellation is not None:
            await await_with_deferred_cancellation(
                run_in_threadpool(_remove_reservation_files, stage_path, marker_path)
            )
            raise cancellation
        self.stage_path = stage_path
        self.marker_path = marker_path
        self.max_file_bytes, self.user_remaining_bytes, self.storage_remaining_bytes = capacity
        return self

    async def __aexit__(self, exc_type, exc_value, traceback) -> None:
        if self._is_complete:
            return
        _, cancellation = await await_with_deferred_cancellation(
            run_in_threadpool(_remove_reservation_files, self.stage_path, self.marker_path)
        )
        if cancellation is not None and exc_type is not asyncio.CancelledError:
            raise cancellation

    async def open_stage_file(self) -> BinaryIO:
        if self.stage_path is None:
            raise RuntimeError("Upload reservation is not active")
        stage_file, cancellation = await await_with_deferred_cancellation(
            run_in_threadpool(_open_stage_file, self.stage_path)
        )
        if cancellation is not None:
            await await_with_deferred_cancellation(run_in_threadpool(stage_file.close))
            raise cancellation
        return stage_file

    async def complete(self) -> None:
        if self.marker_path is not None:
            _, cancellation = await await_with_deferred_cancellation(
                run_in_threadpool(
                    _complete_reservation,
                    self.user_id,
                    self.upload_root,
                    self.marker_path,
                )
            )
            if cancellation is not None:
                raise cancellation
        self._is_complete = True

    def assert_file_size(self, file_size: int) -> None:
        if file_size <= self.max_file_bytes:
            return
        raise self.limit_error()

    def limit_error(self) -> Exception:
        if (
            self.user_remaining_bytes < settings.asset_upload_max_bytes
            and self.user_remaining_bytes <= self.storage_remaining_bytes
        ):
            return UploadUserQuotaError()
        if self.storage_remaining_bytes < settings.asset_upload_max_bytes:
            return UploadStorageFloorError()
        return UploadTooLargeError()
