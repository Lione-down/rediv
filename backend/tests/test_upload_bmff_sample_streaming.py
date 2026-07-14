from __future__ import annotations

import struct
import unittest
from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from core.upload_bmff_validation import (
    MAX_BMFF_VALIDATED_SAMPLES,
    _parse_stsz,
    validate_bmff,
)


SAMPLE_COUNT_OVER_LEGACY_LIMIT = 4097
SAMPLE_COUNT_BOMB = MAX_BMFF_VALIDATED_SAMPLES + 1


def _box(box_type: bytes, payload: bytes) -> bytes:
    return struct.pack(">I4s", len(payload) + 8, box_type) + payload


def _sample_description() -> bytes:
    audio_fields = (
        b"\x00" * 6
        + (1).to_bytes(2, "big")
        + b"\x00" * 8
        + (2).to_bytes(2, "big")
        + (16).to_bytes(2, "big")
        + b"\x00" * 4
        + (48_000 << 16).to_bytes(4, "big")
    )
    entry = _box(b"mp4a", audio_fields + _box(b"esds", b"\x00\x00\x00\x00\x03"))
    return _box(b"stsd", b"\x00" * 4 + (1).to_bytes(4, "big") + entry)


def _sample_table(
    sample_count: int, chunk_offset: int, *, fragmented: bool, compact_sizes: bool
) -> bytes:
    if fragmented:
        stts = _box(b"stts", b"\x00" * 8)
        stsc = _box(b"stsc", b"\x00" * 8)
        stsz = _box(b"stsz", b"\x00" * 12)
        stco = _box(b"stco", b"\x00" * 8)
    else:
        stts = _box(
            b"stts",
            b"\x00" * 4
            + (1).to_bytes(4, "big")
            + sample_count.to_bytes(4, "big")
            + (1024).to_bytes(4, "big"),
        )
        stsc = _box(
            b"stsc",
            b"\x00" * 4
            + (1).to_bytes(4, "big")
            + (1).to_bytes(4, "big")
            + sample_count.to_bytes(4, "big")
            + (1).to_bytes(4, "big"),
        )
        encoded_sizes = b"" if compact_sizes else (1).to_bytes(4, "big") * sample_count
        default_size = 1 if compact_sizes else 0
        stsz = _box(
            b"stsz",
            b"\x00" * 4
            + default_size.to_bytes(4, "big")
            + sample_count.to_bytes(4, "big")
            + encoded_sizes,
        )
        stco = _box(
            b"stco",
            b"\x00" * 4 + (1).to_bytes(4, "big") + chunk_offset.to_bytes(4, "big"),
        )
    return _box(b"stbl", _sample_description() + stts + stsc + stsz + stco)


def _moov(
    sample_count: int, chunk_offset: int, *, fragmented: bool, compact_sizes: bool = True
) -> bytes:
    track_header = bytearray(20)
    track_header[12:16] = (1).to_bytes(4, "big")
    handler = _box(b"hdlr", b"\x00" * 8 + b"soun")
    media = _box(
        b"mdia",
        handler
        + _box(
            b"minf",
            _sample_table(
                sample_count,
                chunk_offset,
                fragmented=fragmented,
                compact_sizes=compact_sizes,
            ),
        ),
    )
    payload = _box(b"trak", _box(b"tkhd", bytes(track_header)) + media)
    if fragmented:
        payload += _box(b"mvex", b"")
    return _box(b"moov", payload)


def _classic_m4a(
    sample_count: int, payload_size: int | None = None, *, compact_sizes: bool = False
) -> bytes:
    ftyp = _box(b"ftyp", b"M4A \x00\x00\x00\x00isom")
    moov = _moov(sample_count, 0, fragmented=False, compact_sizes=compact_sizes)
    chunk_offset = len(ftyp) + len(moov) + 8
    moov = _moov(sample_count, chunk_offset, fragmented=False, compact_sizes=compact_sizes)
    payload = b"\x01" * (sample_count if payload_size is None else payload_size)
    return ftyp + moov + _box(b"mdat", payload)


def _fragmented_m4a(
    sample_count: int,
    payload_size: int | None = None,
    *,
    trun_counts: tuple[int, ...] | None = None,
) -> bytes:
    ftyp = _box(b"ftyp", b"M4A \x00\x00\x00\x00isom")
    moov = _moov(0, 0, fragmented=True)
    tfhd = _box(
        b"tfhd",
        (0x020018).to_bytes(4, "big")
        + (1).to_bytes(4, "big")
        + (1024).to_bytes(4, "big")
        + (1).to_bytes(4, "big"),
    )
    counts = trun_counts or (sample_count,)

    def build_moof(data_start: int) -> bytes:
        truns = []
        sample_offset = 0
        for count in counts:
            trun_payload = (
                (1).to_bytes(4, "big")
                + count.to_bytes(4, "big")
                + (data_start + sample_offset).to_bytes(4, "big", signed=True)
            )
            truns.append(_box(b"trun", trun_payload))
            sample_offset += count
        return _box(b"moof", _box(b"traf", tfhd + b"".join(truns)))

    moof = build_moof(0)
    moof = build_moof(len(moof) + 8)
    payload = b"\x01" * (sum(counts) if payload_size is None else payload_size)
    return ftyp + moov + moof + _box(b"mdat", payload)


class BmffSampleStreamingTestCase(unittest.TestCase):
    def test_classic_m4a_accepts_more_than_4096_samples(self) -> None:
        self.assertTrue(self._validate(_classic_m4a(SAMPLE_COUNT_OVER_LEGACY_LIMIT)))

    def test_fragmented_m4a_accepts_more_than_4096_samples(self) -> None:
        self.assertTrue(self._validate(_fragmented_m4a(SAMPLE_COUNT_OVER_LEGACY_LIMIT)))

    def test_classic_compact_sample_count_bomb_stops_before_validation(self) -> None:
        content = _classic_m4a(SAMPLE_COUNT_BOMB, payload_size=1, compact_sizes=True)
        with patch("core.upload_bmff_validation.validate_nonzero_sample", return_value=True) as check:
            self.assertFalse(self._validate(content))
        check.assert_not_called()

    def test_compact_stsz_sample_count_bomb_is_rejected_from_header(self) -> None:
        payload = b"\x00" * 4 + (1).to_bytes(4, "big") + SAMPLE_COUNT_BOMB.to_bytes(4, "big")
        with self.assertRaisesRegex(ValueError, "invalid stsz"):
            _parse_stsz(BytesIO(payload), 0, len(payload))

    def test_fragmented_compact_sample_count_bomb_stops_before_validation(self) -> None:
        content = _fragmented_m4a(SAMPLE_COUNT_BOMB, payload_size=1)
        with patch("core.upload_bmff_validation.validate_nonzero_sample", return_value=True) as check:
            self.assertFalse(self._validate(content))
        check.assert_not_called()

    def test_fragmented_aggregate_budget_cannot_be_split_across_truns(self) -> None:
        content = _fragmented_m4a(0, trun_counts=(6, 6))
        with (
            patch("core.upload_bmff_validation.MAX_BMFF_VALIDATED_SAMPLES", 10),
            patch("core.upload_bmff_validation.validate_nonzero_sample", return_value=True) as check,
        ):
            self.assertFalse(self._validate(content))
        self.assertEqual(10, check.call_count)

    def _validate(self, content: bytes) -> bool:
        with TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "fixture.m4a"
            path.write_bytes(content)
            return validate_bmff(path, ".m4a")


if __name__ == "__main__":
    unittest.main()
