from __future__ import annotations

import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import AsyncMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from starlette.requests import Request

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.router import include_routers
from controllers.store import DatabaseStore, configure_store, store
from core.security import create_token, hash_password
from settings.config import settings
from tests.mysql_test_database import MySQLTestDatabase


class AssetUploadClientErrorTestCase(unittest.TestCase):
    CONTENT_TEXT_MAX_LENGTH = 64 * 1024

    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_asset_upload_client_errors")
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
        self.client = TestClient(app, raise_server_exceptions=False)
        store.registration_settings["registration_mode"] = "open"
        store.ensure_admin_user("test-admin", hash_password("StrongPass123!"))
        response = self.client.post(
            "/auth/wechat/mock",
            json={
                "openid": f"upload-client-errors-{self._testMethodName}",
                "nickname": "upload-client-errors",
                "avatar_url": "",
                "unionid": None,
                "invitation_code": None,
            },
        )
        self.user = response.json()["user"]

    def tearDown(self) -> None:
        self.client.close()
        settings.storage_local_root = self.original_storage_root
        self.temp_dir.cleanup()

    def test_upload_rejects_urlencoded_body(self) -> None:
        response = self.client.post(
            "/assets/upload",
            content="type=prompt&content_text=hello",
            headers={
                **self._auth_headers(),
                "content-type": "application/x-www-form-urlencoded",
            },
        )

        self.assertEqual(415, response.status_code)
        self.assertEqual("Unsupported content type", response.json()["detail"])

    def test_upload_accepts_case_insensitive_multipart_content_type(self) -> None:
        boundary = "case-boundary"
        body = (
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"type\"\r\n\r\nprompt\r\n"
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"content_text\"\r\n\r\nhello\r\n"
            f"--{boundary}--\r\n"
        ).encode()

        response = self.client.post(
            "/assets/upload",
            content=body,
            headers={
                **self._auth_headers(),
                "content-type": f"Multipart/Form-Data; boundary={boundary}",
            },
        )

        self.assertEqual(200, response.status_code)
        self.assertEqual("hello", response.json()["content_text"])

    def test_upload_rejects_malformed_json_as_bad_request(self) -> None:
        response = self.client.post(
            "/assets/upload",
            content=b'{"type":',
            headers={**self._auth_headers(), "content-type": "application/json"},
        )

        self.assertEqual(400, response.status_code)
        self.assertEqual("Malformed JSON body", response.json()["detail"])

    def test_upload_rejects_invalid_json_contract_as_unprocessable(self) -> None:
        response = self.client.post(
            "/assets/upload",
            json={"type": "executable", "content_text": "hello"},
            headers=self._auth_headers(),
        )

        self.assertEqual(422, response.status_code)
        self.assertEqual("body", response.json()["detail"][0]["loc"][0])

    def test_upload_rejects_unknown_json_field_as_unprocessable(self) -> None:
        response = self.client.post(
            "/assets/upload",
            json={"type": "prompt", "content_text": "hello", "unexpected": "value"},
            headers=self._auth_headers(),
        )

        self.assertEqual(422, response.status_code)
        self.assertEqual(["body", "unexpected"], response.json()["detail"][0]["loc"])

    def test_upload_rejects_oversized_json_scalar_as_unprocessable(self) -> None:
        response = self.client.post(
            "/assets/upload",
            json={"type": "prompt", "content_text": "x" * (self.CONTENT_TEXT_MAX_LENGTH + 1)},
            headers=self._auth_headers(),
        )

        self.assertEqual(422, response.status_code)
        self.assertEqual(["body", "content_text"], response.json()["detail"][0]["loc"])

    def test_upload_rejects_oversized_json_body_before_parsing(self) -> None:
        parse_json = AsyncMock(return_value={"type": "prompt", "content_text": "hello"})
        with patch.object(Request, "json", parse_json):
            response = self.client.post(
                "/assets/upload",
                content=b"{}",
                headers={
                    **self._auth_headers(),
                    "content-type": "application/json",
                    "content-length": str(128 * 1024 + 1),
                },
            )

        self.assertEqual(413, response.status_code)
        self.assertEqual("Upload JSON body is too large", response.json()["detail"])
        parse_json.assert_not_awaited()

    def test_upload_rejects_invalid_multipart_contract_as_unprocessable(self) -> None:
        response = self.client.post(
            "/assets/upload",
            data={"type": "executable", "content_text": "hello"},
            files={"unused": (None, "value")},
            headers=self._auth_headers(),
        )

        self.assertEqual(422, response.status_code)
        self.assertEqual("body", response.json()["detail"][0]["loc"][0])

    def test_upload_rejects_unknown_multipart_field_as_unprocessable(self) -> None:
        response = self.client.post(
            "/assets/upload",
            files=[
                ("type", (None, "prompt")),
                ("content_text", (None, "hello")),
                ("unexpected", (None, "value")),
            ],
            headers=self._auth_headers(),
        )

        self.assertEqual(422, response.status_code)
        self.assertEqual(["body", "unexpected"], response.json()["detail"][0]["loc"])

    def test_upload_rejects_duplicate_multipart_field_as_unprocessable(self) -> None:
        response = self.client.post(
            "/assets/upload",
            files=[
                ("type", (None, "prompt")),
                ("type", (None, "prompt")),
                ("content_text", (None, "hello")),
            ],
            headers=self._auth_headers(),
        )

        self.assertEqual(422, response.status_code)
        self.assertEqual(["body", "type"], response.json()["detail"][0]["loc"])

    def test_upload_rejects_oversized_multipart_scalar(self) -> None:
        response = self.client.post(
            "/assets/upload",
            files=[
                ("type", (None, "prompt")),
                ("content_text", (None, "x" * (self.CONTENT_TEXT_MAX_LENGTH + 1))),
            ],
            headers=self._auth_headers(),
        )

        self.assertEqual(413, response.status_code)
        self.assertEqual("Upload form field is too large", response.json()["detail"])

    def test_upload_rejects_oversized_multipart_header(self) -> None:
        boundary = "large-header-boundary"
        body = (
            f"--{boundary}\r\n"
            'Content-Disposition: form-data; name="type"\r\n'
            f"X-Large: {'x' * (16 * 1024)}\r\n\r\nprompt\r\n"
            f"--{boundary}--\r\n"
        ).encode()

        response = self.client.post(
            "/assets/upload",
            content=body,
            headers={
                **self._auth_headers(),
                "content-type": f"multipart/form-data; boundary={boundary}",
            },
        )

        self.assertEqual(400, response.status_code)
        self.assertIn(
            response.json()["detail"],
            {"Malformed multipart body", "Multipart part headers are too large"},
        )

    def test_upload_rejects_too_many_multipart_headers(self) -> None:
        boundary = "many-headers-boundary"
        extra_headers = "".join(f"X-{index}: x\r\n" for index in range(32))
        body = (
            f"--{boundary}\r\n"
            'Content-Disposition: form-data; name="type"\r\n'
            f"{extra_headers}\r\nprompt\r\n"
            f"--{boundary}--\r\n"
        ).encode()

        response = self.client.post(
            "/assets/upload",
            content=body,
            headers={
                **self._auth_headers(),
                "content-type": f"multipart/form-data; boundary={boundary}",
            },
        )

        self.assertEqual(400, response.status_code)
        self.assertIn(
            response.json()["detail"],
            {"Malformed multipart body", "Multipart part has too many headers"},
        )

    def test_upload_rejects_malformed_multipart_body_as_bad_request(self) -> None:
        boundary = "expected-boundary"
        response = self.client.post(
            "/assets/upload",
            content=(
                b"--different-boundary\r\n"
                b'Content-Disposition: form-data; name="type"\r\n\r\n'
                b"prompt\r\n--different-boundary--\r\n"
            ),
            headers={
                **self._auth_headers(),
                "content-type": f"multipart/form-data; boundary={boundary}",
            },
        )

        self.assertEqual(400, response.status_code)
        self.assertEqual("Malformed multipart body", response.json()["detail"])

    def test_upload_rejects_unsupported_content_type(self) -> None:
        response = self.client.post(
            "/assets/upload",
            content=b'{"type":"prompt","content_text":"hello"}',
            headers={**self._auth_headers(), "content-type": "text/plain"},
        )

        self.assertEqual(415, response.status_code)
        self.assertEqual("Unsupported content type", response.json()["detail"])

    def _auth_headers(self) -> dict[str, str]:
        token = create_token({"sub": self.user["id"], "role": "user"})
        return {"Authorization": f"Bearer {token}"}


if __name__ == "__main__":
    unittest.main()
