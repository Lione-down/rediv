from __future__ import annotations

from copy import deepcopy

from sqlalchemy import null, select

from controllers import canvas_document_mutations as mutation_controller
from controllers.workflow_template_instance_context import (
    load_instance_context,
    require_managed_instance,
    require_no_active_run,
)
from controllers.workflow_templates import WorkflowTemplateConflictError
from models.base import get_session, utc_now
from models.canvas_connection import CanvasConnection
from models.canvas_node import CanvasNode
from models.canvas_revision import CanvasRevision
from models.workflow_template import WorkflowTemplateInstance
from models.workflow_template_lineage import (
    WorkflowTemplateAssetBindingItem,
    WorkflowTemplateBinding,
    WorkflowTemplateInstanceCommit,
    WorkflowTemplateInstanceStep,
)
from schemas.canvas_document import CanvasDocumentPatchRequest
from schemas.workflow_template_instance import WorkflowTemplateCloneRequest
from services.workflow_templates.instance_lifecycle import (
    instance_lifecycle_request_fingerprint,
    lifecycle_node_content,
    node_upsert_payload,
)
from services.workflow_templates.instance_overrides import (
    detect_instance_local_overrides,
    local_override_snapshot,
    remap_local_overrides,
)
from services.workflow_templates.instances import stable_instance_entity_id
from services.workflow_templates.lineage import workflow_template_lineage_id


_REVISION_METADATA_KEY = "workflow_template_instance_clone"


