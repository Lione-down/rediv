import hashlib
import os
import subprocess
import sys
from pathlib import Path


SCRIPT = Path(__file__).parents[1] / "reconcile-hermes-execution-status.py"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest().upper()


def write_fixture(tmp_path: Path) -> tuple[Path, Path, Path]:
    task = tmp_path / "TASK-T4-010.md"
    task.write_text("# Task\n\n- Revision: `rev-32`\n", encoding="utf-8")

    diagnostic = tmp_path / "diagnostic.md"
    diagnostic.write_text("# Diagnostic\n\nSTILL_INFRA_BLOCKED\n", encoding="utf-8")

    queue = tmp_path / "HERMES-AUTO-QUEUE.md"
    queue.write_text(
        "# Queue\n\n"
        "```text\n"
        "PMC Reconciliation Required: YES\n"
        "PMC Verdict Revision: rev-32\n"
        "PMC Verdict: PMC_BLOCKED\n"
        "Failure Fingerprint: REV32_RUNTIME\n"
        "Expected Hermes Action: ACK_TERMINAL_VERDICT_AND_STOP\n"
        "```\n\n"
        "## Active Wave\n\n"
        "| Field | Value |\n"
        "|---|---|\n"
        "| Revision | `rev-32` |\n"
        "| Status | `BLOCKED — NOT EXECUTABLE / AWAITING HERMES STATUS RECONCILIATION` |\n"
        "| Task ID | `T4-010` |\n"
        f"| Project Task File | `{task.as_posix()}` |\n"
        "| Action | `NONE — terminal evidence only` |\n"
        "| Stop After | `ACK_TERMINAL_VERDICT_AND_STOP` |\n",
        encoding="utf-8",
    )

    status = tmp_path / "HERMES-EXECUTION-STATUS.md"
    status.write_text(
        "# Hermes Execution Status\n\n"
        "> Last updated: 2026-07-03T15:25:27+08:00\n\n"
        "## Active Queue — Revision 32\n\n"
        "| Field | Value |\n"
        "|---|---|\n"
        "| Queue Revision | `rev-32` |\n"
        "| Task ID | `T4-010` |\n"
        f"| Task Path | `{task.as_posix()}` |\n"
        "| Task SHA256 | `OLD_TASK_HASH` |\n"
        "| Queue SHA256 | `OLD_QUEUE_HASH` |\n"
        "| Action | `DISPATCH_ONLY` |\n\n"
        "## Execution State\n\n"
        "| Field | Value |\n"
        "|---|---|\n"
        "| State | `REPORT_READY` |\n"
        "| Failure Fingerprint | `OLD_FINGERPRINT` |\n\n"
        "## PMC Attention\n\n"
        "| Field | Value |\n"
        "|---|---|\n"
        "| PMC Action Required | `YES` |\n"
        "| PMC Action Type | `QUEUE_DECISION` |\n"
        "| PMC Action Reason | `REPORT_READY` |\n\n"
        "## Runtime Advisory — Revision 32 (Active)\n\n"
        "| Field | Value |\n"
        "|---|---|\n"
        "| Runtime Advisory Revision | `rev-32` |\n"
        "| Runtime Advisory Fingerprint | `REV32_RUNTIME` |\n"
        "| Runtime Owner State | `DIAGNOSTIC_READY` |\n"
        "| Runtime Diagnostic Due | `2026-07-03T15:55:27+08:00` |\n"
        "| Runtime Diagnostic Due Status | `VALID` |\n"
        f"| Runtime Diagnostic Path | `{diagnostic.as_posix()}` |\n"
        f"| Runtime Diagnostic SHA256 | `{sha256(diagnostic)}` |\n"
        "| Runtime Diagnostic Verdict | `STILL_INFRA_BLOCKED` |\n"
        "| PMC Verdict Confirmation | `ACK_TERMINAL_VERDICT_AND_STOP` |\n\n"
        "## Reconciliation Status\n\n"
        "| Field | Value |\n"
        "|---|---|\n"
        "| Rev32 Reconciliation | `ACK_TERMINAL_VERDICT_AND_STOP — COMPLETE` |\n"
        "| Queue Status | `BLOCKED — NOT EXECUTABLE / AWAITING PMC CONTINUATION DECISION` |\n",
        encoding="utf-8",
    )
    return queue, task, status


def run_reconciler(queue: Path, status: Path, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [
            sys.executable,
            str(SCRIPT),
            "--queue",
            str(queue),
            "--status",
            str(status),
            *args,
        ],
        capture_output=True,
        text=True,
        encoding="utf-8",
        env={**os.environ, "PYTHONIOENCODING": "utf-8"},
        check=False,
    )


