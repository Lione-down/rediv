import hmac

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status

from controllers import quotas as quota_controller
from controllers.store import store
from core.auth_throttle import AuthThrottleExceeded, clear_auth_attempts, record_auth_attempt
from core.security import create_token, current_admin
from schemas.admin import InvitationCodeCreate, QuotaGrantRequest, RegistrationSettingsUpdate
from settings.config import development_auth_request_is_enabled, settings


router = APIRouter(prefix="/admin", tags=["admin"])


def _log_admin_operation(
    admin_id: str,
    action: str,
    target_type: str,
    target_id: str,
    detail: str | None = None,
) -> None:
    store.log_admin_operation(admin_id, action, target_type, target_id, detail)


def _require_dev_admin_key(
    request: Request,
    supplied_key: str | None = Header(default=None, alias="X-Revid-Dev-Admin-Key"),
) -> str:
    client_host = request.client.host if request.client is not None else "unknown"
    if (
        not development_auth_request_is_enabled(client_host)
        or not settings.dev_admin_key.strip()
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found",
        )
    subject = client_host
    try:
        record_auth_attempt(
            "dev-admin",
            subject,
            limit=settings.auth_development_attempt_limit,
            window_seconds=settings.auth_attempt_window_seconds,
        )
    except AuthThrottleExceeded as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many authentication attempts",
            headers={"Retry-After": str(exc.retry_after_seconds)},
        ) from None
    if supplied_key is None or not hmac.compare_digest(supplied_key, settings.dev_admin_key):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid admin key")
    clear_auth_attempts("dev-admin", subject)
    return supplied_key


@router.post("/dev-login")
def dev_admin_login(_admin_key: str = Depends(_require_dev_admin_key)):
    admin = next(
        (
            user
            for user in store.users.values()
            if user["role"] == "admin" and user.get("username") and store.get_password_hash(user["id"])
        ),
        None,
    )
    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin bootstrap user is not configured",
        )
    return {"token": create_token({"sub": admin["id"], "role": "admin"}), "user": admin}


@router.get("/dashboard")
def dashboard(_admin=Depends(current_admin)):
    tasks = []
    return {
        "users": len(store.users),
        "assets": len(store.assets),
        "queued_tasks": len([task for task in tasks if task.get("status") == "pending"]),
        "wechat_login_enabled": store.registration_settings["wechat_login_enabled"],
        "registration_mode": store.registration_settings["registration_mode"],
        "server": {"status": "ok"},
    }


@router.get("/users")
def list_users(_admin=Depends(current_admin)):
    return {"items": list(store.users.values())}


@router.post("/users/{user_id}/ban")
def ban_user(user_id: str, admin=Depends(current_admin)):
    user = store.get_user(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user["status"] = "banned"
    _log_admin_operation(admin["id"], "ban", "user", user_id, f"Banned user {user_id}")
    return user


@router.post("/users/{user_id}/freeze-generation")
def freeze_generation(user_id: str, admin=Depends(current_admin)):
    user = store.get_user(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user["generation_status"] = "frozen"
    _log_admin_operation(admin["id"], "freeze_generation", "user", user_id, f"Froze generation for user {user_id}")
    return user


@router.get("/registration-settings")
def get_registration_settings(_admin=Depends(current_admin)):
    return store.registration_settings


@router.put("/registration-settings")
def update_registration_settings(payload: RegistrationSettingsUpdate, admin=Depends(current_admin)):
    data = payload.model_dump(exclude_none=True)
    if "default_quotas" in data:
        for key in data["default_quotas"]:
            if key not in {"text", "image", "video"}:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown quota type")
    store.registration_settings.update(data)
    _log_admin_operation(admin["id"], "update_registration_settings", "registration_settings", "default", "Updated registration settings")
    return store.registration_settings


@router.get("/invitation-codes")
def list_invitation_codes(_admin=Depends(current_admin)):
    return {"items": list(store.invitation_codes.values())}


@router.post("/invitation-codes")
def create_invitation_code(payload: InvitationCodeCreate, admin=Depends(current_admin)):
    invitation = store.create_invitation_code(
        payload.code,
        payload.max_uses,
        payload.expires_at,
        payload.quota_package_id,
        admin["id"],
    )
    _log_admin_operation(admin["id"], "create_invitation_code", "invitation_code", payload.code, f"Created invitation code {payload.code}")
    return invitation


@router.patch("/invitation-codes/{code}/disable")
def disable_invitation_code(code: str, admin=Depends(current_admin)):
    invitation = store.invitation_codes.get(code)
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation code not found")
    invitation["status"] = "disabled"
    _log_admin_operation(admin["id"], "disable_invitation_code", "invitation_code", code, f"Disabled invitation code {code}")
    return invitation


@router.get("/users/{user_id}/quotas")
def get_user_quotas(user_id: str, _admin=Depends(current_admin)):
    quotas = quota_controller.get_quota_balances(user_id)
    if quotas is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"user_id": user_id, "quotas": quotas}


@router.get("/users/{user_id}/quotas/ledger")
def get_user_quota_ledger(user_id: str, _admin=Depends(current_admin)):
    if quota_controller.get_quota_balances(user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    ledger = quota_controller.list_quota_ledger(user_id)
    return {"user_id": user_id, "ledger": ledger}


@router.post("/users/{user_id}/quotas/grant")
def grant_user_quota(user_id: str, payload: QuotaGrantRequest, admin=Depends(current_admin)):
    if quota_controller.get_quota_balances(user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    record = store.grant_quota(user_id, payload.quota_type, payload.amount, "admin_grant", admin["id"])
    record["note"] = payload.reason
    _log_admin_operation(
        admin["id"],
        "grant_quota",
        "user",
        user_id,
        f"Granted {payload.amount} {payload.quota_type} quota to user {user_id}: {payload.reason}",
    )
    return {"quotas": quota_controller.get_quota_balances(user_id), "ledger": record}


@router.get("/quota-ledger")
def list_quota_ledger(_admin=Depends(current_admin)):
    return {"items": quota_controller.list_quota_ledger()}


@router.get("/assets")
def list_all_assets(_admin=Depends(current_admin)):
    return {"items": list(store.assets.values())}


@router.get("/projects")
def list_all_projects(_admin=Depends(current_admin)):
    return {"items": store.list_all_projects()}


@router.get("/users/{user_id}")
def get_user_detail(user_id: str, _admin=Depends(current_admin)):
    detail = store.get_user_detail(user_id)
    if detail is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return detail


@router.get("/logs")
def list_admin_logs(_admin=Depends(current_admin)):
    items = sorted(store.admin_logs, key=lambda record: record.get("created_at", ""), reverse=True)
    return {"items": items[:100]}


@router.patch("/assets/{asset_id}/hide")
def hide_asset(asset_id: str, admin=Depends(current_admin)):
    asset = store.hide_asset(asset_id)
    if asset is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    _log_admin_operation(admin["id"], "hide_asset", "asset", asset_id, f"Hid asset {asset_id}")
    return asset
