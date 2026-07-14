from __future__ import annotations

import asyncio
import unittest
from io import BytesIO
from pathlib import Path
from unittest.mock import AsyncMock, patch

from starlette.datastructures import Headers
from starlette.formparsers import MultiPartException

from core.upload_multipart import (
    MAX_MULTIPART_PART_HEADER_BYTES,
    MAX_MULTIPART_PART_HEADERS,
    ReservedMultiPartParser,
)
from core import upload_media
from settings.config import settings


class UploadDependencyContractTestCase(unittest.TestCase):
    def test_python_multipart_requires_patched_release_and_upper_bound(self) -> None:
        requirements_path = Path(__file__).resolve().parents[1] / "requirements.txt"
        requirements = [
            line.split("#", 1)[0].strip().replace(" ", "")
            for line in requirements_path.read_text(encoding="utf-8").splitlines()
        ]
        multipart_requirements = [
            requirement
            for requirement in requirements
            if requirement.lower().startswith("python-multipart")
        ]

        self.assertEqual(
            ["python-multipart>=0.0.32,<1"],
            multipart_requirements,
            "upload parser must exclude vulnerable and future incompatible releases",
        )

    def test_parser_maps_oversized_boundary_to_malformed_body(self) -> None:
        stage_file = BytesIO()

        async def empty_stream():
            if False:
                yield b""

        parser = ReservedMultiPartParser(
            Headers(
                {
                    "content-type": (
                        "multipart/form-data; boundary=" + "x" * 257
                    )
                }
            ),
            empty_stream(),
            stage_file,
            max_file_bytes=1024,
            max_part_size=1024,
            max_files=1,
            max_fields=4,
        )

        with self.assertRaises(MultiPartException) as raised:
            asyncio.run(parser.parse())

        self.assertEqual("Malformed multipart body", raised.exception.message)
        self.assertTrue(stage_file.closed)

    def test_parser_enforces_header_byte_limit_without_dependency_support(self) -> None:
        parser = self._parser()
        parser.on_part_begin()
        header = b"x" * (MAX_MULTIPART_PART_HEADER_BYTES + 1)

        with self.assertRaises(MultiPartException) as raised:
            parser.on_header_field(header, 0, len(header))
        self.assertEqual("Multipart part headers are too large", raised.exception.message)

    def test_parser_enforces_header_count_without_dependency_support(self) -> None:
        parser = self._parser()
        parser.on_part_begin()
        for index in range(MAX_MULTIPART_PART_HEADERS):
            name = f"x-{index}".encode()
            parser.on_header_field(name, 0, len(name))
            parser.on_header_value(b"x", 0, 1)
            parser.on_header_end()

        parser.on_header_field(b"overflow", 0, 8)
        parser.on_header_value(b"x", 0, 1)
        with self.assertRaises(MultiPartException) as raised:
            parser.on_header_end()
        self.assertEqual("Multipart part has too many headers", raised.exception.message)

    def test_parser_accumulates_header_bytes_across_callbacks(self) -> None:
        parser = self._parser()
        parser.on_part_begin()
        parser.on_header_field(b"x", 0, 1)
        first_value = b"x" * (MAX_MULTIPART_PART_HEADER_BYTES // 2)
        second_value = b"x" * (MAX_MULTIPART_PART_HEADER_BYTES // 2 - 1)
        parser.on_header_value(first_value, 0, len(first_value))
        parser.on_header_value(second_value, 0, len(second_value))

        with self.assertRaises(MultiPartException) as raised:
            parser.on_header_value(b"x", 0, 1)
        self.assertEqual("Multipart part headers are too large", raised.exception.message)

    @staticmethod
    def _parser() -> ReservedMultiPartParser:
        async def empty_stream():
            if False:
                yield b""

        return ReservedMultiPartParser(
            Headers({"content-type": "multipart/form-data; boundary=test"}),
            empty_stream(),
            BytesIO(),
            max_file_bytes=1024,
            max_part_size=1024,
            max_files=1,
            max_fields=4,
        )


class UploadValidationConcurrencyTestCase(unittest.IsolatedAsyncioTestCase):
    async def test_structure_validation_uses_dedicated_process_limiter(self) -> None:
        with patch.object(upload_media.to_process, "run_sync", new=AsyncMock()) as run_sync:
            await upload_media.validate_staged_upload_in_process(
                Path("staged.png"),
                ".png",
                max_file_bytes=1024,
                min_free_bytes=0,
            )

        limiter = run_sync.await_args.kwargs["limiter"]
        self.assertIs(upload_media._UPLOAD_VALIDATION_LIMITER, limiter)
        self.assertEqual(settings.asset_upload_validation_concurrency, limiter.total_tokens)


if __name__ == "__main__":
    unittest.main()
