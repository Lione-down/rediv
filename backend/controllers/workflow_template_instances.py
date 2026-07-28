from __future__ import annotations

from copy import deepcopy

from pydantic import ValidationError
from sqlalchemy import select

from controllers import canvas_document_mutations as mutation_controller
from controllers.workflow_templates import (
    WorkflowTemplateConflictError,
    WorkflowTemplateLifecycleError,
    WorkflowTemplateNotFoundError,
)
from core.generation_parameter_contract import build_generation_capabilities
from core.workflow_template_contract import workflow_template_fingerprint
from models.asset import Asset
from models.base import get_session, utc_now
from models.canvas import Canvas
from models.canvas_connection import CanvasConnection
from models.canvas_node import CanvasNode
from models.canvas_revision import CanvasRevision
from models.quota import Quota
from models.project import Project
from models.workflow_template import (
    WorkflowTemplateDefinition,
    WorkflowTemplateInstance,
    WorkflowTemplateVersion,
)
from models.workflow_template_lineage import WorkflowTemplateInstanceCommit
from schemas.workflow_template import WorkflowTemplateManifest
from schemas.workflow_template_instance import WorkflowTemplateInstantiateRequest
from services.workflow_templates.instances import (
    build_instance_projection,
    instantiate_request_fingerprint,
    response_from_replay_metadata,
)
from services.workflow_templates.lineage import (
    WorkflowTemplateLineageConflictError,
    persist_instance_lineage,
)
from services.workflow_templates.preflight import run_provider_free_preflight


_REVISION_METADATA_KEY = "workflow_template_instantiation"


def _exact_version(
    session,
    *,
    template_id: str,
    template_version: int,
    owner_user_id: str,
) -> tuple[WorkflowTemplateDefinition, WorkflowTemplateVersion, WorkflowTemplateManifest]:
    definition = session.scalar(
        select(WorkflowTemplateDefinition)
        .where(WorkflowTemplateDefinition.template_key == template_id)
        .with_for_update()
    )
    if definition is None or (
        definition.scope == "private" and definition.owner_user_id != owner_user_id
    ):
        raise WorkflowTemplateNotFoundError("Workflow-template version not found")
    version = session.scalar(
        select(WorkflowTemplateVersion)
        .where(
            WorkflowTemplateVersion.definition_id == definition.id,
            WorkflowTemplateVersion.version == template_version,
        )
        .with_for_update()
    )
    if (
        version is None
        or definition.status != "active"
        or version.lifecycle != "published"
    ):
        raise WorkflowTemplateConflictError(
            "Workflow-template version is unavailable for instantiate",
            code="workflow_template_version_unavailable",
        )
    try:
        manifest = WorkflowTemplateManifest.model_validate(version.manifest)
    except ValidationError as error:
        raise WorkflowTemplateLifecycleError(
            "Workflow-template version is invalid",
            code="workflow_template_schema_invalid",
        ) from error
    if (
        manifest.template_id != template_id
        or manifest.template_version != template_version
        or manifest.lifecycle != "published"
        or workflow_template_fingerprint(manifest) != version.fingerprint
    ):
        raise WorkflowTemplateConflictError(
            "Workflow-template version changed",
            code="workflow_template_version_conflict",
        )
    return definition, version, manifest


def _current_preflight(
    session,
    *,
    manifest: WorkflowTemplateManifest,
    owner_user_id: str,
    project_id: str,
    canvas_id: str,
    request: WorkflowTemplateInstantiateRequest,
) -> dict:
    requested_asset_ids = {
        binding.asset_id
        for bindings in request.asset_bindings.values()
        for binding in bindings
    }
    assets = (
        list(
            session.scalars(
                select(Asset)
                .where(Asset.id.in_(requested_asset_ids))
                .with_for_update()
            ).all()
        )
        if requested_asset_ids
        else []
    )
    quota = session.scalar(
        select(Quota).where(Quota.user_id == owner_user_id).with_for_update()
    )
    quota_balances = (
        {
            "text": quota.text_quota,
            "image": quota.image_quota,
            "video": quota.video_quota,
        }
        if quota is not None
        else {"text": 0, "image": 0, "video": 0}
    )
    return run_provider_free_preflight(
        manifest=manifest,
        owner_user_id=owner_user_id,
        project_id=project_id,
        canvas_id=canvas_id,
        variable_bindings=request.variable_bindings,
        asset_bindings=request.asset_bindings,
        assets_by_id={asset.id: asset for asset in assets},
        capabilities=build_generation_capabilities(),
        quota_balances=quota_balances,
        cost_confirmed=request.cost_confirmed,
    )


