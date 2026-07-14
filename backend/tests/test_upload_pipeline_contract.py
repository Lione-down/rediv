from __future__ import annotations

import asyncio
import errno
import json
import struct
import sys
import threading
import unittest
from contextlib import suppress
from pathlib import Path
from tempfile import SpooledTemporaryFile, TemporaryDirectory
from unittest.mock import AsyncMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import text

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api import assets as asset_api
from api.router import include_routers
from controllers.store import DatabaseStore, configure_store, store
from core.security import create_token, hash_password
from core.upload_reservation import upload_lock_name
from models.base import init_engine
from settings.config import settings
from tests.media_fixtures import VALID_PNG_BYTES
from tests.mysql_test_database import MySQLTestDatabase


_MISSING = object()


def _wav_bytes(payload_bytes: int) -> bytes:
    data = b"\x00\x00" * (payload_bytes // 2)
    fmt = struct.pack("<HHIIHH", 1, 1, 8_000, 16_000, 2, 16)
    body = b"fmt " + struct.pack("<I", len(fmt)) + fmt
    body += b"data" + struct.pack("<I", len(data)) + data
    return b"RIFF" + struct.pack("<I", len(body) + 4) + b"WAVE" + body


class UploadPipelineContractTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_upload_pipeline_contract")
        cls.mysql_database.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    def setUp(self) -> None:
        self.temp_dir = TemporaryDirectory()
        self.original_settings = {
            name: getattr(settings, name, _MISSING)
            for name in (
                "storage_local_root",
                "asset_upload_max_bytes",
                "asset_upload_user_quota_bytes",
                "asset_upload_min_free_bytes",
                "asset_upload_idle_timeout_seconds",
                "asset_upload_total_timeout_seconds",
            )
        }
        settings.storage_local_root = str(Path(self.temp_dir.name) / "storage")
        object.__setattr__(settings, "asset_upload_max_bytes", 8 * 1024 * 1024)
        object.__setattr__(settings, "asset_upload_user_quota_bytes", 16 * 1024 * 1024)
        object.__setattr__(settings, "asset_upload_min_free_bytes", 0)
        self._set_timeouts(idle_seconds=0.5, total_seconds=2.0)

        configure_store(DatabaseStore())
        app = FastAPI()
        include_routers(app)
        self.client = TestClient(app, raise_server_exceptions=False)
        store.registration_settings["registration_mode"] = "open"
        store.ensure_admin_user("test-admin", hash_password("StrongPass123!"))
        response = self.client.post(
            "/auth/wechat/mock",
            json={
                "openid": f"upload-pipeline-{self._testMethodName}",
                "nickname": "upload-pipeline",
                "avatar_url": "",
                "unionid": None,
                "invitation_code": None,
            },
        )
        self.user = response.json()["user"]

    def tearDown(self) -> None:
        self.client.close()
        for name, value in self.original_settings.items():
            if value is _MISSING:
                with suppress(AttributeError):
                    object.__delattr__(settings, name)
            else:
                object.__setattr__(settings, name, value)
        self.temp_dir.cleanup()

    def test_upload_lock_is_available_while_request_waits_for_body(self) -> None:
        self._set_timeouts(idle_seconds=1.0, total_seconds=2.0)
        waiting_for_body = asyncio.Event()

        async def exercise() -> tuple[int, list[Path]]:
            receive_calls = 0

            async def receive():
                nonlocal receive_calls
                receive_calls += 1
                if receive_calls == 1:
                    return {
                        "type": "http.request",
                        "body": self._multipart_prefix(b"partial"),
                        "more_body": True,
                    }
                waiting_for_body.set()
                await asyncio.sleep(5)
                return {"type": "http.disconnect"}

            request_task = asyncio.create_task(self._invoke_asgi(receive))
            await asyncio.wait_for(waiting_for_body.wait(), timeout=1)
            acquired = await asyncio.to_thread(self._try_upload_lock)
            request_task.cancel()
            with suppress(asyncio.CancelledError, Exception):
                await request_task
            await asyncio.sleep(0)
            return acquired, self._upload_files()

        acquired, remaining_files = asyncio.run(exercise())

        self.assertEqual(1, acquired, "global upload lock remained held while receive() was idle")
        self.assertEqual([], remaining_files, "cancelled upload left reservation or staging files")

    def test_idle_body_timeout_returns_408_and_cleans_reservation(self) -> None:
        self._set_timeouts(idle_seconds=0.02, total_seconds=1.0)

        async def exercise() -> tuple[int, bytes]:
            receive_calls = 0

            async def receive():
                nonlocal receive_calls
                receive_calls += 1
                if receive_calls == 1:
                    return {
                        "type": "http.request",
                        "body": self._multipart_prefix(b"partial"),
                        "more_body": True,
                    }
                await asyncio.sleep(0.15)
                return {"type": "http.disconnect"}

            return await self._invoke_asgi(receive)

        response_status, response_body = asyncio.run(exercise())

        self.assertEqual(408, response_status, response_body.decode(errors="replace"))
        self.assertEqual([], self._upload_files())

    def test_total_body_timeout_returns_408_despite_active_chunks(self) -> None:
        self._set_timeouts(idle_seconds=0.08, total_seconds=0.04)

        async def exercise() -> tuple[int, bytes]:
            receive_calls = 0

            async def receive():
                nonlocal receive_calls
                receive_calls += 1
                await asyncio.sleep(0.015)
                if receive_calls == 1:
                    body = self._multipart_prefix(b"x")
                else:
                    body = b"x" * 32
                return {"type": "http.request", "body": body, "more_body": True}

            try:
                return await asyncio.wait_for(self._invoke_asgi(receive), timeout=1)
            except TimeoutError:
                return 0, b"upload request did not enforce a total body timeout"

        response_status, response_body = asyncio.run(exercise())

        self.assertEqual(408, response_status, response_body.decode(errors="replace"))
        self.assertEqual([], self._upload_files())

    def test_json_idle_body_timeout_returns_408(self) -> None:
        self._set_timeouts(idle_seconds=0.02, total_seconds=1.0)

        async def exercise() -> tuple[int, bytes]:
            receive_calls = 0

            async def receive():
                nonlocal receive_calls
                receive_calls += 1
                if receive_calls == 1:
                    return {
                        "type": "http.request",
                        "body": b'{"type":"prompt",',
                        "more_body": True,
                    }
                await asyncio.sleep(0.15)
                return {"type": "http.disconnect"}

            return await self._invoke_asgi(receive, content_type="application/json")

        response_status, response_body = asyncio.run(exercise())

        self.assertEqual(408, response_status, response_body.decode(errors="replace"))

    def test_json_total_timeout_returns_408_despite_active_chunks(self) -> None:
        self._set_timeouts(idle_seconds=0.08, total_seconds=0.04)

        async def exercise() -> tuple[int, bytes]:
            async def receive():
                await asyncio.sleep(0.015)
                return {"type": "http.request", "body": b" ", "more_body": True}

            return await self._invoke_asgi(receive, content_type="application/json")

        response_status, response_body = asyncio.run(exercise())

        self.assertEqual(408, response_status, response_body.decode(errors="replace"))

    def test_total_timeout_cancels_media_validation_and_cleans_stage(self) -> None:
        self._set_timeouts(idle_seconds=0.5, total_seconds=0.04)

        async def slow_validation(*args, **kwargs) -> None:
            await asyncio.sleep(0.2)

        with patch.object(
            asset_api,
            "validate_staged_upload_in_process",
            side_effect=slow_validation,
        ):
            response = self.client.post(
                "/assets/upload",
                data={"type": "image"},
                files={"file": ("slow.png", VALID_PNG_BYTES, "image/png")},
                headers=self._auth_headers(),
            )

        self.assertEqual(408, response.status_code, response.text)
        self.assertEqual([], self._upload_files())

    def test_large_upload_uses_one_named_same_volume_stage_and_atomic_replace(self) -> None:
        content = _wav_bytes(1024 * 1024 + 64 * 1024)
        spool_calls: list[int] = []
        replacements: list[tuple[Path, Path, int, int]] = []
        original_spool = SpooledTemporaryFile
        original_replace = Path.replace

        def tracked_spool(*args, **kwargs):
            spool_calls.append(threading.get_ident())
            return original_spool(*args, **kwargs)

        def tracked_replace(source: Path, target: Path):
            replacements.append((source, target, source.stat().st_dev, target.parent.stat().st_dev))
            return original_replace(source, target)

        with (
            patch("starlette.formparsers.SpooledTemporaryFile", side_effect=tracked_spool),
            patch.object(Path, "replace", tracked_replace),
        ):
            response = self.client.post(
                "/assets/upload",
                data={"type": "audio"},
                files={"file": ("large.wav", content, "audio/wav")},
                headers=self._auth_headers(),
            )

        self.assertEqual(200, response.status_code, response.text)
        self.assertEqual([], spool_calls, "multipart parser created a system-temp spool")
        self.assertEqual(1, len(replacements))
        source, target, source_device, target_device = replacements[0]
        self.assertEqual(".part", source.suffix)
        self.assertEqual(".uploading", source.parent.name)
        self.assertEqual(source_device, target_device)
        self.assertEqual(target, Path(settings.storage_local_root) / response.json()["url"].lstrip("/"))
        self.assertEqual([target], self._upload_files())
        self.assertEqual(len(content), target.stat().st_size)

    def test_large_parser_disk_operations_never_run_on_event_loop_thread(self) -> None:
        content = b"not-media" + (b"x" * (1024 * 1024 + 64 * 1024))
        operation_threads: list[tuple[str, int]] = []
        event_loop_threads: list[int] = []
        upload_root = Path(settings.storage_local_root) / "uploads"
        original_headers = asset_api._multipart_headers
        original_open = Path.open
        original_unlink = Path.unlink
        original_replace = Path.replace

        class TrackedSpooledFile(SpooledTemporaryFile):
            def write(self, data):
                operation_threads.append(("spool-write", threading.get_ident()))
                return super().write(data)

            def seek(self, offset, whence=0):
                operation_threads.append(("spool-seek", threading.get_ident()))
                return super().seek(offset, whence)

            def close(self):
                operation_threads.append(("spool-close", threading.get_ident()))
                return super().close()

        class TrackedFile:
            def __init__(self, file_object) -> None:
                self.file_object = file_object

            def __getattr__(self, name):
                return getattr(self.file_object, name)

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc_value, traceback):
                self.close()

            def write(self, data):
                operation_threads.append(("stage-write", threading.get_ident()))
                return self.file_object.write(data)

            def seek(self, offset, whence=0):
                operation_threads.append(("stage-seek", threading.get_ident()))
                return self.file_object.seek(offset, whence)

            def close(self):
                operation_threads.append(("stage-close", threading.get_ident()))
                return self.file_object.close()

        def tracked_headers(*args, **kwargs):
            event_loop_threads.append(threading.get_ident())
            return original_headers(*args, **kwargs)

        def tracked_open(path: Path, *args, **kwargs):
            file_object = original_open(path, *args, **kwargs)
            if path.is_relative_to(upload_root) and path.suffix == ".part":
                operation_threads.append(("stage-open", threading.get_ident()))
                return TrackedFile(file_object)
            return file_object

        def tracked_unlink(path: Path, *args, **kwargs):
            if path.is_relative_to(upload_root):
                operation_threads.append(("stage-unlink", threading.get_ident()))
            return original_unlink(path, *args, **kwargs)

        def tracked_replace(source: Path, target: Path):
            if source.is_relative_to(upload_root):
                operation_threads.append(("stage-replace", threading.get_ident()))
            return original_replace(source, target)

        with (
            patch.object(asset_api, "_multipart_headers", tracked_headers),
            patch("starlette.formparsers.SpooledTemporaryFile", TrackedSpooledFile),
            patch.object(Path, "open", tracked_open),
            patch.object(Path, "unlink", tracked_unlink),
            patch.object(Path, "replace", tracked_replace),
        ):
            response = self.client.post(
                "/assets/upload",
                data={"type": "image"},
                files={"file": ("invalid.png", content, "image/png")},
                headers=self._auth_headers(),
            )

        self.assertEqual(415, response.status_code, response.text)
        self.assertEqual(1, len(event_loop_threads))
        self.assertTrue(operation_threads, "test did not observe parser or staging disk I/O")
        loop_thread = event_loop_threads[0]
        unsafe_operations = [name for name, thread_id in operation_threads if thread_id == loop_thread]
        self.assertEqual([], unsafe_operations, f"disk I/O ran on event-loop thread: {unsafe_operations}")
        self.assertEqual([], self._upload_files())

    def test_streaming_storage_exhaustion_returns_507_and_cleans_reservation(self) -> None:
        disk_full = OSError(errno.ENOSPC, "simulated full upload volume")
        with patch("core.upload_multipart.UploadFile.write", new=AsyncMock(side_effect=disk_full)):
            response = self.client.post(
                "/assets/upload",
                data={"type": "audio"},
                files={"file": ("voice.wav", _wav_bytes(32), "audio/wav")},
                headers=self._auth_headers(),
            )

        self.assertEqual(507, response.status_code, response.text)
        self.assertEqual("Insufficient local storage", response.json()["detail"])
        self.assertEqual([], self._upload_files())

    def _set_timeouts(self, idle_seconds: float, total_seconds: float) -> None:
        object.__setattr__(settings, "asset_upload_idle_timeout_seconds", idle_seconds)
        object.__setattr__(settings, "asset_upload_total_timeout_seconds", total_seconds)

    def _try_upload_lock(self) -> int:
        lock_name = upload_lock_name(Path(settings.storage_local_root) / "uploads")
        with init_engine().connect() as connection:
            acquired = int(
                connection.execute(
                    text("SELECT GET_LOCK(:lock_name, 0)"),
                    {"lock_name": lock_name},
                ).scalar()
                or 0
            )
            if acquired == 1:
                connection.execute(
                    text("SELECT RELEASE_LOCK(:lock_name)"),
                    {"lock_name": lock_name},
                )
            return acquired

    async def _invoke_asgi(
        self,
        receive,
        *,
        content_type: str = "multipart/form-data; boundary=pipeline-boundary",
    ) -> tuple[int, bytes]:
        response_status = 0
        response_body = bytearray()

        async def send(message):
            nonlocal response_status
            if message["type"] == "http.response.start":
                response_status = message["status"]
            elif message["type"] == "http.response.body":
                response_body.extend(message.get("body", b""))

        try:
            await self.client.app(self._upload_scope(content_type), receive, send)
        except Exception as error:
            response_body.extend(json.dumps({"test_exception": type(error).__name__}).encode())
        return response_status, bytes(response_body)

    def _upload_scope(self, content_type: str) -> dict:
        return {
            "type": "http",
            "asgi": {"version": "3.0"},
            "http_version": "1.1",
            "method": "POST",
            "scheme": "http",
            "path": "/assets/upload",
            "raw_path": b"/assets/upload",
            "query_string": b"",
            "root_path": "",
            "headers": [
                (b"host", b"testserver"),
                (b"content-type", content_type.encode()),
                (b"authorization", self._auth_headers()["Authorization"].encode()),
            ],
            "client": ("testclient", 50000),
            "server": ("testserver", 80),
            "state": {},
        }

    @staticmethod
    def _multipart_prefix(content: bytes) -> bytes:
        return (
            b"--pipeline-boundary\r\n"
            b"Content-Disposition: form-data; name=\"type\"\r\n\r\nimage\r\n"
            b"--pipeline-boundary\r\n"
            b"Content-Disposition: form-data; name=\"file\"; filename=\"partial.png\"\r\n"
            b"Content-Type: image/png\r\n\r\n"
            + content
        )

    def _auth_headers(self) -> dict[str, str]:
        token = create_token({"sub": self.user["id"], "role": "user"})
        return {"Authorization": f"Bearer {token}"}

    @staticmethod
    def _upload_files() -> list[Path]:
        upload_root = Path(settings.storage_local_root) / "uploads"
        if not upload_root.exists():
            return []
        return sorted(path for path in upload_root.rglob("*") if path.is_file())


if __name__ == "__main__":
    unittest.main()
