from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="REVID_", env_file=".env")

    # === App ===
    app_name: str = "Revid API"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173", "http://localhost:9099"])
    jwt_secret: str = "change-this-secret-in-production"

    # === Database ===
    use_sqlite: bool = True
    db_path: str = "revid.db"
    db_host: str = "localhost"
    db_port: int = 3306
    db_name: str = "revid_db"
    db_user: str = "root"
    db_password: str = ""

    # === Agnes AI API ===
    agnes_api_key: str = ""
    agnes_base_url: str = "https://apihub.agnes-ai.com"
    agnes_model_text: str = "agnes-2.0-flash"
    agnes_model_image: str = "agnes-image-2.1-flash"
    agnes_model_video: str = "agnes-video-v2.0"

    # === WeChat OAuth ===
    wechat_app_id: str = ""
    wechat_app_secret: str = ""
    wechat_redirect_uri: str = "http://localhost:8000/auth/wechat/callback"
    wechat_mock_enabled: bool = True

    # === Admin ===
    dev_admin_key: str = "dev-admin-key"

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
