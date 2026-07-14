from __future__ import annotations

from bisect import bisect_right
from collections.abc import Iterator
from dataclasses import dataclass
from itertools import chain
from pathlib import Path
from typing import BinaryIO, Final

from core.upload_video_bitstream_validation import (
    parse_avcc_length_size,
    validate_avc_sample,
    validate_nonzero_sample,
)


MAX_BMFF_ELEMENTS: Final = 4096
MAX_BMFF_VALIDATED_SAMPLES: Final = 1_000_000
MAX_FTYP_BYTES: Final = 4096


def _boxes(
    file: BinaryIO, start: int, end: int, element_count: list[int]
) -> Iterator[tuple[bytes, int, int]]:
    position = start
    while position < end:
        element_count[0] += 1
        if element_count[0] > MAX_BMFF_ELEMENTS:
            raise ValueError("too many boxes")
        file.seek(position)
        header = file.read(8)
        if len(header) != 8:
            raise ValueError("truncated box")
        box_size = int.from_bytes(header[:4], "big")
        header_size = 8
        if box_size == 1:
            extended_size = file.read(8)
            if len(extended_size) != 8:
                raise ValueError("truncated extended box")
            box_size = int.from_bytes(extended_size, "big")
            header_size = 16
        elif box_size == 0:
            box_size = end - position
        box_end = position + box_size
        if box_size < header_size or box_end > end:
            raise ValueError("invalid box size")
        yield header[4:], position + header_size, box_end
        position = box_end


@dataclass(frozen=True)
class _CodecProfile:
    codec: bytes
    avc_length_size: int | None


@dataclass(frozen=True)
class _Table:
    start: int
    count: int
    width: int
    default: int = 0


@dataclass(frozen=True)
class _ClassicSamples:
    sizes: _Table
    chunks: _Table
    chunk_map: _Table


@dataclass(frozen=True)
class _TrackProfile:
    track_id: int
    codec: bytes
    avc_length_size: int | None
    classic_samples: _ClassicSamples | None
    has_mvex: bool


def _sample_description(
    file: BinaryIO, start: int, end: int, expected_handler: bytes, element_count: list[int]
) -> _CodecProfile:
    file.seek(start)
    header = file.read(8)
    if len(header) != 8 or header[:4] != b"\x00\x00\x00\x00" or int.from_bytes(header[4:], "big") != 1:
        raise ValueError("invalid sample description")
    entries = list(_boxes(file, start + 8, end, element_count))
    if len(entries) != 1:
        raise ValueError("invalid sample description count")
    codec, payload_start, payload_end = entries[0]
    if expected_handler == b"vide":
        if codec not in {b"avc1", b"avc3"} or payload_end - payload_start < 78:
            raise ValueError("unsupported video codec")
        file.seek(payload_start + 24)
        if int.from_bytes(file.read(2), "big") == 0 or int.from_bytes(file.read(2), "big") == 0:
            raise ValueError("invalid video dimensions")
        configs = [
            (child_start, child_end)
            for child_type, child_start, child_end in _boxes(
                file, payload_start + 78, payload_end, element_count
            )
            if child_type == b"avcC"
        ]
        if len(configs) != 1:
            raise ValueError("missing AVC configuration")
        length_size = parse_avcc_length_size(file, *configs[0])
        if length_size is None:
            raise ValueError("invalid AVC configuration")
        return _CodecProfile(codec, length_size)
    if codec != b"mp4a" or payload_end - payload_start < 28:
        raise ValueError("unsupported audio codec")
    file.seek(payload_start + 16)
    channels = int.from_bytes(file.read(2), "big")
    sample_bits = int.from_bytes(file.read(2), "big")
    file.seek(payload_start + 24)
    sample_rate = int.from_bytes(file.read(4), "big") >> 16
    configs = [
        (child_start, child_end)
        for child_type, child_start, child_end in _boxes(
            file, payload_start + 28, payload_end, element_count
        )
        if child_type == b"esds" and child_end > child_start
    ]
    if channels == 0 or sample_bits == 0 or sample_rate == 0 or len(configs) != 1:
        raise ValueError("invalid audio sample description")
    return _CodecProfile(codec, None)


