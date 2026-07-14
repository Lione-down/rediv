from __future__ import annotations

import zlib
from collections.abc import Callable, Iterable, Iterator
from pathlib import Path
from typing import BinaryIO, Final


MAX_CONTAINER_ELEMENTS: Final = 4096
MAX_IMAGE_DIMENSION: Final = 32_768
MAX_IMAGE_PIXELS: Final = 40_000_000
MAX_PNG_DECODED_BYTES: Final = 128 * 1024 * 1024
PNG_CHANNELS: Final = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}
VALID_PNG_DEPTHS: Final = {
    0: {1, 2, 4, 8, 16},
    2: {8, 16},
    3: {1, 2, 4, 8},
    4: {8, 16},
    6: {8, 16},
}
JPEG_SOF_MARKERS: Final = {
    0xC0,
    0xC1,
    0xC2,
    0xC3,
    0xC5,
    0xC6,
    0xC7,
    0xC9,
    0xCA,
    0xCB,
    0xCD,
    0xCE,
    0xCF,
}


def _valid_dimensions(width: int, height: int) -> bool:
    return (
        0 < width <= MAX_IMAGE_DIMENSION
        and 0 < height <= MAX_IMAGE_DIMENSION
        and width * height <= MAX_IMAGE_PIXELS
    )


def _file_range_has_nonzero(file: BinaryIO, start: int, size: int) -> bool:
    file.seek(start)
    remaining = size
    while remaining:
        chunk = file.read(min(64 * 1024, remaining))
        if not chunk:
            return False
        if any(chunk):
            return True
        remaining -= len(chunk)
    return False


def _read_png_payload(
    file: BinaryIO,
    chunk_type: bytes,
    chunk_size: int,
    capture: bool,
    consume: Callable[[bytes], bool] | None = None,
) -> bytes | None:
    crc = zlib.crc32(chunk_type)
    remaining = chunk_size
    captured = bytearray()
    while remaining:
        data = file.read(min(64 * 1024, remaining))
        if not data:
            return None
        crc = zlib.crc32(data, crc)
        if capture:
            captured.extend(data)
        if consume is not None and not consume(data):
            return None
        remaining -= len(data)
    expected_crc = file.read(4)
    if len(expected_crc) != 4 or int.from_bytes(expected_crc, "big") != crc & 0xFFFFFFFF:
        return None
    return bytes(captured)


