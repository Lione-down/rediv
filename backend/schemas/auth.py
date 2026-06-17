from pydantic import BaseModel, Field


class WechatCallbackRequest(BaseModel):
    code: str
    state: str | None = None
    invitation_code: str | None = None


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


class GuestResponse(BaseModel):
    session_id: str
    expires_at: str
