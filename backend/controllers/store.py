from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import uuid4


def now_iso() -> str:
    return datetime.now(UTC).isoformat()


class InMemoryStore:
    def __init__(self) -> None:
        self.users: dict[str, dict] = {}
        self.identities: dict[str, dict] = {}
        self.guests: dict[str, dict] = {}
        self.assets: dict[str, dict] = {}
        self.registration_settings = {
            "wechat_login_enabled": True,
            "registration_mode": "invite_only",
            "default_quotas": {"text": 100, "image": 20, "video": 3},
        }
        self.invitation_codes: dict[str, dict] = {}
        self.quotas: dict[str, dict[str, int]] = {}
        self.quota_ledger: list[dict] = []
        self.admin_logs: list[dict] = []
        self._seed_admin()

    def _seed_admin(self) -> None:
        admin = self.create_user("Admin", "", role="admin")
        self.grant_quota(admin["id"], "text", 9999, "default_grant", None)
        self.grant_quota(admin["id"], "image", 9999, "default_grant", None)
        self.grant_quota(admin["id"], "video", 9999, "default_grant", None)

    def create_user(self, nickname: str, avatar_url: str, role: str = "user") -> dict:
        user_id = str(uuid4())
        user = {
            "id": user_id,
            "nickname": nickname,
            "avatar_url": avatar_url,
            "role": role,
            "status": "active",
            "generation_status": "enabled",
            "created_at": now_iso(),
            "updated_at": now_iso(),
            "last_login_at": now_iso(),
        }
        self.users[user_id] = user
        self.quotas[user_id] = {"text": 0, "image": 0, "video": 0}
        return user

    def get_user(self, user_id: str) -> dict | None:
        return self.users.get(user_id)

    def bind_identity(self, user_id: str, provider: str, provider_user_id: str, unionid: str | None, raw_profile: dict) -> dict:
        key = f"{provider}:{provider_user_id}"
        identity = {
            "id": str(uuid4()),
            "user_id": user_id,
            "provider": provider,
            "provider_user_id": provider_user_id,
            "unionid": unionid,
            "raw_profile": raw_profile,
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }
        self.identities[key] = identity
        return identity

    def find_identity(self, provider: str, provider_user_id: str) -> dict | None:
        return self.identities.get(f"{provider}:{provider_user_id}")

    def touch_login(self, user_id: str) -> None:
        if user_id in self.users:
            self.users[user_id]["last_login_at"] = now_iso()
            self.users[user_id]["updated_at"] = now_iso()

    def create_guest(self) -> dict:
        guest = {
            "id": str(uuid4()),
            "session_id": str(uuid4()),
            "local_project_snapshot": {},
            "created_at": now_iso(),
            "expires_at": (datetime.now(UTC) + timedelta(days=7)).isoformat(),
            "converted_user_id": None,
        }
        self.guests[guest["session_id"]] = guest
        return guest

    def create_invitation_code(self, code: str, max_uses: int, expires_at: str | None, quota_package_id: str | None, admin_id: str) -> dict:
        invitation = {
            "id": str(uuid4()),
            "code": code,
            "status": "active",
            "max_uses": max_uses,
            "used_count": 0,
            "expires_at": expires_at,
            "quota_package_id": quota_package_id,
            "created_by_admin_id": admin_id,
            "created_at": now_iso(),
        }
        self.invitation_codes[code] = invitation
        return invitation

    def use_invitation_code(self, code: str | None) -> bool:
        if self.registration_settings["registration_mode"] != "invite_only":
            return True
        if not code:
            return False
        invitation = self.invitation_codes.get(code)
        if not invitation or invitation["status"] != "active":
            return False
        if invitation["used_count"] >= invitation["max_uses"]:
            return False
        if invitation["expires_at"] and invitation["expires_at"] < now_iso():
            return False
        invitation["used_count"] += 1
        return True

    def grant_default_quotas(self, user_id: str) -> None:
        for quota_type, amount in self.registration_settings["default_quotas"].items():
            self.grant_quota(user_id, quota_type, amount, "default_grant", None)

    def grant_quota(self, user_id: str, quota_type: str, amount: int, reason: str, admin_id: str | None) -> dict:
        self.quotas.setdefault(user_id, {"text": 0, "image": 0, "video": 0})
        self.quotas[user_id][quota_type] += amount
        record = {
            "id": str(uuid4()),
            "user_id": user_id,
            "quota_type": quota_type,
            "change_amount": amount,
            "reason": reason,
            "related_task_id": None,
            "admin_id": admin_id,
            "created_at": now_iso(),
        }
        self.quota_ledger.append(record)
        return record

    def create_asset(self, user_id: str, asset_type: str, url: str | None, content_text: str | None) -> dict:
        asset = {
            "id": str(uuid4()),
            "user_id": user_id,
            "project_id": None,
            "canvas_node_id": None,
            "type": asset_type,
            "url": url,
            "content_text": content_text,
            "source": "upload",
            "source_model": None,
            "source_task_id": None,
            "status": "active",
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }
        self.assets[asset["id"]] = asset
        return asset


store = InMemoryStore()