def _existing_replay(
    *,
    canvas_revision: CanvasRevision | None,
    instance: WorkflowTemplateInstance | None,
    instance_commit: WorkflowTemplateInstanceCommit | None,
    request_fingerprint: str,
    project_id: str,
    canvas_id: str,
) -> dict | None:
    if canvas_revision is None and instance is None and instance_commit is None:
        return None
    if instance is None or instance_commit is None:
        raise mutation_controller.CanvasDocumentConflictError(
            "mutation_id_reused",
            (
                canvas_revision.revision_no
                if canvas_revision is not None
                else instance_commit.canvas_revision
                if instance_commit is not None
                else 0
            ),
        )
    if (
        instance_commit.request_fingerprint != request_fingerprint
        or instance_commit.response_snapshot.get("instance_id") != instance.id
        or instance_commit.response_snapshot.get("project_id") != project_id
        or instance_commit.response_snapshot.get("canvas_id") != canvas_id
    ):
        raise mutation_controller.CanvasDocumentConflictError(
            "mutation_id_reused",
            instance_commit.canvas_revision,
        )
    if canvas_revision is not None:
        metadata = canvas_revision.operations.get(_REVISION_METADATA_KEY)
        if (
            not isinstance(metadata, dict)
            or metadata.get("request_fingerprint") != request_fingerprint
            or metadata.get("instance_id") != instance.id
            or canvas_revision.revision_no != instance_commit.canvas_revision
        ):
            raise mutation_controller.CanvasDocumentConflictError(
                "mutation_id_reused",
                canvas_revision.revision_no,
            )
    result = deepcopy(instance_commit.response_snapshot)
    result["_is_replay"] = True
    return result


