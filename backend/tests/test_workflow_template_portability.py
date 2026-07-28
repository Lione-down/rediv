from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.workflow_template_contract import classify_workflow_template_field


FIXTURE_PATH = (
    Path(__file__).resolve().parents[2]
    / "ai"
    / "requirements"
    / "contracts"
    / "fixtures"
    / "workflow-template"
    / "non-portable-cases.json"
)


def test_frozen_portability_fixture_has_exact_backend_classifications() -> None:
    cases = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))

    assert [
        {
            "path": case["path"],
            "classification": classify_workflow_template_field(case["path"]),
        }
        for case in cases
    ] == cases


@pytest.mark.parametrize(
    "path",
    [
        "canvas.unknown_runtime_state",
        "provider.endpoint",
        "content.unreviewed_extension",
        "",
    ],
)
def test_unknown_or_ambiguous_capture_field_fails_closed(path: str) -> None:
    with pytest.raises(ValueError, match="workflow_template_field_unclassified"):
        classify_workflow_template_field(path)
