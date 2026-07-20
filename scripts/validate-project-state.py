#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CURRENT = ROOT / "ai" / "state" / "CURRENT.md"
ROADMAP = ROOT / "ai" / "state" / "ROADMAP.md"
TASK_ROOT = ROOT / "ai" / "tasks"
REPORT_ROOT = ROOT / "ai" / "reports"
ALLOWED_STATES = {"TODO", "DOING", "VERIFYING", "BLOCKED", "DONE"}
ALLOWED_OUTCOMES = {"PENDING", "PASS", "FAIL", "DEFERRED"}
TASK_ROW = re.compile(
    r"^\|\s*(\d+)\s*\|\s*(T[56]-\d{3})\s*\|\s*(.*?)\s*\|\s*"
    r"(TODO|DOING|VERIFYING|BLOCKED|DONE)\s*\|\s*"
    r"(PENDING|PASS|FAIL|DEFERRED)\s*\|\s*(.*?)\s*\|$"
)
LINK = re.compile(r"\[[^\]]+\]\(([^)]+)\)")


def _error(errors: list[str], message: str) -> None:
    errors.append(message)


def _metadata(path: Path, errors: list[str]) -> tuple[str | None, str | None]:
    text = path.read_text(encoding="utf-8")
    state_match = re.search(r"^- State: `([^`]+)`\s*$", text, re.MULTILINE)
    outcome_match = re.search(r"^- Verification outcome: `([^`]+)`\s*$", text, re.MULTILINE)
    state = state_match.group(1) if state_match else None
    outcome = outcome_match.group(1) if outcome_match else None
    if state not in ALLOWED_STATES:
        _error(errors, f"{path.relative_to(ROOT)} has invalid or missing State: {state}")
    if outcome not in ALLOWED_OUTCOMES:
        _error(errors, f"{path.relative_to(ROOT)} has invalid or missing Verification outcome: {outcome}")
    return state, outcome


def _validate_links(path: Path, errors: list[str]) -> None:
    text = path.read_text(encoding="utf-8")
    for raw_target in LINK.findall(text):
        target = raw_target.strip().split("#", 1)[0]
        if not target or re.match(r"^[a-z]+://", target, re.IGNORECASE):
            continue
        resolved = (path.parent / target).resolve()
        if not resolved.exists():
            _error(errors, f"{path.relative_to(ROOT)} has missing link target: {raw_target}")


def _validate_t6_chain(errors: list[str]) -> dict[str, tuple[str, str]]:
    task_states: dict[str, tuple[str, str]] = {}
    active_ids: list[str] = []
    for task_path in sorted((TASK_ROOT / "todo").glob("TASK-T6-*.md")):
        task_id = task_path.stem.removeprefix("TASK-")
        state, outcome = _metadata(task_path, errors)
        if state and outcome:
            task_states[task_id] = (state, outcome)
        if state in {"DOING", "VERIFYING"}:
            active_ids.append(task_id)
        _validate_links(task_path, errors)
        for suffix in ("PLAN", "PROGRESS"):
            linked = TASK_ROOT / "doing" / f"TASK-{task_id}-{suffix}.md"
            if not linked.is_file():
                _error(errors, f"missing {task_id} {suffix}")
                continue
            linked_state, linked_outcome = _metadata(linked, errors)
            if (linked_state, linked_outcome) != (state, outcome):
                _error(errors, f"{task_id} {suffix} metadata disagrees with Task")
            _validate_links(linked, errors)
        report = REPORT_ROOT / f"REPORT-{task_id}.md"
        if state == "DONE":
            if not report.is_file():
                _error(errors, f"DONE task {task_id} has no REPORT")
            else:
                report_state, report_outcome = _metadata(report, errors)
                if (report_state, report_outcome) != (state, outcome):
                    _error(errors, f"{task_id} REPORT metadata disagrees with Task")
                _validate_links(report, errors)
        elif report.exists():
            _error(errors, f"active task {task_id} has a premature REPORT")
    unfinished_ids = [task_id for task_id, metadata in task_states.items() if metadata[0] != "DONE"]
    if len(active_ids) > 1 or (unfinished_ids and len(active_ids) != 1):
        _error(errors, f"expected one active T6 Task while unfinished Tasks exist, found {active_ids}")
    return task_states


