from __future__ import annotations

from copy import deepcopy

from sqlalchemy import delete, insert, null, select

from controllers.workflow_templates import WorkflowTemplateConflictError
from models.base import utc_now
from models.workflow_template import WorkflowTemplateSlot
from models.workflow_template_lineage import (
    WorkflowTemplateAssetBindingItem,
    WorkflowTemplateBinding,
)
from services.workflow_templates.lineage import workflow_template_lineage_id


def migrate_instance_bindings(
    session,
    *,
    context,
    target,
    target_manifest,
    allow_target_slot_removal: bool = False,
) -> None:
    source_slots = {
        slot.id: slot
        for slot in session.scalars(
            select(WorkflowTemplateSlot)
            .where(WorkflowTemplateSlot.version_id == context.version.id)
            .with_for_update()
        ).all()
    }
    target_slots = {
        slot.slot_key: slot
        for slot in session.scalars(
            select(WorkflowTemplateSlot)
            .where(WorkflowTemplateSlot.version_id == target.id)
            .with_for_update()
        ).all()
    }
    bindings = list(
        session.scalars(
            select(WorkflowTemplateBinding)
            .where(WorkflowTemplateBinding.instance_id == context.instance.id)
            .with_for_update()
        ).all()
    )
    binding_ids = [binding.id for binding in bindings]
    items = (
        list(
            session.scalars(
                select(WorkflowTemplateAssetBindingItem)
                .where(WorkflowTemplateAssetBindingItem.binding_id.in_(binding_ids))
                .with_for_update()
            ).all()
        )
        if binding_ids
        else []
    )
    now = utc_now()
    binding_rows = []
    retained_binding_ids: set[str] = set()
    existing_slot_keys: set[str] = set()
    for binding in bindings:
        source_slot = source_slots.get(binding.slot_id)
        target_slot = target_slots.get(source_slot.slot_key) if source_slot else None
        if target_slot is None:
            if allow_target_slot_removal:
                continue
            raise WorkflowTemplateConflictError(
                "Workflow-template binding cannot migrate",
                code="workflow_template_binding_migration_conflict",
            )
        slot_key = source_slot.slot_key
        retained_binding_ids.add(binding.id)
        existing_slot_keys.add(slot_key)
        binding_rows.append(
            {
                "id": binding.id,
                "instance_id": context.instance.id,
                "version_id": target.id,
                "slot_id": target_slot.id,
                "binding_type": binding.binding_type,
                "value_json": (
                    null()
                    if binding.binding_type == "asset"
                    else deepcopy(binding.value_json)
                ),
                "asset_id": binding.asset_id,
                "source_revision": binding.source_revision,
                "created_at": binding.created_at,
                "updated_at": now,
            }
        )
    variable_by_key = {variable.key: variable for variable in target_manifest.variables}
    for slot_key, variable in sorted(variable_by_key.items()):
        if slot_key in existing_slot_keys:
            continue
        if variable.default is None:
            raise WorkflowTemplateConflictError(
                "Workflow-template variable default is unavailable",
                code="workflow_template_binding_migration_conflict",
            )
        binding_id = workflow_template_lineage_id(
            context.instance.id,
            "binding",
            slot_key,
        )
        retained_binding_ids.add(binding_id)
        binding_rows.append(
            {
                "id": binding_id,
                "instance_id": context.instance.id,
                "version_id": target.id,
                "slot_id": target_slots[slot_key].id,
                "binding_type": "value",
                "value_json": {"value": deepcopy(variable.default)},
                "asset_id": None,
                "source_revision": None,
                "created_at": now,
                "updated_at": now,
            }
        )
    item_rows = [
        {
            "id": item.id,
            "binding_id": item.binding_id,
            "asset_id": item.asset_id,
            "source_revision": item.source_revision,
            "position": item.position,
            "created_at": item.created_at,
            "updated_at": now,
        }
        for item in items
        if item.binding_id in retained_binding_ids
    ]
    if binding_ids:
        session.execute(
            delete(WorkflowTemplateAssetBindingItem).where(
                WorkflowTemplateAssetBindingItem.binding_id.in_(binding_ids)
            )
        )
        session.execute(
            delete(WorkflowTemplateBinding).where(
                WorkflowTemplateBinding.id.in_(binding_ids)
            )
        )
        session.flush()
    context.instance.version_id = target.id
    session.flush()
    if binding_rows:
        session.execute(insert(WorkflowTemplateBinding), binding_rows)
    if item_rows:
        session.execute(insert(WorkflowTemplateAssetBindingItem), item_rows)
    session.flush()
