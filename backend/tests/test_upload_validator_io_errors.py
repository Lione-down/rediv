from __future__ import annotations

import errno
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, patch

from api import assets as asset_api
from core import (
    upload_audio_validation,
    upload_bmff_validation,
    upload_container_validation,
    upload_image_validation,
    upload_media,
    upload_video_bitstream_validation,
)


class UploadValidatorIoErrorTestCase(unittest.TestCase):
    def test_path_validators_propagate_open_errors(self) -> None:
        validators = (
            upload_audio_validation.validate_flac,
            upload_audio_validation.validate_mp3,
            upload_audio_validation.validate_ogg,
            upload_audio_validation.validate_wav,
            upload_container_validation.validate_webm,
            upload_image_validation.validate_gif,
            upload_image_validation.validate_jpeg,
            upload_image_validation.validate_png,
            upload_image_validation.validate_webp,
        )

        for validator in validators:
            with self.subTest(validator=validator.__name__):
                read_error = OSError(errno.EIO, "simulated media read failure")
                with (
                    patch.object(Path, "stat", return_value=SimpleNamespace(st_size=128)),
                    patch.object(Path, "open", side_effect=read_error),
                    self.assertRaises(OSError) as raised,
                ):
                    validator(Path("staged-media.bin"))
                self.assertIs(read_error, raised.exception)

    def test_bitstream_validator_propagates_read_errors(self) -> None:
        file = Mock()
        read_error = OSError(errno.EIO, "simulated bitstream read failure")
        file.read.side_effect = read_error

        with self.assertRaises(OSError) as raised:
            upload_video_bitstream_validation.validate_nonzero_sample(file, 0, 1)

        self.assertIs(read_error, raised.exception)

    def test_bmff_validator_propagates_open_errors(self) -> None:
        read_error = OSError(errno.EIO, "simulated BMFF read failure")
        with (
            patch.object(Path, "stat", return_value=SimpleNamespace(st_size=128)),
            patch.object(Path, "open", side_effect=read_error),
            self.assertRaises(OSError) as raised,
        ):
            upload_bmff_validation.validate_bmff(Path("staged.mp4"), ".mp4")

        self.assertIs(read_error, raised.exception)

    def test_upload_boundary_translates_validator_io_error_with_cause(self) -> None:
        self.assertTrue(hasattr(upload_media, "UploadStorageUnavailableError"))
        error_type = upload_media.UploadStorageUnavailableError
        read_error = OSError(errno.EIO, "simulated validator read failure")

        with (
            patch.dict(
                upload_media._STRUCTURE_VALIDATORS,
                {".png": Mock(side_effect=read_error)},
            ),
            patch.object(Path, "stat", return_value=SimpleNamespace(st_size=128)),
            self.assertRaises(error_type) as raised,
        ):
            upload_media.validate_staged_upload(
                Path("staged.png"),
                ".png",
                max_file_bytes=1024,
                min_free_bytes=0,
            )

        self.assertIs(read_error, raised.exception.__cause__)

    def test_storage_unavailable_error_maps_to_sanitized_503(self) -> None:
        self.assertTrue(hasattr(upload_media, "UploadStorageUnavailableError"))

        response = asset_api._upload_http_error(upload_media.UploadStorageUnavailableError())

        self.assertEqual(503, response.status_code)
        self.assertEqual("Upload storage is unavailable", response.detail)
        self.assertEqual({"Retry-After": "1"}, response.headers)


if __name__ == "__main__":
    unittest.main()