def _validate_roadmap(
    task_states: dict[str, tuple[str, str]],
    errors: list[str],
) -> None:
    text = ROADMAP.read_text(encoding="utf-8")
    required_header = "| Order | Task | Deliverable | State | Verification | Dependency |"
    if text.count(required_header) != 2:
        _error(errors, "ROADMAP must contain two normalized task-table headers")
    rows: dict[str, tuple[int, str, str, str, str]] = {}
    for line in text.splitlines():
        match = TASK_ROW.match(line)
        if not match:
            continue
        order, task_id, deliverable, state, outcome, dependency = match.groups()
        if task_id in rows:
            _error(errors, f"ROADMAP contains duplicate row {task_id}")
        rows[task_id] = (int(order), deliverable, state, outcome, dependency)

    expected_t5 = {f"T5-{number:03d}" for number in range(1, 97)}
    actual_t5 = {task_id for task_id in rows if task_id.startswith("T5-")}
    if actual_t5 != expected_t5:
        missing = sorted(expected_t5 - actual_t5)
        extra = sorted(actual_t5 - expected_t5)
        _error(errors, f"ROADMAP T5 rows incomplete; missing={missing}, extra={extra}")
    for task_id in expected_t5:
        report = REPORT_ROOT / f"REPORT-{task_id}.md"
        if not report.is_file():
            _error(errors, f"ROADMAP completed task lacks report: {task_id}")
        row = rows.get(task_id)
        if row and (row[2], row[3]) != ("DONE", "PASS"):
            _error(errors, f"ROADMAP historical completion disagrees: {task_id}")

    expected_t6 = set(task_states)
    actual_t6 = {task_id for task_id in rows if task_id.startswith("T6-")}
    if actual_t6 != expected_t6:
        _error(errors, f"ROADMAP T6 rows disagree with Task files: {sorted(actual_t6)}")
    for task_id, (state, outcome) in task_states.items():
        row = rows.get(task_id)
        if row and (row[2], row[3]) != (state, outcome):
            _error(errors, f"ROADMAP metadata disagrees with {task_id}")
    _validate_links(ROADMAP, errors)


def _validate_current(
    task_states: dict[str, tuple[str, str]],
    errors: list[str],
) -> None:
    text = CURRENT.read_text(encoding="utf-8")
    state, outcome = _metadata(CURRENT, errors)
    active_match = re.search(r"^- Active implementation Task: `([^`]+)", text, re.MULTILINE)
    active_id = active_match.group(1).split(" ", 1)[0] if active_match else None
    expected_active = next(
        (task_id for task_id, metadata in task_states.items() if metadata[0] in {"DOING", "VERIFYING"}),
        None,
    )
    if active_id != expected_active:
        _error(errors, f"CURRENT active Task {active_id} disagrees with {expected_active}")
    if active_id and task_states.get(active_id) != (state, outcome):
        _error(errors, "CURRENT state/outcome disagrees with active Task")
    if len(text.splitlines()) > 60:
        _error(errors, "CURRENT exceeds the 60-line rolling-snapshot budget")
    for heading in (
        "## Delivery Mode",
        "## Product State",
        "## Active Delivery",
        "## Live Gates",
        "## Exact Next Action",
        "## Worktree Ownership",
    ):
        if heading not in text:
            _error(errors, f"CURRENT missing required section: {heading}")
    _validate_links(CURRENT, errors)


def main() -> int:
    errors: list[str] = []
    task_states = _validate_t6_chain(errors)
    _validate_roadmap(task_states, errors)
    _validate_current(task_states, errors)
    for entry in (
        ROOT / "README.md",
        ROOT / "backend" / "README.md",
        TASK_ROOT / "README.md",
    ):
        _validate_links(entry, errors)
    if errors:
        for message in errors:
            print(f"ERROR: {message}")
        return 1
    print("Project state validation passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
