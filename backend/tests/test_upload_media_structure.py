from __future__ import annotations

import base64
import hashlib
import struct
import unittest
import zlib
from pathlib import Path
from tempfile import TemporaryDirectory

from core.upload_media import UploadStructureError, validate_staged_upload
from core.upload_audio_validation import MAX_OGG_PACKET_BYTES, _append_ogg_segment
from tests.media_fixtures import (
    AUDIO_FIRST_WEBM_BYTES,
    AUDIO_FIRST_H264_AAC_MP4_BYTES,
    CLASSIC_BMFF_BYTES,
    FORGED_UPLOAD_BYTES,
    REAL_VP8_WEBM_BYTES,
    SURROUND_OGG_BYTES,
    VALID_UPLOAD_BYTES,
)


REAL_MEDIA_SHA256 = {
    "clip.mov": "30c53f8c4cd4d8f5ac8ffb0dc74f29cc883b6ac7e42b6ad90882e67a8be298da",
    "clip.mp4": "ed0cb867eef34eaee41004c7f6d6ac080d39a4bb352673f9616f6dd5872f5935",
    "clip.webm": "6cf9dc7ea0500fb3243a560dc9a0ad5f949967173b89369c77e96532c13de703",
    "cover.webp": "03486d40b400918bbc09fe1608db054e59c40ff4400c1cb2342158edd5c75baa",
    "voice.m4a": "51287927e8c522d89594f07d1ac78643951689dd4bf0714bfd96a95f97ba4bba",
    "voice.ogg": "fe79e882d6fd4a7e941611ffe2ccd2ac232a2c6a0b7783af351cabacb876debc",
}
CLASSIC_BMFF_SHA256 = {
    "standard.mp4": "448e14789e818c7c142ef475280a2d060b3eaad3633340c3aac770034c84ae20",
    "standard.mov": "ace69f71ff46593a5cbb585f3e2fb59804357043364984059b01e40a3a68c074",
    "standard.m4a": "16968ec5931b468d5e2791396948cfa2482061dc4ac104f089297f55b4ca2eee",
}


VALID_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
)
JPEG_WITHOUT_SOF = (
    b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00"
    b"\xff\xda\x00\x08\x01\x01\x00\x00\x3f\x00\x00\xff\xd9"
)
SINGLE_MP3_FRAME = b"\xff\xfb\x90\x64" + (b"\x00" * 413)


def _box(name: bytes, payload: bytes) -> bytes:
    return struct.pack(">I4s", len(payload) + 8, name) + payload


def _ebml_element(element_id: bytes, payload: bytes, *, unknown_size: bool = False) -> bytes:
    size = b"\xff" if unknown_size else bytes([0x80 | len(payload)])
    return element_id + size + payload


def _replace_png_idat(content: bytes, payload: bytes) -> bytes:
    idat_type = content.index(b"IDAT")
    old_payload_start = idat_type + 4
    old_payload_end = old_payload_start + int.from_bytes(content[idat_type - 4 : idat_type], "big")
    chunk = len(payload).to_bytes(4, "big") + b"IDAT" + payload
    chunk += zlib.crc32(b"IDAT" + payload).to_bytes(4, "big")
    return content[: idat_type - 4] + chunk + content[old_payload_end + 4 :]