def _parse_stts(file: BinaryIO, start: int, end: int) -> int:
    if end - start < 8:
        raise ValueError("truncated stts")
    file.seek(start)
    header = file.read(8)
    entry_count = int.from_bytes(header[4:], "big")
    if header[:4] != b"\x00\x00\x00\x00" or end - start != 8 + entry_count * 8:
        raise ValueError("invalid stts")
    sample_count = 0
    for _ in range(entry_count):
        entry = file.read(8)
        count = int.from_bytes(entry[:4], "big")
        delta = int.from_bytes(entry[4:], "big")
        sample_count += count
        if count == 0 or delta == 0 or sample_count > MAX_BMFF_VALIDATED_SAMPLES:
            raise ValueError("invalid stts entry")
    return sample_count


def _parse_stsc(file: BinaryIO, start: int, end: int) -> _Table:
    if end - start < 8:
        raise ValueError("truncated stsc")
    file.seek(start)
    header = file.read(8)
    entry_count = int.from_bytes(header[4:], "big")
    if header[:4] != b"\x00\x00\x00\x00" or end - start != 8 + entry_count * 12:
        raise ValueError("invalid stsc")
    previous_chunk = 0
    for index in range(entry_count):
        entry = file.read(12)
        first_chunk = int.from_bytes(entry[:4], "big")
        samples_per_chunk = int.from_bytes(entry[4:8], "big")
        description_index = int.from_bytes(entry[8:], "big")
        if (
            first_chunk == 0
            or samples_per_chunk == 0
            or description_index != 1
            or first_chunk <= previous_chunk
            or (index == 0 and first_chunk != 1)
        ):
            raise ValueError("invalid stsc entry")
        previous_chunk = first_chunk
    return _Table(start + 8, entry_count, 12)


def _parse_stsz(file: BinaryIO, start: int, end: int) -> _Table:
    if end - start < 12:
        raise ValueError("truncated stsz")
    file.seek(start)
    header = file.read(12)
    default_size = int.from_bytes(header[4:8], "big")
    sample_count = int.from_bytes(header[8:], "big")
    expected_size = 12 if default_size else 12 + sample_count * 4
    if header[:4] != b"\x00\x00\x00\x00" or sample_count > MAX_BMFF_VALIDATED_SAMPLES or end - start != expected_size:
        raise ValueError("invalid stsz")
    return _Table(start + 12, sample_count, 4, default_size)


def _parse_chunk_offsets(file: BinaryIO, start: int, end: int, width: int) -> _Table:
    if end - start < 8:
        raise ValueError("truncated chunk offsets")
    file.seek(start)
    header = file.read(8)
    entry_count = int.from_bytes(header[4:], "big")
    if header[:4] != b"\x00\x00\x00\x00" or end - start != 8 + entry_count * width:
        raise ValueError("invalid chunk offsets")
    return _Table(start + 8, entry_count, width)


def _table_int(file: BinaryIO, table: _Table, index: int, offset: int = 0) -> int:
    width = table.width if offset == 0 and table.width in {4, 8} else 4
    if not 0 <= index < table.count or offset < 0 or offset + width > table.width:
        raise ValueError("invalid table index")
    file.seek(table.start + index * table.width + offset)
    value = file.read(width)
    if len(value) != width:
        raise ValueError("truncated table value")
    return int.from_bytes(value, "big")


def _classic_sample_ranges(file: BinaryIO, tables: _ClassicSamples) -> Iterator[tuple[int, int]]:
    sizes, chunks, chunk_map = tables.sizes, tables.chunks, tables.chunk_map
    map_index = 0
    sample_index = 0
    samples_per_chunk = _table_int(file, chunk_map, 0, 4)
    for chunk_index in range(1, chunks.count + 1):
        while map_index + 1 < chunk_map.count and _table_int(
            file, chunk_map, map_index + 1
        ) <= chunk_index:
            map_index += 1
            samples_per_chunk = _table_int(file, chunk_map, map_index, 4)
        sample_offset = _table_int(file, chunks, chunk_index - 1)
        if samples_per_chunk > sizes.count - sample_index:
            raise ValueError("chunk map exceeds samples")
        for _ in range(samples_per_chunk):
            sample_size = sizes.default or _table_int(file, sizes, sample_index)
            if sample_size == 0:
                raise ValueError("empty sample")
            yield sample_offset, sample_size
            sample_offset += sample_size
            sample_index += 1
    if sample_index != sizes.count or map_index + 1 != chunk_map.count:
        raise ValueError("unmapped samples")


