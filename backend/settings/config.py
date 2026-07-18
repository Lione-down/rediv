from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="REVID_")

    # === App ===
    app_name: str = "Revid API"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173", "http://localhost:9099"])
    jwt_secret: str = Field(default="", repr=False)
    acceptance_instance_id: str = ""

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
    wechat_mock_enabled: bool = True

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
    storage_s3_bucket: str = ""
    storage_s3_endpoint: str = ""
    storage_s3_region: str = "us-east-1"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()


def require_runtime_security_settings() -> None:
    if not settings.jwt_secret.strip():
        raise RuntimeError("REVID_JWT_SECRET is required")
