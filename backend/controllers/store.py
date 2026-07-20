from __future__ import annotations

from collections.abc import Callable
from copy import deepcopy
from datetime import UTC, datetime, timedelta
from threading import Lock
from uuid import uuid4

from sqlalchemy import func, or_, select

from models.admin_log import AdminLog
from models.asset import Asset
from models.base import StoreConfig, get_session
from models.canvas import Canvas
from models.canvas_connection import CanvasConnection
from models.canvas_node import CanvasNode
from models.generation_task import GenerationTask
from models.guest import Guest
from models.identity import Identity
from models.invitation import InvitationCode
from models.project import Project
from models.quota import Quota, QuotaLedger
from models.template import Template
from models.user import User

from controllers.resource_scope import (
    ProjectResourceConflictError,
    resolve_database_resource_scope,
    resolve_memory_resource_scope,
)
from controllers.resource_links import clear_resource_node_links
from controllers.generation_reservations import reconcile_stale_generation_reservations


def now_iso() -> str:
    return datetime.now(UTC).isoformat()


def now_utc() -> datetime:
    return datetime.now(UTC)


def parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value)


def parse_mysql_datetime(value: str | None) -> datetime | None:
    parsed = parse_iso(value)
    if parsed is None or parsed.tzinfo is None:
        return parsed
    return parsed.astimezone(UTC).replace(tzinfo=None)


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
ADMIN_BOOTSTRAP_QUOTAS = {"text": 9999, "image": 9999, "video": 9999}


