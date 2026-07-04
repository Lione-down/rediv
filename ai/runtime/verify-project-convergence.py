from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path


TERMINAL_MARKERS = ("COMPLETE", "PMC_PASS", "PMC_BLOCKED", "PMC_REWORK", "DONE", "ACCEPTED")
ACTIVE_QUEUE_PATTERN = re.compile(r"^## Active Queue", re.MULTILINE)
EVIDENCE_PATH_PATTERN = re.compile(r"`(ai/evidence/[^`]+)`")


@dataclass(frozen=True)
class Finding:
    code: str
    path: Path
    message: str


def read_utf8(path: Path) -> str:
    return path.read_text(encoding="utf-8-sig")


def task_status(text: str) -> str:
    for line in text.splitlines()[:25]:
        if "status" in line.lower() or "状态" in line:
            return line.upper()
    return ""


def check_task_locations(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    for folder_name in ("doing", "todo"):
        folder = root / "ai" / "tasks" / folder_name
        if not folder.exists():
            continue
        for path in sorted(folder.glob("*.md")):
            status = task_status(read_utf8(path))
            if folder_name == "doing" and any(marker in status for marker in TERMINAL_MARKERS):
                findings.append(Finding("TASK_TERMINAL_IN_DOING", path, f"terminal status remains in {folder_name}"))
            if folder_name == "todo" and any(marker in status for marker in ("COMPLETE", "PMC_PASS", "DONE", "ACCEPTED")):
                findings.append(Finding("TASK_FINISHED_IN_TODO", path, "finished task remains in todo"))
    return findings


def check_active_queue(root: Path) -> list[Finding]:
    path = root / "ai" / "automation" / "HERMES-EXECUTION-STATUS.md"
    if not path.exists():
        return [Finding("STATUS_MISSING", path, "execution status is missing")]
    count = len(ACTIVE_QUEUE_PATTERN.findall(read_utf8(path)))
    if count != 1:
        return [Finding("ACTIVE_QUEUE_COUNT", path, f"expected 1 active queue section, found {count}")]
    return []


def check_report_evidence(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    reports = root / "ai" / "reports"
    if not reports.exists():
        return findings
    for path in sorted(reports.glob("REPORT-*.md")):
        text = read_utf8(path)
        if "✅" not in text and not re.search(r"\bPASS(?:ED)?\b", text, re.IGNORECASE):
            continue
        evidence_paths = EVIDENCE_PATH_PATTERN.findall(text)
        requires_browser_evidence = "## evidence" in text.lower() and (
            "viewport" in text.lower() or "browser" in text.lower()
        )
        if requires_browser_evidence and not evidence_paths:
            findings.append(Finding("BROWSER_PASS_WITHOUT_EVIDENCE", path, "browser PASS has no ai/evidence artifact reference"))
            continue
        for relative in evidence_paths:
            if not (root / relative).exists():
                findings.append(Finding("EVIDENCE_MISSING", path, f"referenced artifact does not exist: {relative}"))
    return findings


def verify(root: Path) -> list[Finding]:
    return check_task_locations(root) + check_active_queue(root) + check_report_evidence(root)


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify Codex/Hermes project convergence invariants.")
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    args = parser.parse_args()
    root = args.root.resolve()
    findings = verify(root)
    for finding in findings:
        relative = finding.path.relative_to(root) if finding.path.is_relative_to(root) else finding.path
        print(f"{finding.code}: {relative}: {finding.message}")
    if findings:
        print(f"CONVERGENCE_BLOCKED findings={len(findings)}")
        return 1
    print("CONVERGENCE_OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
