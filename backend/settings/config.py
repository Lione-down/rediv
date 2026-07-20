from functools import lru_cache
from ipaddress import ip_address
from typing import Literal
from urllib.parse import urlsplit

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="REVID_")

    # === App ===
    app_name: str = "Revid API"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173", "http://localhost:9099"])
    jwt_secret: str = Field(default="", repr=False)
    acceptance_instance_id: str = ""
    runtime_profile: Literal["production", "development"] = "production"
    runtime_bind_host: str = "127.0.0.1"
    allow_mock_auth: bool = False
    auth_login_attempt_limit: int = Field(default=5, ge=1, le=100)
    auth_development_attempt_limit: int = Field(default=5, ge=1, le=100)
    auth_attempt_window_seconds: int = Field(default=300, ge=1, le=86_400)

    # === Database ===
    db_host: str = ""
    db_port: int = 3306
    db_name: str = ""
    db_user: str = ""
    db_password: str = ""
    db_pool_recycle: int = 3600

    # === Agnes AI API ===
    agnes_api_key: str = ""
    agnes_base_url: str = "https://apihub.agnes-ai.com"
    agnes_allow_development_endpoint: bool = False
    agnes_model_text: str = "agnes-2.0-flash"
    agnes_model_image: str = "agnes-image-2.1-flash"
    agnes_model_video: str = "agnes-video-v2.0"
    agnes_admission_global_limit: int = Field(default=4, gt=0, le=64)
    agnes_admission_per_user_limit: int = Field(default=2, gt=0, le=32)
    agnes_admission_text_limit: int = Field(default=2, gt=0, le=32)
    agnes_admission_image_limit: int = Field(default=2, gt=0, le=32)
    agnes_admission_video_limit: int = Field(default=1, gt=0, le=32)
    agnes_admission_lease_seconds: int = Field(default=900, ge=60, le=86_400)
    agnes_admission_retry_after_seconds: int = Field(default=5, ge=1, le=300)
    agnes_deterministic_failure_guard_seconds: int = Field(default=300, ge=1, le=3_600)
    agnes_http_connect_timeout_seconds: float = Field(default=10, gt=0, le=120)
    agnes_http_pool_timeout_seconds: float = Field(default=2, gt=0, le=60)
    agnes_http_read_timeout_seconds: float = Field(default=300, gt=0, le=3_600)
    agnes_http_write_timeout_seconds: float = Field(default=30, gt=0, le=600)

    # === WeChat OAuth ===
    # Real OAuth callback exchanges use these env vars:
    # REVID_WECHAT_APP_ID / REVID_WECHAT_APP_SECRET / REVID_WECHAT_REDIRECT_URI
    wechat_app_id: str = ""
    wechat_app_secret: str = ""
    wechat_redirect_uri: str = "http://localhost:8000/auth/wechat/callback"
    wechat_mock_enabled: bool = False

    # === Admin ===
    dev_admin_key: str = Field(default="", repr=False)
    admin_username: str = ""
    admin_password: str = Field(default="", repr=False)
    test_mysql_admin_url: str | None = Field(default=None, repr=False)

    # === Storage ===
    storage_backend: str = "local"  # local | s3
    storage_local_root: str = "./storage"
    asset_upload_max_bytes: int = Field(default=100 * 1024 * 1024, gt=0, le=1024 * 1024 * 1024)
    asset_upload_user_quota_bytes: int = Field(default=5 * 1024**3, gt=0, le=1024**4)
    asset_upload_min_free_bytes: int = Field(default=512 * 1024**2, ge=0, le=1024**4)
    asset_upload_max_active_reservations: int = Field(default=64, gt=0, le=10_000)
    asset_upload_max_active_reservations_per_user: int = Field(default=2, gt=0, le=1_000)
    asset_upload_reservation_scan_limit: int = Field(default=256, gt=0, le=100_000)
    asset_upload_user_file_count_limit: int = Field(default=10_000, gt=0, le=1_000_000)
    asset_upload_validation_concurrency: int = Field(default=4, gt=0, le=32)
    asset_upload_idle_timeout_seconds: float = Field(default=30, gt=0, le=3600)
    asset_upload_total_timeout_seconds: float = Field(default=600, gt=0, le=3600)
    agnes_reference_image_max_bytes: int = Field(default=20 * 1024 * 1024, gt=0, le=100 * 1024 * 1024)
    storage_s3_bucket: str = ""
    storage_s3_endpoint: str = ""
    storage_s3_region: str = "us-east-1"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()


_KNOWN_JWT_PLACEHOLDERS = frozenset(
    {
        "change-this-in-production",
        "change-this-secret-in-production",
        "jwt-secret",
        "secret",
        "your-secret-key",
    }
)
AGNES_PRODUCTION_BASE_URL = "https://apihub.agnes-ai.com"


def _is_loopback_host(host: str) -> bool:
    normalized = host.strip().lower().strip("[]")
    if normalized == "localhost":
        return True
    try:
        return ip_address(normalized).is_loopback
    except ValueError:
        return False


def development_auth_is_enabled(configured: Settings | None = None) -> bool:
    runtime_settings = settings if configured is None else configured
    return bool(
        runtime_settings.runtime_profile == "development"
        and runtime_settings.allow_mock_auth
        and _is_loopback_host(runtime_settings.runtime_bind_host)
    )


def development_auth_request_is_enabled(
    client_host: str,
    configured: Settings | None = None,
) -> bool:
    if not development_auth_is_enabled(configured):
        return False
    return client_host == "testclient" or _is_loopback_host(client_host)


def validate_agnes_base_url(
    base_url: str,
    configured: Settings | None = None,
) -> str:
    runtime_settings = settings if configured is None else configured
    normalized = base_url.strip().rstrip("/")
    try:
        parsed = urlsplit(normalized)
        hostname = parsed.hostname or ""
        port = parsed.port
    except ValueError:
        raise ValueError("Agnes endpoint is not trusted") from None
    if (
        not normalized
        or parsed.username is not None
        or parsed.password is not None
        or parsed.query
        or parsed.fragment
        or parsed.path not in ("", "/")
        or not hostname.isascii()
    ):
        raise ValueError("Agnes endpoint is not trusted")
    if normalized == AGNES_PRODUCTION_BASE_URL and port is None:
        return normalized

    development_endpoint_enabled = bool(
        runtime_settings.runtime_profile == "development"
        and runtime_settings.agnes_allow_development_endpoint
    )
    if (
        development_endpoint_enabled
        and parsed.scheme in {"http", "https"}
        and _is_loopback_host(hostname)
    ):
        return normalized
    raise ValueError("Agnes endpoint is not trusted")


def require_runtime_security_settings(configured: Settings | None = None) -> None:
    runtime_settings = settings if configured is None else configured
    normalized_secret = runtime_settings.jwt_secret.strip()
    if (
        len(normalized_secret) < 32
        or normalized_secret.lower() in _KNOWN_JWT_PLACEHOLDERS
    ):
        raise RuntimeError("REVID_JWT_SECRET must be a non-placeholder secret of at least 32 characters")

    development_auth_requested = bool(
        runtime_settings.allow_mock_auth
        or runtime_settings.wechat_mock_enabled
        or runtime_settings.dev_admin_key.strip()
    )
    if development_auth_requested and not development_auth_is_enabled(runtime_settings):
        raise RuntimeError(
            "Development authentication requires an explicit development profile, "
            "mock-auth opt-in, and loopback runtime binding"
        )
    validate_agnes_base_url(runtime_settings.agnes_base_url, runtime_settings)
