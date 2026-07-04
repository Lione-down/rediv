#!/usr/bin/env python3
"""Deterministically reconcile Hermes terminal execution status with the PMC Queue."""

from __future__ import annotations

import argparse
import hashlib
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
import sys


TERMINAL_ACTION = "NONE — terminal evidence only"
TERMINAL_QUEUE_STATUS = "BLOCKED — NOT EXECUTABLE / TERMINAL RECONCILIATION COMPLETE"
TERMINAL_EXECUTION_STATE = "PMC_BLOCKED — NOT EXECUTABLE / TERMINAL RECONCILIATION COMPLETE"
PENDING_DIAGNOSTIC_QUEUE_STATUS = "BLOCKED — NOT EXECUTABLE / TERMINAL RECONCILIATION PENDING"
TERMINAL_CONFIRMATION = "ACK_TERMINAL_VERDICT_AND_STOP"
DIAGNOSTIC_START_CONFIRMATION = "ACK_TERMINAL_VERDICT_AND_START_RUNTIME_DIAGNOSTIC"
DOCUMENT_UNIQUE_FIELDS = {
    "Queue Revision",
    "Task ID",
    "Task Path",
    "Task SHA256",
    "Queue SHA256",
    "Action",
    "State",
    "Last Transition",
    "PMC Action Required",
    "PMC Action Type",
    "PMC Action Reason",
    "PMC Evidence Paths",
    "Human Decision Candidate",
    "Human Escalation Reason",
}


class ReconciliationError(RuntimeError):
    pass


@dataclass(frozen=True)
class Section:
    start: int
    end: int


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest().upper()


