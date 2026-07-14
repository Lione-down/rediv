from __future__ import annotations

import asyncio
import os
import queue
import subprocess
import sys
import threading
import unittest
from collections import namedtuple
from contextlib import suppress
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.upload_media import UploadStorageFloorError
from core.upload_reservation import LocalUploadReservation, UploadUserQuotaError
from settings.config import settings
from tests.mysql_test_database import MySQLTestDatabase


_CHILD_SCRIPT = r"""
import asyncio
import os
import sys
from pathlib import Path

from core.upload_reservation import LocalUploadReservation


async def main():
    reservation = LocalUploadReservation(
        sys.argv[1],
        Path(sys.argv[2]),
        declared_request_bytes=int(sys.argv[3]),
    )
    await reservation.__aenter__()
    print(reservation.stage_path, flush=True)
    if sys.argv[4] == "crash":
        os._exit(0)
    sys.stdin.readline()
    await reservation.__aexit__(None, None, None)


asyncio.run(main())
"""
_MISSING = object()
DiskUsage = namedtuple("DiskUsage", "total used free")


class UploadSidecarReservationTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_upload_sidecar_reservation")
        cls.mysql_database.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    def setUp(self) -> None:
        self.temp_dir = TemporaryDirectory()
        self.upload_root = Path(self.temp_dir.name) / "storage" / "uploads"
        self.original_settings = {
            name: getattr(settings, name, _MISSING)
            for name in (
                "storage_local_root",
                "asset_upload_max_bytes",
                "asset_upload_user_quota_bytes",
                "asset_upload_min_free_bytes",
            )
        }
        settings.storage_local_root = str(self.upload_root.parent)
        object.__setattr__(settings, "asset_upload_max_bytes", 1_000)
        object.__setattr__(settings, "asset_upload_user_quota_bytes", 1_000)
        object.__setattr__(settings, "asset_upload_min_free_bytes", 0)
        self.children: list[subprocess.Popen[str]] = []

    def tearDown(self) -> None:
        for child in self.children:
            self._stop_child(child)
        for name, value in self.original_settings.items():
            if value is _MISSING:
                with suppress(AttributeError):
                    object.__delattr__(settings, name)
            else:
                object.__setattr__(settings, name, value)
        self.temp_dir.cleanup()

    def test_other_process_reservation_counts_against_user_quota(self) -> None:
        child, _ = self._start_child("shared-user", declared_bytes=700)

        with self.assertRaises(UploadUserQuotaError):
            asyncio.run(self._open_and_close("shared-user", declared_bytes=400))

        self._stop_child(child)
        self.children.remove(child)
        self.assertEqual([], self._reservation_files())

    def test_other_process_reservation_counts_against_free_space_floor(self) -> None:
        child, _ = self._start_child("first-user", declared_bytes=700)

        with patch(
            "core.upload_reservation.shutil.disk_usage",
            return_value=DiskUsage(total=2_000, used=1_000, free=1_000),
        ):
            with self.assertRaises(UploadStorageFloorError):
                asyncio.run(self._open_and_close("second-user", declared_bytes=400))

        self._stop_child(child)
        self.children.remove(child)
        self.assertEqual([], self._reservation_files())

    def test_crashed_process_sidecar_and_stage_are_reclaimed_when_stale(self) -> None:
        child, stage_path = self._start_child("stale-user", declared_bytes=700, mode="crash")
        child.wait(timeout=10)
        self.children.remove(child)
        stale_files = self._reservation_files()
        self.assertIn(stage_path, stale_files)
        self.assertGreaterEqual(len(stale_files), 2, "reservation did not create a JSON sidecar")
        for path in stale_files:
            os.utime(path, (1, 1))

        observed_old_files: list[Path] = []

        async def exercise() -> None:
            reservation = LocalUploadReservation(
                "stale-user",
                self.upload_root,
                declared_request_bytes=900,
            )
            async with reservation:
                observed_old_files.extend(path for path in stale_files if path.exists())

        asyncio.run(exercise())

        self.assertEqual([], observed_old_files)
        self.assertEqual([], self._reservation_files())

    async def _open_and_close(self, user_id: str, declared_bytes: int) -> None:
        reservation = LocalUploadReservation(
            user_id,
            self.upload_root,
            declared_request_bytes=declared_bytes,
        )
        async with reservation:
            self.assertTrue(reservation.stage_path.exists())

    def _start_child(
        self,
        user_id: str,
        declared_bytes: int,
        mode: str = "wait",
    ) -> tuple[subprocess.Popen[str], Path]:
        backend_dir = Path(__file__).resolve().parents[1]
        environment = os.environ.copy()
        environment.update(
            {
                "PYTHONPATH": str(backend_dir),
                "REVID_STORAGE_LOCAL_ROOT": str(self.upload_root.parent),
                "REVID_ASSET_UPLOAD_MAX_BYTES": "1000",
                "REVID_ASSET_UPLOAD_USER_QUOTA_BYTES": "1000",
                "REVID_ASSET_UPLOAD_MIN_FREE_BYTES": "0",
            }
        )
        child = subprocess.Popen(
            [
                sys.executable,
                "-c",
                _CHILD_SCRIPT,
                user_id,
                str(self.upload_root),
                str(declared_bytes),
                mode,
            ],
            cwd=backend_dir,
            env=environment,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        self.children.append(child)
        output_queue: queue.Queue[str] = queue.Queue(maxsize=1)
        reader = threading.Thread(
            target=lambda: output_queue.put(child.stdout.readline() if child.stdout else ""),
            daemon=True,
        )
        reader.start()
        try:
            stage_line = output_queue.get(timeout=10).strip()
        except queue.Empty:
            self._stop_child(child)
            self.fail("child process did not enter upload reservation within 10 seconds")
        if not stage_line:
            _, stderr = child.communicate(timeout=10)
            self.children.remove(child)
            self.fail(f"child process failed before reservation: {stderr.strip()}")
        return child, Path(stage_line)

    @staticmethod
    def _stop_child(child: subprocess.Popen[str]) -> None:
        if child.poll() is not None:
            return
        try:
            if child.stdin is not None:
                child.stdin.write("release\n")
                child.stdin.flush()
            child.communicate(timeout=10)
        except (BrokenPipeError, subprocess.TimeoutExpired):
            child.terminate()
            with suppress(subprocess.TimeoutExpired):
                child.communicate(timeout=5)

    def _reservation_files(self) -> list[Path]:
        if not self.upload_root.exists():
            return []
        return sorted(path for path in self.upload_root.rglob("*") if path.is_file())


if __name__ == "__main__":
    unittest.main()
