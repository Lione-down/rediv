from __future__ import annotations

from copy import deepcopy

from pydantic import ValidationError
from sqlalchemy import select

from core.generation_parameter_contract import build_generation_capabilities
from core.workflow_template_contract import workflow_template_fingerprint
from models.asset import Asset
from models.base import get_session
from models.canvas import Canvas
from models.canvas_node import CanvasNode
from models.quota import Quota
from models.workflow_template import (
    WorkflowTemplateDefinition,
    WorkflowTemplateInstance,
    WorkflowTemplateSlot,
    WorkflowTemplateVersion,
)
from models.workflow_template_lineage import (
    WorkflowTemplateAssetBindingItem,
    WorkflowTemplateBinding,
    WorkflowTemplateInstanceStep,
)
from schemas.workflow_template import (
    WorkflowTemplateAssetBindingInput,
    WorkflowTemplateManifest,
)
from services.workflow_templates.portable_classifier import asset_source_revision
from services.workflow_templates.preflight import run_provider_free_preflight


ACTIVE_RUN_STATUSES = {"ready", "submitting", "queued", "running", "persisting"}


class WorkflowRunServiceError(Exception):
    def __init__(self, message: str, *, code: str) -> None:
        super().__init__(message)
        self.code = code


class WorkflowRunNotFoundError(WorkflowRunServiceError):
    pass


class WorkflowRunConflictError(WorkflowRunServiceError):
    pass


class WorkflowRunValidationError(WorkflowRunServiceError):
    pass


def _load_context(
    session,
    *,
    owner_user_id: str,
    project_id: str,
    canvas_id: str,
    instance_id: str,
    lock: bool,
) -> tuple[
    WorkflowTemplateInstance,
    WorkflowTemplateVersion,
    WorkflowTemplateManifest,
    list[WorkflowTemplateInstanceStep],
    dict[str, CanvasNode],
    dict[str, list[Asset]],
    dict[str, object],
    dict[str, list[WorkflowTemplateAssetBindingInput]],
]:
    query = select(WorkflowTemplateInstance).where(
        WorkflowTemplateInstance.id == instance_id,
        WorkflowTemplateInstance.owner_user_id == owner_user_id,
        WorkflowTemplateInstance.project_id == project_id,
        WorkflowTemplateInstance.canvas_id == canvas_id,
    )
    instance = session.scalar(query.with_for_update() if lock else query)
    if instance is None:
        raise WorkflowRunNotFoundError(
            "Workflow-template instance not found",
            code="workflow_run_instance_not_found",
        )
    if instance.status not in {"instantiated", "locally_modified", "upgrade_available"}:
        raise WorkflowRunConflictError(
            "Workflow-template instance is not runnable",
            code="workflow_run_instance_unavailable",
        )
    canvas = session.scalar(
        select(Canvas).where(
            Canvas.id == canvas_id,
            Canvas.project_id == project_id,
            Canvas.status == "active",
        )
    )
    if canvas is None:
        raise WorkflowRunNotFoundError(
            "Canvas not found",
            code="workflow_run_canvas_not_found",
        )
    definition = session.get(WorkflowTemplateDefinition, instance.definition_id)
    version = session.get(WorkflowTemplateVersion, instance.version_id)
    if definition is None or version is None:
        raise WorkflowRunConflictError(
            "Workflow-template version lineage is unavailable",
            code="workflow_run_version_unavailable",
        )
    if definition.scope == "private" and definition.owner_user_id != owner_user_id:
        raise WorkflowRunNotFoundError(
            "Workflow-template instance not found",
            code="workflow_run_instance_not_found",
        )
    try:
        manifest = WorkflowTemplateManifest.model_validate(version.manifest)
    except ValidationError as error:
        raise WorkflowRunConflictError(
            "Workflow-template version is invalid",
            code="workflow_run_version_invalid",
        ) from error
    if (
        manifest.template_id != definition.template_key
        or manifest.template_version != version.version
        or workflow_template_fingerprint(manifest) != version.fingerprint
    ):
        raise WorkflowRunConflictError(
            "Workflow-template version changed",
            code="workflow_run_version_stale",
        )
    steps = list(
        session.scalars(
            select(WorkflowTemplateInstanceStep)
            .where(WorkflowTemplateInstanceStep.instance_id == instance_id)
            .order_by(
                WorkflowTemplateInstanceStep.created_at,
                WorkflowTemplateInstanceStep.id,
            )
        ).all()
    )
    if {step.step_key for step in steps} != {step.step_id for step in manifest.steps}:
        raise WorkflowRunConflictError(
            "Workflow-template step lineage changed",
            code="workflow_run_step_lineage_stale",
        )
    node_ids = [step.canvas_node_id for step in steps if step.canvas_node_id]
    nodes = (
        list(
            session.scalars(
                select(CanvasNode).where(
                    CanvasNode.id.in_(node_ids),
                    CanvasNode.project_id == project_id,
                    CanvasNode.canvas_id == canvas_id,
                    CanvasNode.status != "deleted",
                )
            ).all()
        )
        if node_ids
        else []
    )
    nodes_by_id = {node.id: node for node in nodes}
    if len(nodes_by_id) != len(steps) or any(
        step.canvas_node_id not in nodes_by_id for step in steps
    ):
        raise WorkflowRunConflictError(
            "Workflow-template Canvas step lineage changed",
            code="workflow_run_node_lineage_stale",
        )

    slots = {
        slot.id: slot
        for slot in session.scalars(
            select(WorkflowTemplateSlot).where(
                WorkflowTemplateSlot.version_id == version.id
            )
        ).all()
    }
    bindings = list(
        session.scalars(
            select(WorkflowTemplateBinding).where(
                WorkflowTemplateBinding.instance_id == instance_id
            )
        ).all()
    )
    variable_bindings: dict[str, object] = {}
    asset_inputs: dict[str, list[WorkflowTemplateAssetBindingInput]] = {
        slot.slot_id: [] for slot in manifest.asset_slots
    }
    asset_ids: set[str] = set()
    asset_items_by_binding: dict[str, list[WorkflowTemplateAssetBindingItem]] = {}
    asset_binding_ids = [
        binding.id for binding in bindings if binding.binding_type == "asset"
    ]
    if asset_binding_ids:
        items = list(
            session.scalars(
                select(WorkflowTemplateAssetBindingItem)
                .where(
                    WorkflowTemplateAssetBindingItem.binding_id.in_(
                        asset_binding_ids
                    )
                )
                .order_by(
                    WorkflowTemplateAssetBindingItem.binding_id,
                    WorkflowTemplateAssetBindingItem.position,
                )
            ).all()
        )
        for item in items:
            asset_items_by_binding.setdefault(item.binding_id, []).append(item)
    for binding in bindings:
        slot = slots.get(binding.slot_id)
        if slot is None:
            raise WorkflowRunConflictError(
                "Workflow-template binding lineage changed",
                code="workflow_run_binding_lineage_stale",
            )
        if binding.binding_type == "value":
            if not isinstance(binding.value_json, dict) or "value" not in binding.value_json:
                raise WorkflowRunConflictError(
                    "Workflow-template value binding is invalid",
                    code="workflow_run_binding_lineage_stale",
                )
            variable_bindings[slot.slot_key] = deepcopy(binding.value_json["value"])
            continue
        item_rows = asset_items_by_binding.get(binding.id, [])
        item_facts = [
            (item.asset_id, item.source_revision)
            for item in item_rows
        ]
        if not item_facts and binding.asset_id and binding.source_revision:
            item_facts = [(binding.asset_id, binding.source_revision)]
        asset_inputs[slot.slot_key] = [
            WorkflowTemplateAssetBindingInput(
                asset_id=asset_id,
                source_revision=source_revision,
            )
            for asset_id, source_revision in item_facts
        ]
        asset_ids.update(asset_id for asset_id, _source_revision in item_facts)
    assets = (
        list(session.scalars(select(Asset).where(Asset.id.in_(asset_ids))).all())
        if asset_ids
        else []
    )
    assets_by_id = {asset.id: asset for asset in assets}
    assets_by_slot: dict[str, list[Asset]] = {}
    for slot_id, inputs in asset_inputs.items():
        resolved: list[Asset] = []
        for binding in inputs:
            asset = assets_by_id.get(binding.asset_id)
            if (
                asset is None
                or asset.user_id != owner_user_id
                or asset.project_id != project_id
                or asset.status != "active"
                or asset_source_revision(asset) != binding.source_revision
            ):
                raise WorkflowRunConflictError(
                    "Workflow-template asset binding changed",
                    code="workflow_run_asset_binding_stale",
                )
            resolved.append(asset)
        assets_by_slot[slot_id] = resolved
    return (
        instance,
        version,
        manifest,
        steps,
        nodes_by_id,
        assets_by_slot,
        variable_bindings,
        asset_inputs,
    )


