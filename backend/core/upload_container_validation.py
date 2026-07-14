from __future__ import annotations

from collections.abc import Iterator
from dataclasses import dataclass
from pathlib import Path
from typing import BinaryIO, Final

from core.upload_video_bitstream_validation import validate_vp9_keyframe


MAX_CONTAINER_ELEMENTS: Final = 4096
MAX_WEBM_HEADER_BYTES: Final = 4096


def _vint_width(first_byte: int, maximum: int) -> int | None:
    marker = 0x80
    for width in range(1, maximum + 1):
        if first_byte & marker:
            return width
        marker >>= 1
    return None


def _element_header(file: BinaryIO, position: int, end: int) -> tuple[int, int, int, bool]:
    file.seek(position)
    first_id = file.read(1)
    if not first_id:
        raise ValueError("missing EBML id")
    id_width = _vint_width(first_id[0], 4)
    if id_width is None:
        raise ValueError("invalid EBML id")
    element_id_data = first_id + file.read(id_width - 1)
    first_size = file.read(1)
    if len(element_id_data) != id_width or not first_size:
        raise ValueError("truncated EBML header")
    size_width = _vint_width(first_size[0], 8)
    if size_width is None:
        raise ValueError("invalid EBML size")
    size_data = first_size + file.read(size_width - 1)
    if len(size_data) != size_width:
        raise ValueError("truncated EBML size")
    marker = 1 << (8 - size_width)
    value = size_data[0] & (marker - 1)
    for byte in size_data[1:]:
        value = (value << 8) | byte
    unknown = value == (1 << (7 * size_width)) - 1
    payload_start = position + id_width + size_width
    payload_end = end if unknown else payload_start + value
    if payload_end > end:
        raise ValueError("EBML element exceeds parent")
    return int.from_bytes(element_id_data, "big"), payload_start, payload_end, unknown


def _elements(
    file: BinaryIO,
    start: int,
    end: int,
    element_count: list[int],
) -> Iterator[tuple[int, int, int, bool]]:
    position = start
    while position < end:
        element_count[0] += 1
        if element_count[0] > MAX_CONTAINER_ELEMENTS:
            raise ValueError("too many EBML elements")
        element = _element_header(file, position, end)
        yield element
        position = element[2]


def _has_webm_doctype(file: BinaryIO, start: int, end: int, element_count: list[int]) -> bool:
    for element_id, payload_start, payload_end, unknown in _elements(file, start, end, element_count):
        if unknown:
            return False
        if element_id == 0x4282:
            file.seek(payload_start)
            return file.read(payload_end - payload_start).lower() == b"webm"
    return False


@dataclass(frozen=True)
class _WebmTrack:
    number: int
    codec: bytes
    width: int
    height: int


def _read_ebml_uint(file: BinaryIO, start: int, end: int) -> int:
    if not 0 < end - start <= 8:
        return 0
    file.seek(start)
    return int.from_bytes(file.read(end - start), "big")


def _webm_video_dimensions(
    file: BinaryIO,
    start: int,
    end: int,
    element_count: list[int],
) -> tuple[int, int]:
    width = 0
    height = 0
    for element_id, payload_start, payload_end, unknown in _elements(file, start, end, element_count):
        if unknown:
            return 0, 0
        if element_id == 0xB0:
            width = _read_ebml_uint(file, payload_start, payload_end)
        elif element_id == 0xBA:
            height = _read_ebml_uint(file, payload_start, payload_end)
    return width, height


