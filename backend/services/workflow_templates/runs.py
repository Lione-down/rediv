from __future__ import annotations

from copy import deepcopy

from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.exc import OperationalError

from models.asset import Asset
from models.base import get_session, utc_now
from models.generation_task import GenerationTask
from models.workflow_run import WorkflowRun, WorkflowRunStep
from models.workflow_template_lineage import WorkflowTemplateInstanceStep
from services.workflow_templates.run_context import (
    ACTIVE_RUN_STATUSES,
    WorkflowRunConflictError,
    WorkflowRunNotFoundError,
    WorkflowRunServiceError,
    WorkflowRunValidationError,
    _load_context,
    _runtime_preflight,
    preflight_workflow_run,
)
from services.workflow_templates.run_jobs import (
    queue_workflow_run_job,
    stable_workflow_run_id,
    step_source_fingerprint,
)
from services.workflow_templates.run_read_model import (
    cancel_workflow_run,
    get_workflow_run,
    workflow_run_response,
)
from services.workflow_templates.run_steps import (
    WorkflowRunStepCompilationError,
    WorkflowRunStepPlan,
    compile_workflow_run_step,
)

def _start_workflow_run_once(
    *,
    owner_user_id: str,
    project_id: str,
    canvas_id: str,
    instance_id: str,
    request,
) -> dict:
    with get_session() as session:
        existing = session.scalar(
            select(WorkflowRun)
            .where(
                WorkflowRun.owner_user_id == owner_user_id,
                WorkflowRun.client_run_id == request.client_run_id,
            )
            .with_for_update()
        )
        if existing is not None:
            if (
                existing.instance_id != instance_id
                or existing.project_id != project_id
                or existing.canvas_id != canvas_id
                or existing.preflight_fingerprint != request.preflight_fingerprint
                or existing.cost_confirmed != request.cost_confirmed
            ):
                raise WorkflowRunConflictError(
                    "Client run ID already owns different workflow facts",
                    code="workflow_run_idempotency_conflict",
                )
            result = workflow_run_response(session, existing)
            result["_is_replay"] = True
            return result
        try:
            preflight, context = _runtime_preflight(
                session,
                owner_user_id=owner_user_id,
                project_id=project_id,
                canvas_id=canvas_id,
                instance_id=instance_id,
                cost_confirmed=request.cost_confirmed,
                lock=True,
            )
        except WorkflowRunConflictError as error:
            if error.code == "workflow_run_asset_binding_stale":
                raise WorkflowRunConflictError(
                    "Workflow run preflight changed",
                    code="workflow_run_preflight_stale",
                ) from error
            raise
        if (
            not preflight["executable"]
            or preflight["fingerprint"] != request.preflight_fingerprint
        ):
            raise WorkflowRunConflictError(
                "Workflow run preflight changed",
                code="workflow_run_preflight_stale",
            )
        instance, _version, _manifest, instance_steps, nodes, assets_by_slot = (
            context[:6]
        )
        try:
            plans = {
                step.id: compile_workflow_run_step(
                    step=step,
                    node=nodes[step.canvas_node_id],
                    assets_by_slot=assets_by_slot,
                )
                for step in instance_steps
            }
        except (WorkflowRunStepCompilationError, ValidationError, ValueError) as error:
            raise WorkflowRunConflictError(
                "Workflow run step changed",
                code="workflow_run_step_stale",
            ) from error
        now = utc_now()
        run = WorkflowRun(
            id=stable_workflow_run_id(
                owner_user_id,
                "workflow-run",
                request.client_run_id,
            ),
            instance_id=instance.id,
            owner_user_id=owner_user_id,
            project_id=project_id,
            canvas_id=canvas_id,
            status="ready",
            preflight_fingerprint=preflight["fingerprint"],
            client_run_id=request.client_run_id,
            cost_confirmed=request.cost_confirmed,
            quota_estimate=deepcopy(preflight["quota_estimate"]),
            cost_class=preflight["cost_class"],
            created_at=now,
            updated_at=now,
            completed_at=None,
        )
        session.add(run)
        run_steps: dict[str, WorkflowRunStep] = {}
        for instance_step in instance_steps:
            plan = plans[instance_step.id]
            run_step = WorkflowRunStep(
                id=stable_workflow_run_id(run.id, "step", instance_step.id),
                run_id=run.id,
                instance_id=instance.id,
                instance_step_id=instance_step.id,
                status="succeeded" if plan.is_satisfied else "draft",
                generation_task_id=None,
                dependency_snapshot={
                    "depends_on": list(
                        instance_step.configuration.get("depends_on", [])
                    ),
                    "source_fingerprint": step_source_fingerprint(
                        step=instance_step,
                        node=nodes[instance_step.canvas_node_id],
                        assets_by_slot=assets_by_slot,
                    ),
                    "preflight_fingerprint": preflight["fingerprint"],
                },
                attempt_count=0,
                error_code=None,
                created_at=now,
                updated_at=now,
            )
            session.add(run_step)
            run_steps[instance_step.step_key] = run_step
        session.flush()
        for instance_step in instance_steps:
            run_step = run_steps[instance_step.step_key]
            if run_step.status == "succeeded":
                continue
            dependencies = instance_step.configuration.get("depends_on", [])
            if all(run_steps[key].status == "succeeded" for key in dependencies):
                queue_workflow_run_job(
                    session,
                    run=run,
                    run_step=run_step,
                    instance_step=instance_step,
                    plan=plans[instance_step.id],
                )
        statuses = {step.status for step in run_steps.values()}
        run.status = (
            "succeeded"
            if statuses == {"succeeded"}
            else "queued"
            if "queued" in statuses
            else "ready"
        )
        run.completed_at = now if run.status == "succeeded" else None
        run.updated_at = now
        session.commit()
        session.expire_all()
        return workflow_run_response(session, run)


