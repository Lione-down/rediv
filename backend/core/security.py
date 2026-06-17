import base64
import hashlib
import hmac
import json
import time
from typing import Any

from fastapi import Depends, Header, HTTPException, status

from controllers.store import store
from settings.config import settings


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
