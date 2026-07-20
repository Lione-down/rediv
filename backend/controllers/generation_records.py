from __future__ import annotations

from datetime import UTC, datetime

from models.asset import Asset
from models.generation_task import GenerationTask
from models.quota import Quota, QuotaLedger


def _datetime_to_iso(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.isoformat()


def task_to_dict(task: GenerationTask) -> dict:
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
        "created_at": _datetime_to_iso(task.created_at),
        "updated_at": _datetime_to_iso(task.updated_at),
    }


def asset_to_dict(asset: Asset) -> dict:
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
        "created_at": _datetime_to_iso(asset.created_at),
        "updated_at": _datetime_to_iso(asset.updated_at),
    }


def quota_to_dict(quota: Quota) -> dict[str, int]:
    return {
        "text": quota.text_quota,
        "image": quota.image_quota,
        "video": quota.video_quota,
    }


def ledger_to_dict(record: QuotaLedger) -> dict:
    return {
        "id": record.id,
        "user_id": record.user_id,
        "quota_type": record.quota_type,
        "change_amount": record.change_amount,
        "reason": record.reason,
        "related_task_id": record.related_task_id,
        "admin_id": record.admin_id,
        "created_at": _datetime_to_iso(record.created_at),
    }