def _png_scanline_sizes(
    width: int,
    height: int,
    bit_depth: int,
    color_type: int,
    interlace: int,
) -> Iterator[int]:
    bits_per_pixel = bit_depth * PNG_CHANNELS[color_type]
    if interlace == 0:
        row_bytes = (width * bits_per_pixel + 7) // 8
        yield from (row_bytes for _ in range(height))
        return
    passes = (
        (0, 0, 8, 8),
        (4, 0, 8, 8),
        (0, 4, 4, 8),
        (2, 0, 4, 4),
        (0, 2, 2, 4),
        (1, 0, 2, 2),
        (0, 1, 1, 2),
    )
    for x_start, y_start, x_step, y_step in passes:
        pass_width = max(0, (width - x_start + x_step - 1) // x_step)
        pass_height = max(0, (height - y_start + y_step - 1) // y_step)
        if pass_width == 0 or pass_height == 0:
            continue
        row_bytes = (pass_width * bits_per_pixel + 7) // 8
        yield from (row_bytes for _ in range(pass_height))


class _PngScanlineValidator:
    def __init__(self, scanline_sizes: Iterable[int]) -> None:
        self._scanline_sizes = iter(scanline_sizes)
        self._remaining_row_bytes = 0
        self._needs_filter = True
        self._finished = False

    def feed(self, data: bytes) -> bool:
        position = 0
        while position < len(data):
            if self._needs_filter:
                try:
                    self._remaining_row_bytes = next(self._scanline_sizes)
                except StopIteration:
                    self._finished = True
                    return False
                if data[position] > 4:
                    return False
                position += 1
                self._needs_filter = False
            consumed = min(self._remaining_row_bytes, len(data) - position)
            position += consumed
            self._remaining_row_bytes -= consumed
            if self._remaining_row_bytes == 0:
                self._needs_filter = True
        return True

    def finish(self) -> bool:
        if self._finished or not self._needs_filter or self._remaining_row_bytes:
            return False
        try:
            next(self._scanline_sizes)
        except StopIteration:
            self._finished = True
            return True
        return False


def _feed_png_compressed(
    decompressor: zlib.Decompress,
    scanlines: _PngScanlineValidator,
    data: bytes,
) -> bool:
    pending = data
    while pending:
        output = decompressor.decompress(pending, 64 * 1024)
        if decompressor.unused_data or not scanlines.feed(output):
            return False
        pending = decompressor.unconsumed_tail
    return True


def validate_png(path: Path) -> bool:
    size = path.stat().st_size
    try:
        with path.open("rb") as file:
            if file.read(8) != b"\x89PNG\r\n\x1a\n":
                return False
            saw_ihdr = False
            saw_idat = False
            idat_finished = False
            decompressor: zlib.Decompress | None = None
            scanlines: _PngScanlineValidator | None = None
            for index in range(MAX_CONTAINER_ELEMENTS):
                header = file.read(8)
                if len(header) != 8:
                    return False
                chunk_size = int.from_bytes(header[:4], "big")
                chunk_type = header[4:]
                if chunk_size > size - file.tell() - 4:
                    return False
                if saw_idat and chunk_type != b"IDAT":
                    idat_finished = True
                consume = None
                if chunk_type == b"IDAT":
                    if idat_finished or decompressor is None or scanlines is None:
                        return False
                    saw_idat = True
                    consume = lambda data: _feed_png_compressed(decompressor, scanlines, data)
                payload = _read_png_payload(file, chunk_type, chunk_size, chunk_type == b"IHDR", consume)
                if payload is None:
                    return False
                if index == 0:
                    if chunk_type != b"IHDR" or chunk_size != 13:
                        return False
                    width = int.from_bytes(payload[:4], "big")
                    height = int.from_bytes(payload[4:8], "big")
                    bit_depth, color_type, compression, filtering, interlace = payload[8:]
                    if (
                        not _valid_dimensions(width, height)
                        or bit_depth not in VALID_PNG_DEPTHS.get(color_type, set())
                        or compression != 0
                        or filtering != 0
                        or interlace not in {0, 1}
                    ):
                        return False
                    scanline_sizes = tuple(
                        _png_scanline_sizes(width, height, bit_depth, color_type, interlace)
                    )
                    if sum(row_bytes + 1 for row_bytes in scanline_sizes) > MAX_PNG_DECODED_BYTES:
                        return False
                    decompressor = zlib.decompressobj()
                    scanlines = _PngScanlineValidator(scanline_sizes)
                    saw_ihdr = True
                elif chunk_type == b"IHDR":
                    return False
                if chunk_type == b"IEND":
                    if (
                        chunk_size != 0
                        or not saw_ihdr
                        or not saw_idat
                        or decompressor is None
                        or scanlines is None
                        or not scanlines.feed(decompressor.flush())
                        or not decompressor.eof
                        or decompressor.unused_data
                        or not scanlines.finish()
                    ):
                        return False
                    return file.tell() == size
    except zlib.error:
        return False
    return False


def validate_jpeg(path: Path) -> bool:
    size = path.stat().st_size
    with path.open("rb") as file:
        if file.read(2) != b"\xff\xd8":
            return False
        saw_sof = False
        for _ in range(MAX_CONTAINER_ELEMENTS):
            if file.read(1) != b"\xff":
                return False
            marker_data = file.read(1)
            while marker_data == b"\xff":
                marker_data = file.read(1)
            if not marker_data:
                return False
            marker = marker_data[0]
            if marker == 0xD9:
                return False
            if marker == 0x01 or 0xD0 <= marker <= 0xD7:
                continue
            length_data = file.read(2)
            if len(length_data) != 2:
                return False
            segment_size = int.from_bytes(length_data, "big")
            payload_size = segment_size - 2
            if segment_size < 2 or file.tell() + payload_size > size:
                return False
            if marker in JPEG_SOF_MARKERS:
                header = file.read(6)
                if len(header) != 6:
                    return False
                height = int.from_bytes(header[1:3], "big")
                width = int.from_bytes(header[3:5], "big")
                components = header[5]
                if payload_size != 6 + 3 * components or components == 0 or not _valid_dimensions(width, height):
                    return False
                file.seek(payload_size - 6, 1)
                saw_sof = True
                continue
            if marker == 0xDA:
                if payload_size > 4 + 2 * 255:
                    return False
                scan_header = file.read(payload_size)
                if not saw_sof or len(scan_header) != payload_size or not scan_header:
                    return False
                components = scan_header[0]
                if components == 0 or payload_size != 4 + 2 * components:
                    return False
                scan_start = file.tell()
                if scan_start >= size - 2:
                    return False
                file.seek(size - 2)
                return file.read(2) == b"\xff\xd9"
            file.seek(payload_size, 1)
    return False


def _skip_gif_sub_blocks(file: BinaryIO, size: int) -> bool:
    for _ in range(MAX_CONTAINER_ELEMENTS):
        length_data = file.read(1)
        if not length_data:
            return False
        length = length_data[0]
        if length == 0:
            return True
        if file.tell() + length > size:
            return False
        file.seek(length, 1)
    return False


def validate_gif(path: Path) -> bool:
    size = path.stat().st_size
    with path.open("rb") as file:
        if file.read(6) not in {b"GIF87a", b"GIF89a"}:
            return False
        descriptor = file.read(7)
        if len(descriptor) != 7 or not _valid_dimensions(
            int.from_bytes(descriptor[:2], "little"), int.from_bytes(descriptor[2:4], "little")
        ):
            return False
        if descriptor[4] & 0x80:
            file.seek(3 * (2 ** ((descriptor[4] & 0x07) + 1)), 1)
        saw_image = False
        for _ in range(MAX_CONTAINER_ELEMENTS):
            introducer = file.read(1)
            if introducer == b"\x3b":
                return saw_image and file.tell() == size
            if introducer == b"\x21":
                if not file.read(1) or not _skip_gif_sub_blocks(file, size):
                    return False
                continue
            if introducer != b"\x2c":
                return False
            image_descriptor = file.read(9)
            if len(image_descriptor) != 9 or not _valid_dimensions(
                int.from_bytes(image_descriptor[4:6], "little"),
                int.from_bytes(image_descriptor[6:8], "little"),
            ):
                return False
            if image_descriptor[8] & 0x80:
                file.seek(3 * (2 ** ((image_descriptor[8] & 0x07) + 1)), 1)
            lzw_code_size = file.read(1)
            if not lzw_code_size or not 2 <= lzw_code_size[0] <= 8 or not _skip_gif_sub_blocks(file, size):
                return False
            saw_image = True
    return False


def _webp_dimensions(chunk_type: bytes, prefix: bytes) -> tuple[int, int] | None:
    if chunk_type == b"VP8 ":
        if len(prefix) < 10 or prefix[0] & 1 or prefix[3:6] != b"\x9d\x01\x2a":
            return None
        return int.from_bytes(prefix[6:8], "little") & 0x3FFF, int.from_bytes(prefix[8:10], "little") & 0x3FFF
    if chunk_type == b"VP8L":
        if len(prefix) < 5 or prefix[0] != 0x2F:
            return None
        packed = int.from_bytes(prefix[1:5], "little")
        if packed >> 28:
            return None
        return (packed & 0x3FFF) + 1, ((packed >> 14) & 0x3FFF) + 1
    if chunk_type == b"VP8X" and len(prefix) == 10:
        return int.from_bytes(prefix[4:7], "little") + 1, int.from_bytes(prefix[7:10], "little") + 1
    return None


def validate_webp(path: Path) -> bool:
    size = path.stat().st_size
    with path.open("rb") as file:
        header = file.read(12)
        if len(header) != 12 or header[:4] != b"RIFF" or header[8:] != b"WEBP":
            return False
        if int.from_bytes(header[4:8], "little") + 8 != size:
            return False
        saw_bitstream = False
        for _ in range(MAX_CONTAINER_ELEMENTS):
            if file.tell() == size:
                return saw_bitstream
            chunk_header = file.read(8)
            if len(chunk_header) != 8:
                return False
            chunk_type = chunk_header[:4]
            chunk_size = int.from_bytes(chunk_header[4:], "little")
            padded_size = chunk_size + (chunk_size % 2)
            payload_start = file.tell()
            if payload_start + padded_size > size:
                return False
            if chunk_type in {b"VP8 ", b"VP8L", b"VP8X"}:
                prefix_size = min(chunk_size, 10)
                prefix = file.read(prefix_size)
                dimensions = _webp_dimensions(chunk_type, prefix)
                if dimensions is None or not _valid_dimensions(*dimensions):
                    return False
                if chunk_type in {b"VP8 ", b"VP8L"}:
                    minimum_size = 10 if chunk_type == b"VP8 " else 12
                    if saw_bitstream or chunk_size < minimum_size:
                        return False
                    if chunk_type == b"VP8 ":
                        frame_tag = int.from_bytes(prefix[:3], "little")
                        if frame_tag >> 5 == 0 or 10 + (frame_tag >> 5) > chunk_size:
                            return False
                        bitstream_header_size = 10
                    else:
                        bitstream_header_size = 5
                    if not _file_range_has_nonzero(
                        file,
                        payload_start + bitstream_header_size,
                        chunk_size - bitstream_header_size,
                    ):
                        return False
                    saw_bitstream = True
            file.seek(payload_start + padded_size)
    return False
