from __future__ import annotations

import base64
import ipaddress
from pathlib import Path, PurePosixPath
from urllib.parse import urlsplit
from uuid import UUID

from settings.config import settings


_IMAGE_MIME_TYPES = {
    ".gif": "image/gif",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}


class AgnesImageReferenceError(ValueError):
    pass


def _is_public_hostname(hostname: str) -> bool:
    normalized = hostname.rstrip(".").casefold()
    if normalized in {"localhost", "localhost.localdomain"} or normalized.endswith(".localhost"):
        return False
    try:
        address = ipaddress.ip_address(normalized)
    except ValueError:
        return True
    return address.is_global


def _resolve_public_url(reference: str) -> str:
    parsed = urlsplit(reference)
    if (
        parsed.scheme != "https"
        or not parsed.hostname
        or parsed.username is not None
        or parsed.password is not None
        or not _is_public_hostname(parsed.hostname)
    ):
        raise AgnesImageReferenceError("Image reference must be a public HTTPS URL")
    return reference


def resolve_agnes_public_image_url(reference: str) -> str:
    """Validate the public-HTTPS-only image form supported by Agnes text vision."""
    return _resolve_public_url(reference)


def _local_upload_path(reference: str, *, user_id: str, storage_root: Path) -> tuple[Path, str]:
    parsed = urlsplit(reference)
    if parsed.scheme or parsed.netloc or parsed.query or parsed.fragment or "%" in parsed.path:
        raise AgnesImageReferenceError("Image has an invalid local upload reference")
    parts = PurePosixPath(parsed.path).parts
    if len(parts) != 4 or parts[:3] != ("/", "uploads", user_id):
        raise AgnesImageReferenceError("Image has an invalid local upload reference")
    filename = parts[3]
    extension = Path(filename).suffix.casefold()
    if extension not in _IMAGE_MIME_TYPES:
        raise AgnesImageReferenceError("Image has an unsupported image type")
    try:
        UUID(Path(filename).stem)
    except ValueError as error:
        raise AgnesImageReferenceError("Image has an invalid local upload reference") from error

    user_dir = (storage_root / "uploads" / user_id).resolve(strict=False)
    candidate = user_dir / filename
    if candidate.is_symlink():
        raise AgnesImageReferenceError("Image has an invalid local upload reference")
    try:
        resolved = candidate.resolve(strict=True)
    except (FileNotFoundError, OSError) as error:
        raise AgnesImageReferenceError("Local upload image is unavailable") from error
    if resolved.parent != user_dir or not resolved.is_file():
        raise AgnesImageReferenceError("Image has an invalid local upload reference")
    return resolved, _IMAGE_MIME_TYPES[extension]


def resolve_agnes_image_reference(
    reference: str,
    *,
    user_id: str,
    storage_root: Path | None = None,
    max_bytes: int | None = None,
) -> str:
    if reference.startswith("https://"):
        return _resolve_public_url(reference)
    if not reference.startswith("/uploads/"):
        raise AgnesImageReferenceError("Image reference must be a public HTTPS URL or local upload")

    resolved, mime_type = _local_upload_path(
        reference,
        user_id=user_id,
        storage_root=storage_root or Path(settings.storage_local_root),
    )
    byte_limit = max_bytes or settings.agnes_reference_image_max_bytes
    if resolved.stat().st_size > byte_limit:
        raise AgnesImageReferenceError("Local upload image exceeds provider reference limit")
    payload = resolved.read_bytes()
    if len(payload) > byte_limit:
        raise AgnesImageReferenceError("Local upload image exceeds provider reference limit")
    encoded = base64.b64encode(payload).decode("ascii")
    return f"data:{mime_type};base64,{encoded}"
