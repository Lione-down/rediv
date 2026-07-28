from __future__ import annotations

import copy
import importlib
import json
from pathlib import Path

import pytest
from pydantic import ValidationError


ROOT = Path(__file__).resolve().parents[2]
FIXTURE_ROOT = ROOT / "ai" / "requirements" / "contracts" / "fixtures" / "workflow-template"
JSON_SCHEMA_PATH = (
    ROOT / "ai" / "requirements" / "contracts" / "revid-workflow-template.v1.schema.json"
)


def load_json(name: str):
    return json.loads((FIXTURE_ROOT / name).read_text(encoding="utf-8"))


def load_contract_modules():
    schema_module = importlib.import_module("schemas.workflow_template")
    contract_module = importlib.import_module("core.workflow_template_contract")
    return schema_module, contract_module


def set_path(payload: dict, path: str, value: object) -> None:
    parts = path.split(".")
    current: object = payload
    for part in parts[:-1]:
        if isinstance(current, list):
            current = current[int(part)]
        else:
            assert isinstance(current, dict)
            if part not in current:
                current[part] = {}
            current = current[part]
    if isinstance(current, list):
        current[int(parts[-1])] = value
    else:
        assert isinstance(current, dict)
        current[parts[-1]] = value


def test_portable_manifest_is_strict_and_canonical() -> None:
    schema_module, contract_module = load_contract_modules()
    payload = load_json("portable-manifest.json")

    manifest = schema_module.WorkflowTemplateManifest.model_validate(payload)

    assert manifest.schema_id == "revid.workflow-template"
    assert manifest.schema_version == 1
    assert contract_module.canonical_workflow_template_json(payload) == (
        contract_module.canonical_workflow_template_json(manifest.model_dump(mode="json"))
    )
    assert contract_module.workflow_template_fingerprint(payload) == (
        "bb3f4c5214f5e2ff18138d9ac8809cc7cdbcded8e0f3e03b729e1be9bb35bbbb"
    )


def test_canonical_fingerprint_preserves_valid_unicode() -> None:
    _, contract_module = load_contract_modules()
    payload = load_json("portable-manifest.json")
    payload["metadata"]["description"] = "合法 Unicode 🎬 模板"

    assert contract_module.workflow_template_fingerprint(payload) == (
        "2eae599df2da5793d24b3f3ba16ff1220c8cd11333d4727ac673e22913062f23"
    )


def test_frozen_json_schema_is_strict_and_matches_manifest_identity() -> None:
    schema = json.loads(JSON_SCHEMA_PATH.read_text(encoding="utf-8"))
    assert schema["$schema"] == "https://json-schema.org/draft/2020-12/schema"
    assert schema["$id"] == "https://revid.local/contracts/revid-workflow-template.v1.schema.json"
    assert schema["properties"]["schema_id"]["const"] == "revid.workflow-template"
    assert schema["properties"]["schema_version"]["const"] == 1
    assert schema["additionalProperties"] is False
    assert set(schema["required"]) == set(schema["properties"])
    assert all(
        definition.get("additionalProperties") is False
        for definition in schema["$defs"].values()
        if definition.get("type") == "object"
    )


@pytest.mark.parametrize("case", load_json("security-abuse-cases.json"), ids=lambda case: case["name"])
def test_security_abuse_cases_fail_closed(case: dict) -> None:
    schema_module, _ = load_contract_modules()
    payload = copy.deepcopy(load_json("portable-manifest.json"))
    set_path(payload, case["path"], case["value"])

    with pytest.raises(ValidationError):
        schema_module.WorkflowTemplateManifest.model_validate(payload)


def test_portability_classifier_matches_frozen_matrix() -> None:
    _, contract_module = load_contract_modules()
    cases = load_json("non-portable-cases.json")

    assert [
        contract_module.classify_workflow_template_field(case["path"])
        for case in cases
    ] == [case["classification"] for case in cases]


def test_provider_projection_fixtures_are_strict_and_provider_valid() -> None:
    schema_module, _ = load_contract_modules()
    cases = load_json("provider-projection-cases.json")

    projections = [
        schema_module.WorkflowTemplateProviderProjection.model_validate(case)
        for case in cases
    ]

    assert len(projections) == 6
    assert "resolution" not in projections[-1].request
    assert projections[-1].request["extra_body"]["mode"] == "keyframes"
    assert "tags" not in projections[1].request
    assert "response_format" not in projections[2].request
    assert projections[2].request["extra_body"]["response_format"] == "url"


@pytest.mark.parametrize(
    "case",
    load_json("provider-projection-abuse-cases.json"),
    ids=lambda case: case["name"],
)
def test_provider_projection_abuse_cases_fail_closed(case: dict) -> None:
    schema_module, _ = load_contract_modules()
    projections = load_json("provider-projection-cases.json")
    payload = copy.deepcopy(projections[case["base_index"]])
    set_path(payload, case["path"], case["value"])

    with pytest.raises(ValidationError):
        schema_module.WorkflowTemplateProviderProjection.model_validate(payload)
