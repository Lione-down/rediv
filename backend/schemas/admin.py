from pydantic import BaseModel, Field


class RegistrationSettingsUpdate(BaseModel):
    wechat_login_enabled: bool | None = None
    registration_mode: str | None = Field(default=None, pattern="^(open|invite_only|closed)$")
    default_quotas: dict[str, int] | None = None


class InvitationCodeCreate(BaseModel):
    code: str = Field(min_length=4, max_length=64)
    max_uses: int = Field(gt=0)
    expires_at: str | None = None
    quota_package_id: str | None = None


class QuotaGrantRequest(BaseModel):
    quota_type: str = Field(pattern="^(text|image|video)$")
    amount: int = Field(gt=0)
    reason: str = Field(min_length=2, max_length=200)