def _sample_table(
    file: BinaryIO, start: int, end: int, expected_handler: bytes, element_count: list[int]
) -> tuple[_CodecProfile, _ClassicSamples | None]:
    leaves = {box_type: (payload_start, payload_end) for box_type, payload_start, payload_end in _boxes(file, start, end, element_count)}
    if b"stsd" not in leaves:
        raise ValueError("missing stsd")
    codec = _sample_description(file, *leaves[b"stsd"], expected_handler, element_count)
    required = {b"stts", b"stsc", b"stsz"}
    if not required <= leaves.keys() or not ({b"stco", b"co64"} & leaves.keys()):
        raise ValueError("missing sample table")
    if b"stco" in leaves and b"co64" in leaves:
        raise ValueError("ambiguous chunk offsets")
    timed_samples = _parse_stts(file, *leaves[b"stts"])
    chunk_map = _parse_stsc(file, *leaves[b"stsc"])
    sizes = _parse_stsz(file, *leaves[b"stsz"])
    offset_type = b"stco" if b"stco" in leaves else b"co64"
    chunks = _parse_chunk_offsets(file, *leaves[offset_type], 4 if offset_type == b"stco" else 8)
    if sizes.count == chunks.count == chunk_map.count == timed_samples == 0:
        return codec, None
    if timed_samples != sizes.count or not sizes.count or not chunks.count or not chunk_map.count:
        raise ValueError("inconsistent sample table")
    return codec, _ClassicSamples(sizes, chunks, chunk_map)


def _media_profile(
    file: BinaryIO, start: int, end: int, expected_handler: bytes, element_count: list[int]
) -> tuple[_CodecProfile, _ClassicSamples | None] | None:
    handler_matches = False
    minf_ranges: list[tuple[int, int]] = []
    for box_type, payload_start, payload_end in _boxes(file, start, end, element_count):
        if box_type == b"hdlr" and payload_end - payload_start >= 12:
            file.seek(payload_start + 8)
            handler_matches = file.read(4) == expected_handler
        elif box_type == b"minf":
            minf_ranges.append((payload_start, payload_end))
    if not handler_matches or len(minf_ranges) != 1:
        return None
    tables = [
        (child_start, child_end)
        for child_type, child_start, child_end in _boxes(file, *minf_ranges[0], element_count)
        if child_type == b"stbl"
    ]
    if len(tables) != 1:
        raise ValueError("invalid sample table count")
    return _sample_table(file, *tables[0], expected_handler, element_count)


def _track_profile(
    file: BinaryIO, start: int, end: int, expected_handler: bytes, element_count: list[int]
) -> tuple[int, _CodecProfile, _ClassicSamples | None] | None:
    track_id = 0
    media = None
    for box_type, payload_start, payload_end in _boxes(file, start, end, element_count):
        if box_type == b"tkhd" and payload_end - payload_start >= 20:
            file.seek(payload_start)
            version = file.read(1)
            track_id_offset = 20 if version == b"\x01" else 12
            if payload_end - payload_start >= track_id_offset + 4:
                file.seek(payload_start + track_id_offset)
                track_id = int.from_bytes(file.read(4), "big")
        elif box_type == b"mdia":
            media = _media_profile(file, payload_start, payload_end, expected_handler, element_count)
    if track_id == 0 or media is None:
        return None
    codec, samples = media
    return track_id, codec, samples


