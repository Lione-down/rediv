from __future__ import annotations

from copy import deepcopy
from uuid import NAMESPACE_URL, uuid5

from sqlalchemy import select

from controllers import canvas_document_mutations as mutation_controller
from controllers.workflow_template_instance_context import (
    build_version_diff,
    load_instance_context,
    require_managed_instance,
    require_no_active_run,
    target_version,
)
from controllers.workflow_templates import WorkflowTemplateConflictError
from models.base import get_session, utc_now
from models.canvas_revision import CanvasRevision
from models.workflow_template_instance_lifecycle import (
    WorkflowTemplateInstanceLifecycleCommit,
)
from schemas.canvas_document import CanvasDocumentPatchRequest
from schemas.workflow_template_instance import (
    WorkflowTemplateDetachRequest,
    WorkflowTemplateUpgradeRequest,
    WorkflowTemplateVersionDiffRequest,
)
from services.workflow_templates.instance_lifecycle import (
    instance_lifecycle_request_fingerprint,
    lifecycle_node_content,
    node_upsert_payload,
)
from services.workflow_templates.instance_bindings import migrate_instance_bindings
from services.workflow_templates.instance_overrides import (
    detect_instance_local_overrides,
    local_override_snapshot,
)


_REVISION_METADATA_KEY = "workflow_template_instance_lifecycle"


def _lifecycle_replay(
    session,
    *,
    canvas_id: str,
    instance_id: str,
    client_mutation_id: str,
    action: str,
    request_fingerprint: str,
) -> dict | None:
    commit = session.scalar(
        select(WorkflowTemplateInstanceLifecycleCommit)
        .where(
            WorkflowTemplateInstanceLifecycleCommit.canvas_id == canvas_id,
            WorkflowTemplateInstanceLifecycleCommit.client_mutation_id
            == client_mutation_id,
        )
        .with_for_update()
    )
    revision = session.scalar(
        select(CanvasRevision)
        .where(
            CanvasRevision.canvas_id == canvas_id,
            CanvasRevision.client_mutation_id == client_mutation_id,
        )
        .with_for_update()
    )
    if commit is None and revision is None:
        return None
    if (
        commit is None
        or commit.instance_id != instance_id
        or commit.action != action
        or commit.request_fingerprint != request_fingerprint
        or (
            revision is not None
            and (
                revision.revision_no != commit.canvas_revision
                or revision.operations.get(_REVISION_METADATA_KEY, {}).get(
                    "request_fingerprint"
                )
                != request_fingerprint
            )
        )
    ):
        raise mutation_controller.CanvasDocumentConflictError(
            "mutation_id_reused",
            commit.canvas_revision
            if commit is not None
            else revision.revision_no
            if revision is not None
            else 0,
        )
    result = deepcopy(commit.response_snapshot)
    result["_is_replay"] = True
    return result


def _managed_marker_mutation(
    *,
    context,
    nodes: dict,
    managed: bool,
    template_version: int,
    client_mutation_id: str,
) -> dict:
    missing = sorted(set(context.instance.node_id_map.values()) - set(nodes))
    if missing:
        raise WorkflowTemplateConflictError(
            "Workflow-template instance nodes are unavailable",
            code="workflow_template_instance_nodes_missing",
        )
    upserts = []
    for local_id, node_id in sorted(context.instance.node_id_map.items()):
        node = nodes[node_id]
        content = lifecycle_node_content(
            node.content,
            template_id=context.definition.template_key,
            template_version=template_version,
            instance_id=context.instance.id,
            managed=managed,
        )
        upserts.append(node_upsert_payload(node, content=content))
    return CanvasDocumentPatchRequest.model_validate(
        {
            "base_revision": context.canvas.graph_revision,
            "client_mutation_id": client_mutation_id,
            "node_upserts": upserts,
            "node_deletes": [],
            "connection_upserts": [],
            "connection_deletes": [],
        }
    ).model_dump(mode="json")


