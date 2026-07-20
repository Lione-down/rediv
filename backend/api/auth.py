from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status

from controllers import quotas as quota_controller
from controllers.registration import (
    RegistrationConflictError,
    RegistrationForbiddenError,
    register_password_user,
    register_wechat_user,
)
from controllers.store import store
from core.auth_throttle import AuthThrottleExceeded, clear_auth_attempts, record_auth_attempt
from core.security import (
    create_token,
    create_wechat_oauth_state,
    current_user,
    hash_password,
    password_meets_policy,
    verify_password,
    verify_wechat_oauth_state,
)
from schemas.auth import (
    AuthResponse,
    GuestResponse,
    LoginRequest,
    LogoutResponse,
    MockWechatLoginRequest,
    RegisterRequest,
    RegistrationSettingsResponse,
    WechatAuthorizeResponse,
    WechatCallbackRequest,
)
from settings.config import development_auth_request_is_enabled, settings


router = APIRouter(prefix="/auth", tags=["auth"])
me_router = APIRouter(tags=["auth"])
WECHAT_TIMEOUT_SECONDS = 10


def _require_development_auth(request: Request) -> None:
    client_host = request.client.host if request.client is not None else "unknown"
    if development_auth_request_is_enabled(client_host):
        return
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")


def _request_client_host(request: Request) -> str:
    return request.client.host if request.client is not None else "unknown"


def _request_subject(request: Request, identity: str) -> str:
    return f"{_request_client_host(request)}|{identity.strip().lower()}"


def _record_auth_attempt(bucket: str, subject: str, limit: int) -> None:
    try:
        record_auth_attempt(
            bucket,
            subject,
            limit=limit,
            window_seconds=settings.auth_attempt_window_seconds,
        )
    except AuthThrottleExceeded as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many authentication attempts",
            headers={"Retry-After": str(exc.retry_after_seconds)},
        ) from None


def _normalize_login_value(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip().lower()
    return normalized or None


def _issue_auth(user: dict) -> AuthResponse:
    if user["status"] == "banned":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is banned")
    token = create_token({"sub": user["id"], "role": user["role"]})
    quota_snapshot = quota_controller.get_quota_snapshot(user["id"])
    if quota_snapshot is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="User quota not found")
    quotas, quota_revision = quota_snapshot
    return AuthResponse(
        token=token,
        user=user,
        quotas=quotas,
        quota_revision=quota_revision,
    )


def _ensure_wechat_credentials_configured() -> None:
    if settings.wechat_app_id and settings.wechat_app_secret:
        return
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Wechat OAuth credentials are not configured",
    )


def _wechat_get(url: str, params: dict[str, str]) -> dict:
    try:
        response = httpx.get(url, params=params, timeout=WECHAT_TIMEOUT_SECONDS)
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Wechat OAuth request failed",
        ) from exc

    try:
        payload = response.json()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Wechat OAuth returned invalid JSON",
        ) from exc

    if payload.get("errcode"):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Wechat OAuth error: {payload.get('errmsg', 'unknown error')}",
        )
    return payload


def _fetch_wechat_profile(code: str) -> dict:
    _ensure_wechat_credentials_configured()
    token_payload = _wechat_get(
        "https://api.weixin.qq.com/sns/oauth2/access_token",
        {
            "appid": settings.wechat_app_id,
            "secret": settings.wechat_app_secret,
            "code": code,
            "grant_type": "authorization_code",
        },
    )
    access_token = token_payload.get("access_token")
    openid = token_payload.get("openid")
    if not access_token or not openid:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Wechat OAuth response missing access_token or openid",
        )

    userinfo_payload = _wechat_get(
        "https://api.weixin.qq.com/sns/userinfo",
        {
            "access_token": access_token,
            "openid": openid,
            "lang": "zh_CN",
        },
    )
    if not userinfo_payload.get("openid"):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Wechat userinfo response missing openid",
        )

    return {
        "openid": userinfo_payload["openid"],
        "nickname": userinfo_payload.get("nickname", "Wechat User"),
        "avatar_url": userinfo_payload.get("headimgurl", ""),
        "unionid": userinfo_payload.get("unionid"),
        "raw_profile": userinfo_payload,
    }