def _moov_profile(
    file: BinaryIO, start: int, end: int, expected_handler: bytes, element_count: list[int]
) -> _TrackProfile | None:
    tracks = []
    has_mvex = False
    for box_type, payload_start, payload_end in _boxes(file, start, end, element_count):
        if box_type == b"trak":
            profile = _track_profile(file, payload_start, payload_end, expected_handler, element_count)
            if profile is not None:
                tracks.append(profile)
        elif box_type == b"mvex":
            has_mvex = True
    if len(tracks) != 1:
        return None
    track_id, codec, samples = tracks[0]
    return _TrackProfile(track_id, codec.codec, codec.avc_length_size, samples, has_mvex)


def _parse_tfhd(
    file: BinaryIO, start: int, end: int, moof_start: int, track_id: int
) -> tuple[int, int, int] | None:
    if end - start < 8:
        raise ValueError("truncated tfhd")
    file.seek(start)
    full_box = file.read(4)
    flags = int.from_bytes(full_box, "big") & 0xFFFFFF
    if full_box[0] != 0 or flags & ~0x03003B:
        raise ValueError("unsupported tfhd")
    parsed_track_id = int.from_bytes(file.read(4), "big")
    position = start + 8
    base_offset = moof_start
    if flags & 0x000001:
        file.seek(position)
        base_offset = int.from_bytes(file.read(8), "big")
        position += 8
    elif not flags & 0x020000:
        raise ValueError("ambiguous fragment base")
    if flags & 0x000002:
        position += 4
    default_duration = 0
    if flags & 0x000008:
        file.seek(position)
        default_duration = int.from_bytes(file.read(4), "big")
        position += 4
    default_size = 0
    if flags & 0x000010:
        file.seek(position)
        default_size = int.from_bytes(file.read(4), "big")
        position += 4
    if flags & 0x000020:
        position += 4
    if position != end or flags & 0x010000:
        raise ValueError("invalid tfhd fields")
    return (base_offset, default_duration, default_size) if parsed_track_id == track_id else None


def _parse_trun(
    file: BinaryIO, start: int, end: int, base_offset: int, default_duration: int, default_size: int,
) -> Iterator[tuple[int, int]]:
    if end - start < 12:
        raise ValueError("truncated trun")
    file.seek(start)
    full_box = file.read(4)
    flags = int.from_bytes(full_box, "big") & 0xFFFFFF
    sample_count = int.from_bytes(file.read(4), "big")
    if full_box[0] not in {0, 1} or flags & ~0x000F05 or not 0 < sample_count <= MAX_BMFF_VALIDATED_SAMPLES or not flags & 0x000001:
        raise ValueError("invalid trun")
    data_offset = int.from_bytes(file.read(4), "big", signed=True)
    position = start + 12
    if flags & 0x000004:
        position += 4
    field_width = 4 * sum(bool(flags & field) for field in (0x000100, 0x000200, 0x000400, 0x000800))
    if position + sample_count * field_width != end:
        raise ValueError("invalid trun size")
    sample_offset = base_offset + data_offset
    for _ in range(sample_count):
        duration = default_duration
        sample_size = default_size
        if flags & 0x000100:
            file.seek(position)
            duration = int.from_bytes(file.read(4), "big")
            position += 4
        if flags & 0x000200:
            file.seek(position)
            sample_size = int.from_bytes(file.read(4), "big")
            position += 4
        position += 4 if flags & 0x000400 else 0
        position += 4 if flags & 0x000800 else 0
        if duration == 0 or sample_size == 0 or sample_offset < 0:
            raise ValueError("invalid fragment sample")
        sample = (sample_offset, sample_size)
        sample_offset += sample_size
        yield sample