class UploadMediaStructureTestCase(unittest.TestCase):
    def test_real_media_fixture_checksums_are_stable(self) -> None:
        for filename, expected_sha256 in REAL_MEDIA_SHA256.items():
            with self.subTest(filename=filename):
                self.assertEqual(expected_sha256, hashlib.sha256(VALID_UPLOAD_BYTES[filename]).hexdigest())

    def test_accepts_standard_non_fragmented_bmff_fixtures(self) -> None:
        expected_lengths = {"standard.mp4": 1546, "standard.mov": 1493, "standard.m4a": 840}
        for filename, content in CLASSIC_BMFF_BYTES.items():
            with self.subTest(filename=filename):
                self.assertEqual(expected_lengths[filename], len(content))
                self.assertEqual(CLASSIC_BMFF_SHA256[filename], hashlib.sha256(content).hexdigest())
                self._assert_accepted(Path(filename).suffix, content)

    def test_accepts_generic_iso_brand_m4a(self) -> None:
        content = VALID_UPLOAD_BYTES["voice.m4a"].replace(b"M4A ", b"isom", 2)

        self.assertEqual(1627, len(content))
        self.assertEqual(
            "ce8faaaf009f70dc57b6935c67519370bdf023c93aca4e434b59edee70ca0eac",
            hashlib.sha256(content).hexdigest(),
        )
        self._assert_accepted(".m4a", content)

    def test_accepts_audio_first_multitrack_webm(self) -> None:
        self.assertEqual(1109, len(AUDIO_FIRST_WEBM_BYTES))
        self.assertEqual(
            "47e8170c42a069c80b6aed7226f3d0842caa79afad71e4ec2e207fd0020d151f",
            hashlib.sha256(AUDIO_FIRST_WEBM_BYTES).hexdigest(),
        )
        self._assert_accepted(".webm", AUDIO_FIRST_WEBM_BYTES)

    def test_accepts_audio_first_h264_aac_mp4(self) -> None:
        self.assertEqual(2811, len(AUDIO_FIRST_H264_AAC_MP4_BYTES))
        self.assertEqual(
            "b6d451d1a72a2a6ed864974cfa300d8c695ba5433ea2e8b28fb9247549e52b4b",
            hashlib.sha256(AUDIO_FIRST_H264_AAC_MP4_BYTES).hexdigest(),
        )
        self._assert_accepted(".mp4", AUDIO_FIRST_H264_AAC_MP4_BYTES)

    def test_accepts_surround_ogg_mapping_family(self) -> None:
        self.assertEqual(268, len(SURROUND_OGG_BYTES))
        self.assertEqual(
            "8256bd1eac6530e3d952e2e5b500f28279ae1ab469d824b438f2965658085b98",
            hashlib.sha256(SURROUND_OGG_BYTES).hexdigest(),
        )
        self._assert_accepted(".ogg", SURROUND_OGG_BYTES)

    def test_rejects_shallow_forged_media_containers(self) -> None:
        for filename, content in FORGED_UPLOAD_BYTES.items():
            with self.subTest(filename=filename):
                self._assert_rejected(Path(filename).suffix, content)

    def test_bmff_rejects_missing_codec_config_and_outside_fragment_data(self) -> None:
        for filename, config_box in (("clip.mp4", b"avcC"), ("voice.m4a", b"esds")):
            with self.subTest(filename=filename, mutation="codec-config"):
                content = VALID_UPLOAD_BYTES[filename].replace(config_box, b"junk", 1)
                self._assert_rejected(Path(filename).suffix, content)

        content = bytearray(VALID_UPLOAD_BYTES["clip.mp4"])
        trun_type = content.index(b"trun")
        content[trun_type + 12 : trun_type + 16] = (2**31 - 1).to_bytes(4, "big")
        self._assert_rejected(".mp4", bytes(content))

    def test_bmff_rejects_zeroed_video_sample_payload(self) -> None:
        for filename, original in (
            ("fragmented.mp4", VALID_UPLOAD_BYTES["clip.mp4"]),
            ("standard.mp4", CLASSIC_BMFF_BYTES["standard.mp4"]),
        ):
            with self.subTest(filename=filename):
                content = bytearray(original)
                mdat_type = content.index(b"mdat")
                box_start = mdat_type - 4
                box_end = box_start + int.from_bytes(content[box_start:mdat_type], "big")
                content[mdat_type + 4 : box_end] = b"\x00" * (box_end - mdat_type - 4)
                self._assert_rejected(".mp4", bytes(content))

    def test_bmff_rejects_sample_framing_that_disagrees_with_avcc(self) -> None:
        content = bytearray(VALID_UPLOAD_BYTES["clip.mp4"])
        avcc_type = content.index(b"avcC")
        content[avcc_type + 8] &= 0xFC
        self._assert_rejected(".mp4", bytes(content))

    def test_webm_rejects_unknown_codec_and_mismatched_block_track(self) -> None:
        unknown_codec = VALID_UPLOAD_BYTES["clip.webm"].replace(b"V_VP9", b"V_BAD", 1)
        self._assert_rejected(".webm", unknown_codec)

        content = bytearray(VALID_UPLOAD_BYTES["clip.webm"])
        block = content.index(b"\x81\x00\x00\x80\xa2\x49\x83\x42")
        content[block] = 0x82
        self._assert_rejected(".webm", bytes(content))

    def test_webm_rejects_zeroed_keyframe_payload(self) -> None:
        content = bytearray(VALID_UPLOAD_BYTES["clip.webm"])
        block = content.index(b"\x81\x00\x00\x80\xa2\x49\x83\x42")
        content[block + 8 :] = b"\x00" * (len(content) - block - 8)
        self._assert_rejected(".webm", bytes(content))

    def test_vp8_rejects_first_partition_outside_block(self) -> None:
        self.assertEqual(406, len(REAL_VP8_WEBM_BYTES))
        self.assertEqual(
            "da50d173be2c4d37b99da59ea1f79dace80263a868eb1bcac2bc3a1f3b19e51c",
            hashlib.sha256(REAL_VP8_WEBM_BYTES).hexdigest(),
        )
        self._assert_accepted(".webm", REAL_VP8_WEBM_BYTES)

        content = bytearray(REAL_VP8_WEBM_BYTES)
        block_start = content.index(b"\x81\x00\x00\x80")
        frame_start = block_start + 4
        frame_tag = int.from_bytes(content[frame_start : frame_start + 3], "little")
        content[frame_start : frame_start + 3] = (
            (0x7FFFF << 5) | (frame_tag & 0x1F)
        ).to_bytes(3, "little")
        self._assert_rejected(".webm", bytes(content))

    def test_webp_rejects_partition_outside_bitstream(self) -> None:
        content = bytearray(VALID_UPLOAD_BYTES["cover.webp"])
        content[20:23] = (0xFFFFE0).to_bytes(3, "little")
        self._assert_rejected(".webp", bytes(content))

    def test_png_rejects_invalid_chunk_crc(self) -> None:
        content = bytearray(VALID_PNG)
        content[29] ^= 0x01
        self._assert_rejected(".png", bytes(content))

    def test_png_rejects_zeroed_idat_payload_with_valid_crc(self) -> None:
        content = bytearray(VALID_PNG)
        idat_type = content.index(b"IDAT")
        payload_start = idat_type + 4
        payload_end = payload_start + int.from_bytes(content[idat_type - 4 : idat_type], "big")
        content[payload_start:payload_end] = b"\x00" * (payload_end - payload_start)
        content[payload_end : payload_end + 4] = zlib.crc32(
            content[idat_type:payload_end]
        ).to_bytes(4, "big")
        self._assert_rejected(".png", bytes(content))

    def test_png_rejects_invalid_filter_after_successful_inflate(self) -> None:
        content = _replace_png_idat(VALID_PNG, zlib.compress(b"\x05\x00\xff"))
        self._assert_rejected(".png", content)

    def test_png_rejects_extra_inflated_scanline_bytes(self) -> None:
        content = _replace_png_idat(VALID_PNG, zlib.compress(b"\x00\x00\xff\x00"))
        self._assert_rejected(".png", content)

    def test_png_rejects_excessive_dimensions(self) -> None:
        content = bytearray(VALID_PNG)
        content[16:20] = (100_001).to_bytes(4, "big")
        content[29:33] = zlib.crc32(content[12:29]).to_bytes(4, "big")
        self._assert_rejected(".png", bytes(content))

    def test_png_rejects_excessive_pixel_area(self) -> None:
        content = bytearray(VALID_PNG)
        content[16:20] = (10_000).to_bytes(4, "big")
        content[20:24] = (10_000).to_bytes(4, "big")
        content[24] = 16
        content[25] = 0
        content[29:33] = zlib.crc32(content[12:29]).to_bytes(4, "big")
        self._assert_rejected(".png", bytes(content))

    def test_jpeg_rejects_scan_without_sof_dimensions(self) -> None:
        self._assert_rejected(".jpg", JPEG_WITHOUT_SOF)

    def test_bmff_rejects_moov_without_matching_track(self) -> None:
        ftyp = _box(b"ftyp", b"mp42\x00\x00\x00\x00isom")
        self._assert_rejected(".mp4", ftyp + _box(b"moov", b"\x00") + _box(b"mdat", b"\x00"))

    def test_webm_rejects_segment_without_tracks(self) -> None:
        content = b"\x1a\x45\xdf\xa3\x87\x42\x82\x84webm\x18\x53\x80\x67\x81\x00"
        self._assert_rejected(".webm", content)

    def test_webm_unknown_track_size_is_rejected_without_validator_crash(self) -> None:
        header = _ebml_element(
            b"\x1a\x45\xdf\xa3",
            _ebml_element(b"\x42\x82", b"webm"),
        )
        tracks = _ebml_element(
            b"\x16\x54\xae\x6b",
            _ebml_element(b"\xae", b"", unknown_size=True),
        )
        cluster = _ebml_element(
            b"\x1f\x43\xb6\x75",
            _ebml_element(b"\xa3", b"\x81\x00\x00\x80\xa2\x49\x83\x42"),
        )
        content = header + _ebml_element(b"\x18\x53\x80\x67", tracks + cluster)
        self._assert_rejected(".webm", content)

    def test_ogg_rejects_page_without_valid_crc_or_codec(self) -> None:
        content = b"OggS\x00\x02" + (b"\x00" * 20) + b"\x01\x01\x00"
        self._assert_rejected(".ogg", content)

    def test_ogg_packet_buffer_rejects_growth_past_codec_bound(self) -> None:
        packet = bytearray(b"x" * MAX_OGG_PACKET_BYTES)

        self.assertFalse(_append_ogg_segment(packet, b"x"))
        self.assertEqual(MAX_OGG_PACKET_BYTES, len(packet))

    def test_mp3_rejects_single_frame(self) -> None:
        self._assert_rejected(".mp3", SINGLE_MP3_FRAME)

    def _assert_rejected(self, extension: str, content: bytes) -> None:
        with TemporaryDirectory() as temp_dir:
            stage_path = Path(temp_dir) / f"fixture{extension}"
            stage_path.write_bytes(content)
            with self.assertRaises(UploadStructureError):
                validate_staged_upload(stage_path, extension, 1024 * 1024, 0)

    def _assert_accepted(self, extension: str, content: bytes) -> None:
        with TemporaryDirectory() as temp_dir:
            stage_path = Path(temp_dir) / f"fixture{extension}"
            stage_path.write_bytes(content)
            validate_staged_upload(stage_path, extension, 1024 * 1024, 0)


if __name__ == "__main__":
    unittest.main()
