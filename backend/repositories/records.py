from __future__ import annotations

from copy import deepcopy
from datetime import UTC, datetime

from models.admin_log import AdminLog
from models.asset import Asset
from models.canvas import Canvas
from models.canvas_connection import CanvasConnection
from models.canvas_node import CanvasNode
from models.generation_task import GenerationTask
from models.identity import Identity
from models.invitation import InvitationCode
from models.project import Project
from models.user import User


def datetime_to_iso(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.isoformat()


def normalize_login_value(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip().lower()
    return normalized or None


def user_record(user: User) -> dict:
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


def identity_record(identity: Identity) -> dict:
    return {
        "id": identity.id,
        "user_id": identity.user_id,
        "provider": identity.provider,
        "provider_user_id": identity.provider_user_id,
        "unionid": identity.unionid,
        "raw_profile": deepcopy(identity.raw_profile),
        "created_at": datetime_to_iso(identity.created_at),
        "updated_at": datetime_to_iso(identity.updated_at),
    }


def invitation_record(invitation: InvitationCode) -> dict:
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


def admin_log_record(record: AdminLog) -> dict:
    return {
        "id": record.id,
        "admin_id": record.admin_id,
        "action": record.action,
        "target_type": record.target_type,
        "target_id": record.target_id,
        "detail": deepcopy(record.detail),
        "created_at": datetime_to_iso(record.created_at),
    }


def asset_record(asset: Asset) -> dict:
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


def generation_task_record(task: GenerationTask) -> dict:
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
        "request_parameters": deepcopy(task.request_parameters),
        "progress_percent": task.progress_percent,
        "progress_stage": task.progress_stage,
        "status": task.status,
        "job_version": task.job_version,
        "lease_owner": task.lease_owner,
        "lease_expires_at": datetime_to_iso(task.lease_expires_at),
        "attempt_count": task.attempt_count,
        "retry_count": task.retry_count,
        "cancel_requested_at": datetime_to_iso(task.cancel_requested_at),
        "duration_ms": task.duration_ms,
        "result_asset_id": task.result_asset_id,
        "error_code": task.error_code,
        "error_message": task.error_message,
        "created_at": datetime_to_iso(task.created_at),
        "updated_at": datetime_to_iso(task.updated_at),
    }


def project_record(project: Project) -> dict:
    return {
        "id": project.id,
        "user_id": project.user_id,
        "name": project.name,
        "canvas_order_revision": project.canvas_order_revision,
        "created_at": datetime_to_iso(project.created_at),
        "updated_at": datetime_to_iso(project.updated_at),
    }


def canvas_record(canvas: Canvas) -> dict:
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


def canvas_node_record(node: CanvasNode) -> dict:
    return {
        "id": node.id,
        "project_id": node.project_id,
        "canvas_id": node.canvas_id,
        "node_type": node.node_type,
        "content": deepcopy(node.content),
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


def canvas_connection_record(connection: CanvasConnection) -> dict:
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
