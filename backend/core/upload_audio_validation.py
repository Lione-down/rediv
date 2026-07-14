from __future__ import annotations

from pathlib import Path
from typing import Final


MAX_CONTAINER_ELEMENTS: Final = 4096
MAX_PROBED_MP3_FRAMES: Final = 8
MAX_OGG_PACKET_BYTES: Final = 1275 * 48


def validate_flac(path: Path) -> bool:
    size = path.stat().st_size
    with path.open("rb") as file:
        if file.read(4) != b"fLaC":
            return False
        for index in range(128):
            header = file.read(4)
            if len(header) != 4:
                return False
            block_type = header[0] & 0x7F
            block_size = int.from_bytes(header[1:], "big")
            if index == 0 and (block_type != 0 or block_size != 34):
                return False
            if file.tell() + block_size > size:
                return False
            if index == 0:
                stream_info = file.read(block_size)
                sample_data = int.from_bytes(stream_info[10:18], "big")
                sample_rate = sample_data >> 44
                bits_per_sample = ((sample_data >> 36) & 0x1F) + 1
                if (
                    int.from_bytes(stream_info[:2], "big") == 0
                    or int.from_bytes(stream_info[2:4], "big") == 0
                    or sample_rate == 0
                    or not 4 <= bits_per_sample <= 32
                ):
                    return False
            else:
                file.seek(block_size, 1)
            if header[0] & 0x80:
                frame_header = file.read(6)
                return (
                    len(frame_header) == 6
                    and frame_header[0] == 0xFF
                    and frame_header[1] & 0xFC == 0xF8
                )
    return False


def _mp3_frame_size(header: bytes) -> int | None:
    if len(header) != 4 or header[0] != 0xFF or header[1] & 0xE0 != 0xE0:
        return None
    version_bits = (header[1] >> 3) & 0x03
    layer_bits = (header[1] >> 1) & 0x03
    bitrate_index = (header[2] >> 4) & 0x0F
    sample_index = (header[2] >> 2) & 0x03
    if (
        version_bits == 1
        or layer_bits != 1
        or bitrate_index in {0, 15}
        or sample_index == 3
        or header[3] & 0x03 == 2
    ):
        return None
    bitrate_tables = {
        3: (0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320),
        2: (0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160),
        0: (0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160),
    }
    sample_rates = {
        3: (44_100, 48_000, 32_000),
        2: (22_050, 24_000, 16_000),
        0: (11_025, 12_000, 8_000),
    }
    coefficient = 144 if version_bits == 3 else 72
    frame_size = (
        coefficient
        * bitrate_tables[version_bits][bitrate_index]
        * 1000
        // sample_rates[version_bits][sample_index]
    )
    return frame_size + ((header[2] >> 1) & 1)


def validate_mp3(path: Path) -> bool:
    size = path.stat().st_size
    with path.open("rb") as file:
        id3_header = file.read(10)
        if id3_header.startswith(b"ID3"):
            if (
                len(id3_header) != 10
                or id3_header[3] not in {2, 3, 4}
                or any(byte & 0x80 for byte in id3_header[6:10])
            ):
                return False
            tag_size = sum(id3_header[6 + index] << (21 - index * 7) for index in range(4))
            position = 10 + tag_size + (10 if id3_header[5] & 0x10 else 0)
        else:
            position = 0
        frames = 0
        for _ in range(MAX_PROBED_MP3_FRAMES):
            if position == size:
                return frames >= 2
            if size - position == 128:
                file.seek(position)
                return frames >= 2 and file.read(3) == b"TAG"
            file.seek(position)
            frame_size = _mp3_frame_size(file.read(4))
            if frame_size is None or position + frame_size > size:
                return False
            position += frame_size
            frames += 1
        return frames >= 2


def _build_ogg_crc_table() -> tuple[int, ...]:
    table = []
    for value in range(256):
        remainder = value << 24
        for _ in range(8):
            remainder = ((remainder << 1) ^ 0x04C11DB7) if remainder & 0x80000000 else remainder << 1
        table.append(remainder & 0xFFFFFFFF)
    return tuple(table)


OGG_CRC_TABLE: Final = _build_ogg_crc_table()


def _ogg_crc(content: bytes) -> int:
    checksum = 0
    for byte in content:
        checksum = ((checksum << 8) & 0xFFFFFFFF) ^ OGG_CRC_TABLE[((checksum >> 24) & 0xFF) ^ byte]
    return checksum


def _valid_opus_head(packet: bytes) -> bool:
    if (
        len(packet) < 19
        or not packet.startswith(b"OpusHead")
        or packet[8] != 1
        or not 1 <= packet[9] <= 8
        or int.from_bytes(packet[12:16], "little") == 0
    ):
        return False
    channels = packet[9]
    mapping_family = packet[18]
    if mapping_family == 0:
        return channels <= 2 and len(packet) == 19
    if mapping_family != 1 or len(packet) != 21 + channels:
        return False
    stream_count = packet[19]
    coupled_count = packet[20]
    mapped_channel_count = stream_count + coupled_count
    return (
        stream_count > 0
        and coupled_count <= stream_count
        and mapped_channel_count <= channels
        and all(value == 255 or value < mapped_channel_count for value in packet[21:])
    )