def _clone_replay(
    session,
    *,
    canvas_id: str,
    client_mutation_id: str,
    source_instance_id: str,
    request_fingerprint: str,
) -> dict | None:
    revision = session.scalar(
        select(CanvasRevision)
        .where(
            CanvasRevision.canvas_id == canvas_id,
            CanvasRevision.client_mutation_id == client_mutation_id,
        )
        .with_for_update()
    )
    instance = session.scalar(
        select(WorkflowTemplateInstance)
        .where(
            WorkflowTemplateInstance.canvas_id == canvas_id,
            WorkflowTemplateInstance.client_mutation_id == client_mutation_id,
        )
        .with_for_update()
    )
    commit = (
        session.scalar(
            select(WorkflowTemplateInstanceCommit)
            .where(WorkflowTemplateInstanceCommit.instance_id == instance.id)
            .with_for_update()
        )
        if instance is not None
        else None
    )
    if revision is None and instance is None and commit is None:
        return None
    snapshot = commit.response_snapshot if commit is not None else {}
    if (
        instance is None
        or commit is None
        or commit.request_fingerprint != request_fingerprint
        or snapshot.get("instance_id") != instance.id
        or snapshot.get("source_instance_id") != source_instance_id
        or (
            revision is not None
            and (
                commit.canvas_revision != revision.revision_no
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
    result = deepcopy(snapshot)
    result["_is_replay"] = True
    return result


def _clone_bindings(session, *, source_instance_id: str, clone_instance_id: str) -> None:
    now = utc_now()
    bindings = list(
        session.scalars(
            select(WorkflowTemplateBinding)
            .where(WorkflowTemplateBinding.instance_id == source_instance_id)
            .with_for_update()
        ).all()
    )
    for binding in bindings:
        clone_binding_id = workflow_template_lineage_id(
            clone_instance_id,
            "binding",
            binding.id,
        )
        session.add(
            WorkflowTemplateBinding(
                id=clone_binding_id,
                instance_id=clone_instance_id,
                version_id=binding.version_id,
                slot_id=binding.slot_id,
                binding_type=binding.binding_type,
                value_json=(
                    null()
                    if binding.binding_type == "asset"
                    else deepcopy(binding.value_json)
                ),
                asset_id=binding.asset_id,
                source_revision=binding.source_revision,
                created_at=now,
                updated_at=now,
            )
        )
        session.flush()
        items = list(
            session.scalars(
                select(WorkflowTemplateAssetBindingItem)
                .where(
                    WorkflowTemplateAssetBindingItem.binding_id == binding.id
                )
                .order_by(WorkflowTemplateAssetBindingItem.position)
                .with_for_update()
            ).all()
        )
        for item in items:
            session.add(
                WorkflowTemplateAssetBindingItem(
                    id=workflow_template_lineage_id(
                        clone_instance_id,
                        "asset-binding-item",
                        f"{binding.id}:{item.position}",
                    ),
                    binding_id=clone_binding_id,
                    asset_id=item.asset_id,
                    source_revision=item.source_revision,
                    position=item.position,
                    created_at=now,
                    updated_at=now,
                )
            )


def clone_instance(
    *,
    project_id: str,
    canvas_id: str,
    instance_id: str,
    owner_user_id: str,
    request: WorkflowTemplateCloneRequest,
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
            action="clone",
            request=request,
        )
        replay = _clone_replay(
            session,
            canvas_id=canvas_id,
            client_mutation_id=request.client_mutation_id,
            source_instance_id=instance_id,
            request_fingerprint=request_fingerprint,
        )
        if replay is not None:
            return replay
        require_managed_instance(context)
        require_no_active_run(session, instance_id)
        if context.version.lifecycle != "published":
            raise WorkflowTemplateConflictError(
                "Workflow-template version is unavailable for clone",
                code="workflow_template_version_unavailable",
            )
        if context.canvas.graph_revision != request.base_revision:
            raise mutation_controller.CanvasDocumentConflictError(
                "stale_graph_revision",
                context.canvas.graph_revision,
            )
        local_overrides, source_nodes = detect_instance_local_overrides(
            session,
            instance=context.instance,
        )
        missing = sorted(set(context.instance.node_id_map.values()) - set(source_nodes))
        if missing:
            raise WorkflowTemplateConflictError(
                "Workflow-template instance nodes are unavailable",
                code="workflow_template_instance_nodes_missing",
            )
        clone_instance_id = stable_instance_entity_id(
            template_id=context.definition.template_key,
            template_version=context.version.version,
            canvas_id=canvas_id,
            client_mutation_id=request.client_mutation_id,
            entity_kind="instance",
            local_id="instance",
        )
        clone_node_map = {
            local_id: stable_instance_entity_id(
                template_id=context.definition.template_key,
                template_version=context.version.version,
                canvas_id=canvas_id,
                client_mutation_id=request.client_mutation_id,
                entity_kind="node",
                local_id=local_id,
            )
            for local_id in context.instance.node_id_map
        }
        source_steps = list(
            session.scalars(
                select(WorkflowTemplateInstanceStep)
                .where(
                    WorkflowTemplateInstanceStep.instance_id == context.instance.id
                )
                .with_for_update()
            ).all()
        )
        clone_step_map = {
            step.step_key: workflow_template_lineage_id(
                clone_instance_id,
                "step",
                step.step_key,
            )
            for step in source_steps
        }
        replacements = {
            context.instance.id: clone_instance_id,
            **{
                source_id: clone_node_map[local_id]
                for local_id, source_id in context.instance.node_id_map.items()
            },
            **{
                step.id: clone_step_map[step.step_key]
                for step in source_steps
            },
        }
        clone_local_overrides = remap_local_overrides(
            local_overrides,
            replacements,
        )
        min_x = min(node.position_x for node in source_nodes.values())
        min_y = min(node.position_y for node in source_nodes.values())
        anchor_x = request.anchor.x if request.anchor is not None else min_x + 80
        anchor_y = request.anchor.y if request.anchor is not None else min_y + 80
        delta_x = anchor_x - min_x
        delta_y = anchor_y - min_y
        node_upserts = []
        for local_id, source_node_id in sorted(context.instance.node_id_map.items()):
            source_node = source_nodes[source_node_id]
            cloned_parent = (
                replacements.get(source_node.parent_node_id)
                if source_node.parent_node_id is not None
                else None
            )
            if source_node.parent_node_id is not None and cloned_parent is None:
                raise WorkflowTemplateConflictError(
                    "External group parent cannot be cloned",
                    code="workflow_template_clone_external_parent",
                )
            content = lifecycle_node_content(
                source_node.content,
                template_id=context.definition.template_key,
                template_version=context.version.version,
                instance_id=clone_instance_id,
                managed=True,
                replacements=replacements,
            )
            cloned_payload = node_upsert_payload(
                source_node,
                content=content,
                position_x=source_node.position_x + delta_x,
                position_y=source_node.position_y + delta_y,
                parent_node_id=cloned_parent,
            )
            cloned_payload["id"] = clone_node_map[local_id]
            node_upserts.append(cloned_payload)
        source_node_ids = set(context.instance.node_id_map.values())
        internal_connections = list(
            session.scalars(
                select(CanvasConnection)
                .where(
                    CanvasConnection.canvas_id == canvas_id,
                    CanvasConnection.source_node_id.in_(source_node_ids),
                    CanvasConnection.target_node_id.in_(source_node_ids),
                    CanvasConnection.status != "deleted",
                )
                .order_by(CanvasConnection.id)
                .with_for_update()
            ).all()
        )
        source_commit = session.get(WorkflowTemplateInstanceCommit, instance_id)
        baseline_connection_map = (
            source_commit.response_snapshot.get("connection_id_map", {})
            if source_commit is not None
            else {}
        )
        local_by_connection_id = {
            connection_id: local_id
            for local_id, connection_id in baseline_connection_map.items()
        }
        clone_connection_map: dict[str, str] = {}
        connection_upserts = []
        for index, connection in enumerate(internal_connections):
            local_id = local_by_connection_id.get(
                connection.id,
                f"local_override_{index + 1:03d}",
            )
            clone_connection_id = stable_instance_entity_id(
                template_id=context.definition.template_key,
                template_version=context.version.version,
                canvas_id=canvas_id,
                client_mutation_id=request.client_mutation_id,
                entity_kind="connection",
                local_id=local_id,
            )
            clone_connection_map[local_id] = clone_connection_id
            connection_upserts.append(
                {
                    "id": clone_connection_id,
                    "source_node_id": replacements[connection.source_node_id],
                    "source_port": connection.source_port,
                    "target_node_id": replacements[connection.target_node_id],
                    "target_port": connection.target_port,
                    "metadata": deepcopy(connection.metadata_),
                }
            )
        if session.scalar(
            select(CanvasNode.id)
            .where(CanvasNode.id.in_(list(clone_node_map.values()) or [""]))
            .limit(1)
            .with_for_update()
        ) is not None or session.scalar(
            select(CanvasConnection.id)
            .where(
                CanvasConnection.id.in_(list(clone_connection_map.values()) or [""])
            )
            .limit(1)
            .with_for_update()
        ) is not None:
            raise WorkflowTemplateConflictError(
                "Workflow-template clone target IDs conflict",
                code="workflow_template_target_id_conflict",
            )
        mutation_payload = CanvasDocumentPatchRequest.model_validate(
            {
                "base_revision": request.base_revision,
                "client_mutation_id": request.client_mutation_id,
                "node_upserts": node_upserts,
                "node_deletes": [],
                "connection_upserts": connection_upserts,
                "connection_deletes": [],
            }
        ).model_dump(mode="json")
        mutation = mutation_controller.apply_document_patch_in_session(
            session,
            project_id,
            canvas_id,
            owner_user_id,
            mutation_payload,
        )
        now = utc_now()
        state = "locally_modified" if local_overrides else "instantiated"
        clone = WorkflowTemplateInstance(
            id=clone_instance_id,
            definition_id=context.definition.id,
            version_id=context.version.id,
            owner_user_id=owner_user_id,
            project_id=project_id,
            canvas_id=canvas_id,
            status=state,
            preflight_fingerprint=None,
            client_mutation_id=request.client_mutation_id,
            node_id_map=deepcopy(clone_node_map),
            local_overrides=local_override_snapshot(clone_local_overrides),
            created_at=now,
            updated_at=now,
            detached_at=None,
        )
        session.add(clone)
        session.flush()
        _clone_bindings(
            session,
            source_instance_id=context.instance.id,
            clone_instance_id=clone_instance_id,
        )
        for source_step in source_steps:
            session.add(
                WorkflowTemplateInstanceStep(
                    id=clone_step_map[source_step.step_key],
                    instance_id=clone_instance_id,
                    canvas_id=canvas_id,
                    step_key=source_step.step_key,
                    node_local_id=source_step.node_local_id,
                    canvas_node_id=clone_node_map[source_step.node_local_id],
                    status=source_step.status,
                    configuration=deepcopy(source_step.configuration),
                    created_at=now,
                    updated_at=now,
                )
            )
        result = {
            "instance_id": clone_instance_id,
            "source_instance_id": context.instance.id,
            "template_id": context.definition.template_key,
            "template_version": context.version.version,
            "project_id": project_id,
            "canvas_id": canvas_id,
            "state": state,
            "node_id_map": deepcopy(clone_node_map),
            "connection_id_map": deepcopy(clone_connection_map),
            "local_overrides": deepcopy(clone_local_overrides),
            "mutation": mutation,
        }
        revision = session.scalar(
            select(CanvasRevision)
            .where(
                CanvasRevision.canvas_id == canvas_id,
                CanvasRevision.client_mutation_id == request.client_mutation_id,
            )
            .with_for_update()
        )
        if revision is None:
            raise RuntimeError("Workflow-template clone revision was not persisted")
        operations = deepcopy(revision.operations)
        operations[_REVISION_METADATA_KEY] = {
            "source_instance_id": context.instance.id,
            "instance_id": clone_instance_id,
            "request_fingerprint": request_fingerprint,
        }
        revision.operations = operations
        session.add(
            WorkflowTemplateInstanceCommit(
                instance_id=clone_instance_id,
                request_fingerprint=request_fingerprint,
                canvas_revision=mutation["revision"],
                response_snapshot=deepcopy(result),
                created_at=now,
            )
        )
        session.commit()
        return result
