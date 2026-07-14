from __future__ import annotations

import asyncio
import io
import threading
import unittest
from unittest.mock import patch

from fastapi import HTTPException
from starlette.datastructures import Headers
from starlette.formparsers import MultiPartException
from starlette.requests import Request

from api import assets as assets_api
from core.upload_multipart import ReservedMultiPartParser


class _StreamFailure(RuntimeError):
    pass


class _SlowCloseFile:
    def __init__(self) -> None:
        self.close_calls = 0
        self.close_started = threading.Event()
        self.close_release = threading.Event()
        self.close_finished = threading.Event()

    def close(self) -> None:
        self.close_calls += 1
        self.close_started.set()
        self.close_release.wait(timeout=2)
        self.close_finished.set()


class _SlowOperationFile:
    def __init__(self, slow_operation: str) -> None:
        self.slow_operation = slow_operation
        self.operation_started = threading.Event()
        self.operation_release = threading.Event()
        self.operation_finished = threading.Event()
        self.close_calls = 0
        self.data = bytearray()

    def _wait_if_slow(self, operation: str) -> None:
        if self.slow_operation != operation:
            return
        self.operation_started.set()
        self.operation_release.wait(timeout=2)
        self.operation_finished.set()

    def write(self, data: bytes) -> int:
        self._wait_if_slow("write")
        self.data.extend(data)
        return len(data)

    def seek(self, offset: int) -> int:
        self._wait_if_slow("seek")
        return offset

    def close(self) -> None:
        self.close_calls += 1


async def _wait_for_thread_event(event: threading.Event) -> None:
    for _ in range(2_000):
        if event.is_set():
            return
        await asyncio.sleep(0.001)
    raise AssertionError("Timed out waiting for close worker")


def _parser(stream, stage_file: _SlowCloseFile) -> ReservedMultiPartParser:
    return ReservedMultiPartParser(
        Headers({"content-type": "multipart/form-data; boundary=test"}),
        stream,
        stage_file,  # type: ignore[arg-type]
        max_file_bytes=1024,
        max_part_size=1024,
        max_files=1,
        max_fields=1,
    )


