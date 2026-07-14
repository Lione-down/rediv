from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator, Awaitable
from typing import BinaryIO

import python_multipart
from python_multipart.exceptions import FormParserError
from starlette.concurrency import run_in_threadpool
from starlette.datastructures import FormData, Headers, UploadFile
from starlette.formparsers import MultiPartException, MultiPartParser, parse_options_header

from core.async_lifecycle import await_with_deferred_cancellation


MAX_MULTIPART_PART_HEADER_BYTES = 16 * 1024
MAX_MULTIPART_PART_HEADERS = 32


class UploadFormFieldTooLarge(MultiPartException):
    def __init__(self) -> None:
        super().__init__("Upload form field is too large")


class UploadFileLimitExceeded(MultiPartException):
    def __init__(self) -> None:
        super().__init__("Uploaded file is too large")


class UploadMultipartHeadersTooLarge(MultiPartException):
    def __init__(self) -> None:
        super().__init__("Multipart part headers are too large")


class UploadMultipartHeaderCountExceeded(MultiPartException):
    def __init__(self) -> None:
        super().__init__("Multipart part has too many headers")


def _safe_decode(value: bytes, charset: str) -> str:
    try:
        return value.decode(charset)
    except (UnicodeDecodeError, LookupError):
        return value.decode("latin-1")


async def _await_file_operation(operation: Awaitable[None]) -> None:
    _, cancellation = await await_with_deferred_cancellation(operation)
    if cancellation is not None:
        raise cancellation


class ReservedMultiPartParser(MultiPartParser):
    def __init__(
        self,
        headers: Headers,
        stream: AsyncGenerator[bytes, None],
        stage_file: BinaryIO,
        *,
        max_file_bytes: int,
        max_part_size: int,
        max_files: int,
        max_fields: int,
    ) -> None:
        super().__init__(headers, stream, max_files=max_files, max_fields=max_fields)
        self.max_part_size = max_part_size
        self.max_file_bytes = max_file_bytes
        self._stage_file = stage_file
        self._stage_claimed = False
        self._current_file_bytes = 0
        self._current_header_bytes = 0
        self._current_header_count = 0
        self._stage_close_task: asyncio.Task[None] | None = None
        self._is_complete = False

    def on_part_begin(self) -> None:
        super().on_part_begin()
        self._current_file_bytes = 0
        self._current_header_bytes = 0
        self._current_header_count = 0

    def on_header_field(self, data: bytes, start: int, end: int) -> None:
        self._count_header_bytes(end - start)
        super().on_header_field(data, start, end)

    def on_header_value(self, data: bytes, start: int, end: int) -> None:
        self._count_header_bytes(end - start)
        super().on_header_value(data, start, end)

    def on_header_end(self) -> None:
        self._current_header_count += 1
        if self._current_header_count > MAX_MULTIPART_PART_HEADERS:
            raise UploadMultipartHeaderCountExceeded
        super().on_header_end()

    def _count_header_bytes(self, incoming_bytes: int) -> None:
        self._current_header_bytes += incoming_bytes
        if self._current_header_bytes > MAX_MULTIPART_PART_HEADER_BYTES:
            raise UploadMultipartHeadersTooLarge

    def on_part_data(self, data: bytes, start: int, end: int) -> None:
        incoming_bytes = end - start
        if self._current_part.file is None:
            if len(self._current_part.data) + incoming_bytes > self.max_part_size:
                raise UploadFormFieldTooLarge
        else:
            self._current_file_bytes += incoming_bytes
            if self._current_file_bytes > self.max_file_bytes:
                raise UploadFileLimitExceeded
        super().on_part_data(data, start, end)

    def on_headers_finished(self) -> None:
        _, options = parse_options_header(self._current_part.content_disposition)
        try:
            self._current_part.field_name = _safe_decode(options[b"name"], self._charset)
        except KeyError:
            raise MultiPartException('The Content-Disposition header field "name" must be provided.')
        if b"filename" not in options:
            self._current_fields += 1
            if self._current_fields > self.max_fields:
                raise MultiPartException(f"Too many fields. Maximum number of fields is {self.max_fields}.")
            self._current_part.file = None
            return

        self._current_files += 1
        if self._current_files > self.max_files or self._stage_claimed:
            raise MultiPartException(f"Too many files. Maximum number of files is {self.max_files}.")
        self._stage_claimed = True
        self._current_part.file = UploadFile(
            file=self._stage_file,
            size=0,
            filename=_safe_decode(options[b"filename"], self._charset),
            headers=Headers(raw=self._current_part.item_headers),
        )

    def on_end(self) -> None:
        super().on_end()
        self._is_complete = True

    async def parse(self) -> FormData:
        _, params = parse_options_header(self.headers["Content-Type"])
        charset = params.get(b"charset", "utf-8")
        if isinstance(charset, bytes):
            charset = charset.decode("latin-1")
        self._charset = charset
        try:
            boundary = params[b"boundary"]
        except KeyError:
            error = MultiPartException("Missing boundary in multipart.")
            await self._close_on_error(error)
            raise error from None

        callbacks = {
            "on_part_begin": self.on_part_begin,
            "on_part_data": self.on_part_data,
            "on_part_end": self.on_part_end,
            "on_header_field": self.on_header_field,
            "on_header_value": self.on_header_value,
            "on_header_end": self.on_header_end,
            "on_headers_finished": self.on_headers_finished,
            "on_end": self.on_end,
        }
        try:
            parser = python_multipart.MultipartParser(boundary, callbacks)
            async for chunk in self.stream:
                parser.write(chunk)
                for part, data in self._file_parts_to_write:
                    if part.file is None:
                        raise RuntimeError("Multipart file part is missing its file")
                    await _await_file_operation(part.file.write(data))
                for part in self._file_parts_to_finish:
                    if part.file is None:
                        raise RuntimeError("Multipart file part is missing its file")
                    await _await_file_operation(part.file.seek(0))
                self._file_parts_to_write.clear()
                self._file_parts_to_finish.clear()
            parser.finalize()
            if not self._is_complete:
                raise MultiPartException("Malformed multipart body")
        except BaseException as error:
            await self._close_on_error(error)
            if isinstance(error, FormParserError):
                raise MultiPartException("Malformed multipart body") from error
            raise
        return FormData(self.items)

    async def close_stage_file(self, active_error: BaseException | None = None) -> None:
        if self._stage_close_task is None:
            self._stage_close_task = asyncio.create_task(
                run_in_threadpool(self._stage_file.close)
            )
        try:
            _, cancellation = await await_with_deferred_cancellation(self._stage_close_task)
        except BaseException:
            if active_error is None:
                raise
            return
        if cancellation is not None and active_error is None:
            raise cancellation

    async def _close_on_error(self, error: BaseException) -> None:
        self._files_to_close_on_error.clear()
        await self.close_stage_file(active_error=error)