def _persist_lifecycle_commit(
    session,
    *,
    context,
    action: str,
    request,
    request_fingerprint: str,
    source_version: int,
    target_version_number: int | None,
    mutation: dict,
    result: dict,
) -> None:
    revision = session.scalar(
        select(CanvasRevision)
        .where(
            CanvasRevision.canvas_id == context.canvas.id,
            CanvasRevision.client_mutation_id == request.client_mutation_id,
        )
        .with_for_update()
    )
    if revision is None:
        raise RuntimeError("Workflow-template lifecycle revision was not persisted")
    operations = deepcopy(revision.operations)
    operations[_REVISION_METADATA_KEY] = {
        "action": action,
        "instance_id": context.instance.id,
        "request_fingerprint": request_fingerprint,
        "source_version": source_version,
        "target_version": target_version_number,
    }
    revision.operations = operations
    commit_id = str(
        uuid5(
            NAMESPACE_URL,
            (
                f"revid:{context.canvas.id}:workflow-template-lifecycle:"
                f"{request.client_mutation_id}"
            ),
        )
    )
    session.add(
        WorkflowTemplateInstanceLifecycleCommit(
            id=commit_id,
            instance_id=context.instance.id,
            canvas_id=context.canvas.id,
            client_mutation_id=request.client_mutation_id,
            action=action,
            request_fingerprint=request_fingerprint,
            source_version=source_version,
            target_version=target_version_number,
            canvas_revision=mutation["revision"],
            response_snapshot=deepcopy(result),
            created_at=utc_now(),
        )
    )


def preview_version_diff(
    *,
    project_id: str,
    canvas_id: str,
    instance_id: str,
    owner_user_id: str,
    request: WorkflowTemplateVersionDiffRequest,
) -> dict:
    with get_session() as session:
        context = load_instance_context(
            session,
            project_id=project_id,
            canvas_id=canvas_id,
            instance_id=instance_id,
            owner_user_id=owner_user_id,
            lock=False,
        )
        _target, target_manifest = target_version(
            session,
            context=context,
            version_number=request.target_version,
            lock=False,
        )
        return build_version_diff(
            session,
            context=context,
            target_manifest=target_manifest,
        )


def read_instance_state(
    *,
    project_id: str,
    canvas_id: str,
    instance_id: str,
    owner_user_id: str,
) -> dict:
    with get_session() as session:
        context = load_instance_context(
            session,
            project_id=project_id,
            canvas_id=canvas_id,
            instance_id=instance_id,
            owner_user_id=owner_user_id,
            lock=False,
        )
        local_overrides, _nodes = detect_instance_local_overrides(
            session,
            instance=context.instance,
        )
        state = (
            "detached"
            if context.instance.status == "detached"
            else "locally_modified"
            if local_overrides
            else context.instance.status
        )
        return {
            "instance_id": context.instance.id,
            "template_id": context.definition.template_key,
            "template_version": context.version.version,
            "project_id": project_id,
            "canvas_id": canvas_id,
            "state": state,
            "node_id_map": deepcopy(context.instance.node_id_map),
            "local_overrides": deepcopy(local_overrides),
        }


