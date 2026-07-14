from __future__ import annotations

from typing import BinaryIO, Final


MAX_SAMPLE_NALS: Final = 4096
MAX_AVCC_PARAMETER_SETS: Final = 32


def _read_exact(file: BinaryIO, size: int) -> bytes | None:
    value = file.read(size)
    return value if len(value) == size else None


def _range_has_nonzero(file: BinaryIO, start: int, size: int) -> bool:
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


def _parameter_set_is_valid(
    file: BinaryIO,
    position: int,
    end: int,
    expected_type: int,
) -> int | None:
    if position + 2 > end:
        return None
    file.seek(position)
    encoded_size = _read_exact(file, 2)
    if encoded_size is None:
        return None
    nal_size = int.from_bytes(encoded_size, "big")
    nal_start = position + 2
    nal_end = nal_start + nal_size
    if nal_size < 2 or nal_end > end:
        return None
    file.seek(nal_start)
    header = file.read(1)
    if not header or header[0] & 0x80 or header[0] & 0x1F != expected_type:
        return None
    if not _range_has_nonzero(file, nal_start + 1, nal_size - 1):
        return None
    return nal_end


def parse_avcc_length_size(file: BinaryIO, start: int, end: int) -> int | None:
    if end - start < 7:
        return None
    file.seek(start)
    header = _read_exact(file, 6)
    if header is None or header[0] != 1 or header[4] & 0xFC != 0xFC or header[5] & 0xE0 != 0xE0:
        return None
    length_size_minus_one = header[4] & 0x03
    if length_size_minus_one == 2:
        return None
    length_size = length_size_minus_one + 1
    sps_count = header[5] & 0x1F
    if not 0 < sps_count <= MAX_AVCC_PARAMETER_SETS:
        return None
    position = start + 6
    for _ in range(sps_count):
        position = _parameter_set_is_valid(file, position, end, 7)
        if position is None:
            return None
    if position >= end:
        return None
    file.seek(position)
    pps_count_data = file.read(1)
    if not pps_count_data or not 0 < pps_count_data[0] <= MAX_AVCC_PARAMETER_SETS:
        return None
    position += 1
    for _ in range(pps_count_data[0]):
        position = _parameter_set_is_valid(file, position, end, 8)
        if position is None:
            return None
    return length_size


def validate_avc_sample(
    file: BinaryIO,
    start: int,
    size: int,
    length_size: int,
) -> bool:
    end = start + size
    position = start
    nal_count = 0
    saw_vcl = False
    while position < end:
        nal_count += 1
        if nal_count > MAX_SAMPLE_NALS or position + length_size > end:
            return False
        file.seek(position)
        encoded_size = _read_exact(file, length_size)
        if encoded_size is None:
            return False
        nal_size = int.from_bytes(encoded_size, "big")
        nal_start = position + length_size
        nal_end = nal_start + nal_size
        if nal_size < 2 or nal_end > end:
            return False
        file.seek(nal_start)
        header = file.read(1)
        if not header or header[0] & 0x80:
            return False
        nal_type = header[0] & 0x1F
        if not 1 <= nal_type <= 23 or not _range_has_nonzero(file, nal_start + 1, nal_size - 1):
            return False
        saw_vcl = saw_vcl or 1 <= nal_type <= 5
        position = nal_end
    return position == end and saw_vcl


def validate_nonzero_sample(file: BinaryIO, start: int, size: int) -> bool:
    return size > 0 and _range_has_nonzero(file, start, size)


class _BitReader:
    def __init__(self, data: bytes) -> None:
        self.data = data
        self.position = 0

    def read(self, count: int) -> int | None:
        if count < 0 or self.position + count > len(self.data) * 8:
            return None
        value = 0
        for _ in range(count):
            byte = self.data[self.position // 8]
            value = (value << 1) | ((byte >> (7 - self.position % 8)) & 1)
            self.position += 1
        return value


def validate_vp9_keyframe(frame: bytes, expected_width: int, expected_height: int) -> bool:
    reader = _BitReader(frame)
    if reader.read(2) != 2:
        return False
    profile_low = reader.read(1)
    profile_high = reader.read(1)
    if profile_low is None or profile_high is None:
        return False
    profile = profile_low | (profile_high << 1)
    if profile == 3 and reader.read(1) != 0:
        return False
    if reader.read(1) != 0 or reader.read(1) != 0:
        return False
    if reader.read(1) is None or reader.read(1) is None or reader.read(24) != 0x498342:
        return False
    if profile >= 2 and reader.read(1) is None:
        return False
    color_space = reader.read(3)
    if color_space is None:
        return False
    if color_space == 7:
        if profile not in {1, 3} or reader.read(1) != 0:
            return False
    else:
        if reader.read(1) is None:
            return False
        if profile in {1, 3} and (
            reader.read(1) is None or reader.read(1) is None or reader.read(1) != 0
        ):
            return False
    width_minus_one = reader.read(16)
    height_minus_one = reader.read(16)
    if width_minus_one is None or height_minus_one is None:
        return False
    if (width_minus_one + 1, height_minus_one + 1) != (expected_width, expected_height):
        return False
    body_start = (reader.position + 7) // 8
    return body_start < len(frame) and any(frame[body_start:])