def _retryable_transaction_error(error: OperationalError) -> bool:
    arguments = getattr(error.orig, "args", ())
    return bool(arguments and arguments[0] in {1205, 1213})


def start_workflow_run(
    *,
    owner_user_id: str,
    project_id: str,
    canvas_id: str,
    instance_id: str,
    request,
) -> dict:
    for attempt in range(3):
        try:
            return _start_workflow_run_once(
                owner_user_id=owner_user_id,
                project_id=project_id,
                canvas_id=canvas_id,
                instance_id=instance_id,
                request=request,
            )
        except OperationalError as error:
            if not _retryable_transaction_error(error):
                raise
            if attempt == 2:
                raise WorkflowRunConflictError(
                    "Workflow run is busy",
                    code="workflow_run_concurrent_conflict",
                ) from error
    raise AssertionError("unreachable")


def _apply_job_state(step: WorkflowRunStep, task: GenerationTask) -> bool:
    mapped = {
        "queued": "queued",
        "running": (
            "persisting" if task.progress_stage == "persisting" else "running"
        ),
        "succeeded": "succeeded",
        "failed": "failed",
        "timed_out": "failed",
        "cancel_requested": "running",
        "cancelled": "cancelled",
    }[task.status]
    changed = step.status != mapped
    step.status = mapped
    step.attempt_count = max(step.attempt_count, task.attempt_count)
    if mapped == "failed":
        step.error_code = task.error_code or (
            "workflow_generation_timed_out"
            if task.status == "timed_out"
            else "workflow_generation_failed"
        )
    step.updated_at = utc_now()
    return changed


def _dependency_assets(
    session,
    *,
    run: WorkflowRun,
    instance_step: WorkflowTemplateInstanceStep,
    by_key: dict[str, WorkflowRunStep],
) -> list[Asset]:
    assets: list[Asset] = []
    for dependency_key in instance_step.configuration.get("depends_on", []):
        dependency_step = by_key[dependency_key]
        if dependency_step.generation_task_id is None:
            continue
        dependency_task = session.get(
            GenerationTask,
            dependency_step.generation_task_id,
        )
        asset = (
            session.get(Asset, dependency_task.result_asset_id)
            if dependency_task is not None
            and dependency_task.result_asset_id is not None
            else None
        )
        if (
            dependency_task is None
            or asset is None
            or asset.user_id != run.owner_user_id
            or asset.project_id != run.project_id
            or asset.status != "active"
            or asset.source_task_id != dependency_task.id
        ):
            raise WorkflowRunStepCompilationError(
                "Workflow dependency result lineage is unavailable"
            )
        assets.append(asset)
    return assets


