from __future__ import annotations

import errno
import shutil
from collections.abc import Callable
from pathlib import Path
from typing import Final
from uuid import uuid4

from anyio import CapacityLimiter, to_process
from starlette.concurrency import run_in_threadpool

from core.async_lifecycle import await_with_deferred_cancellation
from core.upload_audio_validation import (
    validate_flac as validate_flac_structure,
    validate_mp3 as validate_mp3_structure,
    validate_ogg as validate_ogg_structure,
    validate_wav as validate_wav_structure,
)
from core.upload_bmff_validation import validate_bmff as validate_bmff_structure
from core.upload_container_validation import validate_webm as validate_webm_structure
from core.upload_image_validation import (
    validate_gif as validate_gif_structure,
    validate_jpeg as validate_jpeg_structure,
    validate_png as validate_png_structure,
    validate_webp as validate_webp_structure,
)
from settings.config import settings


UPLOAD_MEDIA_TYPES: Final[dict[str, dict[str, frozenset[str]]]] = {
    "image": {
        ".gif": frozenset({"image/gif"}),
        ".jpeg": frozenset({"image/jpeg"}),
        ".jpg": frozenset({"image/jpeg"}),
        ".png": frozenset({"image/png"}),
        ".webp": frozenset({"image/webp"}),
    },
    "video": {
        ".mov": frozenset({"video/quicktime"}),
        ".mp4": frozenset({"video/mp4"}),
        ".webm": frozenset({"video/webm"}),
    },
    "audio": {
        ".flac": frozenset({"audio/flac", "audio/x-flac"}),
        ".m4a": frozenset({"audio/mp4", "audio/x-m4a"}),
        ".mp3": frozenset({"audio/mpeg", "audio/mp3"}),
        ".ogg": frozenset({"audio/ogg"}),
        ".wav": frozenset({"audio/wav", "audio/x-wav"}),
    },
}
UPLOAD_EXTENSIONS: Final = frozenset(
    extension for media_types in UPLOAD_MEDIA_TYPES.values() for extension in media_types
)
_UPLOAD_VALIDATION_LIMITER: Final = CapacityLimiter(
    settings.asset_upload_validation_concurrency
)


class UploadMediaError(Exception):
    pass


class UploadEmptyError(UploadMediaError):
    pass


class UploadTooLargeError(UploadMediaError):
    pass


class UploadStructureError(UploadMediaError):
    pass


class UploadStorageFloorError(UploadMediaError):
    pass


class UploadStorageUnavailableError(UploadMediaError):
    pass


def is_storage_exhaustion_error(error: OSError) -> bool:
    return error.errno in {errno.ENOSPC, getattr(errno, "EDQUOT", errno.ENOSPC)}


def validate_upload_metadata(filename: str | None, content_type: str | None, asset_type: str) -> str:
    extension = Path(filename or "").suffix.lower()
    if extension not in UPLOAD_EXTENSIONS:
        raise UploadMediaError("Unsupported file type")
    normalized_content_type = (content_type or "").partition(";")[0].strip().lower()
    allowed_content_types = UPLOAD_MEDIA_TYPES.get(asset_type, {}).get(extension, frozenset())
    if normalized_content_type not in allowed_content_types:
        raise UploadMediaError("File type does not match asset type")
    return extension


def finalize_staged_upload(
    stage_path: Path,
    user_dir: Path,
    extension: str,
    max_file_bytes: int,
    min_free_bytes: int,
) -> tuple[str, Path]:
    validate_staged_upload(stage_path, extension, max_file_bytes, min_free_bytes)
    return commit_staged_upload(stage_path, user_dir, extension)


def commit_staged_upload(
    stage_path: Path,
    user_dir: Path,
    extension: str,
) -> tuple[str, Path]:
    filename = f"{uuid4()}{extension}"
    saved_path = user_dir / filename
    if stage_path.stat().st_dev != user_dir.stat().st_dev:
        raise UploadStorageFloorError
    stage_path.replace(saved_path)
    return filename, saved_path


async def validate_staged_upload_in_process(
    stage_path: Path,
    extension: str,
    max_file_bytes: int,
    min_free_bytes: int,
) -> None:
    await to_process.run_sync(
        validate_staged_upload,
        stage_path,
        extension,
        max_file_bytes,
        min_free_bytes,
        cancellable=True,
        limiter=_UPLOAD_VALIDATION_LIMITER,
    )


async def commit_staged_upload_cancellation_safe(
    stage_path: Path,
    user_dir: Path,
    extension: str,
) -> tuple[str, Path]:
    result, cancellation = await await_with_deferred_cancellation(
        run_in_threadpool(commit_staged_upload, stage_path, user_dir, extension)
    )
    if cancellation is not None:
        await await_with_deferred_cancellation(
            run_in_threadpool(remove_upload_file, result[1])
        )
        raise cancellation
    return result


async def remove_upload_file_cancellation_safe(path: Path) -> None:
    _, cancellation = await await_with_deferred_cancellation(
        run_in_threadpool(remove_upload_file, path)
    )
    if cancellation is not None:
        raise cancellation


def validate_staged_upload(
    stage_path: Path,
    extension: str,
    max_file_bytes: int,
    min_free_bytes: int,
) -> None:
    try:
        uploaded_bytes = stage_path.stat().st_size
        if uploaded_bytes == 0:
            raise UploadEmptyError
        if uploaded_bytes > max_file_bytes:
            raise UploadTooLargeError
        if not _STRUCTURE_VALIDATORS[extension](stage_path):
            raise UploadStructureError
        if shutil.disk_usage(stage_path.parent).free < min_free_bytes:
            raise UploadStorageFloorError
    except OSError as error:
        if is_storage_exhaustion_error(error):
            raise UploadStorageFloorError from error
        raise UploadStorageUnavailableError from error


def remove_upload_file(path: Path) -> None:
    path.unlink(missing_ok=True)


_STRUCTURE_VALIDATORS: Final[dict[str, Callable[[Path], bool]]] = {
    ".flac": validate_flac_structure,
    ".gif": validate_gif_structure,
    ".jpeg": validate_jpeg_structure,
    ".jpg": validate_jpeg_structure,
    ".m4a": lambda path: validate_bmff_structure(path, ".m4a"),
    ".mov": lambda path: validate_bmff_structure(path, ".mov"),
    ".mp3": validate_mp3_structure,
    ".mp4": lambda path: validate_bmff_structure(path, ".mp4"),
    ".ogg": validate_ogg_structure,
    ".png": validate_png_structure,
    ".wav": validate_wav_structure,
    ".webm": validate_webm_structure,
    ".webp": validate_webp_structure,
}
