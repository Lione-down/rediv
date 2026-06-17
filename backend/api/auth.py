from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, status

from controllers.store import store
from core.security import create_token, current_user
from schemas.auth import AuthResponse, GuestResponse, MockWechatLoginRequest, WechatCallbackRequest
from settings.config import settings


router = APIRouter(prefix="/auth", tags=["auth"])
me_router = APIRouter(tags=["auth"])


def _issue_auth(user: dict) -> AuthResponse:
    token = create_token({"sub": user["id"], "role": user["role"]})
    return AuthResponse(token=token, user=user, quotas=store.quotas[user["id"]])


def _login_or_register_wechat(profile: dict, invitation_code: str | None) -> AuthResponse:
    if not store.registration_settings["wechat_login_enabled"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Wechat login is disabled")
    identity = store.find_identity("wechat_open", profile["openid"])
    if identity:
        user = store.get_user(identity["user_id"])
        store.touch_login(user["id"])
        return _issue_auth(user)
    if store.registration_settings["registration_mode"] == "closed":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Registration is closed")
    if not store.use_invitation_code(invitation_code):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid invitation code")
    user = store.create_user(profile.get("nickname", "Wechat User"), profile.get("avatar_url", ""))
    store.bind_identity(user["id"], "wechat_open", profile["openid"], profile.get("unionid"), profile)
    store.grant_default_quotas(user["id"])
    return _issue_auth(user)


@router.get("/wechat/authorize")
def wechat_authorize(state: str = "revid-login"):
    if settings.wechat_mock_enabled:
        return {"authorize_url": f"/auth/wechat/mock?state={state}", "mock": True}
    params = {
        "appid": settings.wechat_app_id,
        "redirect_uri": settings.wechat_redirect_uri,
        "response_type": "code",
        "scope": "snsapi_login",
        "state": state,
    }
    return {"authorize_url": f"https://open.weixin.qq.com/connect/qrconnect?{urlencode(params)}#wechat_redirect", "mock": False}


@router.post("/wechat/mock", response_model=AuthResponse)
def mock_wechat_login(payload: MockWechatLoginRequest):
    if not settings.wechat_mock_enabled:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mock provider is disabled")
    profile = payload.model_dump(exclude={"invitation_code"})
    return _login_or_register_wechat(profile, payload.invitation_code)


@router.post("/wechat/callback", response_model=AuthResponse)
def wechat_callback(payload: WechatCallbackRequest):
    if settings.wechat_mock_enabled:
        profile = {"openid": payload.code, "nickname": "Mock Wechat User", "avatar_url": "", "unionid": None}
        return _login_or_register_wechat(profile, payload.invitation_code)
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Real Wechat token exchange is not configured yet")


@router.post("/guest", response_model=GuestResponse)
def create_guest():
    guest = store.create_guest()
    return GuestResponse(session_id=guest["session_id"], expires_at=guest["expires_at"])


@router.get("/me")
def me(user=Depends(current_user)):
    return {"user": user, "quotas": store.quotas[user["id"]]}


@me_router.get("/me")
def root_me(user=Depends(current_user)):
    return {"user": user, "quotas": store.quotas[user["id"]]}