def test_apply_repairs_terminal_canonical_fields_and_is_idempotent(tmp_path):
    queue, task, status = write_fixture(tmp_path)

    before = run_reconciler(queue, status, "--check")
    assert before.returncode == 1

    applied = run_reconciler(queue, status, "--apply")
    assert applied.returncode == 0, applied.stdout + applied.stderr

    content = status.read_text(encoding="utf-8")
    assert f"| Task SHA256 | `{sha256(task)}` |" in content
    assert f"| Queue SHA256 | `{sha256(queue)}` |" in content
    assert "| Action | `NONE — terminal evidence only` |" in content
    assert "| State | `PMC_BLOCKED — NOT EXECUTABLE / TERMINAL RECONCILIATION COMPLETE` |" in content
    assert "| Failure Fingerprint | `REV32_RUNTIME` |" in content
    assert "| PMC Action Required | `NO` |" in content
    assert "| PMC Action Type | `NONE` |" in content
    assert "| Queue Status | `BLOCKED — NOT EXECUTABLE / TERMINAL RECONCILIATION COMPLETE` |" in content
    assert "| Runtime Diagnostic Due | `2026-07-03T15:55:27+08:00` |" in content
    assert "| Runtime Diagnostic Due Status | `SATISFIED` |" in content

    first_hash = sha256(status)
    second = run_reconciler(queue, status, "--apply")
    assert second.returncode == 0, second.stdout + second.stderr
    assert "NO_CHANGES" in second.stdout
    assert sha256(status) == first_hash


def test_check_passes_after_apply(tmp_path):
    queue, _, status = write_fixture(tmp_path)
    assert run_reconciler(queue, status, "--apply").returncode == 0

    checked = run_reconciler(queue, status, "--check")
    assert checked.returncode == 0, checked.stdout + checked.stderr
    assert "STATUS_OK" in checked.stdout
    content = status.read_text(encoding="utf-8")
    assert "| State | `PMC_BLOCKED — NOT EXECUTABLE / TERMINAL RECONCILIATION COMPLETE` |" in content
    assert "| Failure Fingerprint | `REV32_RUNTIME` |" in content
    assert "| PMC Action Required | `NO` |" in content


def test_terminal_business_block_does_not_require_runtime_advisory(tmp_path):
    queue, _, status = write_fixture(tmp_path)
    content = status.read_text(encoding="utf-8")
    runtime_start = content.index("## Runtime Advisory")
    reconciliation_start = content.index("## Reconciliation Status")
    status.write_text(
        content[:runtime_start] + content[reconciliation_start:],
        encoding="utf-8",
    )

    applied = run_reconciler(queue, status, "--apply")
    assert applied.returncode == 0, applied.stdout + applied.stderr

    checked = run_reconciler(queue, status, "--check")
    assert checked.returncode == 0, checked.stdout + checked.stderr
    assert "STATUS_OK" in checked.stdout


def test_acknowledged_queue_hash_change_reconciles_once(tmp_path):
    queue, _, status = write_fixture(tmp_path)
    assert run_reconciler(queue, status, "--apply").returncode == 0

    queue_content = queue.read_text(encoding="utf-8")
    queue.write_text(
        queue_content.replace(
            "PMC Reconciliation Required: YES",
            "PMC Reconciliation Required: NO — ACKNOWLEDGED",
        ).replace(
            "Expected Hermes Action: ACK_TERMINAL_VERDICT_AND_STOP",
            "Expected Hermes Action: NONE — TERMINAL VERDICT ACKNOWLEDGED",
        ),
        encoding="utf-8",
    )

    assert run_reconciler(queue, status, "--check").returncode == 1
    assert run_reconciler(queue, status, "--apply").returncode == 0
    checked = run_reconciler(queue, status, "--check")
    assert checked.returncode == 0, checked.stdout + checked.stderr
    assert f"| Queue SHA256 | `{sha256(queue)}` |" in status.read_text(encoding="utf-8")