def _reconcile_run(session, run: WorkflowRun) -> bool:
    changed = False
    steps = list(
        session.scalars(
            select(WorkflowRunStep)
            .where(WorkflowRunStep.run_id == run.id)
            .order_by(WorkflowRunStep.created_at, WorkflowRunStep.id)
            .with_for_update()
        ).all()
    )
    instance_steps = {
        step.id: step
        for step in session.scalars(
            select(WorkflowTemplateInstanceStep).where(
                WorkflowTemplateInstanceStep.instance_id == run.instance_id
            )
        ).all()
    }
    by_key = {
        instance_steps[step.instance_step_id].step_key: step for step in steps
    }
    for step in steps:
        if step.generation_task_id is None:
            continue
        task = session.get(GenerationTask, step.generation_task_id)
        if task is None:
            step.status = "failed"
            step.error_code = "workflow_generation_job_missing"
            step.updated_at = utc_now()
            changed = True
        else:
            changed = _apply_job_state(step, task) or changed
    context = None
    for step in steps:
        if step.status != "draft":
            continue
        instance_step = instance_steps[step.instance_step_id]
        dependency_states = [
            by_key[key].status
            for key in instance_step.configuration.get("depends_on", [])
        ]
        if any(
            state in {"failed", "blocked", "cancelled"}
            for state in dependency_states
        ):
            step.status = "blocked"
            step.error_code = "workflow_dependency_failed"
            step.updated_at = utc_now()
            changed = True
            continue
        if not all(state == "succeeded" for state in dependency_states):
            continue
        try:
            if context is None:
                context = _load_context(
                    session,
                    owner_user_id=run.owner_user_id,
                    project_id=run.project_id,
                    canvas_id=run.canvas_id,
                    instance_id=run.instance_id,
                    lock=True,
                )
            node = context[4][instance_step.canvas_node_id]
            current_fingerprint = step_source_fingerprint(
                step=instance_step,
                node=node,
                assets_by_slot=context[5],
            )
            if current_fingerprint != step.dependency_snapshot["source_fingerprint"]:
                raise WorkflowRunStepCompilationError(
                    "Workflow step changed after run confirmation"
                )
            plan = compile_workflow_run_step(
                step=instance_step,
                node=node,
                assets_by_slot=context[5],
                dependency_assets=_dependency_assets(
                    session,
                    run=run,
                    instance_step=instance_step,
                    by_key=by_key,
                ),
            )
            queue_workflow_run_job(
                session,
                run=run,
                run_step=step,
                instance_step=instance_step,
                plan=plan,
            )
            changed = True
        except (WorkflowRunServiceError, WorkflowRunStepCompilationError, ValueError):
            step.status = "failed"
            step.error_code = "workflow_run_step_stale"
            step.updated_at = utc_now()
            changed = True
    statuses = {step.status for step in steps}
    previous = run.status
    if statuses and statuses.issubset({"succeeded"}):
        run.status = "succeeded"
    elif statuses & {"failed", "blocked"} and not statuses & {
        "queued",
        "running",
        "persisting",
        "draft",
    }:
        run.status = "failed"
    elif statuses & {"running", "persisting"}:
        run.status = "running"
    elif "queued" in statuses:
        run.status = "queued"
    else:
        run.status = "ready"
    if run.status in {"succeeded", "failed", "cancelled"}:
        run.completed_at = run.completed_at or utc_now()
    run.updated_at = utc_now()
    return changed or previous != run.status


def reconcile_workflow_run_for_job(job_id: str) -> bool:
    with get_session() as session:
        run = session.scalar(
            select(WorkflowRun)
            .join(WorkflowRunStep, WorkflowRunStep.run_id == WorkflowRun.id)
            .where(
                WorkflowRunStep.generation_task_id == job_id,
                WorkflowRun.status.in_(ACTIVE_RUN_STATUSES),
            )
            .with_for_update()
        )
        if run is None:
            return False
        changed = _reconcile_run(session, run)
        session.commit()
        return changed


def reconcile_next_workflow_run() -> bool:
    with get_session() as session:
        run = session.scalar(
            select(WorkflowRun)
            .where(WorkflowRun.status.in_(ACTIVE_RUN_STATUSES))
            .order_by(WorkflowRun.updated_at, WorkflowRun.id)
            .limit(1)
            .with_for_update(skip_locked=True)
        )
        if run is None:
            return False
        changed = _reconcile_run(session, run)
        session.commit()
        return changed