def _fragment_samples(
    file: BinaryIO, moof_start: int, start: int, end: int, track_id: int, element_count: list[int],
) -> Iterator[tuple[int, int]]:
    matched_track = False
    for box_type, traf_start, traf_end in _boxes(file, start, end, element_count):
        if box_type != b"traf":
            continue
        children = list(_boxes(file, traf_start, traf_end, element_count))
        tfhds = [(child_start, child_end) for child_type, child_start, child_end in children if child_type == b"tfhd"]
        truns = [(child_start, child_end) for child_type, child_start, child_end in children if child_type == b"trun"]
        if len(tfhds) != 1:
            raise ValueError("invalid traf")
        defaults = _parse_tfhd(file, *tfhds[0], moof_start, track_id)
        if defaults is None:
            continue
        if not truns:
            raise ValueError("missing trun")
        matched_track = True
        for trun_start, trun_end in truns:
            yield from _parse_trun(file, trun_start, trun_end, *defaults)
    if not matched_track:
        raise ValueError("missing fragment samples")


def _samples_are_valid(
    file: BinaryIO, profile: _TrackProfile, samples: Iterator[tuple[int, int]],
    media_ranges: list[tuple[int, int]],
) -> bool:
    media_starts = [start for start, _ in media_ranges]
    media_byte_limit = sum(end - start for start, end in media_ranges)
    validated_bytes = sample_count = 0
    for sample_count, (sample_start, sample_size) in enumerate(samples, start=1):
        validated_bytes += sample_size
        range_index = bisect_right(media_starts, sample_start) - 1
        if (
            sample_count > MAX_BMFF_VALIDATED_SAMPLES
            or sample_size <= 0
            or validated_bytes > media_byte_limit
            or range_index < 0
            or sample_start + sample_size > media_ranges[range_index][1]
        ):
            return False
        if profile.codec in {b"avc1", b"avc3"}:
            if profile.avc_length_size is None or not validate_avc_sample(
                file, sample_start, sample_size, profile.avc_length_size
            ):
                return False
        elif not validate_nonzero_sample(file, sample_start, sample_size):
            return False
    return sample_count > 0


def validate_bmff(path: Path, extension: str) -> bool:
    size = path.stat().st_size
    brands: set[bytes] = set()
    track_profile: _TrackProfile | None = None
    media_ranges: list[tuple[int, int]] = []
    fragments: list[tuple[int, int, int]] = []
    expected_handler = b"soun" if extension == ".m4a" else b"vide"
    element_count = [0]
    try:
        with path.open("rb") as file:
            for index, (box_type, payload_start, box_end) in enumerate(_boxes(file, 0, size, element_count)):
                payload_size = box_end - payload_start
                if box_type == b"ftyp":
                    if index != 0 or payload_size < 8 or payload_size > MAX_FTYP_BYTES or payload_size % 4:
                        return False
                    file.seek(payload_start)
                    payload = file.read(payload_size)
                    brands = {payload[:4], *(payload[position : position + 4] for position in range(8, len(payload), 4))}
                elif box_type == b"moov":
                    if track_profile is not None:
                        return False
                    track_profile = _moov_profile(file, payload_start, box_end, expected_handler, element_count)
                elif box_type == b"mdat" and payload_size > 0:
                    media_ranges.append((payload_start, box_end))
                elif box_type == b"moof":
                    fragments.append((payload_start - 8, payload_start, box_end))
            if track_profile is None or not media_ranges:
                return False
            if fragments:
                if not track_profile.has_mvex or track_profile.classic_samples is not None:
                    return False
                samples_to_validate = chain.from_iterable(
                    _fragment_samples(
                        file, moof_start, fragment_start, fragment_end, track_profile.track_id, element_count
                    )
                    for moof_start, fragment_start, fragment_end in fragments
                )
            else:
                if track_profile.has_mvex or track_profile.classic_samples is None:
                    return False
                samples_to_validate = _classic_sample_ranges(file, track_profile.classic_samples)
            media_is_valid = _samples_are_valid(file, track_profile, samples_to_validate, media_ranges)
    except ValueError:
        return False
    common_iso_brands = {b"iso2", b"iso3", b"iso4", b"iso5", b"iso6", b"isom", b"mp41", b"mp42"}
    brand_groups = {
        ".mov": {b"qt  "},
        ".m4a": {b"M4A ", b"M4B ", b"M4P ", *common_iso_brands},
        ".mp4": {b"avc1", b"dash", b"M4V ", *common_iso_brands},
    }
    return bool(brands & brand_groups[extension]) and media_is_valid