def test_diagnostic_start_phase_is_reconciled_without_premature_stop(tmp_path):
    queue, task, status = write_fixture(tmp_path)
    queue.write_text(
        queue.read_text(encoding="utf-8").replace(
            "ACK_TERMINAL_VERDICT_AND_STOP",
            "ACK_TERMINAL_VERDICT_AND_START_RUNTIME_DIAGNOSTIC",
        ),
        encoding="utf-8",
    )
    status.write_text(
        status.read_text(encoding="utf-8")
        .replace(
            "| PMC Verdict Confirmation | `ACK_TERMINAL_VERDICT_AND_STOP` |",
            "| PMC Verdict Confirmation | `ACK_TERMINAL_VERDICT_AND_START_RUNTIME_DIAGNOSTIC` |",
        )
        .replace(
            "| Rev32 Reconciliation | `ACK_TERMINAL_VERDICT_AND_STOP — COMPLETE` |",
            "| Rev32 Reconciliation | `ACK_TERMINAL_VERDICT_AND_START_RUNTIME_DIAGNOSTIC — DIAGNOSTIC PRODUCED` |",
        ),
        encoding="utf-8",
    )

    before = run_reconciler(queue, status, "--check")
    assert before.returncode == 1, before.stdout + before.stderr
    assert "STATUS_RECONCILIATION_ERROR" not in before.stderr

    applied = run_reconciler(queue, status, "--apply")
    assert applied.returncode == 0, applied.stdout + applied.stderr
    content = status.read_text(encoding="utf-8")
    assert f"| Task SHA256 | `{sha256(task)}` |" in content
    assert f"| Queue SHA256 | `{sha256(queue)}` |" in content
    assert (
        "| Rev32 Reconciliation | `ACK_TERMINAL_VERDICT_AND_START_RUNTIME_DIAGNOSTIC "
        "— DIAGNOSTIC PRODUCED` |" in content
    )
    assert "ACK_TERMINAL_VERDICT_AND_STOP — COMPLETE" not in content


def test_pending_diagnostic_ack_is_canonicalized_without_requiring_diagnostic(tmp_path):
    queue, task, status = write_fixture(tmp_path)
    queue.write_text(
        queue.read_text(encoding="utf-8").replace(
            "ACK_TERMINAL_VERDICT_AND_STOP",
            "ACK_TERMINAL_VERDICT_AND_START_RUNTIME_DIAGNOSTIC",
        ),
        encoding="utf-8",
    )
    diagnostic = tmp_path / "diagnostic.md"
    status.write_text(
        status.read_text(encoding="utf-8")
        .replace(
            "| Runtime Owner State | `DIAGNOSTIC_READY` |",
            "| Runtime Owner State | `ACKNOWLEDGED` |",
        )
        .replace(
            "| Runtime Diagnostic Due Status | `VALID` |",
            "| Runtime Diagnostic Due Status | `PENDING` |",
        )
        .replace(
            f"| Runtime Diagnostic Path | `{diagnostic.as_posix()}` |",
            "| Runtime Diagnostic Path | `NONE` |",
        )
        .replace(
            f"| Runtime Diagnostic SHA256 | `{sha256(diagnostic)}` |",
            "| Runtime Diagnostic SHA256 | `NONE` |",
        )
        .replace(
            "| Runtime Diagnostic Verdict | `STILL_INFRA_BLOCKED` |",
            "| Runtime Diagnostic Verdict | `NONE` |",
        )
        .replace(
            "| PMC Verdict Confirmation | `ACK_TERMINAL_VERDICT_AND_STOP` |",
            "| PMC Verdict Confirmation | `ACK_TERMINAL_VERDICT_AND_START_RUNTIME_DIAGNOSTIC` |",
        )
        .replace(
            "| Rev32 Reconciliation | `ACK_TERMINAL_VERDICT_AND_STOP — COMPLETE` |",
            "| Rev32 Reconciliation | `ACK_TERMINAL_VERDICT_AND_START_RUNTIME_DIAGNOSTIC "
            "— ACKNOWLEDGED / DIAGNOSTIC PENDING` |",
        ),
        encoding="utf-8",
    )

    before = run_reconciler(queue, status, "--check")
    assert before.returncode == 1, before.stdout + before.stderr
    assert "STATUS_RECONCILIATION_ERROR" not in before.stderr

    applied = run_reconciler(queue, status, "--apply")
    assert applied.returncode == 0, applied.stdout + applied.stderr
    content = status.read_text(encoding="utf-8")
    assert f"| Task SHA256 | `{sha256(task)}` |" in content
    assert f"| Queue SHA256 | `{sha256(queue)}` |" in content
    assert "| Runtime Owner State | `ACKNOWLEDGED` |" in content
    assert "| Runtime Diagnostic Due Status | `PENDING` |" in content
    assert "| Runtime Diagnostic Path | `NONE` |" in content
    assert "| Runtime Diagnostic SHA256 | `NONE` |" in content
    assert "| Runtime Diagnostic Verdict | `NONE` |" in content

    checked = run_reconciler(queue, status, "--check")
    assert checked.returncode == 0, checked.stdout + checked.stderr
    first_hash = sha256(status)
    second = run_reconciler(queue, status, "--apply")
    assert second.returncode == 0, second.stdout + second.stderr
    assert "NO_CHANGES" in second.stdout
    assert sha256(status) == first_hash


