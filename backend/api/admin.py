from fastapi import APIRouter, Depends, HTTPException, status

from controllers.store import store
from core.security import create_token, current_admin
from schemas.admin import InvitationCodeCreate, QuotaGrantRequest, RegistrationSettingsUpdate
from settings.config import settings


router = APIRouter(prefix="/admin", tags=["admin"])


def _log_admin_operation(
    admin_id: str,
    action: str,
    target_type: str,
    target_id: str,
    detail: str | None = None,
) -> None:
    store.log_admin_operation(admin_id, action, target_type, target_id, detail)


@router.post("/dev-login")
def dev_admin_login(admin_key: str):
    if admin_key != settings.dev_admin_key:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid admin key")
    admin = next(user for user in store.users.values() if user["role"] == "admin")
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
    if user_id not in store.quotas:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"user_id": user_id, "quotas": store.quotas[user_id]}


@router.get("/users/{user_id}/quotas/ledger")
def get_user_quota_ledger(user_id: str, _admin=Depends(current_admin)):
    if user_id not in store.quotas:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    ledger = [record for record in store.quota_ledger if record["user_id"] == user_id]
    ledger.sort(key=lambda record: record.get("created_at", ""), reverse=True)
    return {"user_id": user_id, "ledger": ledger}


@router.post("/users/{user_id}/quotas/grant")
def grant_user_quota(user_id: str, payload: QuotaGrantRequest, admin=Depends(current_admin)):
    if user_id not in store.quotas:
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
    return {"quotas": store.quotas[user_id], "ledger": record}


@router.get("/quota-ledger")
def list_quota_ledger(_admin=Depends(current_admin)):
    return {"items": store.quota_ledger}


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
