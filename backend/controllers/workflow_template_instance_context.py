from __future__ import annotations

from dataclasses import dataclass

from pydantic import ValidationError
from sqlalchemy import select

from controllers.workflow_templates import (
    WorkflowTemplateConflictError,
    WorkflowTemplateLifecycleError,
    WorkflowTemplateNotFoundError,
)
from core.workflow_template_contract import workflow_template_fingerprint
from models.canvas import Canvas
from models.project import Project
from models.workflow_run import WorkflowRun
from models.workflow_template import (
    WorkflowTemplateDefinition,
    WorkflowTemplateInstance,
    WorkflowTemplateVersion,
)
from schemas.workflow_template import WorkflowTemplateManifest
from services.workflow_templates.compatibility import (
    compare_workflow_template_manifests,
)
from services.workflow_templates.instance_lifecycle import (
    instance_diff_fingerprint,
)
from services.workflow_templates.instance_overrides import (
    detect_instance_local_overrides,
)


_NONTERMINAL_RUN_STATES = {
    "ready",
    "submitting",
    "queued",
    "running",
    "persisting",
}


@dataclass(frozen=True)
class InstanceContext:
    project: Project
    canvas: Canvas
    instance: WorkflowTemplateInstance
    definition: WorkflowTemplateDefinition
    version: WorkflowTemplateVersion
    manifest: WorkflowTemplateManifest


def _validated_manifest(
    version: WorkflowTemplateVersion,
    definition: WorkflowTemplateDefinition,
) -> WorkflowTemplateManifest:
    try:
        manifest = WorkflowTemplateManifest.model_validate(version.manifest)
    except ValidationError as error:
        raise WorkflowTemplateLifecycleError(
            "Workflow-template version is invalid",
            code="workflow_template_schema_invalid",
        ) from error
    if (
        manifest.template_id != definition.template_key
        or manifest.template_version != version.version
        or manifest.lifecycle != version.lifecycle
        or workflow_template_fingerprint(manifest) != version.fingerprint
    ):
        raise WorkflowTemplateConflictError(
            "Workflow-template version changed",
            code="workflow_template_version_conflict",
        )
    return manifest


def load_instance_context(
    session,
    *,
    project_id: str,
    canvas_id: str,
    instance_id: str,
    owner_user_id: str,
    lock: bool,
) -> InstanceContext:
    project_query = select(Project).where(Project.id == project_id)
    canvas_query = select(Canvas).where(
        Canvas.id == canvas_id,
        Canvas.project_id == project_id,
        Canvas.status == "active",
    )
    instance_query = select(WorkflowTemplateInstance).where(
        WorkflowTemplateInstance.id == instance_id,
        WorkflowTemplateInstance.owner_user_id == owner_user_id,
        WorkflowTemplateInstance.project_id == project_id,
        WorkflowTemplateInstance.canvas_id == canvas_id,
    )
    if lock:
        project_query = project_query.with_for_update()
        canvas_query = canvas_query.with_for_update()
        instance_query = instance_query.with_for_update()
    project = session.scalar(project_query)
    if project is None or project.user_id != owner_user_id:
        raise WorkflowTemplateNotFoundError("Project not found")
    canvas = session.scalar(canvas_query)
    if canvas is None:
        raise WorkflowTemplateNotFoundError("Canvas not found")
    instance = session.scalar(instance_query)
    if instance is None:
        raise WorkflowTemplateNotFoundError("Workflow-template instance not found")
    definition_query = select(WorkflowTemplateDefinition).where(
        WorkflowTemplateDefinition.id == instance.definition_id
    )
    version_query = select(WorkflowTemplateVersion).where(
        WorkflowTemplateVersion.id == instance.version_id,
        WorkflowTemplateVersion.definition_id == instance.definition_id,
    )
    if lock:
        definition_query = definition_query.with_for_update()
        version_query = version_query.with_for_update()
    definition = session.scalar(definition_query)
    version = session.scalar(version_query)
    if definition is None or version is None:
        raise WorkflowTemplateConflictError(
            "Workflow-template instance lineage is unavailable",
            code="workflow_template_instance_lineage_unavailable",
        )
    return InstanceContext(
        project=project,
        canvas=canvas,
        instance=instance,
        definition=definition,
        version=version,
        manifest=_validated_manifest(version, definition),
    )


def target_version(
    session,
    *,
    context: InstanceContext,
    version_number: int,
    lock: bool,
) -> tuple[WorkflowTemplateVersion, WorkflowTemplateManifest]:
    query = select(WorkflowTemplateVersion).where(
        WorkflowTemplateVersion.definition_id == context.definition.id,
        WorkflowTemplateVersion.version == version_number,
    )
    if lock:
        query = query.with_for_update()
    version = session.scalar(query)
    if (
        version is None
        or context.definition.status != "active"
        or version.lifecycle != "published"
    ):
        raise WorkflowTemplateConflictError(
            "Workflow-template target version is unavailable",
            code="workflow_template_version_unavailable",
        )
    return version, _validated_manifest(version, context.definition)


def require_managed_instance(context: InstanceContext) -> None:
    if context.instance.status == "detached":
        raise WorkflowTemplateConflictError(
            "Workflow-template instance is detached",
            code="workflow_template_instance_detached",
        )
    if context.instance.status not in {
        "instantiated",
        "locally_modified",
        "upgrade_available",
    }:
        raise WorkflowTemplateConflictError(
            "Workflow-template instance is unavailable",
            code="workflow_template_instance_unavailable",
        )


def require_no_active_run(session, instance_id: str) -> None:
    active = session.scalar(
        select(WorkflowRun.id)
        .where(
            WorkflowRun.instance_id == instance_id,
            WorkflowRun.status.in_(_NONTERMINAL_RUN_STATES),
        )
        .limit(1)
        .with_for_update()
    )
    if active is not None:
        raise WorkflowTemplateConflictError(
            "Workflow-template instance has an active run",
            code="workflow_template_instance_run_active",
        )


def build_version_diff(
    session,
    *,
    context: InstanceContext,
    target_manifest: WorkflowTemplateManifest,
) -> dict:
    require_managed_instance(context)
    comparison = compare_workflow_template_manifests(
        context.manifest,
        target_manifest,
    )
    local_overrides, _nodes = detect_instance_local_overrides(
        session,
        instance=context.instance,
    )
    state = (
        "locally_modified"
        if local_overrides
        else "upgrade_available"
    )
    fingerprint_payload = {
        "contract_version": 1,
        "instance_id": context.instance.id,
        "template_id": context.definition.template_key,
        "source_version": context.version.version,
        "target_version": target_manifest.template_version,
        "canvas_revision": context.canvas.graph_revision,
        "state": state,
        "compatible": comparison["compatible"],
        "changes": comparison["changes"],
        "blocking_reasons": comparison["blocking_reasons"],
        "local_overrides": local_overrides,
        "manifest_diff_fingerprint": comparison["fingerprint"],
    }
    return {
        key: value
        for key, value in fingerprint_payload.items()
        if key != "manifest_diff_fingerprint"
    } | {"fingerprint": instance_diff_fingerprint(fingerprint_payload)}
