from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="REVID_", env_file=None)

    app_name: str = "Revid API"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])
    jwt_secret: str = "change-this-secret-in-production"

    wechat_app_id: str = ""
    wechat_app_secret: str = ""
    wechat_redirect_uri: str = "http://localhost:8000/auth/wechat/callback"
    wechat_mock_enabled: bool = True

    dev_admin_key: str = "dev-admin-key"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