class UploadCloseCancellationTestCase(unittest.TestCase):
    def test_file_write_finishes_before_cancellation_and_close(self) -> None:
        self._assert_file_operation_finishes_before_cancellation("write")

    def test_file_seek_finishes_before_cancellation_and_close(self) -> None:
        self._assert_file_operation_finishes_before_cancellation("seek")

    def test_route_waits_for_close_before_reservation_cleanup(self) -> None:
        async def exercise() -> tuple[_SlowCloseFile, list[tuple[bool, int]]]:
            stage_file = _SlowCloseFile()
            expected_error = _StreamFailure("receive failed")
            exit_observations: list[tuple[bool, int]] = []

            class FakeReservation:
                max_file_bytes = 1024

                def __init__(self, *args, **kwargs) -> None:
                    pass

                async def __aenter__(self):
                    return self

                async def __aexit__(self, exc_type, exc_value, traceback) -> None:
                    exit_observations.append(
                        (stage_file.close_finished.is_set(), stage_file.close_calls)
                    )

                async def open_stage_file(self):
                    return stage_file

                def limit_error(self) -> Exception:
                    return RuntimeError("upload limit")

            async def receive():
                raise expected_error

            request = Request(
                {
                    "type": "http",
                    "http_version": "1.1",
                    "method": "POST",
                    "scheme": "http",
                    "path": "/assets/upload",
                    "raw_path": b"/assets/upload",
                    "query_string": b"",
                    "headers": [(b"content-type", b"multipart/form-data; boundary=test")],
                    "client": ("127.0.0.1", 1),
                    "server": ("testserver", 80),
                },
                receive,
            )
            with patch.object(assets_api, "LocalUploadReservation", FakeReservation):
                task = asyncio.create_task(assets_api.upload_asset(request, {"id": "user"}))
                await _wait_for_thread_event(stage_file.close_started)
                task.cancel("cancel during route close")
                await asyncio.sleep(0.02)
                try:
                    self.assertFalse(task.done(), "route cleanup started before close completed")
                finally:
                    stage_file.close_release.set()
                with self.assertRaises(_StreamFailure) as raised:
                    await task
                self.assertIs(expected_error, raised.exception)
            return stage_file, exit_observations

        stage_file, exit_observations = asyncio.run(exercise())
        self.assertEqual([(True, 1)], exit_observations)
        self.assertEqual(1, stage_file.close_calls)

    def test_route_finally_preserves_validation_error_until_close_finishes(self) -> None:
        async def exercise() -> tuple[_SlowCloseFile, list[tuple[bool, int]]]:
            stage_file = _SlowCloseFile()
            exit_observations: list[tuple[bool, int]] = []

            class FakeReservation:
                max_file_bytes = 1024

                def __init__(self, *args, **kwargs) -> None:
                    pass

                async def __aenter__(self):
                    return self

                async def __aexit__(self, exc_type, exc_value, traceback) -> None:
                    exit_observations.append(
                        (stage_file.close_finished.is_set(), stage_file.close_calls)
                    )

                async def open_stage_file(self):
                    return stage_file

                def limit_error(self) -> Exception:
                    return RuntimeError("upload limit")

            body = (
                b"--test\r\n"
                b'Content-Disposition: form-data; name="unexpected"\r\n\r\n'
                b"value\r\n"
                b"--test--\r\n"
            )

            async def receive():
                return {"type": "http.request", "body": body, "more_body": False}

            request = Request(
                {
                    "type": "http",
                    "http_version": "1.1",
                    "method": "POST",
                    "scheme": "http",
                    "path": "/assets/upload",
                    "raw_path": b"/assets/upload",
                    "query_string": b"",
                    "headers": [(b"content-type", b"multipart/form-data; boundary=test")],
                    "client": ("127.0.0.1", 1),
                    "server": ("testserver", 80),
                },
                receive,
            )
            with patch.object(assets_api, "LocalUploadReservation", FakeReservation):
                task = asyncio.create_task(assets_api.upload_asset(request, {"id": "user"}))
                await _wait_for_thread_event(stage_file.close_started)
                task.cancel("cancel during route finally")
                await asyncio.sleep(0.02)
                try:
                    self.assertFalse(task.done(), "route finally returned before close completed")
                finally:
                    stage_file.close_release.set()
                with self.assertRaises(HTTPException) as raised:
                    await task
                self.assertEqual(422, raised.exception.status_code)
            return stage_file, exit_observations

        stage_file, exit_observations = asyncio.run(exercise())
        self.assertEqual([(True, 1)], exit_observations)
        self.assertEqual(1, stage_file.close_calls)

    def test_close_defers_repeated_cancellation_and_only_runs_once(self) -> None:
        async def empty_stream():
            if False:
                yield b""

        async def exercise() -> _SlowCloseFile:
            stage_file = _SlowCloseFile()
            parser = _parser(empty_stream(), stage_file)
            task = asyncio.create_task(parser.close_stage_file())
            await _wait_for_thread_event(stage_file.close_started)
            task.cancel("first cancellation")
            await asyncio.sleep(0)
            task.cancel("second cancellation")
            await asyncio.sleep(0.02)
            try:
                self.assertFalse(task.done(), "cancellation escaped before close completed")
            finally:
                stage_file.close_release.set()

            with self.assertRaises(asyncio.CancelledError) as raised:
                await task
            self.assertEqual(("first cancellation",), raised.exception.args)
            await parser.close_stage_file()
            return stage_file

        stage_file = asyncio.run(exercise())
        self.assertTrue(stage_file.close_finished.is_set())
        self.assertEqual(1, stage_file.close_calls)

    def test_parse_error_waits_for_close_and_preserves_original_error(self) -> None:
        async def exercise() -> tuple[_SlowCloseFile, _StreamFailure]:
            stage_file = _SlowCloseFile()
            expected_error = _StreamFailure("stream failed")

            async def broken_stream():
                if False:
                    yield b""
                raise expected_error

            parser = _parser(broken_stream(), stage_file)
            task = asyncio.create_task(parser.parse())
            await _wait_for_thread_event(stage_file.close_started)
            task.cancel("cancel during close")
            await asyncio.sleep(0.02)
            try:
                self.assertFalse(task.done(), "cancellation escaped before close completed")
            finally:
                stage_file.close_release.set()

            with self.assertRaises(_StreamFailure) as raised:
                await task
            self.assertIs(expected_error, raised.exception)
            await parser.close_stage_file()
            return stage_file, expected_error

        stage_file, _ = asyncio.run(exercise())
        self.assertTrue(stage_file.close_finished.is_set())
        self.assertEqual(1, stage_file.close_calls)

    def test_parser_rejects_truncated_tail_after_complete_field(self) -> None:
        async def exercise() -> io.BytesIO:
            stage_file = io.BytesIO()
            body = (
                b"--test\r\n"
                b'Content-Disposition: form-data; name="type"\r\n\r\n'
                b"image\r\n"
                b"--test\r\n"
            )

            async def stream():
                yield body

            with self.assertRaises(MultiPartException) as raised:
                await _parser(stream(), stage_file).parse()
            self.assertEqual("Malformed multipart body", raised.exception.message)
            return stage_file

        stage_file = asyncio.run(exercise())
        self.assertTrue(stage_file.closed)

    def test_parser_accepts_terminal_boundary_and_epilogue(self) -> None:
        async def exercise() -> tuple[str, bool]:
            stage_file = io.BytesIO()
            body = (
                b"--test\r\n"
                b'Content-Disposition: form-data; name="type"\r\n\r\n'
                b"image\r\n"
                b"--test--\r\n"
                b"ignored epilogue"
            )

            async def stream():
                yield body

            parser = _parser(stream(), stage_file)
            form = await parser.parse()
            value = form["type"]
            await parser.close_stage_file()
            return value, stage_file.closed

        value, is_closed = asyncio.run(exercise())
        self.assertEqual("image", value)
        self.assertTrue(is_closed)

    def _assert_file_operation_finishes_before_cancellation(self, operation: str) -> None:
        async def exercise() -> _SlowOperationFile:
            stage_file = _SlowOperationFile(operation)
            body = (
                b"--test\r\n"
                b'Content-Disposition: form-data; name="file"; filename="sample.bin"\r\n'
                b"Content-Type: application/octet-stream\r\n\r\n"
                b"payload\r\n"
                b"--test--\r\n"
            )

            async def stream():
                yield body

            task = asyncio.create_task(_parser(stream(), stage_file).parse())
            await _wait_for_thread_event(stage_file.operation_started)
            task.cancel(f"cancel during {operation}")
            await asyncio.sleep(0.02)
            try:
                self.assertFalse(task.done(), f"cancellation escaped before {operation} completed")
            finally:
                stage_file.operation_release.set()
            with self.assertRaises(asyncio.CancelledError):
                await task
            return stage_file

        stage_file = asyncio.run(exercise())
        self.assertTrue(stage_file.operation_finished.is_set())
        self.assertEqual(b"payload", stage_file.data)
        self.assertEqual(1, stage_file.close_calls)


if __name__ == "__main__":
    unittest.main()