def clean_value(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == "`" and value[-1] == "`":
        return value[1:-1]
    return value


def table_row(line: str) -> tuple[str, str] | None:
    stripped = line.strip()
    if not stripped.startswith("|") or not stripped.endswith("|"):
        return None
    cells = [cell.strip() for cell in stripped[1:-1].split("|")]
    if len(cells) != 2 or cells[0] in {"Field", "---"}:
        return None
    return cells[0], clean_value(cells[1])


def validate_document_structure(lines: list[str]) -> None:
    canonical_locations: dict[str, list[int]] = {}
    for line_number, line in enumerate(lines, start=1):
        stripped = line.strip()
        if stripped.startswith("|||"):
            raise ReconciliationError(
                f"malformed Markdown table row at line {line_number}: {stripped[:80]}"
            )
        parsed = table_row(line)
        if parsed is None or parsed[0] not in DOCUMENT_UNIQUE_FIELDS:
            continue
        canonical_locations.setdefault(parsed[0], []).append(line_number)

    for field, locations in canonical_locations.items():
        if len(locations) > 1:
            raise ReconciliationError(
                f"duplicate canonical field across document: {field} "
                f"at lines {', '.join(str(location) for location in locations)}"
            )


def find_sections(lines: list[str], heading_prefix: str) -> list[Section]:
    starts = [index for index, line in enumerate(lines) if line.startswith(heading_prefix)]
    sections: list[Section] = []
    for start in starts:
        end = next(
            (index for index in range(start + 1, len(lines)) if lines[index].startswith("## ")),
            len(lines),
        )
        sections.append(Section(start, end))
    return sections


def section_table(lines: list[str], section: Section) -> dict[str, str]:
    result: dict[str, str] = {}
    for line in lines[section.start + 1 : section.end]:
        parsed = table_row(line)
        if parsed is None:
            continue
        key, value = parsed
        if key in result:
            raise ReconciliationError(f"duplicate table field in section: {key}")
        result[key] = value
    return result


def require_single_section(lines: list[str], heading_prefix: str) -> Section:
    sections = find_sections(lines, heading_prefix)
    if len(sections) != 1:
        raise ReconciliationError(
            f"expected one section starting with {heading_prefix!r}, found {len(sections)}"
        )
    return sections[0]


def first_reconciliation_block(lines: list[str]) -> dict[str, str]:
    in_text_block = False
    result: dict[str, str] = {}
    for line in lines:
        stripped = line.strip()
        if stripped == "```text":
            in_text_block = True
            result = {}
            continue
        if in_text_block and stripped == "```":
            if "PMC Reconciliation Required" in result:
                return result
            in_text_block = False
            result = {}
            continue
        if in_text_block and ":" in stripped:
            key, value = stripped.split(":", 1)
            result[key.strip()] = value.strip()
    raise ReconciliationError("Queue has no PMC reconciliation block")


def resolve_project_path(queue_path: Path, raw_path: str) -> Path:
    candidate = Path(raw_path)
    if candidate.is_absolute():
        return candidate
    if len(queue_path.resolve().parents) < 3:
        raise ReconciliationError("cannot derive project root from Queue path")
    return queue_path.resolve().parents[2] / candidate


def replace_table_field(
    lines: list[str], section: Section, key: str, expected: str
) -> bool:
    matches: list[int] = []
    for index in range(section.start + 1, section.end):
        parsed = table_row(lines[index])
        if parsed is not None and parsed[0] == key:
            matches.append(index)
    if len(matches) != 1:
        raise ReconciliationError(
            f"expected one field {key!r} in {lines[section.start]!r}, found {len(matches)}"
        )
    index = matches[0]
    replacement = f"| {key} | `{expected}` |\n"
    if lines[index] == replacement:
        return False
    lines[index] = replacement
    return True


def insert_table_field(lines: list[str], section: Section, key: str, expected: str) -> bool:
    table_indexes = [
        index
        for index in range(section.start + 1, section.end)
        if table_row(lines[index]) is not None
    ]
    if not table_indexes:
        raise ReconciliationError(f"cannot insert field {key!r} into a section without a table")
    lines.insert(table_indexes[-1] + 1, f"| {key} | `{expected}` |\n")
    return True


def find_runtime_section(
    lines: list[str], revision: str
) -> tuple[Section, dict[str, str]]:
    matches: list[tuple[Section, dict[str, str]]] = []
    for section in find_sections(lines, "## Runtime Advisory"):
        values = section_table(lines, section)
        if values.get("Runtime Advisory Revision") == revision:
            matches.append((section, values))
    if len(matches) != 1:
        raise ReconciliationError(
            f"expected one runtime advisory for {revision}, found {len(matches)}"
        )
    return matches[0]


def optional_runtime_section(
    lines: list[str], revision: str
) -> tuple[Section, dict[str, str]] | None:
    matches: list[tuple[Section, dict[str, str]]] = []
    for section in find_sections(lines, "## Runtime Advisory"):
        values = section_table(lines, section)
        if values.get("Runtime Advisory Revision") == revision:
            matches.append((section, values))
    if len(matches) > 1:
        raise ReconciliationError(
            f"expected at most one runtime advisory for {revision}, found {len(matches)}"
        )
    return matches[0] if matches else None


def validate_diagnostic(
    queue_path: Path,
    runtime_values: dict[str, str],
    fingerprint: str,
    expected_confirmation: str,
) -> bool:
    if runtime_values.get("Runtime Advisory Fingerprint") != fingerprint:
        raise ReconciliationError("runtime advisory fingerprint does not match Queue verdict")
    owner_state = runtime_values.get("Runtime Owner State")
    current_confirmation = runtime_values.get("PMC Verdict Confirmation")
    is_terminal_stop_transition = (
        expected_confirmation == TERMINAL_CONFIRMATION
        and current_confirmation == DIAGNOSTIC_START_CONFIRMATION
        and owner_state == "DIAGNOSTIC_READY"
    )
    if current_confirmation != expected_confirmation and not is_terminal_stop_transition:
        raise ReconciliationError("terminal verdict confirmation is missing or invalid")

    diagnostic_raw = runtime_values.get("Runtime Diagnostic Path", "")
    diagnostic_hash = runtime_values.get("Runtime Diagnostic SHA256", "")
    diagnostic_verdict = runtime_values.get("Runtime Diagnostic Verdict", "")
    if owner_state == "ACKNOWLEDGED":
        if expected_confirmation != DIAGNOSTIC_START_CONFIRMATION:
            raise ReconciliationError("terminal reconciliation requires DIAGNOSTIC_READY")
        if any(value != "NONE" for value in (diagnostic_raw, diagnostic_hash, diagnostic_verdict)):
            raise ReconciliationError("ACKNOWLEDGED requires pending diagnostic NONE fields")
        if runtime_values.get("Runtime Diagnostic Due Status") != "PENDING":
            raise ReconciliationError("ACKNOWLEDGED requires a pending diagnostic due status")
        diagnostic_ready = False
    elif owner_state == "DIAGNOSTIC_READY":
        diagnostic_ready = True
    else:
        raise ReconciliationError("runtime owner state is unsupported")

    due = runtime_values.get("Runtime Diagnostic Due", "")
    try:
        parsed_due = datetime.fromisoformat(due.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ReconciliationError("Runtime Diagnostic Due is not ISO-8601") from exc
    if parsed_due.tzinfo is None:
        raise ReconciliationError("Runtime Diagnostic Due must include a timezone")

    if not diagnostic_ready:
        return False
    if not diagnostic_raw or diagnostic_raw == "NONE":
        raise ReconciliationError("DIAGNOSTIC_READY requires a diagnostic path")
    diagnostic_path = resolve_project_path(queue_path, diagnostic_raw)
    if not diagnostic_path.is_file():
        raise ReconciliationError(f"diagnostic file does not exist: {diagnostic_raw}")
    if diagnostic_hash != sha256(diagnostic_path):
        raise ReconciliationError("runtime diagnostic SHA256 does not match the file")
    return True


def expected_contract(queue_path: Path, queue_lines: list[str]) -> dict[str, str]:
    active = require_single_section(queue_lines, "## Active Wave")
    active_values = section_table(queue_lines, active)
    reconciliation = first_reconciliation_block(queue_lines)

    revision = active_values.get("Revision", "")
    task_path_raw = active_values.get("Project Task File", "")
    if not revision or not task_path_raw:
        raise ReconciliationError("Queue Active Wave is missing revision or Task path")
    if active_values.get("Action") != TERMINAL_ACTION:
        raise ReconciliationError("reconciler only accepts terminal non-executable Queue action")
    if "BLOCKED" not in active_values.get("Status", "") or "NOT EXECUTABLE" not in active_values.get(
        "Status", ""
    ):
        raise ReconciliationError("reconciler only accepts a blocked non-executable Queue")
    reconciliation_required = reconciliation.get("PMC Reconciliation Required", "")
    if reconciliation_required == "YES":
        expected_action = reconciliation.get("Expected Hermes Action")
        if expected_action == DIAGNOSTIC_START_CONFIRMATION:
            phase = "diagnostic_start"
        elif expected_action == TERMINAL_CONFIRMATION:
            phase = "terminal_stop"
        else:
            raise ReconciliationError("pending Queue expected action is unsupported")
    elif reconciliation_required.startswith("NO"):
        if not reconciliation.get("Expected Hermes Action", "").startswith("NONE"):
            raise ReconciliationError("acknowledged Queue must not request another Hermes action")
        phase = "acknowledged"
    else:
        raise ReconciliationError("Queue reconciliation state is not pending or acknowledged")
    if reconciliation.get("PMC Verdict Revision") != revision:
        raise ReconciliationError("Queue reconciliation revision does not match Active Wave")

    task_path = resolve_project_path(queue_path, task_path_raw)
    if not task_path.is_file():
        raise ReconciliationError(f"Task file does not exist: {task_path_raw}")

    return {
        "revision": revision,
        "task_id": active_values.get("Task ID", ""),
        "task_path": task_path_raw,
        "task_sha256": sha256(task_path),
        "queue_sha256": sha256(queue_path),
        "action": TERMINAL_ACTION,
        "fingerprint": reconciliation.get("Failure Fingerprint", ""),
        "phase": phase,
    }


def reconcile(queue_path: Path, status_path: Path, apply: bool) -> tuple[bool, list[str]]:
    queue_lines = queue_path.read_text(encoding="utf-8-sig").splitlines(keepends=True)
    status_lines = status_path.read_text(encoding="utf-8-sig").splitlines(keepends=True)
    validate_document_structure(status_lines)
    expected = expected_contract(queue_path, queue_lines)

    active = require_single_section(status_lines, "## Active Queue")
    execution = require_single_section(status_lines, "## Execution State")
    pmc_attention = require_single_section(status_lines, "## PMC Attention")
    reconciliation = require_single_section(status_lines, "## Reconciliation Status")
    confirmation = (
        DIAGNOSTIC_START_CONFIRMATION
        if expected["phase"] == "diagnostic_start"
        else TERMINAL_CONFIRMATION
    )
    runtime_match = optional_runtime_section(status_lines, expected["revision"])
    if expected["phase"] == "diagnostic_start" and runtime_match is None:
        raise ReconciliationError(
            f"expected one runtime advisory for {expected['revision']}, found 0"
        )
    if runtime_match is None:
        runtime = None
        diagnostic_ready = False
    else:
        runtime, runtime_values = runtime_match
        diagnostic_ready = validate_diagnostic(
            queue_path,
            runtime_values,
            expected["fingerprint"],
            confirmation,
        )

    if expected["phase"] == "diagnostic_start":
        diagnostic_state = "DIAGNOSTIC PRODUCED" if diagnostic_ready else "ACKNOWLEDGED / DIAGNOSTIC PENDING"
        reconciliation_value = f"{DIAGNOSTIC_START_CONFIRMATION} — {diagnostic_state}"
        queue_status = PENDING_DIAGNOSTIC_QUEUE_STATUS
    else:
        reconciliation_value = f"{TERMINAL_CONFIRMATION} — COMPLETE"
        queue_status = TERMINAL_QUEUE_STATUS
    due_status = "SATISFIED" if diagnostic_ready else "PENDING"

    updates = [
        (active, "Queue Revision", expected["revision"]),
        (active, "Task ID", expected["task_id"]),
        (active, "Task Path", expected["task_path"]),
        (active, "Task SHA256", expected["task_sha256"]),
        (active, "Queue SHA256", expected["queue_sha256"]),
        (active, "Action", expected["action"]),
        (
            reconciliation,
            f"Rev{expected['revision'].rsplit('-', 1)[-1]} Reconciliation",
            reconciliation_value,
        ),
        (reconciliation, "Queue Status", queue_status),
    ]
    if expected["phase"] != "diagnostic_start":
        updates.extend(
            [
                (execution, "State", TERMINAL_EXECUTION_STATE),
                (execution, "Failure Fingerprint", expected["fingerprint"]),
                (pmc_attention, "PMC Action Required", "NO"),
                (pmc_attention, "PMC Action Type", "NONE"),
                (
                    pmc_attention,
                    "PMC Action Reason",
                    f"revision {expected['revision']} terminal verdict acknowledged",
                ),
            ]
        )
    if runtime is not None:
        updates.extend(
            [
                (runtime, "PMC Verdict Confirmation", confirmation),
                (runtime, "Runtime Diagnostic Due Status", due_status),
            ]
        )

    mismatches: list[str] = []
    changed = False
    for section, key, value in updates:
        current = section_table(status_lines, section).get(key)
        if current != value:
            mismatches.append(f"{key}: {current!r} -> {value!r}")
            if apply:
                if (
                    section == reconciliation
                    and key.startswith("Rev")
                    and key.endswith(" Reconciliation")
                    and current is None
                ):
                    changed = insert_table_field(status_lines, section, key, value) or changed
                else:
                    changed = replace_table_field(status_lines, section, key, value) or changed

    if apply and changed:
        for index, line in enumerate(status_lines):
            if line.startswith("> Last updated:"):
                status_lines[index] = f"> Last updated: {datetime.now().astimezone().isoformat(timespec='seconds')}\n"
                break
        status_path.write_text("".join(status_lines), encoding="utf-8", newline="")

        reread = status_path.read_text(encoding="utf-8-sig").splitlines(keepends=True)
        validate_document_structure(reread)
        active_values = section_table(reread, require_single_section(reread, "## Active Queue"))
        reconciliation_values = section_table(
            reread, require_single_section(reread, "## Reconciliation Status")
        )
        execution_values = section_table(reread, require_single_section(reread, "## Execution State"))
        pmc_values = section_table(reread, require_single_section(reread, "## PMC Attention"))
        for _, key, value in updates:
            values = reconciliation_values if key in reconciliation_values else active_values
            if key in {"State", "Failure Fingerprint"}:
                values = execution_values
            elif key in {"PMC Action Required", "PMC Action Type", "PMC Action Reason"}:
                values = pmc_values
            if key in {"PMC Verdict Confirmation", "Runtime Diagnostic Due Status"}:
                _, values = find_runtime_section(reread, expected["revision"])
            if values.get(key) != value:
                raise ReconciliationError(f"read-back validation failed for {key}")

    return changed, mismatches


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--queue", type=Path, default=Path("ai/automation/HERMES-AUTO-QUEUE.md")
    )
    parser.add_argument(
        "--status", type=Path, default=Path("ai/automation/HERMES-EXECUTION-STATUS.md")
    )
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--check", action="store_true")
    mode.add_argument("--apply", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        changed, mismatches = reconcile(args.queue, args.status, apply=args.apply)
    except (OSError, ReconciliationError) as exc:
        print(f"STATUS_RECONCILIATION_ERROR: {exc}", file=sys.stderr)
        return 2

    if args.check:
        if mismatches:
            print("STATUS_MISMATCH")
            for mismatch in mismatches:
                print(f"- {mismatch}")
            return 1
        print("STATUS_OK")
        return 0

    print("STATUS_UPDATED" if changed else "NO_CHANGES")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
