from pydantic import BaseModel, Field


class WechatCallbackRequest(BaseModel):
    code: str
    state: str | None = None
    invitation_code: str | None = None


class WechatAuthorizeResponse(BaseModel):
    authorize_url: str
    mock: bool
    state: str


class MockWechatLoginRequest(BaseModel):
    openid: str = Field(min_length=3)
    nickname: str = "Wechat User"
    avatar_url: str = ""
    unionid: str | None = None
    invitation_code: str | None = None


class AuthResponse(BaseModel):
    token: str
    user: dict
    quotas: dict[str, int]


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=1)
    email: str | None = Field(default=None, max_length=255)
    invitation_code: str | None = None


class LoginRequest(BaseModel):
    identifier: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=1)


class RegistrationSettingsResponse(BaseModel):
    registration_mode: str
    wechat_login_enabled: bool


class GuestResponse(BaseModel):
    session_id: str
    expires_at: str
