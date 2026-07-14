from __future__ import annotations

import asyncio
import json
import shutil
import sys
import threading
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import event, text

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.router import include_routers
from controllers.store import DatabaseStore, configure_store, store
from core.security import create_token, hash_password
from models.base import init_engine
from settings.config import settings
from tests.media_fixtures import VALID_PNG_BYTES
from tests.mysql_test_database import MySQLTestDatabase


UPLOAD_REQUEST_OVERHEAD_BYTES = 64 * 1024


class AssetUploadQuotaTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_asset_upload_quota")
        cls.mysql_database.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    def setUp(self) -> None:
        self.temp_dir = TemporaryDirectory()
        self.original_storage_root = settings.storage_local_root
        self.original_user_quota = getattr(settings, "asset_upload_user_quota_bytes", None)
        self.original_free_floor = getattr(settings, "asset_upload_min_free_bytes", None)
        settings.storage_local_root = str(Path(self.temp_dir.name) / "storage")
        object.__setattr__(settings, "asset_upload_user_quota_bytes", 1024 * 1024)
        object.__setattr__(settings, "asset_upload_min_free_bytes", 0)
        configure_store(DatabaseStore())
        app = FastAPI()
        include_routers(app)
        self.client = TestClient(app)
        store.registration_settings["registration_mode"] = "open"
        store.ensure_admin_user("test-admin", hash_password("StrongPass123!"))
        response = self.client.post(
            "/auth/wechat/mock",
            json={
                "openid": f"upload-quota-{self._testMethodName}",
                "nickname": "upload-quota",
                "avatar_url": "",
                "unionid": None,
                "invitation_code": None,
            },
        )
        self.user = response.json()["user"]

    def tearDown(self) -> None:
        self.client.close()
        settings.storage_local_root = self.original_storage_root
        self._restore_setting("asset_upload_user_quota_bytes", self.original_user_quota)
        self._restore_setting("asset_upload_min_free_bytes", self.original_free_floor)
        self.temp_dir.cleanup()

    def test_upload_counts_every_existing_user_file_without_deleting_it(self) -> None:
        user_dir = self._user_upload_dir()
        nested_dir = user_dir / "nested"
        nested_dir.mkdir(parents=True)
        existing_files = (user_dir / ".orphan.uploading", nested_dir / "untracked.bin")
        existing_files[0].write_bytes(b"12345")
        existing_files[1].write_bytes(b"67890")
        object.__setattr__(settings, "asset_upload_user_quota_bytes", len(VALID_PNG_BYTES) + 5)

        response = self._upload_png()

        self.assertEqual(413, response.status_code)
        self.assertEqual("User upload storage quota exceeded", response.json()["detail"])
        self.assertTrue(all(path.exists() for path in existing_files))
        self.assertEqual(10, sum(path.stat().st_size for path in existing_files))

    def test_upload_preserves_configured_global_free_space_floor(self) -> None:
        storage_root = Path(settings.storage_local_root)
        storage_root.mkdir(parents=True)
        object.__setattr__(
            settings,
            "asset_upload_min_free_bytes",
            shutil.disk_usage(storage_root).total,
        )

        response = self._upload_png()

        self.assertEqual(507, response.status_code)
        self.assertEqual("Insufficient local storage", response.json()["detail"])
        self.assertEqual([], self._stored_upload_files())

    def test_upload_uses_nonblocking_mysql_lock_and_reports_busy(self) -> None:
        engine = init_engine()
        lock_names: list[str] = []
        statements: list[str] = []

        def observe_statement(conn, cursor, statement, parameters, context, executemany):
            normalized = statement.upper()
            if "GET_LOCK" in normalized:
                lock_names.append(next(iter(parameters.values())))
            if "GET_LOCK" in normalized or "RELEASE_LOCK" in normalized:
                statements.append(normalized)

        event.listen(engine, "before_cursor_execute", observe_statement)
        try:
            first_response = self._upload_png()
        finally:
            event.remove(engine, "before_cursor_execute", observe_statement)

        self.assertEqual(200, first_response.status_code)
        self.assertEqual(5, len(lock_names))
        self.assertEqual(10, len(statements))
        self.assertEqual(
            ["GET_LOCK", "GET_LOCK", "RELEASE_LOCK", "GET_LOCK", "RELEASE_LOCK", "RELEASE_LOCK"],
            [
                "GET_LOCK" if "GET_LOCK" in statement else "RELEASE_LOCK"
                for statement in statements[:6]
            ],
        )
        self.assertEqual(5, sum("GET_LOCK" in statement for statement in statements))
        self.assertEqual(5, sum("RELEASE_LOCK" in statement for statement in statements))

        with engine.connect() as connection:
            self.assertEqual(1, connection.execute(text("SELECT GET_LOCK(:name, 0)"), {"name": lock_names[0]}).scalar())
            try:
                busy_response = self._upload_png()
            finally:
                connection.execute(text("SELECT RELEASE_LOCK(:name)"), {"name": lock_names[0]})

        self.assertEqual(503, busy_response.status_code)
        self.assertEqual("1", busy_response.headers["retry-after"])

    def test_upload_releases_mysql_lock_if_capacity_scan_fails(self) -> None:
        from core import upload_reservation

        statements: list[str] = []

        def observe_statement(conn, cursor, statement, parameters, context, executemany):
            if "_LOCK" in statement.upper():
                statements.append(statement.upper())

        engine = init_engine()
        event.listen(engine, "before_cursor_execute", observe_statement)
        try:
            with patch.object(upload_reservation, "_calculate_capacity", side_effect=RuntimeError("scan failed")):
                with self.assertRaisesRegex(RuntimeError, "scan failed"):
                    self._upload_png()
        finally:
            event.remove(engine, "before_cursor_execute", observe_statement)

        self.assertEqual(6, len(statements))
        self.assertEqual(3, sum("GET_LOCK" in statement for statement in statements))
        self.assertEqual(3, sum("RELEASE_LOCK" in statement for statement in statements))

    def test_failed_mysql_lock_release_invalidates_connection(self) -> None:
        from core import upload_reservation

        lock_names: list[str] = []
        release_attempts = 0

        def fail_release(conn, cursor, statement, parameters, context, executemany):
            nonlocal release_attempts
            normalized = statement.upper()
            if "GET_LOCK" in normalized:
                lock_names.append(next(iter(parameters.values())))
            if "RELEASE_LOCK" in normalized:
                release_attempts += 1
                raise RuntimeError("simulated release failure")

        engine = init_engine()
        event.listen(engine, "before_cursor_execute", fail_release)
        try:
            with self.assertRaises(upload_reservation.UploadReservationBusyError):
                upload_reservation._create_reservation(
                    self.user["id"],
                    Path(settings.storage_local_root) / "uploads",
                    1,
                )
        finally:
            event.remove(engine, "before_cursor_execute", fail_release)

        self.assertEqual(1, release_attempts)
        self.assertEqual(2, len(lock_names))
        with engine.connect() as connection:
            for lock_name in lock_names:
                self.assertEqual(
                    1,
                    connection.execute(
                        text("SELECT GET_LOCK(:name, 0)"),
                        {"name": lock_name},
                    ).scalar(),
                )
            for lock_name in reversed(lock_names):
                connection.execute(
                    text("SELECT RELEASE_LOCK(:name)"),
                    {"name": lock_name},
                )
        self.assertEqual([], self._stored_upload_files())

    def test_json_asset_bypasses_local_storage_lock_and_quota(self) -> None:
        object.__setattr__(settings, "asset_upload_user_quota_bytes", 1)
        object.__setattr__(settings, "asset_upload_min_free_bytes", 2**60)
        statements: list[str] = []

        def observe_statement(conn, cursor, statement, parameters, context, executemany):
            if "_LOCK" in statement.upper():
                statements.append(statement)

        engine = init_engine()
        event.listen(engine, "before_cursor_execute", observe_statement)
        try:
            response = self.client.post(
                "/assets/upload",
                json={"type": "prompt", "content_text": "hello"},
                headers=self._auth_headers(),
            )
        finally:
            event.remove(engine, "before_cursor_execute", observe_statement)

        self.assertEqual(200, response.status_code)
        self.assertEqual([], statements)

    def test_chunked_upload_stops_at_remaining_user_quota(self) -> None:
        user_dir = self._user_upload_dir()
        user_dir.mkdir(parents=True)
        object.__setattr__(settings, "asset_upload_user_quota_bytes", 256)
        (user_dir / "existing.bin").write_bytes(b"x" * 128)
        boundary = "quota-boundary"
        body = (
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"type\"\r\n\r\nimage\r\n"
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; "
            f"filename=\"cover.png\"\r\nContent-Type: image/png\r\n\r\n"
        ).encode() + VALID_PNG_BYTES + (b"x" * (UPLOAD_REQUEST_OVERHEAD_BYTES + 16 * 1024)) + (
            f"\r\n--{boundary}--\r\n".encode()
        )
        chunks = [body[index : index + 4096] for index in range(0, len(body), 4096)]
        consumed_chunks = 0
        response_status = 0
        response_body = bytearray()

        async def receive():
            nonlocal consumed_chunks
            chunk = chunks[consumed_chunks]
            consumed_chunks += 1
            return {"type": "http.request", "body": chunk, "more_body": consumed_chunks < len(chunks)}

        async def send(message):
            nonlocal response_status
            if message["type"] == "http.response.start":
                response_status = message["status"]
            elif message["type"] == "http.response.body":
                response_body.extend(message.get("body", b""))

        asyncio.run(self.client.app(self._upload_scope(boundary), receive, send))

        self.assertEqual(413, response_status)
        self.assertEqual("User upload storage quota exceeded", json.loads(response_body)["detail"])
        self.assertLess(consumed_chunks, len(chunks))

    def test_local_file_write_runs_outside_request_event_loop_thread(self) -> None:
        from api import assets as asset_api

        endpoint_threads: list[int] = []
        file_threads: list[int] = []
        original_limit = asset_api._limit_upload_request_body
        original_open = Path.open

        def tracked_limit(*args, **kwargs):
            endpoint_threads.append(threading.get_ident())
            return original_limit(*args, **kwargs)

        def tracked_open(path: Path, *args, **kwargs):
            mode = args[0] if args else kwargs.get("mode", "r")
            if path.suffix == ".part" and any(flag in mode for flag in "xwa"):
                file_threads.append(threading.get_ident())
            return original_open(path, *args, **kwargs)

        with (
            patch.object(asset_api, "_limit_upload_request_body", tracked_limit),
            patch.object(Path, "open", tracked_open),
        ):
            response = self._upload_png()

        self.assertEqual(200, response.status_code)
        self.assertEqual(1, len(endpoint_threads))
        self.assertEqual(1, len(file_threads))
        self.assertNotEqual(endpoint_threads[0], file_threads[0])

    def _upload_png(self):
        return self.client.post(
            "/assets/upload",
            data={"type": "image"},
            files={"file": ("cover.png", VALID_PNG_BYTES, "image/png")},
            headers=self._auth_headers(),
        )

    def _auth_headers(self) -> dict[str, str]:
        token = create_token({"sub": self.user["id"], "role": "user"})
        return {"Authorization": f"Bearer {token}"}

    def _user_upload_dir(self) -> Path:
        return Path(settings.storage_local_root) / "uploads" / self.user["id"]

    def _stored_upload_files(self) -> list[Path]:
        upload_root = Path(settings.storage_local_root) / "uploads"
        return [path for path in upload_root.rglob("*") if path.is_file()] if upload_root.exists() else []

    def _upload_scope(self, boundary: str) -> dict:
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
                (b"content-type", f"multipart/form-data; boundary={boundary}".encode()),
                (b"authorization", self._auth_headers()["Authorization"].encode()),
            ],
            "client": ("testclient", 50000),
            "server": ("testserver", 80),
            "state": {},
        }

    @staticmethod
    def _restore_setting(name: str, original_value) -> None:
        if original_value is None:
            object.__delattr__(settings, name)
        else:
            object.__setattr__(settings, name, original_value)


if __name__ == "__main__":
    unittest.main()