def test_apply_inserts_missing_revision_reconciliation_row(tmp_path):
    queue, _, status = write_fixture(tmp_path)
    status.write_text(
        status.read_text(encoding="utf-8").replace(
            "| Rev32 Reconciliation | `ACK_TERMINAL_VERDICT_AND_STOP — COMPLETE` |\n",
            "",
        ),
        encoding="utf-8",
    )

    before = run_reconciler(queue, status, "--check")
    assert before.returncode == 1, before.stdout + before.stderr

    applied = run_reconciler(queue, status, "--apply")
    assert applied.returncode == 0, applied.stdout + applied.stderr
    assert (
        "| Rev32 Reconciliation | `ACK_TERMINAL_VERDICT_AND_STOP — COMPLETE` |"
        in status.read_text(encoding="utf-8")
    )
    checked = run_reconciler(queue, status, "--check")
    assert checked.returncode == 0, checked.stdout + checked.stderr


def test_diagnostic_produced_transitions_to_terminal_stop(tmp_path):
    queue, _, status = write_fixture(tmp_path)
    queue.write_text(
        queue.read_text(encoding="utf-8").replace(
            "ACK_TERMINAL_VERDICT_AND_STOP",
            "ACK_TERMINAL_VERDICT_AND_START_RUNTIME_DIAGNOSTIC",
        ),
        encoding="utf-8",
    )
    status.write_text(
        status.read_text(encoding="utf-8")
        .replace(
            "| PMC Verdict Confirmation | `ACK_TERMINAL_VERDICT_AND_STOP` |",
            "| PMC Verdict Confirmation | `ACK_TERMINAL_VERDICT_AND_START_RUNTIME_DIAGNOSTIC` |",
        )
        .replace(
            "| Rev32 Reconciliation | `ACK_TERMINAL_VERDICT_AND_STOP — COMPLETE` |",
            "| Rev32 Reconciliation | `ACK_TERMINAL_VERDICT_AND_START_RUNTIME_DIAGNOSTIC "
            "— DIAGNOSTIC PRODUCED` |",
        ),
        encoding="utf-8",
    )
    assert run_reconciler(queue, status, "--apply").returncode == 0

    queue.write_text(
        queue.read_text(encoding="utf-8").replace(
            "ACK_TERMINAL_VERDICT_AND_START_RUNTIME_DIAGNOSTIC",
            "ACK_TERMINAL_VERDICT_AND_STOP",
        ),
        encoding="utf-8",
    )

    before = run_reconciler(queue, status, "--check")
    assert before.returncode == 1, before.stdout + before.stderr
    assert "STATUS_RECONCILIATION_ERROR" not in before.stderr

    applied = run_reconciler(queue, status, "--apply")
    assert applied.returncode == 0, applied.stdout + applied.stderr
    content = status.read_text(encoding="utf-8")
    assert "| PMC Verdict Confirmation | `ACK_TERMINAL_VERDICT_AND_STOP` |" in content
    assert "| Rev32 Reconciliation | `ACK_TERMINAL_VERDICT_AND_STOP — COMPLETE` |" in content
    checked = run_reconciler(queue, status, "--check")
    assert checked.returncode == 0, checked.stdout + checked.stderr


def test_check_rejects_malformed_multi_pipe_rows_outside_active_section(tmp_path):
    queue, _, status = write_fixture(tmp_path)
    status.write_text(
        "## Legacy State\n\n||| Field | Value |\n||||| State | stale |\n\n"
        + status.read_text(encoding="utf-8"),
        encoding="utf-8",
    )

    checked = run_reconciler(queue, status, "--check")

    assert checked.returncode == 2
    assert "malformed Markdown table row" in checked.stderr


def test_check_rejects_duplicate_canonical_fields_across_sections(tmp_path):
    queue, _, status = write_fixture(tmp_path)
    status.write_text(
        status.read_text(encoding="utf-8")
        + "\n## Stale Queue Snapshot\n\n"
        + "| Field | Value |\n"
        + "|---|---|\n"
        + "| Task ID | `T4-002` |\n",
        encoding="utf-8",
    )

    checked = run_reconciler(queue, status, "--check")

    assert checked.returncode == 2
    assert "duplicate canonical field across document: Task ID" in checked.stderr
