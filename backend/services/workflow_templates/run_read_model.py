from __future__ import annotations

from copy import deepcopy

from sqlalchemy import select

from models.base import get_session, utc_now
from models.generation_task import GenerationTask
from models.workflow_run import WorkflowRun, WorkflowRunStep
from models.workflow_template import (
    WorkflowTemplateInstance,
    WorkflowTemplateVersion,
)
from models.workflow_template_lineage import WorkflowTemplateInstanceStep
from services.workflow_templates.run_context import (
    ACTIVE_RUN_STATUSES,
    WorkflowRunConflictError,
    WorkflowRunNotFoundError,
)


def workflow_run_response(session, run: WorkflowRun) -> dict:
    steps = list(
        session.scalars(
            select(WorkflowRunStep)
            .where(WorkflowRunStep.run_id == run.id)
            .order_by(WorkflowRunStep.created_at, WorkflowRunStep.id)
        ).all()
    )
    task_ids = [step.generation_task_id for step in steps if step.generation_task_id]
    tasks = (
        list(
            session.scalars(
                select(GenerationTask).where(GenerationTask.id.in_(task_ids))
            ).all()
        )
        if task_ids
        else []
    )
    tasks_by_id = {task.id: task for task in tasks}
    instance_steps = {
        step.id: step
        for step in session.scalars(
            select(WorkflowTemplateInstanceStep).where(
                WorkflowTemplateInstanceStep.instance_id == run.instance_id
            )
        ).all()
    }
    instance = session.get(WorkflowTemplateInstance, run.instance_id)
    version = (
        session.get(WorkflowTemplateVersion, instance.version_id)
        if instance is not None
        else None
    )
    manifest_order = (
        {
            step["step_id"]: index
            for index, step in enumerate((version.manifest or {}).get("steps", []))
            if isinstance(step, dict) and isinstance(step.get("step_id"), str)
        }
        if version is not None and isinstance(version.manifest, dict)
        else {}
    )
    steps.sort(
        key=lambda step: (
            manifest_order.get(
                instance_steps[step.instance_step_id].step_key,
                len(manifest_order),
            ),
            step.id,
        )
    )
    return {
        "run_id": run.id,
        "instance_id": run.instance_id,
        "status": run.status,
        "preflight_fingerprint": run.preflight_fingerprint,
        "quota_estimate": deepcopy(run.quota_estimate),
        "cost_class": run.cost_class,
        "created_at": run.created_at,
        "updated_at": run.updated_at,
        "completed_at": run.completed_at,
        "steps": [
            {
                "run_step_id": step.id,
                "instance_step_id": step.instance_step_id,
                "step_id": instance_steps[step.instance_step_id].step_key,
                "node_id": instance_steps[step.instance_step_id].canvas_node_id,
                "status": step.status,
                "generation_job_id": step.generation_task_id,
                "result_asset_id": (
                    tasks_by_id[step.generation_task_id].result_asset_id
                    if step.generation_task_id in tasks_by_id
                    else None
                ),
                "error_code": step.error_code,
            }
            for step in steps
        ],
    }


def get_workflow_run(
    *,
    owner_user_id: str,
    project_id: str,
    canvas_id: str,
    instance_id: str,
    run_id: str | None,
) -> dict:
    with get_session() as session:
        query = select(WorkflowRun).where(
            WorkflowRun.owner_user_id == owner_user_id,
            WorkflowRun.project_id == project_id,
            WorkflowRun.canvas_id == canvas_id,
            WorkflowRun.instance_id == instance_id,
        )
        if run_id is None:
            query = query.order_by(
                WorkflowRun.created_at.desc(),
                WorkflowRun.id.desc(),
            ).limit(1)
        else:
            query = query.where(WorkflowRun.id == run_id)
        run = session.scalar(query)
        if run is None:
            raise WorkflowRunNotFoundError(
                "Workflow run not found",
                code="workflow_run_not_found",
            )
        return workflow_run_response(session, run)


def cancel_workflow_run(
    *,
    owner_user_id: str,
    project_id: str,
    canvas_id: str,
    instance_id: str,
    run_id: str,
) -> dict:
    with get_session() as session:
        run = session.scalar(
            select(WorkflowRun)
            .where(
                WorkflowRun.id == run_id,
                WorkflowRun.owner_user_id == owner_user_id,
                WorkflowRun.project_id == project_id,
                WorkflowRun.canvas_id == canvas_id,
                WorkflowRun.instance_id == instance_id,
            )
            .with_for_update()
        )
        if run is None:
            raise WorkflowRunNotFoundError(
                "Workflow run not found",
                code="workflow_run_not_found",
            )
        if run.status not in ACTIVE_RUN_STATUSES:
            if run.status == "cancelled":
                return workflow_run_response(session, run)
            raise WorkflowRunConflictError(
                "Workflow run is already terminal",
                code="workflow_run_terminal",
            )
        steps = list(
            session.scalars(
                select(WorkflowRunStep)
                .where(WorkflowRunStep.run_id == run.id)
                .with_for_update()
            ).all()
        )
        for step in steps:
            if step.generation_task_id:
                task = session.get(GenerationTask, step.generation_task_id)
                if task is not None and task.status == "queued":
                    task.status = "cancelled"
                    task.progress_stage = None
                    task.cancel_requested_at = task.cancel_requested_at or utc_now()
                    task.job_version += 1
                    task.updated_at = utc_now()
                elif task is not None and task.status == "running":
                    task.status = "cancel_requested"
                    task.cancel_requested_at = task.cancel_requested_at or utc_now()
                    task.job_version += 1
                    task.updated_at = utc_now()
            if step.status not in {"succeeded", "failed", "blocked"}:
                step.status = "cancelled"
                step.updated_at = utc_now()
        run.status = "cancelled"
        run.completed_at = utc_now()
        run.updated_at = utc_now()
        session.commit()
        return workflow_run_response(session, run)
