from __future__ import annotations

from copy import deepcopy
from uuid import NAMESPACE_URL, uuid5

from sqlalchemy import null, select

from models.base import utc_now
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
from schemas.workflow_template import WorkflowTemplateManifest
from schemas.workflow_template_instance import WorkflowTemplateInstantiateRequest


class WorkflowTemplateLineageConflictError(Exception):
    pass


def workflow_template_lineage_id(
    instance_id: str,
    kind: str,
    local_id: str,
) -> str:
    return str(uuid5(NAMESPACE_URL, f"revid:{instance_id}:{kind}:{local_id}"))


def persist_instance_lineage(
    session,
    *,
    definition: WorkflowTemplateDefinition,
    version: WorkflowTemplateVersion,
    manifest: WorkflowTemplateManifest,
    request: WorkflowTemplateInstantiateRequest,
    owner_user_id: str,
    project_id: str,
    canvas_id: str,
    instance_id: str,
    node_id_map: dict[str, str],
    resolved_slots: list[dict],
) -> tuple[dict[str, list[str]], dict[str, str]]:
    now = utc_now()
    session.add(
        WorkflowTemplateInstance(
            id=instance_id,
            definition_id=definition.id,
            version_id=version.id,
            owner_user_id=owner_user_id,
            project_id=project_id,
            canvas_id=canvas_id,
            status="instantiated",
            preflight_fingerprint=request.preflight_fingerprint,
            client_mutation_id=request.client_mutation_id,
            node_id_map=deepcopy(node_id_map),
            local_overrides={},
            created_at=now,
            updated_at=now,
            detached_at=None,
        )
    )
    session.flush()
    slots = {
        slot.slot_key: slot
        for slot in session.scalars(
            select(WorkflowTemplateSlot)
            .where(WorkflowTemplateSlot.version_id == version.id)
            .with_for_update()
        ).all()
    }
    binding_id_map: dict[str, list[str]] = {}
    for resolved in resolved_slots:
        slot_key = resolved["slot_id"]
        slot = slots.get(slot_key)
        if slot is None:
            raise WorkflowTemplateLineageConflictError(
                "Workflow-template slot lineage is unavailable"
            )
        if resolved["kind"] == "asset" and not resolved["items"]:
            binding_id_map[slot_key] = []
            continue
        binding_id = workflow_template_lineage_id(instance_id, "binding", slot_key)
        if resolved["kind"] == "variable":
            binding = WorkflowTemplateBinding(
                id=binding_id,
                instance_id=instance_id,
                version_id=version.id,
                slot_id=slot.id,
                binding_type="value",
                value_json={"value": deepcopy(resolved["value"])},
                asset_id=None,
                source_revision=None,
                created_at=now,
                updated_at=now,
            )
        else:
            items = resolved["items"]
            binding = WorkflowTemplateBinding(
                id=binding_id,
                instance_id=instance_id,
                version_id=version.id,
                slot_id=slot.id,
                binding_type="asset",
                value_json=null(),
                asset_id=items[0]["asset_id"],
                source_revision=items[0]["source_revision"],
                created_at=now,
                updated_at=now,
            )
        session.add(binding)
        session.flush()
        if resolved["kind"] == "asset":
            for position, item in enumerate(resolved["items"]):
                session.add(
                    WorkflowTemplateAssetBindingItem(
                        id=workflow_template_lineage_id(
                            instance_id,
                            "asset-binding-item",
                            f"{slot_key}:{position}",
                        ),
                        binding_id=binding_id,
                        asset_id=item["asset_id"],
                        source_revision=item["source_revision"],
                        position=position,
                        created_at=now,
                        updated_at=now,
                    )
                )
        binding_id_map[slot_key] = [binding_id]
    step_id_map: dict[str, str] = {}
    for step in manifest.steps:
        step_id = workflow_template_lineage_id(instance_id, "step", step.step_id)
        session.add(
            WorkflowTemplateInstanceStep(
                id=step_id,
                instance_id=instance_id,
                canvas_id=canvas_id,
                step_key=step.step_id,
                node_local_id=step.node_local_id,
                canvas_node_id=node_id_map[step.node_local_id],
                status="ready" if not step.depends_on else "blocked",
                configuration={
                    "intent": step.intent,
                    "model_policy": step.model_policy,
                    "input_bindings": list(step.input_bindings),
                    "depends_on": list(step.depends_on),
                    "capability_requirements": list(step.capability_requirements),
                },
                created_at=now,
                updated_at=now,
            )
        )
        step_id_map[step.step_id] = step_id
    session.flush()
    return binding_id_map, step_id_map