def _valid_opus_tags(packet: bytes) -> bool:
    if len(packet) < 16 or not packet.startswith(b"OpusTags"):
        return False
    vendor_length = int.from_bytes(packet[8:12], "little")
    position = 12 + vendor_length
    if position + 4 > len(packet):
        return False
    comment_count = int.from_bytes(packet[position : position + 4], "little")
    position += 4
    if comment_count > 10_000:
        return False
    for _ in range(comment_count):
        if position + 4 > len(packet):
            return False
        comment_length = int.from_bytes(packet[position : position + 4], "little")
        position += 4 + comment_length
        if position > len(packet):
            return False
    return position == len(packet)


def _valid_opus_audio_packet(packet: bytes) -> bool:
    if not packet or len(packet) > MAX_OGG_PACKET_BYTES:
        return False
    frame_code = packet[0] & 0x03
    if frame_code == 0:
        return True
    if frame_code in {1, 2}:
        return len(packet) >= 2
    return len(packet) >= 2 and 1 <= packet[1] & 0x3F <= 48


def _append_ogg_segment(packet_buffer: bytearray, segment: bytes) -> bool:
    if len(packet_buffer) + len(segment) > MAX_OGG_PACKET_BYTES:
        return False
    packet_buffer.extend(segment)
    return True


def validate_ogg(path: Path) -> bool:
    size = path.stat().st_size
    serial: bytes | None = None
    expected_sequence = 0
    pages = 0
    packet_index = 0
    packet_buffer = bytearray()
    saw_audio_packet = False
    saw_eos = False
    last_granule = 0
    with path.open("rb") as file:
        for _ in range(MAX_CONTAINER_ELEMENTS):
            if file.tell() == size:
                return pages >= 2 and saw_audio_packet and saw_eos
            header = bytearray(file.read(27))
            if len(header) != 27 or header[:4] != b"OggS" or header[4] != 0:
                return False
            segment_count = header[26]
            lacing = file.read(segment_count)
            payload_size = sum(lacing)
            payload = file.read(payload_size)
            if len(lacing) != segment_count or len(payload) != payload_size:
                return False
            stored_crc = int.from_bytes(header[22:26], "little")
            header[22:26] = b"\x00\x00\x00\x00"
            if _ogg_crc(bytes(header) + lacing + payload) != stored_crc:
                return False
            page_serial = bytes(header[14:18])
            sequence = int.from_bytes(header[18:22], "little")
            header_type = header[5]
            if bool(header_type & 0x01) != bool(packet_buffer):
                return False
            if serial is None:
                serial = page_serial
                if not header_type & 0x02 or header_type & 0x01 or sequence != 0:
                    return False
            elif page_serial != serial or sequence != expected_sequence:
                return False
            elif header_type & 0x02:
                return False
            granule = int.from_bytes(header[6:14], "little")
            if granule != 0xFFFFFFFFFFFFFFFF:
                if granule < last_granule:
                    return False
                last_granule = granule

            payload_position = 0
            for segment_length in lacing:
                segment = payload[payload_position : payload_position + segment_length]
                if not _append_ogg_segment(packet_buffer, segment):
                    return False
                payload_position += segment_length
                if segment_length == 255:
                    continue
                packet = bytes(packet_buffer)
                packet_buffer.clear()
                if packet_index == 0 and not _valid_opus_head(packet):
                    return False
                if packet_index == 1 and not _valid_opus_tags(packet):
                    return False
                if packet_index >= 2:
                    if not _valid_opus_audio_packet(packet):
                        return False
                    saw_audio_packet = True
                packet_index += 1
            pages += 1
            expected_sequence = sequence + 1
            saw_eos = bool(header_type & 0x04)
            if saw_eos and (file.tell() != size or packet_buffer):
                return False
    return False


def validate_wav(path: Path) -> bool:
    size = path.stat().st_size
    saw_fmt = False
    saw_data = False
    with path.open("rb") as file:
        header = file.read(12)
        if len(header) != 12 or header[:4] != b"RIFF" or header[8:] != b"WAVE":
            return False
        if int.from_bytes(header[4:8], "little") + 8 != size:
            return False
        for _ in range(MAX_CONTAINER_ELEMENTS):
            if file.tell() == size:
                return saw_fmt and saw_data
            chunk_header = file.read(8)
            if len(chunk_header) != 8:
                return False
            chunk_type = chunk_header[:4]
            chunk_size = int.from_bytes(chunk_header[4:], "little")
            padded_size = chunk_size + (chunk_size % 2)
            payload_start = file.tell()
            if payload_start + padded_size > size:
                return False
            if chunk_type == b"fmt ":
                if saw_fmt or chunk_size < 16:
                    return False
                fmt = file.read(16)
                audio_format = int.from_bytes(fmt[:2], "little")
                channels = int.from_bytes(fmt[2:4], "little")
                sample_rate = int.from_bytes(fmt[4:8], "little")
                bits_per_sample = int.from_bytes(fmt[14:16], "little")
                if (
                    audio_format not in {1, 3, 0xFFFE}
                    or not 1 <= channels <= 32
                    or not 1 <= sample_rate <= 768_000
                    or not 1 <= bits_per_sample <= 64
                ):
                    return False
                saw_fmt = True
            elif chunk_type == b"data":
                saw_data = saw_data or chunk_size > 0
            file.seek(payload_start + padded_size)
    return False
