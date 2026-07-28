from __future__ import annotations

import importlib

import pytest
from pydantic import ValidationError


def load_contract_module():
    return importlib.import_module("schemas.workflow_template")


@pytest.mark.parametrize(
    ("model_name", "payload"),
    [
        (
            "WorkflowTemplateBinding",
            {
                "slot_id": "product_reference",
                "binding_type": "asset",
                "asset_id": "asset-owned",
                "source_revision": 7,
                "project_id": "project-target",
                "owner_id": "user-target",
                "provider_task_id": "task-forged"
            },
        ),
        (
            "WorkflowTemplateInstance",
            {
                "instance_id": "instance-1",
                "template_id": "revid.product-ad",
                "template_version": 1,
                "project_id": "project-target",
                "canvas_id": "canvas-target",
                "state": "instantiated",
                "preflight_fingerprint": "0" * 64,
                "node_id_map": {"brief": "node-brief"},
                "provider_endpoint": "https://invalid.example"
            },
        ),
        (
            "WorkflowRun",
            {
                "run_id": "run-1",
                "instance_id": "instance-1",
                "state": "ready",
                "preflight_fingerprint": "0" * 64,
                "steps": [],
                "result_url": "https://invalid.example/result"
            },
        ),
    ],
)
def test_runtime_contract_objects_reject_provider_and_result_leakage(
    model_name: str,
    payload: dict,
) -> None:
    schema_module = load_contract_module()

    with pytest.raises(ValidationError):
        getattr(schema_module, model_name).model_validate(payload)


def test_forged_preflight_fingerprint_is_rejected() -> None:
    schema_module = load_contract_module()

    with pytest.raises(ValidationError):
        schema_module.WorkflowTemplateInstance.model_validate(
            {
                "instance_id": "instance-1",
                "template_id": "revid.product-ad",
                "template_version": 1,
                "project_id": "project-target",
                "canvas_id": "canvas-target",
                "state": "instantiated",
                "preflight_fingerprint": "not-a-sha256",
                "node_id_map": {"brief": "node-brief"}
            }
        )


def test_stale_asset_revision_is_rejected() -> None:
    schema_module = load_contract_module()

    with pytest.raises(ValidationError):
        schema_module.WorkflowTemplateBinding.model_validate(
            {
                "slot_id": "product_reference",
                "binding_type": "asset",
                "asset_id": "asset-owned",
                "source_revision": 0,
                "project_id": "project-target",
                "owner_id": "user-target",
            }
        )