def normalize_login_value(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip().lower()
    return normalized or None


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
        self._password_hashes: dict[str, str | None] = {}
        self.identities: dict[str, dict] = {}
        self.guests: dict[str, dict] = {}
        self.assets: dict[str, dict] = {}
        self.generation_tasks: dict[str, dict] = {}
        self.canvas_connections: dict[str, dict] = {}
        self.canvas_nodes: dict[str, dict] = {}
        self.canvases: dict[str, dict] = {}
        self.projects: dict[str, dict] = {}
        self.templates: dict[str, dict] = {}
        self.registration_settings = {
            "wechat_login_enabled": True,
            "registration_mode": "invite_only",
            "default_quotas": {"text": 100, "image": 20, "video": 3},
        }
        self.invitation_codes: dict[str, dict] = {}
        self.quotas: dict[str, dict[str, int]] = {}
        self._quota_revisions: dict[str, int] = {}
        self._quota_cache_lock = Lock()
        self.quota_ledger: list[dict] = []
        self.admin_logs: list[dict] = []

    def _ensure_admin_quotas(self, user_id: str) -> None:
        for quota_type, target in ADMIN_BOOTSTRAP_QUOTAS.items():
            current = self.quotas[user_id][quota_type]
            if current < target:
                self.grant_quota(user_id, quota_type, target - current, "default_grant", None)

    def create_user(
        self,
        nickname: str,
        avatar_url: str,
        role: str = "user",
        *,
        username: str | None = None,
        email: str | None = None,
        password_hash: str | None = None,
    ) -> dict:
        user_id = str(uuid4())
        timestamp = now_iso()
        user = {
            "id": user_id,
            "username": normalize_login_value(username),
            "email": normalize_login_value(email),
            "nickname": nickname,
            "avatar_url": avatar_url,
            "role": role,
            "status": "active",
            "generation_status": "enabled",
            "created_at": timestamp,
            "updated_at": timestamp,
            "last_login_at": timestamp,
        }
        self.users[user_id] = user
        self._password_hashes[user_id] = password_hash
        self.quotas[user_id] = {"text": 0, "image": 0, "video": 0}
        return user

    def get_user(self, user_id: str) -> dict | None:
        return self.users.get(user_id)

    def get_password_hash(self, user_id: str) -> str | None:
        return self._password_hashes.get(user_id)

    def find_user_by_username(self, username: str | None) -> dict | None:
        normalized = normalize_login_value(username)
        if normalized is None:
            return None
        return next((user for user in self.users.values() if user.get("username") == normalized), None)

    def find_user_by_email(self, email: str | None) -> dict | None:
        normalized = normalize_login_value(email)
        if normalized is None:
            return None
        return next((user for user in self.users.values() if user.get("email") == normalized), None)

    def find_user_by_identifier(self, identifier: str) -> dict | None:
        normalized = normalize_login_value(identifier)
        if normalized is None:
            return None
        return self.find_user_by_username(normalized) or self.find_user_by_email(normalized)

    def ensure_admin_user(self, username: str, password_hash: str, nickname: str = "Admin") -> dict:
        normalized_username = normalize_login_value(username)
        if normalized_username is None:
            raise ValueError("Admin username is required")
        user = self.find_user_by_username(normalized_username)
        if user is None:
            user = next((candidate for candidate in self.users.values() if candidate["role"] == "admin"), None)

        if user is None:
            user = self.create_user(
                nickname,
                "",
                role="admin",
                username=normalized_username,
                password_hash=password_hash,
            )
        else:
            user["nickname"] = nickname
            user["role"] = "admin"
            user["status"] = "active"
            user["generation_status"] = "enabled"
            user["username"] = normalized_username
            user["updated_at"] = now_iso()
            self._password_hashes[user["id"]] = password_hash

        self._password_hashes[user["id"]] = password_hash
        self._ensure_admin_quotas(user["id"])
        return user

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
        self._quota_revisions[user_id] = self._quota_revisions.get(user_id, 0) + 1
        return record

    def replace_quota_snapshot(self, user_id: str, payload: dict, revision: int) -> bool:
        with self._quota_cache_lock:
            if revision < self._quota_revisions.get(user_id, -1):
                return False
            self.quotas[user_id] = dict(payload)
            self._quota_revisions[user_id] = revision
            return True

    def create_asset(
        self,
        user_id: str,
        asset_type: str,
        url: str | None,
        content_text: str | None,
        *,
        project_id: str | None = None,
        origin_canvas_id: str | None = None,
        canvas_node_id: str | None = None,
        source: str = "upload",
        source_model: str | None = None,
        source_task_id: str | None = None,
        status: str = "active",
    ) -> dict:
        scope = resolve_memory_resource_scope(
            user_id=user_id,
            project_id=project_id,
            origin_canvas_id=origin_canvas_id,
            canvas_node_id=canvas_node_id,
            projects=self.projects,
            canvases=self.canvases,
            nodes=self.canvas_nodes,
        )
        timestamp = now_iso()
        asset = {
            "id": str(uuid4()),
            "user_id": user_id,
            "project_id": scope.project_id,
            "origin_canvas_id": scope.origin_canvas_id,
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

    def create_generation_task(
        self,
        user_id: str,
        media_type: str,
        provider: str,
        model: str | None,
        *,
        project_id: str | None = None,
        origin_canvas_id: str | None = None,
        canvas_node_id: str | None = None,
        provider_request_id: str | None = None,
        status: str = "queued",
    ) -> dict:
        scope = resolve_memory_resource_scope(
            user_id=user_id,
            project_id=project_id,
            origin_canvas_id=origin_canvas_id,
            canvas_node_id=canvas_node_id,
            projects=self.projects,
            canvases=self.canvases,
            nodes=self.canvas_nodes,
        )
        timestamp = now_iso()
        task = {
            "id": str(uuid4()),
            "user_id": user_id,
            "project_id": scope.project_id,
            "origin_canvas_id": scope.origin_canvas_id,
            "canvas_node_id": canvas_node_id,
            "media_type": media_type,
            "provider": provider,
            "model": model,
            "provider_request_id": provider_request_id,
            "status": status,
            "duration_ms": None,
            "result_asset_id": None,
            "error_code": None,
            "error_message": None,
            "created_at": timestamp,
            "updated_at": timestamp,
        }
        self.generation_tasks[task["id"]] = task
        return task

    def update_generation_task(self, task_id: str, **fields) -> dict:
        task = self.generation_tasks.get(task_id)
        if task is None:
            raise KeyError(f'Generation task "{task_id}" not found')
        for key, value in fields.items():
            task[key] = value
        task["updated_at"] = now_iso()
        return task

    def get_generation_task(self, task_id: str) -> dict | None:
        return self.generation_tasks.get(task_id)

    def list_generation_tasks(
        self,
        user_id: str,
        *,
        project_id: str | None = None,
        origin_canvas_id: str | None = None,
        media_type: str | None = None,
        status: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[dict], int]:
        items = [task for task in self.generation_tasks.values() if task["user_id"] == user_id]
        if project_id:
            items = [task for task in items if task["project_id"] == project_id]
        if origin_canvas_id:
            items = [task for task in items if task["origin_canvas_id"] == origin_canvas_id]
        if media_type:
            items = [task for task in items if task["media_type"] == media_type]
        if status:
            items = [task for task in items if task["status"] == status]
        items.sort(key=lambda task: task["created_at"], reverse=True)
        total = len(items)
        start = (page - 1) * page_size
        end = start + page_size
        return items[start:end], total

    def create_project(self, user_id: str, name: str) -> dict:
        timestamp = now_iso()
        project = {
            "id": str(uuid4()),
            "user_id": user_id,
            "name": name,
            "canvas_order_revision": 0,
            "created_at": timestamp,
            "updated_at": timestamp,
        }
        self.projects[project["id"]] = project
        canvas = {
            "id": str(uuid4()),
            "project_id": project["id"],
            "name": "画布 1",
            "sort_order": 0,
            "status": "active",
            "viewport_x": 0.0,
            "viewport_y": 0.0,
            "viewport_zoom": 1.0,
            "graph_revision": 0,
            "created_at": timestamp,
            "updated_at": timestamp,
            "deleted_at": None,
        }
        self.canvases[canvas["id"]] = canvas
        return project

    def get_first_canvas_id(self, project_id: str) -> str | None:
        canvases = [
            canvas
            for canvas in self.canvases.values()
            if canvas["project_id"] == project_id and canvas["status"] == "active"
        ]
        if not canvases:
            return None
        canvases.sort(key=lambda canvas: (canvas["sort_order"], canvas["created_at"], canvas["id"]))
        return canvases[0]["id"]

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
            "schema_version": 1,
            "graph_data": {"schema_version": 1, "nodes": deepcopy(node_data), "connections": []},
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

        canvas_id = self.get_first_canvas_id(project_id)
        if canvas_id is None:
            raise RuntimeError("Project has no active canvas")
        timestamp = now_iso()
        node = {
            "id": str(uuid4()),
            "project_id": project_id,
            "canvas_id": canvas_id,
            "node_type": node_type,
            "content": content,
            "position_x": position_x,
            "position_y": position_y,
            "width": width,
            "height": height,
            "z_index": 0,
            "parent_node_id": None,
            "is_locked": False,
            "is_collapsed": False,
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

        canvas_id = self.get_first_canvas_id(project_id)
        items = [
            node
            for node in self.canvas_nodes.values()
            if node["project_id"] == project_id
            and node["canvas_id"] == canvas_id
            and node["status"] != "deleted"
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

        for resources in (self.assets.values(), self.generation_tasks.values()):
            for resource in resources:
                if resource.get("canvas_node_id") == node_id:
                    resource["canvas_node_id"] = None
        node["status"] = "deleted"
        node["updated_at"] = now_iso()
        self._delete_connections_for_node(node_id)
        return node

    def _validate_connection_nodes(
        self,
        project_id: str,
        canvas_id: str,
        source_node_id: str,
        target_node_id: str,
    ) -> None:
        if source_node_id == target_node_id:
            raise ValueError("Self-loop connections are not allowed")

        source_node = self.canvas_nodes.get(source_node_id)
        target_node = self.canvas_nodes.get(target_node_id)
        if (
            source_node is None
            or target_node is None
            or source_node["status"] == "deleted"
            or target_node["status"] == "deleted"
        ):
            raise ValueError("Connection nodes must exist")
        if source_node["project_id"] != project_id or target_node["project_id"] != project_id:
            raise ValueError("Connection nodes must belong to project")
        if source_node["canvas_id"] != canvas_id or target_node["canvas_id"] != canvas_id:
            raise ValueError("Connection nodes must belong to canvas")

    def _has_duplicate_connection(
        self,
        canvas_id: str,
        source_node_id: str,
        source_port: str,
        target_node_id: str,
        target_port: str,
        exclude_connection_id: str | None = None,
    ) -> bool:
        for connection in self.canvas_connections.values():
            if connection["id"] == exclude_connection_id:
                continue
            if connection.get("status") == "deleted":
                continue
            if (
                connection["canvas_id"] == canvas_id
                and connection["source_node_id"] == source_node_id
                and connection["source_port"] == source_port
                and connection["target_node_id"] == target_node_id
                and connection["target_port"] == target_port
            ):
                return True
        return False

    def create_connection(
        self,
        project_id: str,
        user_id: str,
        source_node_id: str,
        source_port: str,
        target_node_id: str,
        target_port: str,
        metadata: dict | None = None,
    ) -> dict:
        project = self.projects.get(project_id)
        if project is None or project["user_id"] != user_id:
            raise PermissionError("Project does not belong to user")
        canvas_id = self.get_first_canvas_id(project_id)
        if canvas_id is None:
            raise RuntimeError("Project has no active canvas")
        self._validate_connection_nodes(project_id, canvas_id, source_node_id, target_node_id)
        if self._has_duplicate_connection(canvas_id, source_node_id, source_port, target_node_id, target_port):
            raise ValueError("Connection already exists")

        timestamp = now_iso()
        connection = {
            "id": str(uuid4()),
            "project_id": project_id,
            "canvas_id": canvas_id,
            "source_node_id": source_node_id,
            "source_port": source_port,
            "target_node_id": target_node_id,
            "target_port": target_port,
            "status": "active",
            "metadata": deepcopy(metadata or {}),
            "created_at": timestamp,
            "updated_at": timestamp,
        }
        self.canvas_connections[connection["id"]] = connection
        return connection

    def list_connections(self, project_id: str, user_id: str) -> list[dict]:
        project = self.projects.get(project_id)
        if project is None or project["user_id"] != user_id:
            raise PermissionError("Project does not belong to user")

        canvas_id = self.get_first_canvas_id(project_id)
        items = [
            connection
            for connection in self.canvas_connections.values()
            if connection["project_id"] == project_id
            and connection["canvas_id"] == canvas_id
            and connection["status"] != "deleted"
        ]
        items.sort(key=lambda connection: connection["created_at"])
        return items

    def get_connection(self, connection_id: str) -> dict | None:
        connection = self.canvas_connections.get(connection_id)
        if connection is None or connection["status"] == "deleted":
            return None
        return connection

    def update_connection(self, connection_id: str, user_id: str, **fields) -> dict | None:
        connection = self.canvas_connections.get(connection_id)
        if connection is None or connection["status"] == "deleted":
            return None

        project = self.projects.get(connection["project_id"])
        if project is None or project["user_id"] != user_id:
            raise PermissionError("Project does not belong to user")

        source_node_id = fields.get("source_node_id", connection["source_node_id"])
        source_port = fields.get("source_port", connection["source_port"])
        target_node_id = fields.get("target_node_id", connection["target_node_id"])
        target_port = fields.get("target_port", connection["target_port"])
        self._validate_connection_nodes(connection["project_id"], connection["canvas_id"], source_node_id, target_node_id)
        if self._has_duplicate_connection(
            connection["canvas_id"],
            source_node_id,
            source_port,
            target_node_id,
            target_port,
            exclude_connection_id=connection_id,
        ):
            raise ValueError("Connection already exists")

        for key, value in fields.items():
            connection[key] = deepcopy(value) if key == "metadata" else value
        connection["updated_at"] = now_iso()
        return connection

    def delete_connection(self, connection_id: str, user_id: str) -> dict | None:
        connection = self.canvas_connections.get(connection_id)
        if connection is None:
            return None

        project = self.projects.get(connection["project_id"])
        if project is None or project["user_id"] != user_id:
            raise PermissionError("Project does not belong to user")
        return self.canvas_connections.pop(connection_id)

    def _delete_connections_for_node(self, node_id: str) -> None:
        connection_ids = [
            connection_id
            for connection_id, connection in self.canvas_connections.items()
            if connection["source_node_id"] == node_id or connection["target_node_id"] == node_id
        ]
        for connection_id in connection_ids:
            self.canvas_connections.pop(connection_id, None)

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
        has_resources = any(
            resource.get("project_id") == project_id
            for resources in (self.assets.values(), self.generation_tasks.values())
            for resource in resources
        )
        if has_resources:
            raise ProjectResourceConflictError("Project has linked resources")
        payload = self.projects.pop(project_id)
        self.canvases = {
            canvas_id: canvas
            for canvas_id, canvas in self.canvases.items()
            if canvas["project_id"] != project_id
        }
        return payload

    def list_assets(
        self,
        user_id: str,
        asset_type: str | None = None,
        project_id: str | None = None,
        origin_canvas_id: str | None = None,
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
        if origin_canvas_id:
            items = [asset for asset in items if asset["origin_canvas_id"] == origin_canvas_id]
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
        self._password_hashes: dict[str, str | None] = {}
        self.identities: dict[str, dict] = {}
        self.guests: dict[str, dict] = {}
        self.assets: dict[str, dict] = {}
        self.generation_tasks: dict[str, dict] = {}
        self.canvas_connections: dict[str, dict] = {}
        self.canvas_nodes: dict[str, dict] = {}
        self.canvases: dict[str, dict] = {}
        self.projects: dict[str, dict] = {}
        self.templates: dict[str, dict] = {}
        self.invitation_codes: dict[str, PersistentDict] = {}
        self.quotas: dict[str, PersistentDict] = {}
        self._quota_revisions: dict[str, int] = {}
        self._quota_cache_lock = Lock()
        self.quota_ledger: list[dict] = []
        self.admin_logs: list[dict] = []
        self.registration_settings = PersistentDict(
            DEFAULT_REGISTRATION_SETTINGS,
            self._persist_registration_settings,
        )
        reconcile_stale_generation_reservations()
        self._load_state()
        self._bootstrap_admin_if_configured()

    def _load_state(self) -> None:
        with get_session() as session:
            self.registration_settings.replace_local(self._load_registration_settings(session))
            self.users = {}
            self._password_hashes = {}
            for user in session.scalars(select(User)).all():
                self.users[user.id] = PersistentDict(self._user_to_dict(user), self._persist_user)
                self._password_hashes[user.id] = user.password_hash
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
            self.generation_tasks = {
                task.id: self._generation_task_to_dict(task)
                for task in session.scalars(select(GenerationTask)).all()
            }
            self.canvas_connections = {
                connection.id: self._canvas_connection_to_dict(connection)
                for connection in session.scalars(select(CanvasConnection)).all()
            }
            self.canvas_nodes = {
                node.id: self._canvas_node_to_dict(node)
                for node in session.scalars(select(CanvasNode)).all()
            }
            self.canvases = {
                canvas.id: self._canvas_to_dict(canvas)
                for canvas in session.scalars(select(Canvas)).all()
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
            quota_rows = list(session.scalars(select(Quota)).all())
            self.quotas = {
                quota.user_id: PersistentDict(
                    self._quota_to_dict(quota),
                    lambda payload, user_id=quota.user_id: self._persist_quota(user_id, payload),
                )
                for quota in quota_rows
            }
            self._quota_revisions = {quota.user_id: quota.revision for quota in quota_rows}
            self.quota_ledger = [self._quota_ledger_to_dict(record) for record in session.scalars(select(QuotaLedger)).all()]
            self.admin_logs = [self._admin_log_to_dict(record) for record in session.scalars(select(AdminLog)).all()]

    def _bootstrap_admin_if_configured(self) -> None:
        from core.security import hash_password, verify_password
        from settings.config import settings

        normalized_username = normalize_login_value(settings.admin_username)
        password = settings.admin_password
        if normalized_username is None or not password:
            return

        user = self.find_user_by_username(normalized_username)
        if user is None:
            user = next((candidate for candidate in self.users.values() if candidate["role"] == "admin"), None)

        if user is not None:
            password_hash = self.get_password_hash(user["id"])
            if (
                user["role"] == "admin"
                and user.get("username") == normalized_username
                and verify_password(password, password_hash)
            ):
                self._ensure_admin_quotas(user["id"])
                return

        self.ensure_admin_user(normalized_username, hash_password(password))

    def _ensure_admin_quotas(self, user_id: str) -> None:
        for quota_type, target in ADMIN_BOOTSTRAP_QUOTAS.items():
            current = self.quotas[user_id][quota_type]
            if current < target:
                self.grant_quota(user_id, quota_type, target - current, "default_grant", None)

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
            user.username = normalize_login_value(payload.get("username"))
            user.email = normalize_login_value(payload.get("email"))
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
            invitation.expires_at = parse_mysql_datetime(payload["expires_at"])
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
            quota.revision += 1
            revision = quota.revision
            session.commit()
        self._quota_revisions[user_id] = revision

    def _user_to_dict(self, user: User) -> dict:
        return {
            "id": user.id,
            "username": normalize_login_value(user.username),
            "email": normalize_login_value(user.email),
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
            "origin_canvas_id": asset.origin_canvas_id,
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

    def _generation_task_to_dict(self, task: GenerationTask) -> dict:
        return {
            "id": task.id,
            "user_id": task.user_id,
            "project_id": task.project_id,
            "origin_canvas_id": task.origin_canvas_id,
            "canvas_node_id": task.canvas_node_id,
            "media_type": task.media_type,
            "provider": task.provider,
            "model": task.model,
            "provider_request_id": task.provider_request_id,
            "client_request_id": task.client_request_id,
            "request_fingerprint": task.request_fingerprint,
            "request_parameters": task.request_parameters,
            "progress_percent": task.progress_percent,
            "progress_stage": task.progress_stage,
            "status": task.status,
            "duration_ms": task.duration_ms,
            "result_asset_id": task.result_asset_id,
            "error_code": task.error_code,
            "error_message": task.error_message,
            "created_at": datetime_to_iso(task.created_at),
            "updated_at": datetime_to_iso(task.updated_at),
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
            "canvas_id": node.canvas_id,
            "node_type": node.node_type,
            "content": node.content,
            "position_x": node.position_x,
            "position_y": node.position_y,
            "width": node.width,
            "height": node.height,
            "z_index": node.z_index,
            "parent_node_id": node.parent_node_id,
            "is_locked": node.is_locked,
            "is_collapsed": node.is_collapsed,
            "status": node.status,
            "created_at": datetime_to_iso(node.created_at),
            "updated_at": datetime_to_iso(node.updated_at),
        }

    def _canvas_connection_to_dict(self, connection: CanvasConnection) -> dict:
        return {
            "id": connection.id,
            "project_id": connection.project_id,
            "canvas_id": connection.canvas_id,
            "source_node_id": connection.source_node_id,
            "source_port": connection.source_port,
            "target_node_id": connection.target_node_id,
            "target_port": connection.target_port,
            "status": connection.status,
            "metadata": deepcopy(connection.metadata_),
            "created_at": datetime_to_iso(connection.created_at),
            "updated_at": datetime_to_iso(connection.updated_at),
        }

    def _canvas_to_dict(self, canvas: Canvas) -> dict:
        return {
            "id": canvas.id,
            "project_id": canvas.project_id,
            "name": canvas.name,
            "sort_order": canvas.sort_order,
            "status": canvas.status,
            "viewport_x": canvas.viewport_x,
            "viewport_y": canvas.viewport_y,
            "viewport_zoom": float(canvas.viewport_zoom),
            "graph_revision": canvas.graph_revision,
            "created_at": datetime_to_iso(canvas.created_at),
            "updated_at": datetime_to_iso(canvas.updated_at),
            "deleted_at": datetime_to_iso(canvas.deleted_at),
        }

    def _project_to_dict(self, project: Project) -> dict:
        return {
            "id": project.id,
            "user_id": project.user_id,
            "name": project.name,
            "canvas_order_revision": project.canvas_order_revision,
            "created_at": datetime_to_iso(project.created_at),
            "updated_at": datetime_to_iso(project.updated_at),
        }

    def _template_to_dict(self, template: Template) -> dict:
        return {
            "id": template.id,
            "user_id": template.user_id,
            "name": template.name,
            "node_data": deepcopy(template.node_data),
            "schema_version": template.schema_version,
            "graph_data": deepcopy(template.graph_data),
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

    def create_user(
        self,
        nickname: str,
        avatar_url: str,
        role: str = "user",
        *,
        username: str | None = None,
        email: str | None = None,
        password_hash: str | None = None,
    ) -> dict:
        if not hasattr(self, "_password_hashes"):
            self._password_hashes = {}
        user_id = str(uuid4())
        timestamp = now_utc()
        user = User(
            id=user_id,
            username=normalize_login_value(username),
            email=normalize_login_value(email),
            password_hash=password_hash,
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
            session.flush()
            session.add(quota)
            session.commit()
        user_payload = PersistentDict(self._user_to_dict(user), self._persist_user)
        quota_payload = PersistentDict(
            self._quota_to_dict(quota),
            lambda payload, key=user_id: self._persist_quota(key, payload),
        )
        self.users[user_id] = user_payload
        self._password_hashes[user_id] = password_hash
        self.quotas[user_id] = quota_payload
        self._quota_revisions[user_id] = quota.revision
        return user_payload

    def get_user(self, user_id: str) -> dict | None:
        return self.users.get(user_id)

    def get_password_hash(self, user_id: str) -> str | None:
        return self._password_hashes.get(user_id)

    def set_password_hash(self, user_id: str, password_hash: str | None) -> None:
        with get_session() as session:
            user = session.get(User, user_id)
            if user is None:
                raise KeyError(f'User "{user_id}" not found')
            user.password_hash = password_hash
            user.updated_at = now_utc()
            session.commit()
            updated_at = datetime_to_iso(user.updated_at)

        self._password_hashes[user_id] = password_hash
        cached_user = self.users.get(user_id)
        if cached_user is not None:
            payload = dict(cached_user)
            payload["updated_at"] = updated_at
            cached_user.replace_local(payload)

    def find_user_by_username(self, username: str | None) -> dict | None:
        normalized = normalize_login_value(username)
        if normalized is None:
            return None
        return next((user for user in self.users.values() if user.get("username") == normalized), None)

    def find_user_by_email(self, email: str | None) -> dict | None:
        normalized = normalize_login_value(email)
        if normalized is None:
            return None
        return next((user for user in self.users.values() if user.get("email") == normalized), None)

    def find_user_by_identifier(self, identifier: str) -> dict | None:
        normalized = normalize_login_value(identifier)
        if normalized is None:
            return None
        return self.find_user_by_username(normalized) or self.find_user_by_email(normalized)

    def ensure_admin_user(self, username: str, password_hash: str, nickname: str = "Admin") -> dict:
        normalized_username = normalize_login_value(username)
        if normalized_username is None:
            raise ValueError("Admin username is required")
        user = self.find_user_by_username(normalized_username)
        if user is None:
            user = next((candidate for candidate in self.users.values() if candidate["role"] == "admin"), None)

        if user is None:
            user = self.create_user(
                nickname,
                "",
                role="admin",
                username=normalized_username,
                password_hash=password_hash,
            )
        else:
            user["nickname"] = nickname
            user["role"] = "admin"
            user["status"] = "active"
            user["generation_status"] = "enabled"
            user["username"] = normalized_username
            user["updated_at"] = now_iso()
            self.set_password_hash(user["id"], password_hash)

        if user["id"] not in self._password_hashes:
            self._password_hashes[user["id"]] = password_hash
        self._ensure_admin_quotas(user["id"])
        return self.get_user(user["id"]) or user

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

    def sync_registration_result(
        self,
        user: User,
        identity: Identity | None,
        quota: Quota,
        invitation: InvitationCode | None,
    ) -> dict:
        user_payload = self._user_to_dict(user)
        cached_user = self.users.get(user.id)
        if cached_user is None:
            cached_user = PersistentDict(user_payload, self._persist_user)
            self.users[user.id] = cached_user
        else:
            cached_user.replace_local(user_payload)
        self._password_hashes[user.id] = user.password_hash

        if identity is not None:
            self.identities[f"{identity.provider}:{identity.provider_user_id}"] = self._identity_to_dict(identity)
        self.replace_quota_snapshot(user.id, self._quota_to_dict(quota), quota.revision)
        with get_session() as session:
            committed_ledger = [
                self._quota_ledger_to_dict(record)
                for record in session.scalars(
                    select(QuotaLedger).where(QuotaLedger.user_id == user.id)
                ).all()
            ]
        self.quota_ledger = [
            record for record in self.quota_ledger if record["user_id"] != user.id
        ] + committed_ledger

        if invitation is not None:
            invitation_payload = self._invitation_to_dict(invitation)
            cached_invitation = self.invitation_codes.get(invitation.code)
            if cached_invitation is None:
                self.invitation_codes[invitation.code] = PersistentDict(
                    invitation_payload,
                    self._persist_invitation,
                )
            else:
                cached_invitation.replace_local(invitation_payload)
        return cached_user

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
            expires_at=parse_mysql_datetime(expires_at),
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
        with get_session() as session:
            quota_row = session.scalar(
                select(Quota).where(Quota.user_id == user_id).with_for_update()
            )
            if quota_row is None:
                quota_row = Quota(
                    id=str(uuid4()),
                    user_id=user_id,
                    text_quota=0,
                    image_quota=0,
                    video_quota=0,
                    revision=0,
                )
                session.add(quota_row)
                session.flush()
            quota_field = f"{quota_type}_quota"
            next_value = getattr(quota_row, quota_field) + amount
            if next_value < 0:
                raise ValueError(f"Insufficient {quota_type} quota")
            setattr(quota_row, quota_field, next_value)
            quota_row.revision += 1
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
            session.add(record)
            session.flush()
            quota_payload = self._quota_to_dict(quota_row)
            quota_revision = quota_row.revision
            payload = self._quota_ledger_to_dict(record)
            session.commit()

        self.replace_quota_snapshot(user_id, quota_payload, quota_revision)
        self.quota_ledger.append(payload)
        return payload

    def replace_quota_snapshot(self, user_id: str, payload: dict, revision: int) -> bool:
        with self._quota_cache_lock:
            if revision < self._quota_revisions.get(user_id, -1):
                return False
            quota_bucket = self.quotas.get(user_id)
            if quota_bucket is None:
                quota_bucket = PersistentDict(
                    payload,
                    lambda value, key=user_id: self._persist_quota(key, value),
                )
                self.quotas[user_id] = quota_bucket
            else:
                quota_bucket.replace_local(payload)
            self._quota_revisions[user_id] = revision
            return True

    def create_asset(
        self,
        user_id: str,
        asset_type: str,
        url: str | None,
        content_text: str | None,
        *,
        project_id: str | None = None,
        origin_canvas_id: str | None = None,
        canvas_node_id: str | None = None,
        source: str = "upload",
        source_model: str | None = None,
        source_task_id: str | None = None,
        status: str = "active",
    ) -> dict:
        timestamp = now_utc()
        with get_session() as session:
            scope = resolve_database_resource_scope(
                session,
                user_id=user_id,
                project_id=project_id,
                origin_canvas_id=origin_canvas_id,
                canvas_node_id=canvas_node_id,
            )
            asset = Asset(
                id=str(uuid4()),
                user_id=user_id,
                project_id=scope.project_id,
                origin_canvas_id=scope.origin_canvas_id,
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
            session.add(asset)
            session.commit()
        payload = self._asset_to_dict(asset)
        self.assets[asset.id] = payload
        return payload

    def create_generation_task(
        self,
        user_id: str,
        media_type: str,
        provider: str,
        model: str | None,
        *,
        project_id: str | None = None,
        origin_canvas_id: str | None = None,
        canvas_node_id: str | None = None,
        provider_request_id: str | None = None,
        request_parameters: dict | None = None,
        status: str = "queued",
    ) -> dict:
        timestamp = now_utc()
        with get_session() as session:
            scope = resolve_database_resource_scope(
                session,
                user_id=user_id,
                project_id=project_id,
                origin_canvas_id=origin_canvas_id,
                canvas_node_id=canvas_node_id,
            )
            task = GenerationTask(
                id=str(uuid4()),
                user_id=user_id,
                project_id=scope.project_id,
                origin_canvas_id=scope.origin_canvas_id,
                canvas_node_id=canvas_node_id,
                media_type=media_type,
                provider=provider,
                model=model,
                provider_request_id=provider_request_id,
                request_parameters=request_parameters,
                status=status,
                created_at=timestamp,
                updated_at=timestamp,
            )
            session.add(task)
            session.commit()
        payload = self._generation_task_to_dict(task)
        self.generation_tasks[task.id] = payload
        return payload

    def update_generation_task(self, task_id: str, **fields) -> dict:
        with get_session() as session:
            task = session.get(GenerationTask, task_id)
            if task is None:
                raise KeyError(f'Generation task "{task_id}" not found')
            for key, value in fields.items():
                setattr(task, key, value)
            task.updated_at = now_utc()
            session.commit()
            payload = self._generation_task_to_dict(task)

        self.generation_tasks[task_id] = payload
        return payload

    def get_generation_task(self, task_id: str) -> dict | None:
        with get_session() as session:
            row = session.get(GenerationTask, task_id)
            if row is None:
                return None
            payload = self._generation_task_to_dict(row)

        self.generation_tasks[task_id] = payload
        return payload

    def list_generation_tasks(
        self,
        user_id: str,
        *,
        project_id: str | None = None,
        origin_canvas_id: str | None = None,
        media_type: str | None = None,
        status: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[dict], int]:
        statement = select(GenerationTask).where(GenerationTask.user_id == user_id)
        if project_id:
            statement = statement.where(GenerationTask.project_id == project_id)
        if origin_canvas_id:
            statement = statement.where(GenerationTask.origin_canvas_id == origin_canvas_id)
        if media_type:
            statement = statement.where(GenerationTask.media_type == media_type)
        if status:
            statement = statement.where(GenerationTask.status == status)
        statement = statement.order_by(GenerationTask.created_at.desc())

        with get_session() as session:
            tasks = [self._generation_task_to_dict(task) for task in session.scalars(statement).all()]

        for task in tasks:
            self.generation_tasks[task["id"]] = task
        total = len(tasks)
        start = (page - 1) * page_size
        end = start + page_size
        return tasks[start:end], total

    def create_project(self, user_id: str, name: str) -> dict:
        timestamp = now_utc()
        project_id = str(uuid4())
        project = Project(
            id=project_id,
            user_id=user_id,
            name=name,
            canvas_order_revision=0,
            created_at=timestamp,
            updated_at=timestamp,
        )
        canvas = Canvas(
            id=str(uuid4()),
            project_id=project_id,
            name="画布 1",
            sort_order=0,
            status="active",
            viewport_x=0.0,
            viewport_y=0.0,
            viewport_zoom=1,
            graph_revision=0,
            created_at=timestamp,
            updated_at=timestamp,
            deleted_at=None,
        )
        with get_session() as session:
            session.add(project)
            session.flush()
            session.add(canvas)
            session.commit()
        payload = self._project_to_dict(project)
        self.projects[project.id] = payload
        self.canvases[canvas.id] = self._canvas_to_dict(canvas)
        return payload

    def get_first_canvas_id(self, project_id: str) -> str | None:
        statement = (
            select(Canvas.id)
            .where(Canvas.project_id == project_id, Canvas.status == "active")
            .order_by(Canvas.sort_order, Canvas.created_at, Canvas.id)
            .limit(1)
        )
        with get_session() as session:
            return session.scalar(statement)

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
            schema_version=1,
            graph_data={"schema_version": 1, "nodes": deepcopy(node_data), "connections": []},
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

        canvas_id = self.get_first_canvas_id(project_id)
        if canvas_id is None:
            raise RuntimeError("Project has no active canvas")
        timestamp = now_utc()
        node = CanvasNode(
            id=str(uuid4()),
            project_id=project_id,
            canvas_id=canvas_id,
            node_type=node_type,
            content=content,
            position_x=position_x,
            position_y=position_y,
            width=width,
            height=height,
            z_index=0,
            parent_node_id=None,
            is_locked=False,
            is_collapsed=False,
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

        canvas_id = self.get_first_canvas_id(project_id)
        statement = select(CanvasNode).where(
            CanvasNode.project_id == project_id,
            CanvasNode.canvas_id == canvas_id,
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
        deleted_connection_ids: list[str] = []
        with get_session() as session:
            node = session.get(CanvasNode, node_id)
            if node is None or node.status == "deleted":
                return None

            project = session.get(Project, node.project_id)
            if project is None or project.user_id != user_id:
                raise PermissionError("Project does not belong to user")

            node.status = "deleted"
            node.updated_at = now_utc()
            clear_resource_node_links(session, [node_id])
            deleted_connection_ids = self._delete_connections_for_node_in_session(session, node_id)
            session.commit()
            payload = self._canvas_node_to_dict(node)

        self.canvas_nodes[node_id] = payload
        for connection_id in deleted_connection_ids:
            self.canvas_connections.pop(connection_id, None)
        return payload

    def _validate_connection_nodes(
        self,
        session,
        project_id: str,
        canvas_id: str,
        source_node_id: str,
        target_node_id: str,
    ) -> None:
        if source_node_id == target_node_id:
            raise ValueError("Self-loop connections are not allowed")

        source_node = session.get(CanvasNode, source_node_id)
        target_node = session.get(CanvasNode, target_node_id)
        if (
            source_node is None
            or target_node is None
            or source_node.status == "deleted"
            or target_node.status == "deleted"
        ):
            raise ValueError("Connection nodes must exist")
        if source_node.project_id != project_id or target_node.project_id != project_id:
            raise ValueError("Connection nodes must belong to project")
        if source_node.canvas_id != canvas_id or target_node.canvas_id != canvas_id:
            raise ValueError("Connection nodes must belong to canvas")

    def _has_duplicate_connection(
        self,
        session,
        canvas_id: str,
        source_node_id: str,
        source_port: str,
        target_node_id: str,
        target_port: str,
        exclude_connection_id: str | None = None,
    ) -> bool:
        statement = select(CanvasConnection).where(
            CanvasConnection.canvas_id == canvas_id,
            CanvasConnection.source_node_id == source_node_id,
            CanvasConnection.source_port == source_port,
            CanvasConnection.target_node_id == target_node_id,
            CanvasConnection.target_port == target_port,
        )
        if exclude_connection_id is not None:
            statement = statement.where(CanvasConnection.id != exclude_connection_id)
        return session.scalar(statement) is not None

    def create_connection(
        self,
        project_id: str,
        user_id: str,
        source_node_id: str,
        source_port: str,
        target_node_id: str,
        target_port: str,
        metadata: dict | None = None,
    ) -> dict:
        project = self.get_project(project_id)
        if project is None or project["user_id"] != user_id:
            raise PermissionError("Project does not belong to user")

        canvas_id = self.get_first_canvas_id(project_id)
        if canvas_id is None:
            raise RuntimeError("Project has no active canvas")
        timestamp = now_utc()
        connection = CanvasConnection(
            id=str(uuid4()),
            project_id=project_id,
            canvas_id=canvas_id,
            source_node_id=source_node_id,
            source_port=source_port,
            target_node_id=target_node_id,
            target_port=target_port,
            status="active",
            metadata_=deepcopy(metadata or {}),
            created_at=timestamp,
            updated_at=timestamp,
        )
        with get_session() as session:
            self._validate_connection_nodes(session, project_id, canvas_id, source_node_id, target_node_id)
            if self._has_duplicate_connection(session, canvas_id, source_node_id, source_port, target_node_id, target_port):
                raise ValueError("Connection already exists")
            session.add(connection)
            session.commit()
            payload = self._canvas_connection_to_dict(connection)

        self.canvas_connections[connection.id] = payload
        return payload

    def list_connections(self, project_id: str, user_id: str) -> list[dict]:
        project = self.get_project(project_id)
        if project is None or project["user_id"] != user_id:
            raise PermissionError("Project does not belong to user")

        canvas_id = self.get_first_canvas_id(project_id)
        statement = select(CanvasConnection).where(
            CanvasConnection.project_id == project_id,
            CanvasConnection.canvas_id == canvas_id,
            CanvasConnection.status != "deleted",
        )
        with get_session() as session:
            items = [self._canvas_connection_to_dict(connection) for connection in session.scalars(statement).all()]

        items.sort(key=lambda connection: connection["created_at"])
        for item in items:
            self.canvas_connections[item["id"]] = item
        return items

    def get_connection(self, connection_id: str) -> dict | None:
        connection = self.canvas_connections.get(connection_id)
        if connection is not None:
            if connection["status"] == "deleted":
                return None
            return connection

        with get_session() as session:
            row = session.get(CanvasConnection, connection_id)
            if row is None or row.status == "deleted":
                return None
            payload = self._canvas_connection_to_dict(row)

        self.canvas_connections[connection_id] = payload
        return payload

    def update_connection(self, connection_id: str, user_id: str, **fields) -> dict | None:
        with get_session() as session:
            connection = session.get(CanvasConnection, connection_id)
            if connection is None or connection.status == "deleted":
                return None

            project = session.get(Project, connection.project_id)
            if project is None or project.user_id != user_id:
                raise PermissionError("Project does not belong to user")

            source_node_id = fields.get("source_node_id", connection.source_node_id)
            source_port = fields.get("source_port", connection.source_port)
            target_node_id = fields.get("target_node_id", connection.target_node_id)
            target_port = fields.get("target_port", connection.target_port)
            self._validate_connection_nodes(session, connection.project_id, connection.canvas_id, source_node_id, target_node_id)
            if self._has_duplicate_connection(
                session,
                connection.canvas_id,
                source_node_id,
                source_port,
                target_node_id,
                target_port,
                exclude_connection_id=connection_id,
            ):
                raise ValueError("Connection already exists")

            for key, value in fields.items():
                if key == "metadata":
                    connection.metadata_ = deepcopy(value)
                else:
                    setattr(connection, key, value)
            connection.updated_at = now_utc()
            session.commit()
            payload = self._canvas_connection_to_dict(connection)

        self.canvas_connections[connection_id] = payload
        return payload

    def delete_connection(self, connection_id: str, user_id: str) -> dict | None:
        with get_session() as session:
            connection = session.get(CanvasConnection, connection_id)
            if connection is None:
                return None

            project = session.get(Project, connection.project_id)
            if project is None or project.user_id != user_id:
                raise PermissionError("Project does not belong to user")
            payload = self._canvas_connection_to_dict(connection)
            session.delete(connection)
            session.commit()

        self.canvas_connections.pop(connection_id, None)
        return payload

    def _delete_connections_for_node_in_session(self, session, node_id: str) -> list[str]:
        statement = select(CanvasConnection).where(
            or_(
                CanvasConnection.source_node_id == node_id,
                CanvasConnection.target_node_id == node_id,
            )
        )
        connections = session.scalars(statement).all()
        connection_ids = [connection.id for connection in connections]
        for connection in connections:
            session.delete(connection)
        return connection_ids

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
            project = session.scalar(
                select(Project).where(Project.id == project_id).with_for_update()
            )
            if project is None:
                return None
            if project.user_id != user_id:
                raise PermissionError("Project does not belong to user")
            asset_count = session.scalar(
                select(func.count()).select_from(Asset).where(Asset.project_id == project_id)
            )
            task_count = session.scalar(
                select(func.count()).select_from(GenerationTask).where(GenerationTask.project_id == project_id)
            )
            if asset_count or task_count:
                raise ProjectResourceConflictError("Project has linked resources")
            payload = self._project_to_dict(project)
            session.delete(project)
            session.commit()

        self.projects.pop(project_id, None)
        self.canvases = {
            canvas_id: canvas
            for canvas_id, canvas in self.canvases.items()
            if canvas["project_id"] != project_id
        }
        return payload

    def list_assets(
        self,
        user_id: str,
        asset_type: str | None = None,
        project_id: str | None = None,
        origin_canvas_id: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[dict], int]:
        statement = select(Asset).where(Asset.user_id == user_id, Asset.status == "active")
        if asset_type:
            statement = statement.where(Asset.type == asset_type)
        if project_id:
            statement = statement.where(Asset.project_id == project_id)
        if origin_canvas_id:
            statement = statement.where(Asset.origin_canvas_id == origin_canvas_id)

        with get_session() as session:
            assets = [self._asset_to_dict(asset) for asset in session.scalars(statement).all()]

        assets.sort(key=lambda asset: asset["created_at"], reverse=True)
        total = len(assets)
        start = (page - 1) * page_size
        end = start + page_size
        return assets[start:end], total

    def get_asset(self, asset_id: str) -> dict | None:
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
    def __init__(self, backend: InMemoryStore | DatabaseStore | None = None) -> None:
        self._backend = backend

    def configure(self, backend: InMemoryStore | DatabaseStore) -> None:
        self._backend = backend

    def __getattr__(self, name: str):
        if self._backend is None:
            raise RuntimeError("Store is not initialized; MySQL startup must complete first")
        return getattr(self._backend, name)


store = StoreProxy()


def configure_store(backend: InMemoryStore | DatabaseStore) -> None:
    store.configure(backend)