def instantiate_workflow_template(
    *,
    project_id: str,
    canvas_id: str,
    owner_user_id: str,
    request: WorkflowTemplateInstantiateRequest,
) -> dict:
    with get_session() as session:
        project = session.scalar(
            select(Project).where(Project.id == project_id).with_for_update()
        )
        if project is None or project.user_id != owner_user_id:
            raise WorkflowTemplateNotFoundError("Project not found")
        canvas = session.scalar(
            select(Canvas)
            .where(
                Canvas.id == canvas_id,
                Canvas.project_id == project_id,
                Canvas.status == "active",
            )
            .with_for_update()
        )
        if canvas is None:
            raise WorkflowTemplateNotFoundError("Canvas not found")
        request_fingerprint = instantiate_request_fingerprint(
            project_id=project_id,
            canvas_id=canvas_id,
            request=request,
        )
        revision = session.scalar(
            select(CanvasRevision)
            .where(
                CanvasRevision.canvas_id == canvas_id,
                CanvasRevision.client_mutation_id == request.client_mutation_id,
            )
            .with_for_update()
        )
        existing_instance = session.scalar(
            select(WorkflowTemplateInstance)
            .where(
                WorkflowTemplateInstance.canvas_id == canvas_id,
                WorkflowTemplateInstance.client_mutation_id
                == request.client_mutation_id,
            )
            .with_for_update()
        )
        existing_commit = (
            session.scalar(
                select(WorkflowTemplateInstanceCommit)
                .where(
                    WorkflowTemplateInstanceCommit.instance_id
                    == existing_instance.id
                )
                .with_for_update()
            )
            if existing_instance is not None
            else None
        )
        replay = _existing_replay(
            canvas_revision=revision,
            instance=existing_instance,
            instance_commit=existing_commit,
            request_fingerprint=request_fingerprint,
            project_id=project_id,
            canvas_id=canvas_id,
        )
        if replay is not None:
            return replay
        if canvas.graph_revision != request.base_revision:
            raise mutation_controller.CanvasDocumentConflictError(
                "stale_graph_revision",
                canvas.graph_revision,
            )
        definition, version, manifest = _exact_version(
            session,
            template_id=request.template_id,
            template_version=request.template_version,
            owner_user_id=owner_user_id,
        )
        current_preflight = _current_preflight(
            session,
            manifest=manifest,
            owner_user_id=owner_user_id,
            project_id=project_id,
            canvas_id=canvas_id,
            request=request,
        )
        if (
            not current_preflight["executable"]
            or current_preflight["fingerprint"] != request.preflight_fingerprint
        ):
            raise WorkflowTemplateConflictError(
                "Workflow-template preflight is stale",
                code="workflow_template_preflight_stale",
            )
        mutation_payload, node_id_map, connection_id_map, instance_id = (
            build_instance_projection(
                manifest=manifest,
                canvas_id=canvas_id,
                request=request,
            )
        )
        if session.scalar(
            select(CanvasNode.id)
            .where(CanvasNode.id.in_(list(node_id_map.values()) or [""]))
            .limit(1)
            .with_for_update()
        ) is not None or session.scalar(
            select(CanvasConnection.id)
            .where(
                CanvasConnection.id.in_(list(connection_id_map.values()) or [""])
            )
            .limit(1)
            .with_for_update()
        ) is not None:
            raise WorkflowTemplateConflictError(
                "Workflow-template target IDs conflict",
                code="workflow_template_target_id_conflict",
            )
        mutation = mutation_controller.apply_document_patch_in_session(
            session,
            project_id,
            canvas_id,
            owner_user_id,
            mutation_payload,
        )
        try:
            binding_id_map, step_id_map = persist_instance_lineage(
                session,
                definition=definition,
                version=version,
                manifest=manifest,
                request=request,
                owner_user_id=owner_user_id,
                project_id=project_id,
                canvas_id=canvas_id,
                instance_id=instance_id,
                node_id_map=node_id_map,
                resolved_slots=current_preflight["resolved_slots"],
            )
        except WorkflowTemplateLineageConflictError as error:
            raise WorkflowTemplateConflictError(
                str(error),
                code="workflow_template_slot_conflict",
            ) from error
        revision = session.scalar(
            select(CanvasRevision)
            .where(
                CanvasRevision.canvas_id == canvas_id,
                CanvasRevision.client_mutation_id == request.client_mutation_id,
            )
            .with_for_update()
        )
        if revision is None:
            raise RuntimeError("Workflow-template Canvas revision was not persisted")
        metadata = {
            "request_fingerprint": request_fingerprint,
            "instance_id": instance_id,
            "template_id": request.template_id,
            "template_version": request.template_version,
            "preflight_fingerprint": request.preflight_fingerprint,
            "node_id_map": deepcopy(node_id_map),
            "connection_id_map": deepcopy(connection_id_map),
            "binding_id_map": deepcopy(binding_id_map),
            "step_id_map": deepcopy(step_id_map),
        }
        operations = deepcopy(revision.operations)
        operations[_REVISION_METADATA_KEY] = metadata
        revision.operations = operations
        result = response_from_replay_metadata(
            metadata=metadata,
            mutation=mutation,
            project_id=project_id,
            canvas_id=canvas_id,
        )
        session.add(
            WorkflowTemplateInstanceCommit(
                instance_id=instance_id,
                request_fingerprint=request_fingerprint,
                canvas_revision=mutation["revision"],
                response_snapshot=deepcopy(result),
                created_at=utc_now(),
            )
        )
        session.commit()
        return result
