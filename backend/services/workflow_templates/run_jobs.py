from __future__ import annotations

import hashlib
from copy import deepcopy
from uuid import NAMESPACE_URL, uuid5

from sqlalchemy import select

from core.canvas_document_fingerprint import canonical_json
from models.asset import Asset
from models.base import utc_now
from models.canvas_node import CanvasNode
from models.generation_task import GenerationTask
from models.quota import Quota
from models.user import User
from models.workflow_run import WorkflowRun, WorkflowRunStep
from models.workflow_template_lineage import WorkflowTemplateInstanceStep
from services.workflow_templates.portable_classifier import asset_source_revision
from services.workflow_templates.run_context import WorkflowRunConflictError
from services.workflow_templates.run_steps import (
    WorkflowRunStepCompilationError,
    WorkflowRunStepPlan,
)


def stable_workflow_run_id(*parts: str) -> str:
    return str(uuid5(NAMESPACE_URL, "revid:" + ":".join(parts)))


def _fingerprint(value: dict) -> str:
    return hashlib.sha256(canonical_json(value).encode("utf-8")).hexdigest()


def step_source_fingerprint(
    *,
    step: WorkflowTemplateInstanceStep,
    node: CanvasNode,
    assets_by_slot: dict[str, list[Asset]],
) -> str:
    return _fingerprint(
        {
            "configuration": step.configuration,
            "node_content": node.content,
            "bound_assets": {
                slot_id: [
                    {
                        "asset_id": asset.id,
                        "source_revision": asset_source_revision(asset),
                    }
                    for asset in assets
                ]
                for slot_id, assets in sorted(assets_by_slot.items())
                if slot_id in step.configuration.get("input_bindings", [])
            },
        }
    )


def queue_workflow_run_job(
    session,
    *,
    run: WorkflowRun,
    run_step: WorkflowRunStep,
    instance_step: WorkflowTemplateInstanceStep,
    plan: WorkflowRunStepPlan,
) -> None:
    if plan.media_type is None or plan.model_id is None or plan.prompt is None:
        raise WorkflowRunStepCompilationError("Workflow step is not executable")
    user = session.get(User, run.owner_user_id)
    quota = session.scalar(
        select(Quota).where(Quota.user_id == run.owner_user_id).with_for_update()
    )
    quota_type = "text" if plan.media_type == "script" else plan.media_type
    if user is None or user.generation_status != "enabled":
        raise WorkflowRunStepCompilationError("Generation is frozen")
    if quota is None or getattr(quota, f"{quota_type}_quota", 0) < 1:
        raise WorkflowRunStepCompilationError(
            f"Insufficient {plan.media_type} quota"
        )
    task_id = stable_workflow_run_id(run.id, "job", instance_step.id)
    client_request_id = stable_workflow_run_id(
        run.id,
        "request",
        instance_step.id,
    )
    workflow_step = {
        "contract_version": 1,
        "run_id": run.id,
        "run_step_id": run_step.id,
        "instance_id": run.instance_id,
        "instance_step_id": instance_step.id,
        "step_id": instance_step.step_key,
        "intent": plan.intent,
        "preflight_fingerprint": run.preflight_fingerprint,
    }
    input_payload = {
        "prompt": plan.prompt,
        "workflow_step": workflow_step,
        "provider_request": deepcopy(plan.provider_request),
    }
    request_fingerprint = _fingerprint(
        {
            "user_id": run.owner_user_id,
            "project_id": run.project_id,
            "canvas_id": run.canvas_id,
            "node_id": instance_step.canvas_node_id,
            "media_type": plan.media_type,
            "provider_id": "agnes",
            "model_id": plan.model_id,
            "input": input_payload,
        }
    )
    existing = session.get(GenerationTask, task_id)
    if existing is None:
        now = utc_now()
        session.add(
            GenerationTask(
                id=task_id,
                user_id=run.owner_user_id,
                project_id=run.project_id,
                origin_canvas_id=run.canvas_id,
                canvas_node_id=instance_step.canvas_node_id,
                media_type=plan.media_type,
                provider="agnes",
                model=plan.model_id,
                client_request_id=client_request_id,
                request_fingerprint=request_fingerprint,
                request_parameters={
                    "contract": "revid.generation-job.v2",
                    "input": input_payload,
                },
                progress_stage="queued",
                status="queued",
                job_version=1,
                attempt_count=0,
                retry_count=0,
                created_at=now,
                updated_at=now,
            )
        )
    elif (
        existing.client_request_id != client_request_id
        or existing.request_fingerprint != request_fingerprint
    ):
        raise WorkflowRunConflictError(
            "Workflow run job identity conflict",
            code="workflow_run_job_conflict",
        )
    run_step.generation_task_id = task_id
    run_step.status = "queued"
    run_step.attempt_count += 1
    run_step.updated_at = utc_now()