def upgrade_instance(
    *,
    project_id: str,
    canvas_id: str,
    instance_id: str,
    owner_user_id: str,
    request: WorkflowTemplateUpgradeRequest,
) -> dict:
    with get_session() as session:
        context = load_instance_context(
            session,
            project_id=project_id,
            canvas_id=canvas_id,
            instance_id=instance_id,
            owner_user_id=owner_user_id,
            lock=True,
        )
        request_fingerprint = instance_lifecycle_request_fingerprint(
            project_id=project_id,
            canvas_id=canvas_id,
            instance_id=instance_id,
            action="upgrade",
            request=request,
        )
        replay = _lifecycle_replay(
            session,
            canvas_id=canvas_id,
            instance_id=instance_id,
            client_mutation_id=request.client_mutation_id,
            action="upgrade",
            request_fingerprint=request_fingerprint,
        )
        if replay is not None:
            return replay
        require_managed_instance(context)
        require_no_active_run(session, instance_id)
        if context.canvas.graph_revision != request.base_revision:
            raise mutation_controller.CanvasDocumentConflictError(
                "stale_graph_revision",
                context.canvas.graph_revision,
            )
        target, target_manifest = target_version(
            session,
            context=context,
            version_number=request.target_version,
            lock=True,
        )
        diff = build_version_diff(
            session,
            context=context,
            target_manifest=target_manifest,
        )
        if diff["fingerprint"] != request.diff_fingerprint:
            raise WorkflowTemplateConflictError(
                "Workflow-template version diff is stale",
                code="workflow_template_version_diff_stale",
            )
        if not diff["compatible"]:
            raise WorkflowTemplateConflictError(
                "Workflow-template upgrade is incompatible",
                code="workflow_template_upgrade_incompatible",
            )
        local_overrides, nodes = detect_instance_local_overrides(
            session,
            instance=context.instance,
        )
        mutation_payload = _managed_marker_mutation(
            context=context,
            nodes=nodes,
            managed=True,
            template_version=target.version,
            client_mutation_id=request.client_mutation_id,
        )
        mutation = mutation_controller.apply_document_patch_in_session(
            session,
            project_id,
            canvas_id,
            owner_user_id,
            mutation_payload,
        )
        source_version = context.version.version
        migrate_instance_bindings(
            session,
            context=context,
            target=target,
            target_manifest=target_manifest,
        )
        now = utc_now()
        context.instance.status = (
            "locally_modified"
            if local_overrides
            else "instantiated"
        )
        context.instance.preflight_fingerprint = None
        context.instance.local_overrides = local_override_snapshot(local_overrides)
        context.instance.updated_at = now
        result = {
            "instance_id": context.instance.id,
            "source_instance_id": None,
            "template_id": context.definition.template_key,
            "template_version": target.version,
            "project_id": project_id,
            "canvas_id": canvas_id,
            "state": context.instance.status,
            "node_id_map": deepcopy(context.instance.node_id_map),
            "connection_id_map": {},
            "local_overrides": deepcopy(local_overrides),
            "mutation": mutation,
        }
        _persist_lifecycle_commit(
            session,
            context=context,
            action="upgrade",
            request=request,
            request_fingerprint=request_fingerprint,
            source_version=source_version,
            target_version_number=target.version,
            mutation=mutation,
            result=result,
        )
        session.commit()
        return result


def detach_instance(
    *,
    project_id: str,
    canvas_id: str,
    instance_id: str,
    owner_user_id: str,
    request: WorkflowTemplateDetachRequest,
) -> dict:
    with get_session() as session:
        context = load_instance_context(
            session,
            project_id=project_id,
            canvas_id=canvas_id,
            instance_id=instance_id,
            owner_user_id=owner_user_id,
            lock=True,
        )
        request_fingerprint = instance_lifecycle_request_fingerprint(
            project_id=project_id,
            canvas_id=canvas_id,
            instance_id=instance_id,
            action="detach",
            request=request,
        )
        replay = _lifecycle_replay(
            session,
            canvas_id=canvas_id,
            instance_id=instance_id,
            client_mutation_id=request.client_mutation_id,
            action="detach",
            request_fingerprint=request_fingerprint,
        )
        if replay is not None:
            return replay
        require_managed_instance(context)
        require_no_active_run(session, instance_id)
        if context.canvas.graph_revision != request.base_revision:
            raise mutation_controller.CanvasDocumentConflictError(
                "stale_graph_revision",
                context.canvas.graph_revision,
            )
        local_overrides, nodes = detect_instance_local_overrides(
            session,
            instance=context.instance,
        )
        mutation_payload = _managed_marker_mutation(
            context=context,
            nodes=nodes,
            managed=False,
            template_version=context.version.version,
            client_mutation_id=request.client_mutation_id,
        )
        mutation = mutation_controller.apply_document_patch_in_session(
            session,
            project_id,
            canvas_id,
            owner_user_id,
            mutation_payload,
        )
        now = utc_now()
        context.instance.status = "detached"
        context.instance.preflight_fingerprint = None
        context.instance.local_overrides = local_override_snapshot(local_overrides)
        context.instance.updated_at = now
        context.instance.detached_at = now
        result = {
            "instance_id": context.instance.id,
            "source_instance_id": None,
            "template_id": context.definition.template_key,
            "template_version": context.version.version,
            "project_id": project_id,
            "canvas_id": canvas_id,
            "state": "detached",
            "node_id_map": deepcopy(context.instance.node_id_map),
            "connection_id_map": {},
            "local_overrides": deepcopy(local_overrides),
            "mutation": mutation,
        }
        _persist_lifecycle_commit(
            session,
            context=context,
            action="detach",
            request=request,
            request_fingerprint=request_fingerprint,
            source_version=context.version.version,
            target_version_number=None,
            mutation=mutation,
            result=result,
        )
        session.commit()
        return result
