from __future__ import annotations

from collections.abc import Callable
from copy import deepcopy
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from sqlalchemy import func, select

from models.admin_log import AdminLog
from models.asset import Asset
from models.base import StoreConfig, get_session
from models.canvas_node import CanvasNode
from models.guest import Guest
from models.identity import Identity
from models.invitation import InvitationCode
from models.project import Project
from models.quota import Quota, QuotaLedger
from models.template import Template
from models.user import User


def now_iso() -> str:
    return datetime.now(UTC).isoformat()


def now_utc() -> datetime:
    return datetime.now(UTC)


def parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value)


def datetime_to_iso(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.isoformat()


def is_expired(expires_at: str | None) -> bool:
    expiration = parse_iso(expires_at)
    if expiration is None:
        return False
    if expiration.tzinfo is None:
        expiration = expiration.replace(tzinfo=UTC)
    return expiration < now_utc()


DEFAULT_REGISTRATION_SETTINGS = {
    "wechat_login_enabled": True,
    "registration_mode": "invite_only",
    "default_quotas": {"text": 100, "image": 20, "video": 3},
}


class PersistentDict(dict):
    def __init__(self, initial: dict, on_change: Callable[[dict], None]) -> None:
        super().__init__(initial)
        self._on_change = on_change

    def __setitem__(self, key, value) -> None:
        super().__setitem__(key, value)
        self._on_change(dict(self))

    def update(self, *args, **kwargs) -> None:
        super().update(*args, **kwargs)
        self._on_change(dict(self))

    def replace_local(self, payload: dict) -> None:
        super().clear()
        super().update(payload)


class InMemoryStore:
    def __init__(self) -> None:
        self.users: dict[str, dict] = {}
        self.identities: dict[str, dict] = {}
        self.guests: dict[str, dict] = {}
        self.assets: dict[str, dict] = {}
        self.canvas_nodes: dict[str, dict] = {}
        self.projects: dict[str, dict] = {}
        self.templates: dict[str, dict] = {}
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
        if is_expired(invitation["expires_at"]):
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

    def create_asset(
        self,
        user_id: str,
        asset_type: str,
        url: str | None,
        content_text: str | None,
        *,
        project_id: str | None = None,
        canvas_node_id: str | None = None,
        source: str = "upload",
        source_model: str | None = None,
        source_task_id: str | None = None,
        status: str = "active",
    ) -> dict:
        timestamp = now_iso()
        asset = {
            "id": str(uuid4()),
            "user_id": user_id,
            "project_id": project_id,
            "canvas_node_id": canvas_node_id,
            "type": asset_type,
            "url": url,
            "content_text": content_text,
            "source": source,
            "source_model": source_model,
            "source_task_id": source_task_id,
            "status": status,
            "created_at": timestamp,
            "updated_at": timestamp,
        }
        self.assets[asset["id"]] = asset
        return asset

    def create_project(self, user_id: str, name: str) -> dict:
        timestamp = now_iso()
        project = {
            "id": str(uuid4()),
            "user_id": user_id,
            "name": name,
            "created_at": timestamp,
            "updated_at": timestamp,
        }
        self.projects[project["id"]] = project
        return project

    def create_template(self, user_id: str, name: str, project_id: str) -> dict:
        project = self.projects.get(project_id)
        if project is None or project["user_id"] != user_id:
            raise PermissionError("Project does not belong to user")

        node_data = [deepcopy(node) for node in self.list_nodes(project_id, user_id)]
        template = {
            "id": str(uuid4()),
            "name": name,
            "user_id": user_id,
            "node_data": node_data,
            "node_count": len(node_data),
            "created_at": now_iso(),
        }
        self.templates[template["id"]] = template
        return template

    def list_templates(self, user_id: str) -> list[dict]:
        items = [template for template in self.templates.values() if template["user_id"] == user_id]
        items.sort(key=lambda template: template["created_at"], reverse=True)
        return items

    def get_template(self, template_id: str) -> dict | None:
        return self.templates.get(template_id)

    def delete_template(self, template_id: str, user_id: str) -> dict | None:
        template = self.templates.get(template_id)
        if template is None:
            return None
        if template["user_id"] != user_id:
            raise PermissionError("Template does not belong to user")
        return self.templates.pop(template_id)

    def use_template(self, template_id: str, user_id: str) -> dict:
        template = self.templates.get(template_id)
        if template is None:
            raise KeyError(f'Template "{template_id}" not found')
        if template["user_id"] != user_id:
            raise PermissionError("Template does not belong to user")

        project = self.create_project(user_id, template["name"])
        nodes_created = 0
        for node in template["node_data"]:
            self.create_node(
                project["id"],
                user_id,
                node["node_type"],
                deepcopy(node["content"]),
                node["position_x"],
                node["position_y"],
                node["width"],
                node["height"],
            )
            nodes_created += 1

        return {
            "template": template,
            "project_id": project["id"],
            "project_name": project["name"],
            "nodes_created": nodes_created,
        }

    def create_node(
        self,
        project_id: str,
        user_id: str,
        node_type: str,
        content: dict,
        position_x: float,
        position_y: float,
        width: int,
        height: int,
    ) -> dict:
        project = self.projects.get(project_id)
        if project is None or project["user_id"] != user_id:
            raise PermissionError("Project does not belong to user")

        timestamp = now_iso()
        node = {
            "id": str(uuid4()),
            "project_id": project_id,
            "node_type": node_type,
            "content": content,
            "position_x": position_x,
            "position_y": position_y,
            "width": width,
            "height": height,
            "status": "active",
            "created_at": timestamp,
            "updated_at": timestamp,
        }
        self.canvas_nodes[node["id"]] = node
        return node

    def list_nodes(self, project_id: str, user_id: str) -> list[dict]:
        project = self.projects.get(project_id)
        if project is None or project["user_id"] != user_id:
            raise PermissionError("Project does not belong to user")

        items = [
            node
            for node in self.canvas_nodes.values()
            if node["project_id"] == project_id and node["status"] != "deleted"
        ]
        items.sort(key=lambda node: node["position_x"])
        return items

    def get_node(self, node_id: str) -> dict | None:
        node = self.canvas_nodes.get(node_id)
        if node is None or node["status"] == "deleted":
            return None
        return node

    def update_node(self, node_id: str, user_id: str, **fields) -> dict | None:
        node = self.canvas_nodes.get(node_id)
        if node is None or node["status"] == "deleted":
            return None

        project = self.projects.get(node["project_id"])
        if project is None or project["user_id"] != user_id:
            raise PermissionError("Project does not belong to user")

        for key, value in fields.items():
            node[key] = value
        node["updated_at"] = now_iso()
        return node

    def delete_node(self, node_id: str, user_id: str) -> dict | None:
        node = self.canvas_nodes.get(node_id)
        if node is None or node["status"] == "deleted":
            return None

        project = self.projects.get(node["project_id"])
        if project is None or project["user_id"] != user_id:
            raise PermissionError("Project does not belong to user")

        node["status"] = "deleted"
        node["updated_at"] = now_iso()
        return node

    def list_projects(self, user_id: str) -> list[dict]:
        items = [project for project in self.projects.values() if project["user_id"] == user_id]
        items.sort(key=lambda project: project["created_at"], reverse=True)
        return items

    def list_all_projects(self) -> list[dict]:
        items = []
        for project in self.projects.values():
            user = self.users.get(project["user_id"])
            node_count = sum(
                1
                for node in self.canvas_nodes.values()
                if node["project_id"] == project["id"] and node["status"] != "deleted"
            )
            items.append(
                {
                    **project,
                    "user_nickname": user["nickname"] if user else None,
                    "node_count": node_count,
                }
            )
        items.sort(key=lambda project: project["created_at"], reverse=True)
        return items

    def get_user_detail(self, user_id: str) -> dict | None:
        user = self.users.get(user_id)
        if user is None:
            return None

        quotas = deepcopy(self.quotas.get(user_id, {"text": 0, "image": 0, "video": 0}))
        asset_count = sum(
            1
            for asset in self.assets.values()
            if asset["user_id"] == user_id and asset["status"] != "deleted"
        )
        project_count = sum(1 for project in self.projects.values() if project["user_id"] == user_id)

        return {
            **user,
            "quotas": quotas,
            "asset_count": asset_count,
            "project_count": project_count,
        }

    def log_admin_operation(
        self,
        admin_id: str,
        action: str,
        target_type: str,
        target_id: str,
        detail: str | None = None,
    ) -> dict:
        entry = {
            "id": str(uuid4()),
            "admin_id": admin_id,
            "action": action,
            "target_type": target_type,
            "target_id": target_id,
            "detail": {"message": detail} if detail is not None else {},
            "created_at": now_iso(),
        }
        self.admin_logs.append(entry)
        return entry

    def get_project(self, project_id: str) -> dict | None:
        return self.projects.get(project_id)

    def delete_project(self, project_id: str, user_id: str) -> dict | None:
        project = self.projects.get(project_id)
        if project is None:
            return None
        if project["user_id"] != user_id:
            raise PermissionError("Project does not belong to user")
        return self.projects.pop(project_id)

    def list_assets(
        self,
        user_id: str,
        asset_type: str | None = None,
        project_id: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[dict], int]:
        items = [
            asset
            for asset in self.assets.values()
            if asset["user_id"] == user_id and asset["status"] == "active"
        ]
        if asset_type:
            items = [asset for asset in items if asset["type"] == asset_type]
        if project_id:
            items = [asset for asset in items if asset["project_id"] == project_id]
        items.sort(key=lambda asset: asset["created_at"], reverse=True)
        total = len(items)
        start = (page - 1) * page_size
        end = start + page_size
        return items[start:end], total

    def get_asset(self, asset_id: str) -> dict | None:
        return self.assets.get(asset_id)

    def delete_asset(self, asset_id: str, user_id: str) -> dict | None:
        asset = self.assets.get(asset_id)
        if asset is None:
            return None
        if asset["user_id"] != user_id:
            raise PermissionError("Asset does not belong to user")
        asset["status"] = "deleted"
        asset["updated_at"] = now_iso()
        return asset

    def hide_asset(self, asset_id: str) -> dict | None:
        asset = self.assets.get(asset_id)
        if asset is None:
            return None
        asset["status"] = "hidden"
        asset["updated_at"] = now_iso()
        return asset


class DatabaseStore:
    def __init__(self) -> None:
        self.users: dict[str, PersistentDict] = {}
        self.identities: dict[str, dict] = {}
        self.guests: dict[str, dict] = {}
        self.assets: dict[str, dict] = {}
        self.canvas_nodes: dict[str, dict] = {}
        self.projects: dict[str, dict] = {}
        self.templates: dict[str, dict] = {}
        self.invitation_codes: dict[str, PersistentDict] = {}
        self.quotas: dict[str, PersistentDict] = {}
        self.quota_ledger: list[dict] = []
        self.admin_logs: list[dict] = []
        self.registration_settings = PersistentDict(
            DEFAULT_REGISTRATION_SETTINGS,
            self._persist_registration_settings,
        )
        self._load_state()
        self._seed_admin_if_missing()

    def _load_state(self) -> None:
        with get_session() as session:
            self.registration_settings.replace_local(self._load_registration_settings(session))
            self.users = {
                user.id: PersistentDict(self._user_to_dict(user), self._persist_user)
                for user in session.scalars(select(User)).all()
            }
            self.identities = {
                f"{identity.provider}:{identity.provider_user_id}": self._identity_to_dict(identity)
                for identity in session.scalars(select(Identity)).all()
            }
            self.guests = {
                guest.session_id: self._guest_to_dict(guest)
                for guest in session.scalars(select(Guest)).all()
            }
            self.assets = {
                asset.id: self._asset_to_dict(asset)
                for asset in session.scalars(select(Asset)).all()
            }
            self.canvas_nodes = {
                node.id: self._canvas_node_to_dict(node)
                for node in session.scalars(select(CanvasNode)).all()
            }
            self.projects = {
                project.id: self._project_to_dict(project)
                for project in session.scalars(select(Project)).all()
            }
            self.templates = {
                template.id: self._template_to_dict(template)
                for template in session.scalars(select(Template)).all()
            }
            self.invitation_codes = {
                invitation.code: PersistentDict(
                    self._invitation_to_dict(invitation),
                    self._persist_invitation,
                )
                for invitation in session.scalars(select(InvitationCode)).all()
            }
            self.quotas = {
                quota.user_id: PersistentDict(
                    self._quota_to_dict(quota),
                    lambda payload, user_id=quota.user_id: self._persist_quota(user_id, payload),
                )
                for quota in session.scalars(select(Quota)).all()
            }
            self.quota_ledger = [self._quota_ledger_to_dict(record) for record in session.scalars(select(QuotaLedger)).all()]
            self.admin_logs = [self._admin_log_to_dict(record) for record in session.scalars(select(AdminLog)).all()]

    def _seed_admin_if_missing(self) -> None:
        if any(user["role"] == "admin" for user in self.users.values()):
            return
        admin = self.create_user("Admin", "", role="admin")
        self.grant_quota(admin["id"], "text", 9999, "default_grant", None)
        self.grant_quota(admin["id"], "image", 9999, "default_grant", None)
        self.grant_quota(admin["id"], "video", 9999, "default_grant", None)

    def _load_registration_settings(self, session) -> dict:
        config = session.get(StoreConfig, "registration_settings")
        if config is None:
            config = StoreConfig(key="registration_settings", value=DEFAULT_REGISTRATION_SETTINGS)
            session.add(config)
            session.commit()
            return {
                "wechat_login_enabled": DEFAULT_REGISTRATION_SETTINGS["wechat_login_enabled"],
                "registration_mode": DEFAULT_REGISTRATION_SETTINGS["registration_mode"],
                "default_quotas": dict(DEFAULT_REGISTRATION_SETTINGS["default_quotas"]),
            }
        return {
            "wechat_login_enabled": config.value.get("wechat_login_enabled", True),
            "registration_mode": config.value.get("registration_mode", "invite_only"),
            "default_quotas": dict(config.value.get("default_quotas", DEFAULT_REGISTRATION_SETTINGS["default_quotas"])),
        }

    def _persist_registration_settings(self, payload: dict) -> None:
        with get_session() as session:
            config = session.get(StoreConfig, "registration_settings")
            if config is None:
                config = StoreConfig(key="registration_settings", value=dict(payload))
                session.add(config)
            else:
                config.value = dict(payload)
                config.updated_at = now_utc()
            session.commit()

    def _persist_user(self, payload: dict) -> None:
        with get_session() as session:
            user = session.get(User, payload["id"])
            if user is None:
                raise KeyError(f'User "{payload["id"]}" not found')
            user.nickname = payload["nickname"]
            user.avatar_url = payload["avatar_url"]
            user.role = payload["role"]
            user.status = payload["status"]
            user.generation_status = payload["generation_status"]
            user.created_at = parse_iso(payload["created_at"]) or now_utc()
            user.updated_at = parse_iso(payload["updated_at"]) or now_utc()
            user.last_login_at = parse_iso(payload["last_login_at"]) or now_utc()
            session.commit()

    def _persist_invitation(self, payload: dict) -> None:
        with get_session() as session:
            invitation = session.get(InvitationCode, payload["id"])
            if invitation is None:
                raise KeyError(f'Invitation "{payload["id"]}" not found')
            invitation.code = payload["code"]
            invitation.status = payload["status"]
            invitation.max_uses = payload["max_uses"]
            invitation.used_count = payload["used_count"]
            invitation.expires_at = parse_iso(payload["expires_at"])
            invitation.quota_package_id = payload["quota_package_id"]
            invitation.created_by_admin_id = payload["created_by_admin_id"]
            invitation.created_at = parse_iso(payload["created_at"]) or now_utc()
            session.commit()

    def _persist_quota(self, user_id: str, payload: dict) -> None:
        with get_session() as session:
            quota = session.scalar(select(Quota).where(Quota.user_id == user_id))
            if quota is None:
                raise KeyError(f'Quota "{user_id}" not found')
            quota.text_quota = payload["text"]
            quota.image_quota = payload["image"]
            quota.video_quota = payload["video"]
            session.commit()

    def _user_to_dict(self, user: User) -> dict:
        return {
            "id": user.id,
            "nickname": user.nickname,
            "avatar_url": user.avatar_url,
            "role": user.role,
            "status": user.status,
            "generation_status": user.generation_status,
            "created_at": datetime_to_iso(user.created_at),
            "updated_at": datetime_to_iso(user.updated_at),
            "last_login_at": datetime_to_iso(user.last_login_at),
        }

    def _identity_to_dict(self, identity: Identity) -> dict:
        return {
            "id": identity.id,
            "user_id": identity.user_id,
            "provider": identity.provider,
            "provider_user_id": identity.provider_user_id,
            "unionid": identity.unionid,
            "raw_profile": identity.raw_profile,
            "created_at": datetime_to_iso(identity.created_at),
            "updated_at": datetime_to_iso(identity.updated_at),
        }

    def _guest_to_dict(self, guest: Guest) -> dict:
        return {
            "id": guest.id,
            "session_id": guest.session_id,
            "local_project_snapshot": guest.local_project_snapshot,
            "created_at": datetime_to_iso(guest.created_at),
            "expires_at": datetime_to_iso(guest.expires_at),
            "converted_user_id": guest.converted_user_id,
        }

    def _asset_to_dict(self, asset: Asset) -> dict:
        return {
            "id": asset.id,
            "user_id": asset.user_id,
            "project_id": asset.project_id,
            "canvas_node_id": asset.canvas_node_id,
            "type": asset.type,
            "url": asset.url,
            "content_text": asset.content_text,
            "source": asset.source,
            "source_model": asset.source_model,
            "source_task_id": asset.source_task_id,
            "status": asset.status,
            "created_at": datetime_to_iso(asset.created_at),
            "updated_at": datetime_to_iso(asset.updated_at),
        }

    def _quota_to_dict(self, quota: Quota) -> dict:
        return {
            "text": quota.text_quota,
            "image": quota.image_quota,
            "video": quota.video_quota,
        }

    def _canvas_node_to_dict(self, node: CanvasNode) -> dict:
        return {
            "id": node.id,
            "project_id": node.project_id,
            "node_type": node.node_type,
            "content": node.content,
            "position_x": node.position_x,
            "position_y": node.position_y,
            "width": node.width,
            "height": node.height,
            "status": node.status,
            "created_at": datetime_to_iso(node.created_at),
            "updated_at": datetime_to_iso(node.updated_at),
        }

    def _project_to_dict(self, project: Project) -> dict:
        return {
            "id": project.id,
            "user_id": project.user_id,
            "name": project.name,
            "created_at": datetime_to_iso(project.created_at),
            "updated_at": datetime_to_iso(project.updated_at),
        }

    def _template_to_dict(self, template: Template) -> dict:
        return {
            "id": template.id,
            "user_id": template.user_id,
            "name": template.name,
            "node_data": deepcopy(template.node_data),
            "node_count": template.node_count,
            "created_at": datetime_to_iso(template.created_at),
        }

    def _quota_ledger_to_dict(self, record: QuotaLedger) -> dict:
        return {
            "id": record.id,
            "user_id": record.user_id,
            "quota_type": record.quota_type,
            "change_amount": record.change_amount,
            "reason": record.reason,
            "related_task_id": record.related_task_id,
            "admin_id": record.admin_id,
            "created_at": datetime_to_iso(record.created_at),
        }

    def _invitation_to_dict(self, invitation: InvitationCode) -> dict:
        return {
            "id": invitation.id,
            "code": invitation.code,
            "status": invitation.status,
            "max_uses": invitation.max_uses,
            "used_count": invitation.used_count,
            "expires_at": datetime_to_iso(invitation.expires_at),
            "quota_package_id": invitation.quota_package_id,
            "created_by_admin_id": invitation.created_by_admin_id,
            "created_at": datetime_to_iso(invitation.created_at),
        }

    def _admin_log_to_dict(self, record: AdminLog) -> dict:
        return {
            "id": record.id,
            "admin_id": record.admin_id,
            "action": record.action,
            "target_type": record.target_type,
            "target_id": record.target_id,
            "detail": record.detail,
            "created_at": datetime_to_iso(record.created_at),
        }

    def create_user(self, nickname: str, avatar_url: str, role: str = "user") -> dict:
        user_id = str(uuid4())
        timestamp = now_utc()
        user = User(
            id=user_id,
            nickname=nickname,
            avatar_url=avatar_url,
            role=role,
            status="active",
            generation_status="enabled",
            created_at=timestamp,
            updated_at=timestamp,
            last_login_at=timestamp,
        )
        quota = Quota(
            id=str(uuid4()),
            user_id=user_id,
            text_quota=0,
            image_quota=0,
            video_quota=0,
        )
        with get_session() as session:
            session.add(user)
            session.add(quota)
            session.commit()
        user_payload = PersistentDict(self._user_to_dict(user), self._persist_user)
        quota_payload = PersistentDict(
            self._quota_to_dict(quota),
            lambda payload, key=user_id: self._persist_quota(key, payload),
        )
        self.users[user_id] = user_payload
        self.quotas[user_id] = quota_payload
        return user_payload

    def get_user(self, user_id: str) -> dict | None:
        return self.users.get(user_id)

    def bind_identity(self, user_id: str, provider: str, provider_user_id: str, unionid: str | None, raw_profile: dict) -> dict:
        timestamp = now_utc()
        identity = Identity(
            id=str(uuid4()),
            user_id=user_id,
            provider=provider,
            provider_user_id=provider_user_id,
            unionid=unionid,
            raw_profile=raw_profile,
            created_at=timestamp,
            updated_at=timestamp,
        )
        with get_session() as session:
            session.add(identity)
            session.commit()
        payload = self._identity_to_dict(identity)
        self.identities[f"{provider}:{provider_user_id}"] = payload
        return payload

    def find_identity(self, provider: str, provider_user_id: str) -> dict | None:
        return self.identities.get(f"{provider}:{provider_user_id}")

    def touch_login(self, user_id: str) -> None:
        user = self.users.get(user_id)
        if not user:
            return
        payload = dict(user)
        payload["last_login_at"] = now_iso()
        payload["updated_at"] = now_iso()
        self._persist_user(payload)
        user.replace_local(payload)

    def create_guest(self) -> dict:
        guest = Guest(
            id=str(uuid4()),
            session_id=str(uuid4()),
            local_project_snapshot={},
            created_at=now_utc(),
            expires_at=now_utc() + timedelta(days=7),
            converted_user_id=None,
        )
        with get_session() as session:
            session.add(guest)
            session.commit()
        payload = self._guest_to_dict(guest)
        self.guests[guest.session_id] = payload
        return payload

    def create_invitation_code(self, code: str, max_uses: int, expires_at: str | None, quota_package_id: str | None, admin_id: str) -> dict:
        invitation = InvitationCode(
            id=str(uuid4()),
            code=code,
            status="active",
            max_uses=max_uses,
            used_count=0,
            expires_at=parse_iso(expires_at),
            quota_package_id=quota_package_id,
            created_by_admin_id=admin_id,
            created_at=now_utc(),
        )
        with get_session() as session:
            session.add(invitation)
            session.commit()
        payload = PersistentDict(self._invitation_to_dict(invitation), self._persist_invitation)
        self.invitation_codes[code] = payload
        return payload

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
        if is_expired(invitation["expires_at"]):
            return False
        invitation["used_count"] += 1
        return True

    def grant_default_quotas(self, user_id: str) -> None:
        for quota_type, amount in self.registration_settings["default_quotas"].items():
            self.grant_quota(user_id, quota_type, amount, "default_grant", None)

    def grant_quota(self, user_id: str, quota_type: str, amount: int, reason: str, admin_id: str | None) -> dict:
        quota_bucket = self.quotas.get(user_id)
        if quota_bucket is None:
            quota_row = Quota(
                id=str(uuid4()),
                user_id=user_id,
                text_quota=0,
                image_quota=0,
                video_quota=0,
            )
            with get_session() as session:
                session.add(quota_row)
                session.commit()
            quota_bucket = PersistentDict(
                self._quota_to_dict(quota_row),
                lambda payload, key=user_id: self._persist_quota(key, payload),
            )
            self.quotas[user_id] = quota_bucket

        quota_bucket[quota_type] += amount
        record = QuotaLedger(
            id=str(uuid4()),
            user_id=user_id,
            quota_type=quota_type,
            change_amount=amount,
            reason=reason,
            related_task_id=None,
            admin_id=admin_id,
            created_at=now_utc(),
        )
        with get_session() as session:
            session.add(record)
            session.commit()
        payload = self._quota_ledger_to_dict(record)
        self.quota_ledger.append(payload)
        return payload

    def create_asset(
        self,
        user_id: str,
        asset_type: str,
        url: str | None,
        content_text: str | None,
        *,
        project_id: str | None = None,
        canvas_node_id: str | None = None,
        source: str = "upload",
        source_model: str | None = None,
        source_task_id: str | None = None,
        status: str = "active",
    ) -> dict:
        timestamp = now_utc()
        asset = Asset(
            id=str(uuid4()),
            user_id=user_id,
            project_id=project_id,
            canvas_node_id=canvas_node_id,
            type=asset_type,
            url=url,
            content_text=content_text,
            source=source,
            source_model=source_model,
            source_task_id=source_task_id,
            status=status,
            created_at=timestamp,
            updated_at=timestamp,
        )
        with get_session() as session:
            session.add(asset)
            session.commit()
        payload = self._asset_to_dict(asset)
        self.assets[asset.id] = payload
        return payload

    def create_project(self, user_id: str, name: str) -> dict:
        timestamp = now_utc()
        project = Project(
            id=str(uuid4()),
            user_id=user_id,
            name=name,
            created_at=timestamp,
            updated_at=timestamp,
        )
        with get_session() as session:
            session.add(project)
            session.commit()
        payload = self._project_to_dict(project)
        self.projects[project.id] = payload
        return payload

    def create_template(self, user_id: str, name: str, project_id: str) -> dict:
        project = self.get_project(project_id)
        if project is None or project["user_id"] != user_id:
            raise PermissionError("Project does not belong to user")

        node_data = [deepcopy(node) for node in self.list_nodes(project_id, user_id)]
        template = Template(
            id=str(uuid4()),
            user_id=user_id,
            name=name,
            node_data=node_data,
            node_count=len(node_data),
            created_at=now_utc(),
        )
        with get_session() as session:
            session.add(template)
            session.commit()

        payload = self._template_to_dict(template)
        self.templates[template.id] = payload
        return payload

    def list_templates(self, user_id: str) -> list[dict]:
        statement = select(Template).where(Template.user_id == user_id)
        with get_session() as session:
            templates = [self._template_to_dict(template) for template in session.scalars(statement).all()]

        templates.sort(key=lambda template: template["created_at"], reverse=True)
        for template in templates:
            self.templates[template["id"]] = template
        return templates

    def get_template(self, template_id: str) -> dict | None:
        template = self.templates.get(template_id)
        if template is not None:
            return template

        with get_session() as session:
            row = session.get(Template, template_id)
            if row is None:
                return None
            payload = self._template_to_dict(row)

        self.templates[template_id] = payload
        return payload

    def delete_template(self, template_id: str, user_id: str) -> dict | None:
        with get_session() as session:
            template = session.get(Template, template_id)
            if template is None:
                return None
            if template.user_id != user_id:
                raise PermissionError("Template does not belong to user")
            payload = self._template_to_dict(template)
            session.delete(template)
            session.commit()

        self.templates.pop(template_id, None)
        return payload

    def use_template(self, template_id: str, user_id: str) -> dict:
        template = self.get_template(template_id)
        if template is None:
            raise KeyError(f'Template "{template_id}" not found')
        if template["user_id"] != user_id:
            raise PermissionError("Template does not belong to user")

        project = self.create_project(user_id, template["name"])
        nodes_created = 0
        for node in template["node_data"]:
            self.create_node(
                project["id"],
                user_id,
                node["node_type"],
                deepcopy(node["content"]),
                node["position_x"],
                node["position_y"],
                node["width"],
                node["height"],
            )
            nodes_created += 1

        return {
            "template": template,
            "project_id": project["id"],
            "project_name": project["name"],
            "nodes_created": nodes_created,
        }

    def create_node(
        self,
        project_id: str,
        user_id: str,
        node_type: str,
        content: dict,
        position_x: float,
        position_y: float,
        width: int,
        height: int,
    ) -> dict:
        project = self.get_project(project_id)
        if project is None or project["user_id"] != user_id:
            raise PermissionError("Project does not belong to user")

        timestamp = now_utc()
        node = CanvasNode(
            id=str(uuid4()),
            project_id=project_id,
            node_type=node_type,
            content=content,
            position_x=position_x,
            position_y=position_y,
            width=width,
            height=height,
            status="active",
            created_at=timestamp,
            updated_at=timestamp,
        )
        with get_session() as session:
            session.add(node)
            session.commit()

        payload = self._canvas_node_to_dict(node)
        self.canvas_nodes[node.id] = payload
        return payload

    def list_nodes(self, project_id: str, user_id: str) -> list[dict]:
        project = self.get_project(project_id)
        if project is None or project["user_id"] != user_id:
            raise PermissionError("Project does not belong to user")

        statement = select(CanvasNode).where(
            CanvasNode.project_id == project_id,
            CanvasNode.status != "deleted",
        )
        with get_session() as session:
            items = [self._canvas_node_to_dict(node) for node in session.scalars(statement).all()]

        items.sort(key=lambda node: node["position_x"])
        for item in items:
            self.canvas_nodes[item["id"]] = item
        return items

    def get_node(self, node_id: str) -> dict | None:
        node = self.canvas_nodes.get(node_id)
        if node is not None:
            if node["status"] == "deleted":
                return None
            return node

        with get_session() as session:
            row = session.get(CanvasNode, node_id)
            if row is None or row.status == "deleted":
                return None
            payload = self._canvas_node_to_dict(row)

        self.canvas_nodes[node_id] = payload
        return payload

    def update_node(self, node_id: str, user_id: str, **fields) -> dict | None:
        with get_session() as session:
            node = session.get(CanvasNode, node_id)
            if node is None or node.status == "deleted":
                return None

            project = session.get(Project, node.project_id)
            if project is None or project.user_id != user_id:
                raise PermissionError("Project does not belong to user")

            for key, value in fields.items():
                setattr(node, key, value)
            node.updated_at = now_utc()
            session.commit()
            payload = self._canvas_node_to_dict(node)

        self.canvas_nodes[node_id] = payload
        return payload

    def delete_node(self, node_id: str, user_id: str) -> dict | None:
        with get_session() as session:
            node = session.get(CanvasNode, node_id)
            if node is None or node.status == "deleted":
                return None

            project = session.get(Project, node.project_id)
            if project is None or project.user_id != user_id:
                raise PermissionError("Project does not belong to user")

            node.status = "deleted"
            node.updated_at = now_utc()
            session.commit()
            payload = self._canvas_node_to_dict(node)

        self.canvas_nodes[node_id] = payload
        return payload

    def list_projects(self, user_id: str) -> list[dict]:
        statement = select(Project).where(Project.user_id == user_id)
        with get_session() as session:
            projects = [self._project_to_dict(project) for project in session.scalars(statement).all()]

        projects.sort(key=lambda project: project["created_at"], reverse=True)
        return projects

    def list_all_projects(self) -> list[dict]:
        with get_session() as session:
            projects = session.scalars(select(Project)).all()
            items = []
            for project in projects:
                user = session.get(User, project.user_id)
                node_count = session.scalar(
                    select(func.count())
                    .select_from(CanvasNode)
                    .where(CanvasNode.project_id == project.id, CanvasNode.status != "deleted")
                )
                items.append(
                    {
                        **self._project_to_dict(project),
                        "user_nickname": user.nickname if user else None,
                        "node_count": node_count or 0,
                    }
                )

        items.sort(key=lambda project: project["created_at"], reverse=True)
        for item in items:
            self.projects[item["id"]] = {
                "id": item["id"],
                "user_id": item["user_id"],
                "name": item["name"],
                "created_at": item["created_at"],
                "updated_at": item["updated_at"],
            }
        return items

    def get_user_detail(self, user_id: str) -> dict | None:
        with get_session() as session:
            user = session.get(User, user_id)
            if user is None:
                return None

            quotas = session.scalar(select(Quota).where(Quota.user_id == user_id))
            assets = session.scalars(select(Asset).where(Asset.user_id == user_id, Asset.status != "deleted")).all()
            projects = session.scalars(select(Project).where(Project.user_id == user_id)).all()

            payload = {
                **self._user_to_dict(user),
                "quotas": self._quota_to_dict(quotas) if quotas is not None else {"text": 0, "image": 0, "video": 0},
                "asset_count": len(assets),
                "project_count": len(projects),
            }

        self.users[user_id] = PersistentDict(self._user_to_dict(user), self._persist_user)
        return payload

    def log_admin_operation(
        self,
        admin_id: str,
        action: str,
        target_type: str,
        target_id: str,
        detail: str | None = None,
    ) -> dict:
        record = AdminLog(
            id=str(uuid4()),
            admin_id=admin_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            detail={"message": detail} if detail is not None else {},
            created_at=now_utc(),
        )
        with get_session() as session:
            session.add(record)
            session.commit()

        payload = self._admin_log_to_dict(record)
        self.admin_logs.append(payload)
        return payload

    def get_project(self, project_id: str) -> dict | None:
        project = self.projects.get(project_id)
        if project is not None:
            return project

        with get_session() as session:
            row = session.get(Project, project_id)
            if row is None:
                return None
            payload = self._project_to_dict(row)

        self.projects[project_id] = payload
        return payload

    def delete_project(self, project_id: str, user_id: str) -> dict | None:
        with get_session() as session:
            project = session.get(Project, project_id)
            if project is None:
                return None
            if project.user_id != user_id:
                raise PermissionError("Project does not belong to user")
            payload = self._project_to_dict(project)
            session.delete(project)
            session.commit()

        self.projects.pop(project_id, None)
        return payload

    def list_assets(
        self,
        user_id: str,
        asset_type: str | None = None,
        project_id: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[dict], int]:
        statement = select(Asset).where(Asset.user_id == user_id, Asset.status == "active")
        if asset_type:
            statement = statement.where(Asset.type == asset_type)
        if project_id:
            statement = statement.where(Asset.project_id == project_id)

        with get_session() as session:
            assets = [self._asset_to_dict(asset) for asset in session.scalars(statement).all()]

        assets.sort(key=lambda asset: asset["created_at"], reverse=True)
        total = len(assets)
        start = (page - 1) * page_size
        end = start + page_size
        return assets[start:end], total

    def get_asset(self, asset_id: str) -> dict | None:
        asset = self.assets.get(asset_id)
        if asset is not None:
            return asset

        with get_session() as session:
            row = session.get(Asset, asset_id)
            if row is None:
                return None
            payload = self._asset_to_dict(row)

        self.assets[asset_id] = payload
        return payload

    def delete_asset(self, asset_id: str, user_id: str) -> dict | None:
        with get_session() as session:
            asset = session.get(Asset, asset_id)
            if asset is None:
                return None
            if asset.user_id != user_id:
                raise PermissionError("Asset does not belong to user")
            asset.status = "deleted"
            asset.updated_at = now_utc()
            session.commit()
            payload = self._asset_to_dict(asset)

        self.assets[asset_id] = payload
        return payload

    def hide_asset(self, asset_id: str) -> dict | None:
        with get_session() as session:
            asset = session.get(Asset, asset_id)
            if asset is None:
                return None
            asset.status = "hidden"
            asset.updated_at = now_utc()
            session.commit()
            payload = self._asset_to_dict(asset)

        self.assets[asset_id] = payload
        return payload


class StoreProxy:
    def __init__(self, backend: InMemoryStore | DatabaseStore) -> None:
        self._backend = backend

    def configure(self, backend: InMemoryStore | DatabaseStore) -> None:
        self._backend = backend

    def __getattr__(self, name: str):
        return getattr(self._backend, name)


store = StoreProxy(InMemoryStore())


def configure_store(backend: InMemoryStore | DatabaseStore) -> None:
    store.configure(backend)
