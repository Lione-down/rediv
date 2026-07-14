from __future__ import annotations

import asyncio
import json
import struct
import sys
import unittest
from pathlib import Path
from tempfile import SpooledTemporaryFile, TemporaryDirectory
from unittest.mock import AsyncMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from starlette.datastructures import FormData
from starlette.requests import Request

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.router import include_routers
from controllers.store import DatabaseStore, configure_store, store
from core.security import create_token, hash_password
from settings.config import settings
from tests.media_fixtures import VALID_UPLOAD_BYTES
from tests.mysql_test_database import MySQLTestDatabase


UPLOAD_REQUEST_OVERHEAD_BYTES = 64 * 1024


class AssetUploadSecurityTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_asset_upload_stream_security")
        cls.mysql_database.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    def setUp(self) -> None:
        self.temp_dir = TemporaryDirectory()
        self.original_storage_root = settings.storage_local_root
        settings.storage_local_root = str(Path(self.temp_dir.name) / "storage")

        configure_store(DatabaseStore())

        app = FastAPI()
        include_routers(app)
        self.client = TestClient(app)

        store.registration_settings["registration_mode"] = "open"
        test_id = self._testMethodName
        store.ensure_admin_user("test-admin", hash_password("StrongPass123!"))
        self.user = self._register_user(f"asset-stream-owner-{test_id}").json()["user"]
        self.other_user = self._register_user(f"asset-stream-other-{test_id}").json()["user"]

    def tearDown(self) -> None:
        self.client.close()
        settings.storage_local_root = self.original_storage_root
        self.temp_dir.cleanup()

    def test_upload_multipart_accepts_each_supported_signature(self) -> None:
        project = store.create_project(self.user["id"], "All Media Project")
        media_files = (
            ("image", "cover.gif", "image/gif"),
            ("image", "cover.jpeg", "image/jpeg"),
            ("image", "cover.jpg", "image/jpeg"),
            ("image", "cover.png", "image/png"),
            ("image", "cover.webp", "image/webp"),
            ("video", "clip.mov", "video/quicktime"),
            ("video", "clip.mp4", "video/mp4"),
            ("video", "clip.webm", "video/webm"),
            ("audio", "voice.flac", "audio/flac"),
            ("audio", "voice.m4a", "audio/mp4"),
            ("audio", "voice.mp3", "audio/mpeg"),
            ("audio", "voice.ogg", "audio/ogg"),
            ("audio", "voice.wav", "audio/wav"),
        )

        for asset_type, filename, content_type in media_files:
            with self.subTest(filename=filename):
                response = self.client.post(
                    "/assets/upload",
                    data={"type": asset_type, "project_id": project["id"]},
                    files={"file": (filename, VALID_UPLOAD_BYTES[filename], content_type)},
                    headers=self._auth_headers(self.user["id"]),
                )

                self.assertEqual(200, response.status_code)

    def test_upload_multipart_rejects_disallowed_extension(self) -> None:
        response = self.client.post(
            "/assets/upload",
            data={"type": "image"},
            files={"file": ("vector.svg", b"<svg></svg>", "image/svg+xml")},
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(415, response.status_code)
        self.assertEqual("Unsupported file type", response.json()["detail"])
        self.assertEqual([], self._stored_upload_files())

    def test_upload_multipart_rejects_mime_extension_mismatch(self) -> None:
        response = self.client.post(
            "/assets/upload",
            data={"type": "image"},
            files={"file": ("cover.png", VALID_UPLOAD_BYTES["cover.png"], "video/mp4")},
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(415, response.status_code)
        self.assertEqual("File type does not match asset type", response.json()["detail"])
        self.assertEqual([], self._stored_upload_files())

    def test_upload_multipart_rejects_declared_asset_type_mismatch(self) -> None:
        response = self.client.post(
            "/assets/upload",
            data={"type": "video"},
            files={"file": ("cover.png", VALID_UPLOAD_BYTES["cover.png"], "image/png")},
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(415, response.status_code)
        self.assertEqual("File type does not match asset type", response.json()["detail"])
        self.assertEqual([], self._stored_upload_files())

    def test_upload_multipart_rejects_forged_magic_bytes(self) -> None:
        response = self.client.post(
            "/assets/upload",
            data={"type": "image"},
            files={"file": ("cover.png", b"not-an-image", "image/png")},
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(415, response.status_code)
        self.assertEqual("File content does not match file type", response.json()["detail"])
        self.assertEqual([], self._stored_upload_files())

    def test_upload_multipart_rejects_header_only_media(self) -> None:
        ftyp_size = int.from_bytes(VALID_UPLOAD_BYTES["clip.mp4"][:4], "big")
        header_only_files = (
            ("image", "cover.png", "image/png", VALID_UPLOAD_BYTES["cover.png"][:16]),
            ("video", "clip.mp4", "video/mp4", VALID_UPLOAD_BYTES["clip.mp4"][:ftyp_size]),
            ("audio", "voice.mp3", "audio/mpeg", VALID_UPLOAD_BYTES["voice.mp3"][:10]),
        )

        for asset_type, filename, content_type, content in header_only_files:
            with self.subTest(filename=filename):
                response = self.client.post(
                    "/assets/upload",
                    data={"type": asset_type},
                    files={"file": (filename, content, content_type)},
                    headers=self._auth_headers(self.user["id"]),
                )

                self.assertEqual(415, response.status_code)
                self.assertEqual("File content does not match file type", response.json()["detail"])

    def test_upload_multipart_rejects_truncated_container_structure(self) -> None:
        truncated_files = (
            ("image", "cover.gif", "image/gif"),
            ("image", "cover.jpeg", "image/jpeg"),
            ("image", "cover.webp", "image/webp"),
            ("audio", "voice.ogg", "audio/ogg"),
        )

        for asset_type, filename, content_type in truncated_files:
            with self.subTest(filename=filename):
                response = self.client.post(
                    "/assets/upload",
                    data={"type": asset_type},
                    files={"file": (filename, VALID_UPLOAD_BYTES[filename][:-1], content_type)},
                    headers=self._auth_headers(self.user["id"]),
                )

                self.assertEqual(415, response.status_code)
                self.assertEqual("File content does not match file type", response.json()["detail"])

    def test_upload_multipart_rejects_oversized_ftyp_box(self) -> None:
        box_size = 8192
        content = struct.pack(">I4s", box_size, b"ftyp") + b"mp42\x00\x00\x00\x00isom"
        content += b"\x00" * (box_size - len(content))

        response = self.client.post(
            "/assets/upload",
            data={"type": "video"},
            files={"file": ("clip.mp4", content, "video/mp4")},
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(415, response.status_code)
        self.assertEqual("File content does not match file type", response.json()["detail"])

    def test_upload_multipart_rejects_signature_extension_mismatch(self) -> None:
        response = self.client.post(
            "/assets/upload",
            data={"type": "image"},
            files={"file": ("cover.png", VALID_UPLOAD_BYTES["cover.jpg"], "image/png")},
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(415, response.status_code)
        self.assertEqual("File content does not match file type", response.json()["detail"])
        self.assertEqual([], self._stored_upload_files())

    def test_upload_multipart_rejects_svg_disguised_as_png(self) -> None:
        response = self.client.post(
            "/assets/upload",
            data={"type": "image"},
            files={"file": ("cover.png", b"<svg xmlns='http://www.w3.org/2000/svg'/>", "image/png")},
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(415, response.status_code)
        self.assertEqual("File content does not match file type", response.json()["detail"])
        self.assertEqual([], self._stored_upload_files())

    def test_upload_multipart_rejects_oversized_file_and_cleans_partial_write(self) -> None:
        original_limit = settings.asset_upload_max_bytes
        object.__setattr__(settings, "asset_upload_max_bytes", 8)
        try:
            response = self.client.post(
                "/assets/upload",
                data={"type": "image"},
                files={"file": ("cover.png", b"ninebytes", "image/png")},
                headers=self._auth_headers(self.user["id"]),
            )
        finally:
            object.__setattr__(settings, "asset_upload_max_bytes", original_limit)

        self.assertEqual(413, response.status_code)
        self.assertEqual("Uploaded file is too large", response.json()["detail"])
        self.assertEqual([], self._stored_upload_files())

    def test_upload_rejects_oversized_content_length_before_form_parsing(self) -> None:
        original_limit = settings.asset_upload_max_bytes
        object.__setattr__(settings, "asset_upload_max_bytes", 64)
        parse_form = AsyncMock(return_value=FormData([("type", "image")]))
        try:
            with patch.object(Request, "_get_form", parse_form):
                response = self.client.post(
                    "/assets/upload",
                    content=b"x",
                    headers={
                        **self._auth_headers(self.user["id"]),
                        "content-type": "multipart/form-data; boundary=upload",
                        "content-length": str(64 + UPLOAD_REQUEST_OVERHEAD_BYTES + 1),
                    },
                )
        finally:
            object.__setattr__(settings, "asset_upload_max_bytes", original_limit)

        self.assertEqual(413, response.status_code)
        self.assertEqual("Uploaded file is too large", response.json()["detail"])
        parse_form.assert_not_awaited()

    def test_upload_rejects_oversized_chunked_stream_before_consuming_full_body(self) -> None:
        boundary = "upload-boundary"
        body = (
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"type\"\r\n\r\nimage\r\n"
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; "
            f"filename=\"cover.png\"\r\nContent-Type: image/png\r\n\r\n"
        ).encode() + VALID_UPLOAD_BYTES["cover.png"] + (
            b"x" * (UPLOAD_REQUEST_OVERHEAD_BYTES + 16 * 1024)
        ) + f"\r\n--{boundary}--\r\n".encode()
        chunks = [body[index : index + 4096] for index in range(0, len(body), 4096)]
        consumed_chunks = 0
        response_status = 0
        response_body = bytearray()
        opened_files: list[SpooledTemporaryFile] = []

        def tracked_spooled_file(*args, **kwargs):
            file = SpooledTemporaryFile(*args, **kwargs)
            opened_files.append(file)
            return file

        async def receive():
            nonlocal consumed_chunks
            chunk = chunks[consumed_chunks]
            consumed_chunks += 1
            return {
                "type": "http.request",
                "body": chunk,
                "more_body": consumed_chunks < len(chunks),
            }

        async def send(message):
            nonlocal response_status
            if message["type"] == "http.response.start":
                response_status = message["status"]
            elif message["type"] == "http.response.body":
                response_body.extend(message.get("body", b""))

        scope = {
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
                (b"authorization", self._auth_headers(self.user["id"])["Authorization"].encode()),
            ],
            "client": ("testclient", 50000),
            "server": ("testserver", 80),
            "state": {},
        }
        original_limit = settings.asset_upload_max_bytes
        object.__setattr__(settings, "asset_upload_max_bytes", 256)
        try:
            with patch("starlette.formparsers.SpooledTemporaryFile", side_effect=tracked_spooled_file):
                asyncio.run(self.client.app(scope, receive, send))
        finally:
            object.__setattr__(settings, "asset_upload_max_bytes", original_limit)

        self.assertEqual(413, response_status)
        self.assertEqual("Uploaded file is too large", json.loads(response_body)["detail"])
        self.assertLess(consumed_chunks, len(chunks))
        self.assertEqual([], opened_files)
        self.assertEqual([], self._stored_upload_files())

    def test_upload_multipart_accepts_file_exactly_at_file_limit(self) -> None:
        content = VALID_UPLOAD_BYTES["cover.png"]
        upload_limit = len(content)
        original_limit = settings.asset_upload_max_bytes
        object.__setattr__(settings, "asset_upload_max_bytes", upload_limit)
        try:
            response = self.client.post(
                "/assets/upload",
                data={"type": "image"},
                files={"file": ("cover.png", content, "image/png")},
                headers=self._auth_headers(self.user["id"]),
            )
        finally:
            object.__setattr__(settings, "asset_upload_max_bytes", original_limit)

        self.assertEqual(200, response.status_code)
        saved_file = Path(settings.storage_local_root) / response.json()["url"].lstrip("/")
        self.assertEqual(upload_limit, saved_file.stat().st_size)

    def test_upload_multipart_rejects_multiple_files_and_closes_first_file(self) -> None:
        opened_files: list[SpooledTemporaryFile] = []

        def tracked_spooled_file(*args, **kwargs):
            file = SpooledTemporaryFile(*args, **kwargs)
            opened_files.append(file)
            return file

        with patch("starlette.formparsers.SpooledTemporaryFile", side_effect=tracked_spooled_file):
            response = self.client.post(
                "/assets/upload",
                data={"type": "image"},
                files=[
                    ("file", ("first.png", VALID_UPLOAD_BYTES["cover.png"], "image/png")),
                    ("file", ("second.png", VALID_UPLOAD_BYTES["cover.png"], "image/png")),
                ],
                headers=self._auth_headers(self.user["id"]),
            )

        self.assertEqual(400, response.status_code)
        self.assertIn("Maximum number of files is 1", response.json()["detail"])
        self.assertEqual([], opened_files)
        self.assertEqual([], self._stored_upload_files())

    def test_upload_multipart_does_not_reread_a_spool_for_a_second_copy(self) -> None:
        original_read = SpooledTemporaryFile.read
        read_sizes: list[int] = []

        def tracked_read(upload: SpooledTemporaryFile, size: int = -1) -> bytes:
            read_sizes.append(size)
            return original_read(upload, size)

        with patch.object(SpooledTemporaryFile, "read", tracked_read):
            response = self.client.post(
                "/assets/upload",
                data={"type": "image"},
                files={"file": ("cover.png", VALID_UPLOAD_BYTES["cover.png"], "image/png")},
                headers=self._auth_headers(self.user["id"]),
            )

        self.assertEqual(200, response.status_code)
        self.assertEqual([], read_sizes)

    def test_upload_multipart_rejects_empty_file(self) -> None:
        response = self.client.post(
            "/assets/upload",
            data={"type": "image"},
            files={"file": ("empty.png", b"", "image/png")},
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(400, response.status_code)
        self.assertEqual("Uploaded file is empty", response.json()["detail"])
        self.assertEqual([], self._stored_upload_files())

    def test_upload_multipart_scope_failure_removes_saved_file(self) -> None:
        foreign_project = store.create_project(self.other_user["id"], "Foreign Upload Project")

        response = self.client.post(
            "/assets/upload",
            data={"type": "image", "project_id": foreign_project["id"]},
            files={"file": ("cover.png", VALID_UPLOAD_BYTES["cover.png"], "image/png")},
            headers=self._auth_headers(self.user["id"]),
        )

        self.assertEqual(403, response.status_code)
        self.assertEqual("Project does not belong to user", response.json()["detail"])
        self.assertEqual([], self._stored_upload_files())

    def _register_user(self, openid: str):
        return self.client.post(
            "/auth/wechat/mock",
            json={
                "openid": openid,
                "nickname": f"user-{openid}",
                "avatar_url": "",
                "unionid": None,
                "invitation_code": None,
            },
        )

    @staticmethod
    def _auth_headers(user_id: str) -> dict[str, str]:
        token = create_token({"sub": user_id, "role": "user"})
        return {"Authorization": f"Bearer {token}"}

    def _stored_upload_files(self) -> list[Path]:
        upload_root = Path(settings.storage_local_root) / "uploads"
        return [path for path in upload_root.rglob("*") if path.is_file()] if upload_root.exists() else []


if __name__ == "__main__":
    unittest.main()
