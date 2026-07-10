import base64
import hashlib
import hmac
import json
import secrets
import time
from typing import Any

import bcrypt
from fastapi import Depends, Header, HTTPException, status

from controllers.store import store
from settings.config import settings


PASSWORD_MIN_LENGTH = 8
WECHAT_STATE_TTL_SECONDS = 600


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def create_token(payload: dict[str, Any], expires_in: int = 86400) -> str:
    body = {**payload, "exp": int(time.time()) + expires_in}
    raw_body = _b64encode(json.dumps(body, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(settings.jwt_secret.encode("utf-8"), raw_body.encode("ascii"), hashlib.sha256)
    return f"{raw_body}.{_b64encode(signature.digest())}"


def verify_token(token: str) -> dict[str, Any]:
    try:
        raw_body, raw_signature = token.split(".", 1)
        expected = hmac.new(settings.jwt_secret.encode("utf-8"), raw_body.encode("ascii"), hashlib.sha256)
        if not hmac.compare_digest(_b64encode(expected.digest()), raw_signature):
            raise ValueError("bad signature")
        payload = json.loads(_b64decode(raw_body))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc
    if payload.get("exp", 0) < int(time.time()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    return payload


def create_wechat_oauth_state(client_state: str | None = None) -> str:
    normalized_state = (client_state or "").strip() or secrets.token_urlsafe(16)
    return create_token(
        {
            "purpose": "wechat_oauth_state",
            "client_state": normalized_state,
        },
        expires_in=WECHAT_STATE_TTL_SECONDS,
    )


def verify_wechat_oauth_state(state_token: str | None) -> str:
    if not state_token or not state_token.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Wechat OAuth state is required")

    try:
        payload = verify_token(state_token.strip())
    except HTTPException as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Wechat OAuth state is invalid") from exc

    if payload.get("purpose") != "wechat_oauth_state":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Wechat OAuth state is invalid")

    client_state = payload.get("client_state")
    if not isinstance(client_state, str) or not client_state.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Wechat OAuth state is invalid")
    return client_state


def password_meets_policy(password: str) -> bool:
    if len(password) < PASSWORD_MIN_LENGTH:
        return False
    if not any(character.isalpha() for character in password):
        return False
    if not any(character.isdigit() for character in password):
        return False
    return True


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str | None) -> bool:
    if not password_hash:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def current_user(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    payload = verify_token(authorization.removeprefix("Bearer ").strip())
    user = store.get_user(payload.get("sub", ""))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if user["status"] == "banned":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is banned")
    return user


def current_admin(user=Depends(current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return user


def generation_enabled_user(user=Depends(current_user)):
    if user["generation_status"] != "enabled":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Generation is frozen")
    return user
