from __future__ import annotations

import asyncio
import threading
import time
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from core import upload_media, upload_reservation
from core.upload_media import commit_staged_upload_cancellation_safe
from core.upload_reservation import LocalUploadReservation


class UploadCancellationCleanupTestCase(unittest.TestCase):
    def test_cancelled_reservation_acquire_removes_late_worker_result(self) -> None:
        with TemporaryDirectory() as temp_dir:
            upload_root = Path(temp_dir) / "uploads"
            worker_started = threading.Event()

            def delayed_create(user_id: str, root: Path, desired_bytes: int):
                worker_started.set()
                time.sleep(0.05)
                staging_dir = root / user_id / ".uploading"
                staging_dir.mkdir(parents=True)
                stage_path = staging_dir / "late.part"
                marker_path = staging_dir / "late.reservation.json"
                stage_path.write_bytes(b"")
                marker_path.write_text("{}", encoding="utf-8")
                return stage_path, marker_path, (desired_bytes, desired_bytes, desired_bytes)

            async def exercise() -> LocalUploadReservation:
                reservation = LocalUploadReservation("user", upload_root, declared_request_bytes=1)
                task = asyncio.create_task(reservation.__aenter__())
                while not worker_started.is_set():
                    await asyncio.sleep(0.001)
                task.cancel()
                with self.assertRaises(asyncio.CancelledError):
                    await task
                return reservation

            with patch.object(upload_reservation, "_create_reservation", side_effect=delayed_create):
                reservation = asyncio.run(exercise())

            self.assertIsNone(reservation.stage_path)
            self.assertIsNone(reservation.marker_path)
            self.assertEqual([], [path for path in upload_root.rglob("*") if path.is_file()])

    def test_cancelled_commit_removes_final_file_after_atomic_replace(self) -> None:
        with TemporaryDirectory() as temp_dir:
            user_dir = Path(temp_dir) / "uploads" / "user"
            staging_dir = user_dir / ".uploading"
            staging_dir.mkdir(parents=True)
            stage_path = staging_dir / "upload.part"
            stage_path.write_bytes(b"payload")
            replaced = threading.Event()
            original_commit = upload_media.commit_staged_upload

            def delayed_commit(stage: Path, target_dir: Path, extension: str):
                result = original_commit(stage, target_dir, extension)
                replaced.set()
                time.sleep(0.05)
                return result

            async def exercise() -> None:
                task = asyncio.create_task(
                    commit_staged_upload_cancellation_safe(stage_path, user_dir, ".bin")
                )
                while not replaced.is_set():
                    await asyncio.sleep(0.001)
                task.cancel()
                with self.assertRaises(asyncio.CancelledError):
                    await task

            with patch.object(upload_media, "commit_staged_upload", side_effect=delayed_commit):
                asyncio.run(exercise())

            self.assertFalse(stage_path.exists())
            self.assertEqual([], [path for path in user_dir.iterdir() if path.is_file()])


if __name__ == "__main__":
    unittest.main()
