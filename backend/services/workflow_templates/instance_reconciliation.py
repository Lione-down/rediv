from __future__ import annotations

from types import SimpleNamespace

from sqlalchemy import or_, select

from controllers.workflow_templates import WorkflowTemplateConflictError
from models.base import utc_now
from models.canvas_node import CanvasNode
from models.workflow_template import (
    WorkflowTemplateInstance,
    WorkflowTemplateVersion,
)
from models.workflow_template_instance_lifecycle import (
    WorkflowTemplateInstanceLifecycleCommit,
)
from schemas.workflow_template import WorkflowTemplateManifest
from services.workflow_templates.instance_bindings import migrate_instance_bindings
from services.workflow_templates.instance_overrides import (
    detect_instance_local_overrides,
    local_override_snapshot,
)


class WorkflowTemplateInstanceReconciliationError(ValueError):
    pass


def _marker(content: dict, instance_id: str) -> tuple[bool, int] | None:
    lifecycle = content.get("workflow_template_instance")
    if isinstance(lifecycle, dict) and lifecycle.get("contract_version") == 1:
        if lifecycle.get("instance_id") != instance_id:
            return None
        version = lifecycle.get("template_version")
        managed = lifecycle.get("managed")
        if isinstance(version, int) and isinstance(managed, bool):
            return managed, version
        raise WorkflowTemplateInstanceReconciliationError(
            "workflow_template_instance_marker_invalid"
        )
    lineage = content.get("workflow_template_lineage")
    if isinstance(lineage, dict) and lineage.get("contract_version") == 1:
        if lineage.get("instance_id") != instance_id:
            return None
        version = lineage.get("template_version")
        if isinstance(version, int):
            return True, version
        raise WorkflowTemplateInstanceReconciliationError(
            "workflow_template_instance_marker_invalid"
        )
    return None


def _upgrade_history_allows(
    session,
    *,
    instance_id: str,
    source_version: int,
    target_version: int,
) -> bool:
    return session.scalar(
        select(WorkflowTemplateInstanceLifecycleCommit.id).where(
            WorkflowTemplateInstanceLifecycleCommit.instance_id == instance_id,
            WorkflowTemplateInstanceLifecycleCommit.action == "upgrade",
            or_(
                (
                    WorkflowTemplateInstanceLifecycleCommit.source_version
                    == source_version
                )
                & (
                    WorkflowTemplateInstanceLifecycleCommit.target_version
                    == target_version
                ),
                (
                    WorkflowTemplateInstanceLifecycleCommit.source_version
                    == target_version
                )
                & (
                    WorkflowTemplateInstanceLifecycleCommit.target_version
                    == source_version
                ),
            ),
        )
    ) is not None


def _undo_source_version(
    session,
    *,
    instance_id: str,
    current_version: int,
) -> int | None:
    commit = session.scalar(
        select(WorkflowTemplateInstanceLifecycleCommit)
        .where(
            WorkflowTemplateInstanceLifecycleCommit.instance_id == instance_id,
            WorkflowTemplateInstanceLifecycleCommit.action == "upgrade",
            WorkflowTemplateInstanceLifecycleCommit.target_version == current_version,
        )
        .order_by(WorkflowTemplateInstanceLifecycleCommit.created_at.desc())
        .limit(1)
    )
    return commit.source_version if commit is not None else None


def reconcile_template_instances_for_canvas_patch(
    session,
    *,
    project_id: str,
    canvas_id: str,
    owner_user_id: str,
    changed_node_ids: set[str],
) -> None:
    if not changed_node_ids:
        return
    instances = list(
        session.scalars(
            select(WorkflowTemplateInstance)
            .where(
                WorkflowTemplateInstance.project_id == project_id,
                WorkflowTemplateInstance.canvas_id == canvas_id,
                WorkflowTemplateInstance.owner_user_id == owner_user_id,
            )
            .with_for_update()
        ).all()
    )
    now = utc_now()
    for instance in instances:
        instance_node_ids = set(instance.node_id_map.values())
        if not instance_node_ids.intersection(changed_node_ids):
            continue
        nodes = {
            node.id: node
            for node in session.scalars(
                select(CanvasNode)
                .where(
                    CanvasNode.canvas_id == canvas_id,
                    CanvasNode.id.in_(instance_node_ids or [""]),
                    CanvasNode.status != "deleted",
                )
                .with_for_update()
            ).all()
        }
        if set(nodes) != instance_node_ids:
            instance.status = "detached"
            instance.detached_at = now
            instance.preflight_fingerprint = None
            instance.updated_at = now
            continue
        resolved_markers = [
            _marker(node.content, instance.id)
            for node in nodes.values()
        ]
        markers = [
            marker
            for marker in resolved_markers
            if marker is not None
        ]
        if markers and len(markers) != len(nodes):
            raise WorkflowTemplateInstanceReconciliationError(
                "workflow_template_instance_marker_inconsistent"
            )
        current_version = session.get(WorkflowTemplateVersion, instance.version_id)
        if current_version is None:
            raise WorkflowTemplateInstanceReconciliationError(
                "workflow_template_instance_version_missing"
            )
        if not markers:
            managed_values = {True}
            version_values = {
                _undo_source_version(
                    session,
                    instance_id=instance.id,
                    current_version=current_version.version,
                )
                or current_version.version
            }
        else:
            managed_values = {managed for managed, _version in markers}
            version_values = {version for _managed, version in markers}
        if len(managed_values) != 1 or len(version_values) != 1:
            raise WorkflowTemplateInstanceReconciliationError(
                "workflow_template_instance_marker_inconsistent"
            )
        managed = managed_values.pop()
        desired_version_number = version_values.pop()
        if not managed:
            instance.status = "detached"
            instance.detached_at = now
            instance.preflight_fingerprint = None
            instance.updated_at = now
            continue
        if desired_version_number != current_version.version:
            if not _upgrade_history_allows(
                session,
                instance_id=instance.id,
                source_version=current_version.version,
                target_version=desired_version_number,
            ):
                raise WorkflowTemplateInstanceReconciliationError(
                    "workflow_template_instance_version_transition_uncommitted"
                )
            target = session.scalar(
                select(WorkflowTemplateVersion)
                .where(
                    WorkflowTemplateVersion.definition_id == instance.definition_id,
                    WorkflowTemplateVersion.version == desired_version_number,
                    WorkflowTemplateVersion.lifecycle == "published",
                )
                .with_for_update()
            )
            if target is None:
                raise WorkflowTemplateInstanceReconciliationError(
                    "workflow_template_instance_target_version_missing"
                )
            try:
                target_manifest = WorkflowTemplateManifest.model_validate(target.manifest)
                migrate_instance_bindings(
                    session,
                    context=SimpleNamespace(
                        instance=instance,
                        version=current_version,
                    ),
                    target=target,
                    target_manifest=target_manifest,
                    allow_target_slot_removal=True,
                )
            except WorkflowTemplateConflictError as error:
                raise WorkflowTemplateInstanceReconciliationError(error.code) from error
        overrides, _nodes = detect_instance_local_overrides(
            session,
            instance=instance,
        )
        instance.local_overrides = local_override_snapshot(overrides)
        instance.status = "locally_modified" if overrides else "instantiated"
        instance.detached_at = None
        instance.preflight_fingerprint = None
        instance.updated_at = now