def _runtime_preflight(
    session,
    *,
    owner_user_id: str,
    project_id: str,
    canvas_id: str,
    instance_id: str,
    cost_confirmed: bool,
    lock: bool,
) -> tuple[dict, tuple]:
    context = _load_context(
        session,
        owner_user_id=owner_user_id,
        project_id=project_id,
        canvas_id=canvas_id,
        instance_id=instance_id,
        lock=lock,
    )
    manifest = context[2]
    assets_by_slot = context[5]
    asset_inputs = context[7]
    quota = session.scalar(select(Quota).where(Quota.user_id == owner_user_id))
    balances = (
        {
            "text": quota.text_quota,
            "image": quota.image_quota,
            "video": quota.video_quota,
        }
        if quota is not None
        else {"text": 0, "image": 0, "video": 0}
    )
    result = run_provider_free_preflight(
        manifest=manifest,
        owner_user_id=owner_user_id,
        project_id=project_id,
        canvas_id=canvas_id,
        variable_bindings=context[6],
        asset_bindings=asset_inputs,
        assets_by_id={
            asset.id: asset
            for assets in assets_by_slot.values()
            for asset in assets
        },
        capabilities=build_generation_capabilities(),
        quota_balances=balances,
        cost_confirmed=cost_confirmed,
    )
    result["template"]["fingerprint"] = context[1].fingerprint
    return result, context


def preflight_workflow_run(
    *,
    owner_user_id: str,
    project_id: str,
    canvas_id: str,
    instance_id: str,
    cost_confirmed: bool,
) -> dict:
    with get_session() as session:
        result, _context = _runtime_preflight(
            session,
            owner_user_id=owner_user_id,
            project_id=project_id,
            canvas_id=canvas_id,
            instance_id=instance_id,
            cost_confirmed=cost_confirmed,
            lock=False,
        )
        return result
