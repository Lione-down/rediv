from __future__ import annotations

import importlib.util
import sys
from pathlib import Path


MODULE_PATH = Path(__file__).parents[1] / "verify-project-convergence.py"
SPEC = importlib.util.spec_from_file_location("verify_project_convergence", MODULE_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def write(root: Path, relative: str, content: str) -> None:
    path = root / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def test_rejects_terminal_task_in_doing(tmp_path: Path) -> None:
    write(tmp_path, "ai/tasks/doing/task.md", "# Task\n\n## Status: COMPLETE\n")
    findings = MODULE.check_task_locations(tmp_path)
    assert [finding.code for finding in findings] == ["TASK_TERMINAL_IN_DOING"]


def test_rejects_finished_task_in_todo(tmp_path: Path) -> None:
    write(tmp_path, "ai/tasks/todo/task.md", "# Task\n\n- Status: `PMC_PASS`\n")
    findings = MODULE.check_task_locations(tmp_path)
    assert [finding.code for finding in findings] == ["TASK_FINISHED_IN_TODO"]


def test_rejects_browser_pass_without_evidence_reference(tmp_path: Path) -> None:
    write(tmp_path, "ai/reports/REPORT-X.md", "# Browser Report\n\n## Acceptance ✅\n\n## Evidence\n\nViewport checked.\n")
    findings = MODULE.check_report_evidence(tmp_path)
    assert [finding.code for finding in findings] == ["BROWSER_PASS_WITHOUT_EVIDENCE"]


def test_accepts_single_active_queue_and_existing_evidence(tmp_path: Path) -> None:
    write(tmp_path, "ai/automation/HERMES-EXECUTION-STATUS.md", "# Status\n\n## Active Queue — Revision 1\n")
    write(tmp_path, "ai/evidence/X/result.json", "{}")
    write(tmp_path, "ai/reports/REPORT-X.md", "# Browser Report\n\nPASS `ai/evidence/X/result.json`\n")
    assert MODULE.verify(tmp_path) == []