def _login_or_register_wechat(profile: dict, invitation_code: str | None) -> AuthResponse:
    if not store.registration_settings["wechat_login_enabled"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Wechat login is disabled")
    identity = store.find_identity("wechat_open", profile["openid"])
    if identity:
        user = store.get_user(identity["user_id"])
        store.touch_login(user["id"])
        return _issue_auth(user)
    try:
        user = register_wechat_user(profile, invitation_code)
    except RegistrationForbiddenError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from None
    except RegistrationConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from None
    return _issue_auth(user)


@router.get("/wechat/authorize", response_model=WechatAuthorizeResponse)
def wechat_authorize(request: Request, state: str = "revid-login"):
    signed_state = create_wechat_oauth_state(state)
    if settings.wechat_mock_enabled:
        _require_development_auth(request)
        return WechatAuthorizeResponse(
            authorize_url=f"/auth/wechat/mock?state={signed_state}",
            mock=True,
            state=signed_state,
        )
    params = {
        "appid": settings.wechat_app_id,
        "redirect_uri": settings.wechat_redirect_uri,
        "response_type": "code",
        "scope": "snsapi_login",
        "state": signed_state,
    }
    return WechatAuthorizeResponse(
        authorize_url=f"https://open.weixin.qq.com/connect/qrconnect?{urlencode(params)}#wechat_redirect",
        mock=False,
        state=signed_state,
    )


@router.post("/wechat/mock", response_model=AuthResponse)
def mock_wechat_login(payload: MockWechatLoginRequest, request: Request):
    if not settings.wechat_mock_enabled:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mock provider is disabled")
    _require_development_auth(request)
    _record_auth_attempt(
        "wechat-mock",
        _request_client_host(request),
        settings.auth_development_attempt_limit,
    )
    profile = payload.model_dump(exclude={"invitation_code"})
    return _login_or_register_wechat(profile, payload.invitation_code)


@router.post("/wechat/callback", response_model=AuthResponse)
def wechat_callback(payload: WechatCallbackRequest, request: Request):
    verify_wechat_oauth_state(payload.state)
    if settings.wechat_mock_enabled:
        _require_development_auth(request)
        _record_auth_attempt(
            "wechat-mock",
            _request_client_host(request),
            settings.auth_development_attempt_limit,
        )
        profile = {"openid": payload.code, "nickname": "Mock Wechat User", "avatar_url": "", "unionid": None}
        return _login_or_register_wechat(profile, payload.invitation_code)
    profile = _fetch_wechat_profile(payload.code)
    return _login_or_register_wechat(profile, payload.invitation_code)


@router.get("/registration-settings", response_model=RegistrationSettingsResponse)
def registration_settings():
    return RegistrationSettingsResponse(
        registration_mode=store.registration_settings["registration_mode"],
        wechat_login_enabled=store.registration_settings["wechat_login_enabled"],
    )


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest):
    normalized_username = _normalize_login_value(payload.username)
    normalized_email = _normalize_login_value(payload.email)
    if normalized_username is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username is required")
    if not password_meets_policy(payload.password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password does not meet policy")
    try:
        user = register_password_user(
            username=normalized_username,
            email=normalized_email,
            password_hash=hash_password(payload.password),
            invitation_code=payload.invitation_code,
        )
    except RegistrationForbiddenError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from None
    except RegistrationConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from None
    return _issue_auth(user)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, request: Request):
    subject = _request_subject(request, payload.identifier)
    _record_auth_attempt("login", subject, settings.auth_login_attempt_limit)
    user = store.find_user_by_identifier(payload.identifier)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if user["status"] == "banned":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is banned")
    if not verify_password(payload.password, store.get_password_hash(user["id"])):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    clear_auth_attempts("login", subject)
    store.touch_login(user["id"])
    return _issue_auth(store.get_user(user["id"]) or user)


@router.post("/logout", response_model=LogoutResponse)
def logout(_user=Depends(current_user)):
    return LogoutResponse(
        ok=True,
        detail="Bearer session acknowledged for client logout",
    )


@router.post("/guest", response_model=GuestResponse)
def create_guest():
    guest = store.create_guest()
    return GuestResponse(session_id=guest["session_id"], expires_at=guest["expires_at"])


@router.get("/me")
def me(user=Depends(current_user)):
    quota_snapshot = quota_controller.get_quota_snapshot(user["id"])
    if quota_snapshot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User quota not found")
    quotas, quota_revision = quota_snapshot
    return {"user": user, "quotas": quotas, "quota_revision": quota_revision}


@me_router.get("/me")
def root_me(user=Depends(current_user)):
    quota_snapshot = quota_controller.get_quota_snapshot(user["id"])
    if quota_snapshot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User quota not found")
    quotas, quota_revision = quota_snapshot
    return {"user": user, "quotas": quotas, "quota_revision": quota_revision}
