from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from uuid import uuid4

from core.agnes_image_reference import AgnesImageReferenceError, resolve_agnes_image_reference


class AgnesImageReferenceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.storage_root = Path(self.temp_dir.name) / "storage"
        self.user_id = str(uuid4())
        self.user_dir = self.storage_root / "uploads" / self.user_id
        self.user_dir.mkdir(parents=True)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_public_https_reference_is_preserved(self) -> None:
        self.assertEqual(
            "https://cdn.example.com/reference.png",
            resolve_agnes_image_reference(
                "https://cdn.example.com/reference.png",
                user_id=self.user_id,
                storage_root=self.storage_root,
            ),
        )

    def test_local_upload_is_encoded_as_provider_safe_data_uri(self) -> None:
        filename = f"{uuid4()}.png"
        (self.user_dir / filename).write_bytes(b"\x89PNG\r\n\x1a\n")

        resolved = resolve_agnes_image_reference(
            f"/uploads/{self.user_id}/{filename}",
            user_id=self.user_id,
            storage_root=self.storage_root,
        )

        self.assertEqual("data:image/png;base64,iVBORw0KGgo=", resolved)

    def test_local_upload_rejects_cross_user_path_and_traversal(self) -> None:
        filename = f"{uuid4()}.png"
        for reference in (
            f"/uploads/{uuid4()}/{filename}",
            f"/uploads/{self.user_id}/../{filename}",
            f"/uploads/{self.user_id}/%2e%2e/{filename}",
        ):
            with self.subTest(reference=reference):
                with self.assertRaisesRegex(AgnesImageReferenceError, "invalid local upload reference"):
                    resolve_agnes_image_reference(
                        reference,
                        user_id=self.user_id,
                        storage_root=self.storage_root,
                    )

    def test_local_upload_rejects_missing_unsupported_and_oversized_files(self) -> None:
        missing = f"{uuid4()}.png"
        unsupported = f"{uuid4()}.svg"
        (self.user_dir / unsupported).write_text("<svg/>", encoding="utf-8")
        oversized = f"{uuid4()}.webp"
        (self.user_dir / oversized).write_bytes(b"12345")

        cases = (
            (missing, "is unavailable"),
            (unsupported, "unsupported image type"),
            (oversized, "exceeds provider reference limit"),
        )
        for filename, message in cases:
            with self.subTest(filename=filename):
                with self.assertRaisesRegex(AgnesImageReferenceError, message):
                    resolve_agnes_image_reference(
                        f"/uploads/{self.user_id}/{filename}",
                        user_id=self.user_id,
                        storage_root=self.storage_root,
                        max_bytes=4,
                    )

    def test_non_public_or_credentialed_url_is_rejected(self) -> None:
        for reference in (
            "http://example.com/reference.png",
            "https://user:password@example.com/reference.png",
            "https://localhost/reference.png",
            "https://127.0.0.1/reference.png",
        ):
            with self.subTest(reference=reference):
                with self.assertRaisesRegex(AgnesImageReferenceError, "public HTTPS URL"):
                    resolve_agnes_image_reference(
                        reference,
                        user_id=self.user_id,
                        storage_root=self.storage_root,
                    )


if __name__ == "__main__":
    unittest.main()
