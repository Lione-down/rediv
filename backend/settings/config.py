from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="REVID_")

    # === App ===
    app_name: str = "Revid API"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173", "http://localhost:9099"])
    jwt_secret: str = Field(default="", repr=False)

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
