from __future__ import annotations

import asyncio
import json
import os
import sys
import threading
import time
import unittest
from collections import namedtuple
from contextlib import suppress
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core import upload_reservation
from core.upload_reservation import (
    LocalUploadReservation,
    UploadReservationBusyError,
    UploadUserQuotaError,
)
from settings.config import settings


DiskUsage = namedtuple("DiskUsage", "total used free")
_MISSING = object()


class _ScalarResult:
    def __init__(self, value: int) -> None:
        self.value = value

    def scalar(self) -> int:
        return self.value


class _FakeConnection:
    def __init__(self, *, fail_release: str | None = None) -> None:
        self.fail_release = fail_release
        self.held_locks: set[str] = set()
        self.statements: list[tuple[str, str]] = []
        self.invalidated = False
        self.closed = False

    def execute(self, statement, parameters):
        sql = str(statement).upper()
        lock_name = parameters["lock_name"]
        if "GET_LOCK" in sql:
            self.statements.append(("get", lock_name))
            self.held_locks.add(lock_name)
            return _ScalarResult(1)
        if "RELEASE_LOCK" in sql:
            self.statements.append(("release", lock_name))
            if lock_name == self.fail_release:
                raise RuntimeError("simulated release failure")
            released = lock_name in self.held_locks
            self.held_locks.discard(lock_name)
            return _ScalarResult(1 if released else 0)
        raise AssertionError(f"unexpected SQL: {statement}")

    def invalidate(self) -> None:
        self.invalidated = True
        self.held_locks.clear()

    def close(self) -> None:
        self.closed = True


class _FakeEngine:
    def __init__(self, connection: _FakeConnection) -> None:
        self.connection = connection

    def connect(self) -> _FakeConnection:
        return self.connection


class UploadReservationLimitsTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = TemporaryDirectory()
        self.upload_root = Path(self.temp_dir.name) / "uploads"
        self.original_settings = {
            name: getattr(settings, name, _MISSING)
            for name in (
                "asset_upload_max_bytes",
                "asset_upload_user_quota_bytes",
                "asset_upload_min_free_bytes",
                "asset_upload_max_active_reservations",
                "asset_upload_max_active_reservations_per_user",
                "asset_upload_reservation_scan_limit",
                "asset_upload_user_file_count_limit",
            )
        }
        self._set_setting("asset_upload_max_bytes", 1_000)
        self._set_setting("asset_upload_user_quota_bytes", 10_000)
        self._set_setting("asset_upload_min_free_bytes", 0)
        self._set_setting("asset_upload_max_active_reservations", 4)
        self._set_setting("asset_upload_max_active_reservations_per_user", 2)
        self._set_setting("asset_upload_reservation_scan_limit", 8)
        self._set_setting("asset_upload_user_file_count_limit", 10)

    def tearDown(self) -> None:
        for name, value in self.original_settings.items():
            if value is _MISSING:
                with suppress(AttributeError):
                    object.__delattr__(settings, name)
            else:
                object.__setattr__(settings, name, value)
        self.temp_dir.cleanup()

    def test_user_history_scan_runs_under_user_lock_before_global_lock(self) -> None:
        connection = _FakeConnection()
        global_lock_name = upload_reservation.upload_lock_name(self.upload_root)
        observed_locks: list[set[str]] = []

        def observe_scan(directory: Path, *args, **kwargs) -> int:
            observed_locks.append(set(connection.held_locks))
            self.assertNotIn(global_lock_name, connection.held_locks)
            self.assertEqual(1, len(connection.held_locks))
            marker_dir = self.upload_root / ".upload-reservations"
            self.assertEqual(1, len(list(marker_dir.glob("*.reservation.json"))))
            return 0

        with (
            patch.object(upload_reservation, "init_engine", return_value=_FakeEngine(connection)),
            patch.object(upload_reservation, "_directory_bytes", side_effect=observe_scan),
            patch.object(
                upload_reservation.shutil,
                "disk_usage",
                return_value=DiskUsage(total=100_000, used=0, free=100_000),
            ),
        ):
            stage_path, marker_path, _ = upload_reservation._create_reservation(
                "user-a", self.upload_root, 100
            )

        self.assertEqual(1, len(observed_locks))
        self.assertEqual(
            ["get", "get", "release", "get", "release", "release"],
            [item[0] for item in connection.statements],
        )
        upload_reservation._remove_reservation_files(stage_path, marker_path)

    def test_per_user_active_reservation_limit_is_enforced(self) -> None:
        self._set_setting("asset_upload_max_active_reservations_per_user", 1)
        self._write_active_marker("existing", "user-a", 100)

        with self.assertRaises(UploadReservationBusyError):
            self._create_reservation("user-a")

    def test_global_active_reservation_limit_is_enforced(self) -> None:
        self._set_setting("asset_upload_max_active_reservations", 1)
        self._write_active_marker("existing", "user-a", 100)

        with self.assertRaises(UploadReservationBusyError):
            self._create_reservation("user-b")

    def test_global_sidecar_scan_stops_at_absolute_scan_limit(self) -> None:
        self._set_setting("asset_upload_reservation_scan_limit", 2)
        marker_dir = self.upload_root / ".upload-reservations"
        marker_dir.mkdir(parents=True)
        for index in range(3):
            (marker_dir / f"invalid-{index}.reservation.json").write_text("{}", encoding="utf-8")

        with self.assertRaises(UploadReservationBusyError):
            upload_reservation._active_reservations(self.upload_root)

    def test_stale_sidecars_above_live_limit_are_reclaimed(self) -> None:
        self._set_setting("asset_upload_max_active_reservations", 2)
        for index in range(3):
            self._write_active_marker(f"stale-{index}", f"user-{index}", 100)
        for path in self.upload_root.rglob("*"):
            if path.is_file():
                os.utime(path, (1, 1))

        self.assertEqual([], upload_reservation._active_reservations(self.upload_root))
        self.assertEqual([], list((self.upload_root / ".upload-reservations").iterdir()))

    def test_user_history_scan_stops_at_configured_file_count_limit(self) -> None:
        self._set_setting("asset_upload_user_file_count_limit", 2)
        user_dir = self.upload_root / "user-a"
        user_dir.mkdir(parents=True)
        for index in range(3):
            (user_dir / f"asset-{index}.bin").write_bytes(b"x")

        with self.assertRaises(UploadUserQuotaError):
            upload_reservation._directory_bytes(user_dir)

    def test_capacity_error_becomes_busy_if_any_lock_release_fails(self) -> None:
        self._set_setting("asset_upload_user_quota_bytes", 0)
        global_lock_name = upload_reservation.upload_lock_name(self.upload_root)
        connection = _FakeConnection(fail_release=global_lock_name)

        with (
            patch.object(upload_reservation, "init_engine", return_value=_FakeEngine(connection)),
            patch.object(
                upload_reservation.shutil,
                "disk_usage",
                return_value=DiskUsage(total=100_000, used=0, free=100_000),
            ),
            self.assertRaises(UploadReservationBusyError),
        ):
            upload_reservation._create_reservation("user-a", self.upload_root, 1)

        self.assertTrue(connection.invalidated)

    def test_complete_holds_user_and_global_locks_while_removing_marker(self) -> None:
        connection = _FakeConnection()
        marker_path = self.upload_root / ".upload-reservations" / "done.reservation.json"
        marker_path.parent.mkdir(parents=True)
        marker_path.write_text("{}", encoding="utf-8")
        reservation = LocalUploadReservation("user-a", self.upload_root, declared_request_bytes=1)
        reservation.marker_path = marker_path
        original_unlink = Path.unlink

        def observe_unlink(path: Path, *args, **kwargs):
            self.assertEqual(2, len(connection.held_locks))
            return original_unlink(path, *args, **kwargs)

        with (
            patch.object(upload_reservation, "init_engine", return_value=_FakeEngine(connection)),
            patch.object(Path, "unlink", observe_unlink),
        ):
            asyncio.run(reservation.complete())

        self.assertFalse(marker_path.exists())
        self.assertEqual(["get", "get", "release", "release"], [item[0] for item in connection.statements])

    def test_cleanup_removes_marker_when_stage_unlink_fails(self) -> None:
        staging_dir = self.upload_root / "user-a" / ".uploading"
        staging_dir.mkdir(parents=True)
        stage_path = staging_dir / "open.part"
        marker_path = self.upload_root / ".upload-reservations" / "open.reservation.json"
        marker_path.parent.mkdir(parents=True)
        stage_path.write_bytes(b"open")
        marker_path.write_text("{}", encoding="utf-8")
        original_unlink = Path.unlink

        def fail_stage_unlink(path: Path, *args, **kwargs):
            if path == stage_path:
                raise PermissionError("simulated Windows sharing violation")
            return original_unlink(path, *args, **kwargs)

        with patch.object(Path, "unlink", fail_stage_unlink):
            with self.assertRaises(OSError) as caught:
                upload_reservation._remove_reservation_files(stage_path, marker_path)

        self.assertTrue(stage_path.exists())
        self.assertFalse(marker_path.exists())
        self.assertEqual((stage_path,), caught.exception.failed_paths)
        self.assertIn("sharing violation", str(caught.exception))
        self.assertEqual(4, upload_reservation._directory_bytes(self.upload_root / "user-a"))

    def test_active_stage_bytes_are_not_double_counted_against_user_quota(self) -> None:
        self._set_setting("asset_upload_user_quota_bytes", 120)
        user_dir = self.upload_root / "user-a"
        user_dir.mkdir(parents=True)
        (user_dir / "stored.bin").write_bytes(b"x" * 10)
        self._write_active_marker("existing", "user-a", 100)
        (user_dir / ".uploading" / "existing.part").write_bytes(b"x" * 60)
        connection = _FakeConnection()

        with (
            patch.object(upload_reservation, "init_engine", return_value=_FakeEngine(connection)),
            patch.object(
                upload_reservation.shutil,
                "disk_usage",
                return_value=DiskUsage(total=100_000, used=0, free=100_000),
            ),
        ):
            stage_path, marker_path, _ = upload_reservation._create_reservation(
                "user-a", self.upload_root, 10
            )

        upload_reservation._remove_reservation_files(stage_path, marker_path)

    def test_cancelled_slow_stage_open_closes_late_file_handle(self) -> None:
        staging_dir = self.upload_root / "user-a" / ".uploading"
        staging_dir.mkdir(parents=True)
        stage_path = staging_dir / "slow-open.part"
        stage_path.write_bytes(b"")
        reservation = LocalUploadReservation("user-a", self.upload_root, declared_request_bytes=1)
        reservation.stage_path = stage_path
        worker_started = threading.Event()
        worker_finished = threading.Event()
        opened_files = []

        def delayed_open(path: Path):
            worker_started.set()
            time.sleep(0.05)
            opened_file = path.open("r+b", buffering=0)
            opened_files.append(opened_file)
            worker_finished.set()
            return opened_file

        async def exercise() -> None:
            task = asyncio.create_task(reservation.open_stage_file())
            while not worker_started.is_set():
                await asyncio.sleep(0.001)
            task.cancel()
            with self.assertRaises(asyncio.CancelledError):
                await task
            while not worker_finished.is_set():
                await asyncio.sleep(0.001)

        with patch.object(upload_reservation, "_open_stage_file", side_effect=delayed_open):
            asyncio.run(exercise())

        self.assertEqual(1, len(opened_files))
        was_closed = opened_files[0].closed
        opened_files[0].close()
        self.assertTrue(was_closed)

    def _create_reservation(self, user_id: str) -> None:
        connection = _FakeConnection()
        with (
            patch.object(upload_reservation, "init_engine", return_value=_FakeEngine(connection)),
            patch.object(
                upload_reservation.shutil,
                "disk_usage",
                return_value=DiskUsage(total=100_000, used=0, free=100_000),
            ),
        ):
            upload_reservation._create_reservation(user_id, self.upload_root, 100)

    def _write_active_marker(self, reservation_id: str, user_id: str, reserved_bytes: int) -> None:
        stage_dir = self.upload_root / user_id / ".uploading"
        marker_dir = self.upload_root / ".upload-reservations"
        stage_dir.mkdir(parents=True, exist_ok=True)
        marker_dir.mkdir(parents=True, exist_ok=True)
        (stage_dir / f"{reservation_id}.part").write_bytes(b"")
        payload = upload_reservation._reservation_payload(reservation_id, user_id, reserved_bytes)
        (marker_dir / f"{reservation_id}.reservation.json").write_text(
            json.dumps(payload), encoding="utf-8"
        )

    @staticmethod
    def _set_setting(name: str, value: int) -> None:
        object.__setattr__(settings, name, value)


if __name__ == "__main__":
    unittest.main()