def _video_track(file: BinaryIO, start: int, end: int, element_count: list[int]) -> _WebmTrack | None:
    matches: list[_WebmTrack] = []
    for element_id, entry_start, entry_end, unknown in _elements(file, start, end, element_count):
        if unknown:
            return None
        if element_id != 0xAE:
            continue
        number = 0
        track_type = 0
        codec = b""
        width = 0
        height = 0
        for child_id, payload_start, payload_end, child_unknown in _elements(
            file, entry_start, entry_end, element_count
        ):
            if child_unknown:
                return None
            if child_id == 0xD7:
                number = _read_ebml_uint(file, payload_start, payload_end)
            elif child_id == 0x83:
                track_type = _read_ebml_uint(file, payload_start, payload_end)
            elif child_id == 0x86:
                if payload_end - payload_start > 16:
                    return None
                file.seek(payload_start)
                codec = file.read(payload_end - payload_start)
            elif child_id == 0xE0:
                width, height = _webm_video_dimensions(file, payload_start, payload_end, element_count)
        if number > 0 and track_type == 1 and codec in {b"V_VP8", b"V_VP9"} and width > 0 and height > 0:
            matches.append(_WebmTrack(number, codec, width, height))
    return matches[0] if len(matches) == 1 else None


def _simple_block_track(payload: bytes) -> tuple[int, int] | None:
    track_width = _vint_width(payload[0], 8) if payload else None
    if track_width is None or len(payload) < track_width:
        return None
    track_number = payload[0] & ((1 << (8 - track_width)) - 1)
    for byte in payload[1:track_width]:
        track_number = (track_number << 8) | byte
    return track_number, track_width


def _valid_webm_frame(payload: bytes, payload_size: int, track: _WebmTrack) -> bool:
    parsed_track = _simple_block_track(payload)
    if parsed_track is None:
        return False
    track_number, track_width = parsed_track
    if len(payload) < track_width + 7:
        return False
    flags = payload[track_width + 2]
    frame = payload[track_width + 3 :]
    if track_number != track.number or not flags & 0x80 or flags & 0x06:
        return False
    if track.codec == b"V_VP8":
        if len(frame) < 10 or frame[0] & 1 or frame[3:6] != b"\x9d\x01\x2a":
            return False
        width = int.from_bytes(frame[6:8], "little") & 0x3FFF
        height = int.from_bytes(frame[8:10], "little") & 0x3FFF
        partition_size = int.from_bytes(frame[:3], "little") >> 5
        frame_size = payload_size - track_width - 3
        return (
            (width, height) == (track.width, track.height)
            and partition_size > 0
            and 10 + partition_size <= frame_size
        )
    return validate_vp9_keyframe(frame, track.width, track.height)


def _has_cluster_block(
    file: BinaryIO,
    start: int,
    end: int,
    track: _WebmTrack,
    element_count: list[int],
) -> bool:
    for element_id, payload_start, payload_end, unknown in _elements(file, start, end, element_count):
        if unknown:
            return False
        if element_id == 0xA3 and payload_end - payload_start >= 8:
            file.seek(payload_start)
            payload_size = payload_end - payload_start
            prefix = file.read(min(payload_size, 32))
            parsed_track = _simple_block_track(prefix)
            if parsed_track is None or parsed_track[0] != track.number:
                continue
            if _valid_webm_frame(prefix, payload_size, track):
                return True
    return False


def validate_webm(path: Path) -> bool:
    size = path.stat().st_size
    element_count = [0]
    try:
        with path.open("rb") as file:
            top_level = list(_elements(file, 0, size, element_count))
            if not top_level or top_level[0][0] != 0x1A45DFA3:
                return False
            _, header_start, header_end, header_unknown = top_level[0]
            if header_unknown or header_end - header_start > MAX_WEBM_HEADER_BYTES:
                return False
            if not _has_webm_doctype(file, header_start, header_end, element_count):
                return False
            segment = next((element for element in top_level[1:] if element[0] == 0x18538067), None)
            if segment is None:
                return False
            _, segment_start, segment_end, _ = segment
            video_track: _WebmTrack | None = None
            saw_cluster_block = False
            for element_id, payload_start, payload_end, unknown in _elements(
                file, segment_start, segment_end, element_count
            ):
                if unknown:
                    return False
                if element_id == 0x1654AE6B:
                    video_track = _video_track(file, payload_start, payload_end, element_count)
                elif element_id == 0x1F43B675 and video_track is not None:
                    saw_cluster_block = saw_cluster_block or _has_cluster_block(
                        file, payload_start, payload_end, video_track, element_count
                    )
            return video_track is not None and saw_cluster_block
    except ValueError:
        return False
