"""Create a Revid Coordinator card using kanban_create tool directly (least-privilege).

This launcher replaces the old subprocess.run() approach which required the
'terminal' tool — not allowed for DISPATCH_ONLY. Instead it calls the Hermes
CLI kanban_create function directly via import, which IS in the allowed_tools
list for revid-dispatcher DISPATCH_ONLY policy.

Usage (standalone CLI):
    python create-hermes-coordinator.py --action DISPATCH_ONLY ...

Usage (imported by dispatcher worker):
    from ai.runtime.create_hermes_coordinator import create_coordinator_card
    card = create_coordinator_card(...)
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
from pathlib import Path
from typing import Sequence

# ---------------------------------------------------------------------------
# Action contracts — mirrors the dispatcher policy matrix
# ---------------------------------------------------------------------------

ACTION_CONTRACTS = {
    "DISPATCH_ONLY": {
        "coordinator_profile": "revid-dispatcher",
        "role": "Dispatcher",
        "minimum_runtime": 120,
    },
    "REVIEW_DISPATCH_ONLY": {
        "coordinator_profile": "revid-pm",
        "role": "Lifecycle Coordinator",
        "minimum_runtime": 180,
    },
}


def validate_dispatch_child_contract(
    *,
    parent_idempotency_key: str,
    executor_idempotency_key: str | None,
    executor_max_runtime: int | None,
    executor_stop_after: str | None,
) -> None:
    missing = sorted(
        name
        for name, value in {
            "executor_idempotency_key": executor_idempotency_key,
            "executor_max_runtime": executor_max_runtime,
            "executor_stop_after": executor_stop_after,
        }.items()
        if value is None or value == ""
    )
    if missing:
        raise ValueError(f"DISPATCH_CHILD_CONTRACT_INCOMPLETE: missing {missing}")
    if executor_max_runtime is None or executor_max_runtime <= 0:
        raise ValueError("DISPATCH_CHILD_RUNTIME_INVALID: expected a positive value")
    if executor_idempotency_key == parent_idempotency_key:
        raise ValueError("DISPATCH_CHILD_IDEMPOTENCY_REUSES_PARENT")


# ---------------------------------------------------------------------------
# Contract validation
# ---------------------------------------------------------------------------

def validate_args_contract(args: argparse.Namespace) -> None:
    """Validate that parsed CLI args satisfy the action contract."""
    contract = ACTION_CONTRACTS.get(args.action)
    if contract is None:
        raise ValueError(f"UNSUPPORTED_COORDINATOR_ACTION: {args.action}")
    if args.coordinator_profile != contract["coordinator_profile"]:
        raise ValueError(
            "COORDINATOR_ACTION_PROFILE_MISMATCH: "
            f"{args.action} requires {contract['coordinator_profile']}, "
            f"got {args.coordinator_profile}"
        )
    if args.max_runtime < contract["minimum_runtime"]:
        raise ValueError(
            "COORDINATOR_RUNTIME_BUDGET_TOO_LOW: "
            f"{args.action} requires at least {contract['minimum_runtime']}s"
        )
    if args.action == "DISPATCH_ONLY":
        if args.executor_profile not in {"revid-backend", "revid-frontend"}:
            raise ValueError(
                "DISPATCH_EXECUTOR_PROFILE_INVALID: expected revid-backend or "
                f"revid-frontend, got {args.executor_profile}"
            )
        validate_dispatch_child_contract(
            parent_idempotency_key=args.idempotency_key,
            executor_idempotency_key=getattr(args, "executor_idempotency_key", None),
            executor_max_runtime=getattr(args, "executor_max_runtime", None),
            executor_stop_after=getattr(args, "executor_stop_after", None),
        )
    else:
        if args.executor_profile:
            raise ValueError("REVIEW_DISPATCH_FORBIDS_EXECUTOR_PROFILE")
        if args.review_profile != "revid-reviewer":
            raise ValueError("REVIEW_PROFILE_INVALID: expected revid-reviewer")
        required = {
            "executor_card": args.executor_card,
            "report_path": args.report_path,
            "review_path": args.review_path,
            "handoff_path": args.handoff_path,
            "reviewer_idempotency_key": args.reviewer_idempotency_key,
            "handoff_idempotency_key": args.handoff_idempotency_key,
        }
        missing = sorted(name for name, value in required.items() if not value)
        if missing:
            raise ValueError(
                f"REVIEW_DISPATCH_CONTRACT_INCOMPLETE: missing {missing}"
            )


# ---------------------------------------------------------------------------
# Body construction
# ---------------------------------------------------------------------------

def build_body(
    *,
    action: str,
    revision: str,
    task_id: str,
    task_path: str,
    idempotency_key: str,
    executor_profile: str | None = None,
    executor_idempotency_key: str | None = None,
    executor_max_runtime: int | None = None,
    executor_stop_after: str | None = None,
    review_profile: str | None = None,
    executor_card: str | None = None,
    report_path: str | None = None,
    review_path: str | None = None,
    handoff_path: str | None = None,
    reviewer_idempotency_key: str | None = None,
    handoff_idempotency_key: str | None = None,
) -> str:
    """Build the card body string. Used by both CLI and programmatic paths."""
    if action == "DISPATCH_ONLY":
        validate_dispatch_child_contract(
            parent_idempotency_key=idempotency_key,
            executor_idempotency_key=executor_idempotency_key,
            executor_max_runtime=executor_max_runtime,
            executor_stop_after=executor_stop_after,
        )
        lines = [
            "Role: Dispatcher",
            "Action: DISPATCH_ONLY",
            f"Revision: {revision}",
            f"Task: {task_id}",
            f"Task Path: {task_path}",
            f"Executor Profile: {executor_profile}",
            "Executor Action: IMPLEMENT_AND_TEST_ONLY",
            f"Executor Idempotency Key: {executor_idempotency_key}",
            f"Executor Max Runtime: {executor_max_runtime}s",
            f"Executor Stop After: {executor_stop_after}",
            (
                "Stop After: Create exactly one Executor child, link it to this "
                "Coordinator, then complete this Coordinator."
            ),
            f"Idempotency Key: {idempotency_key}",
            "",
            f"@{task_path}",
        ]
    elif action == "REVIEW_DISPATCH_ONLY":
        lines = [
            "Role: Lifecycle Coordinator",
            "Action: REVIEW_DISPATCH_ONLY",
            f"Revision: {revision}",
            f"Task: {task_id}",
            f"Task Path: {task_path}",
            f"Review Profile: {review_profile}",
            f"Executor Evidence Card: {executor_card}",
            f"Report Path: {report_path}",
            f"Review Output: {review_path}",
            f"Handoff Output: {handoff_path}",
            f"Reviewer Idempotency Key: {reviewer_idempotency_key}",
            f"Handoff Idempotency Key: {handoff_idempotency_key}",
            (
                "Stop After: Create exactly one INDEPENDENT_REVIEW_ONLY card "
                "and one dependent HANDOFF_ONLY card, verify both, then complete "
                "this Coordinator."
            ),
            f"Idempotency Key: {idempotency_key}",
            "",
            f"@{task_path}",
        ]
    else:
        raise ValueError(f"UNSUPPORTED_COORDINATOR_ACTION: {action}")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Body validation
# ---------------------------------------------------------------------------

def validate_body(
    body: str, *, action: str, revision: str, task_path: str
) -> None:
    """Validate that a body string satisfies the action contract."""
    lines = body.splitlines()
    required_lines = {
        f"Action: {action}",
        f"Revision: {revision}",
        f"Task Path: {task_path}",
        f"@{task_path}",
    }
    missing = sorted(required_lines.difference(lines))
    if missing:
        raise ValueError(f"COORDINATOR_BODY_CONTRACT_INVALID: missing {missing}")
    action_lines = [line for line in lines if line.startswith("Action:")]
    if action_lines != [f"Action: {action}"]:
        raise ValueError(
            f"COORDINATOR_BODY_ACTION_AMBIGUOUS: expected {action!r}, "
            f"got {action_lines}"
        )


# ---------------------------------------------------------------------------
# Hermes executable resolution (for CLI fallback)
# ---------------------------------------------------------------------------

def resolve_hermes_executable(explicit: str | None = None) -> str:
    """Find the hermes.exe on disk. Used only for --dry-run CLI output."""
    candidates: list[Path] = []
    if explicit:
        candidates.append(Path(explicit))
    local_app_data = os.environ.get("LOCALAPPDATA")
    if local_app_data:
        candidates.append(
            Path(local_app_data)
            / "hermes"
            / "hermes-agent"
            / "venv"
            / "Scripts"
            / "hermes.exe"
        )
    for candidate in candidates:
        if candidate.is_file():
            return str(candidate)
    discovered = shutil.which("hermes.exe")
    if discovered:
        return discovered
    raise FileNotFoundError("HERMES_EXE_NOT_FOUND: direct hermes.exe is required")


def build_command(
    args: argparse.Namespace, *, hermes_exe: str, body: str
) -> list[str]:
    """Build the backward-compatible CLI preview used by dry-run checks."""
    return [
        hermes_exe,
        "kanban",
        "--board",
        args.board,
        "create",
        args.title,
        "--assignee",
        args.coordinator_profile,
        "--workspace",
        args.workspace,
        "--priority",
        "0",
        "--idempotency-key",
        args.idempotency_key,
        "--max-runtime",
        str(args.max_runtime),
        "--max-retries",
        "2",
        "--created-by",
        "revid-scheduled-supervisor",
        "--body",
        body,
        "--json",
    ]


# ---------------------------------------------------------------------------
# Kanban-create via import (least-privilege, no terminal needed)
# ---------------------------------------------------------------------------

def _resolve_kanban_create() -> callable:
    """Import and return the _cmd_create function from hermes_cli.kanban.

    This is the least-privilege path: the dispatcher has 'kanban_create' in
    its DISPATCH_ONLY allowed_tools, so calling _cmd_create directly works
    without needing 'terminal'.
    """
    import importlib

    # Strategy 1: Already in hermes_cli path (e.g. Hermes venv or PYTHONPATH)
    try:
        mod = importlib.import_module("hermes_cli.kanban")
        return getattr(mod, "_cmd_create")
    except ImportError:
        pass

    # Strategy 2: Try the Hermes installation venv
    hermes_home = os.environ.get("LOCALAPPDATA", "")
    if hermes_home:
        hermes_py = Path(hermes_home) / "hermes" / "hermes-agent"
        if hermes_py.is_dir():
            hermes_path = str(hermes_py)
            sys.path.insert(0, hermes_path)
            try:
                mod = importlib.import_module("hermes_cli.kanban")
                return getattr(mod, "_cmd_create")
            except ImportError:
                sys.path.remove(hermes_path)

    # Strategy 3: Try common install locations
    for candidate in [
        Path(r"C:\Users\mkd\AppData\Local\hermes\hermes-agent"),
        Path("/usr/local/lib/hermes-agent"),
        Path.home() / ".hermes" / "hermes-agent",
    ]:
        if candidate.is_dir():
            candidate_path = str(candidate)
            sys.path.insert(0, candidate_path)
            try:
                mod = importlib.import_module("hermes_cli.kanban")
                return getattr(mod, "_cmd_create")
            except ImportError:
                sys.path.remove(candidate_path)

    raise RuntimeError(
        "HERMES_CLI_NOT_IMPORTABLE: Cannot import hermes_cli.kanban._cmd_create. "
        "Ensure Hermes is installed and hermes_cli is in the Python path."
    )


def create_coordinator_card(
    *,
    action: str,
    revision: str,
    task_id: str,
    task_path: str,
    executor_profile: str | None = None,
    executor_idempotency_key: str | None = None,
    executor_max_runtime: int | None = None,
    executor_stop_after: str | None = None,
    review_profile: str | None = None,
    executor_card: str | None = None,
    report_path: str | None = None,
    review_path: str | None = None,
    handoff_path: str | None = None,
    reviewer_idempotency_key: str | None = None,
    handoff_idempotency_key: str | None = None,
    coordinator_profile: str = "revid-dispatcher",
    title: str = "",
    idempotency_key: str = "",
    max_runtime: int = 120,
    workspace: str = "scratch",
    board: str = "revid",
    dry_run: bool = False,
) -> dict | str:
    """Create a Coordinator card via kanban_create tool (least-privilege).

    This is the main programmatic entry point. It replaces subprocess.run()
    with a direct import of hermes_cli.kanban._cmd_create.

    Args:
        action: DISPATCH_ONLY or REVIEW_DISPATCH_ONLY
        revision: Task revision string
        task_id: Task ID (e.g. T4-010)
        task_path: Path to the task file
        executor_profile: Target executor profile
        executor_idempotency_key: Exact idempotency key for the Executor child
        executor_max_runtime: Exact runtime budget for the Executor child
        executor_stop_after: Exact terminal marker for the Executor child
        review_profile: Target review profile (REVIEW_DISPATCH_ONLY only)
        coordinator_profile: Profile that owns this card
        title: Card title
        idempotency_key: Dedup key
        max_runtime: Runtime budget in seconds
        workspace: Herms workspace specification
        board: Kanban board name
        dry_run: If True, return the body and command instead of creating

    Returns:
        dict with card data on success, or error message on failure.
    """
    # Build and validate the body
    body = build_body(
        action=action,
        revision=revision,
        task_id=task_id,
        task_path=task_path,
        executor_profile=executor_profile,
        executor_idempotency_key=executor_idempotency_key,
        executor_max_runtime=executor_max_runtime,
        executor_stop_after=executor_stop_after,
        review_profile=review_profile,
        executor_card=executor_card,
        report_path=report_path,
        review_path=review_path,
        handoff_path=handoff_path,
        reviewer_idempotency_key=reviewer_idempotency_key,
        handoff_idempotency_key=handoff_idempotency_key,
        idempotency_key=idempotency_key,
    )
    validate_body(body, action=action, revision=revision, task_path=task_path)

    if dry_run:
        hermes_exe = resolve_hermes_executable(None)
        command_args = argparse.Namespace(
            board=board,
            title=title,
            coordinator_profile=coordinator_profile,
            workspace=workspace,
            idempotency_key=idempotency_key,
            max_runtime=max_runtime,
        )
        command = build_command(
            command_args,
            hermes_exe=hermes_exe,
            body=body,
        )
        return {"body": body, "command": command}

    # --- Real card creation via kanban_create tool ---
    cmd_create = _resolve_kanban_create()

    args = argparse.Namespace()
    args.board = board
    args.title = title
    args.assignee = coordinator_profile
    args.workspace = workspace
    args.priority = 0
    args.idempotency_key = idempotency_key
    args.max_runtime = max_runtime
    args.max_retries = 2
    args.created_by = "revid-scheduled-supervisor"
    args.body = body
    args.parent = []
    args.branch = None
    args.project = None
    args.tenant = None
    args.triage = False
    args.skills = None
    args.goal = False
    args.goal_max_turns = 20
    args.initial_status = "running"
    args.json = True

    # Capture stdout to parse JSON response
    import io
    from contextlib import redirect_stdout, redirect_stderr

    stdout_buf = io.StringIO()
    stderr_buf = io.StringIO()

    try:
        with redirect_stdout(stdout_buf), redirect_stderr(stderr_buf):
            exit_code = cmd_create(args)
    except Exception as exc:
        return {"error": str(exc), "exit_code": 1}

    if exit_code != 0:
        return {"error": stderr_buf.getvalue() or stdout_buf.getvalue(), "exit_code": exit_code}

    output = stdout_buf.getvalue().strip()
    try:
        card = json.loads(output)
    except json.JSONDecodeError:
        return {"error": f"Invalid JSON from kanban_create: {output}", "exit_code": 1}

    # Verify persisted body matches our contract
    persisted_body = card.get("body", "")
    if persisted_body != body:
        return {
            "error": "SUPERVISOR_COORDINATOR_BODY_CONTRACT_INVALID",
            "expected": body[:200],
            "persisted": persisted_body[:200],
        }

    return card


# ---------------------------------------------------------------------------
# CLI entry point (backward compatible)
# ---------------------------------------------------------------------------

def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create a Revid Coordinator card (least-privilege, no terminal)."
    )
    parser.add_argument("--action", required=True, choices=sorted(ACTION_CONTRACTS))
    parser.add_argument("--revision", required=True)
    parser.add_argument("--task-id", required=True)
    parser.add_argument("--task-path", required=True)
    parser.add_argument("--executor-profile")
    parser.add_argument("--executor-idempotency-key")
    parser.add_argument("--executor-max-runtime", type=int)
    parser.add_argument("--executor-stop-after")
    parser.add_argument("--review-profile")
    parser.add_argument("--executor-card")
    parser.add_argument("--report-path")
    parser.add_argument("--review-path")
    parser.add_argument("--handoff-path")
    parser.add_argument("--reviewer-idempotency-key")
    parser.add_argument("--handoff-idempotency-key")
    parser.add_argument("--coordinator-profile", required=True)
    parser.add_argument("--title", required=True)
    parser.add_argument("--idempotency-key", required=True)
    parser.add_argument("--max-runtime", required=True, type=int)
    parser.add_argument("--workspace", required=True)
    parser.add_argument("--board", default="revid")
    parser.add_argument("--hermes-exe")
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    validate_args_contract(args)

    if args.dry_run:
        result = create_coordinator_card(
            action=args.action,
            revision=args.revision,
            task_id=args.task_id,
            task_path=args.task_path,
            executor_profile=args.executor_profile,
            executor_idempotency_key=args.executor_idempotency_key,
            executor_max_runtime=args.executor_max_runtime,
            executor_stop_after=args.executor_stop_after,
            review_profile=args.review_profile,
            executor_card=args.executor_card,
            report_path=args.report_path,
            review_path=args.review_path,
            handoff_path=args.handoff_path,
            reviewer_idempotency_key=args.reviewer_idempotency_key,
            handoff_idempotency_key=args.handoff_idempotency_key,
            coordinator_profile=args.coordinator_profile,
            title=args.title,
            idempotency_key=args.idempotency_key,
            max_runtime=args.max_runtime,
            workspace=args.workspace,
            board=args.board,
            dry_run=True,
        )
        print(json.dumps(result, ensure_ascii=False))
        return 0

    # Real card creation
    result = create_coordinator_card(
        action=args.action,
        revision=args.revision,
        task_id=args.task_id,
        task_path=args.task_path,
        executor_profile=args.executor_profile,
        executor_idempotency_key=args.executor_idempotency_key,
        executor_max_runtime=args.executor_max_runtime,
        executor_stop_after=args.executor_stop_after,
        review_profile=args.review_profile,
        executor_card=args.executor_card,
        report_path=args.report_path,
        review_path=args.review_path,
        handoff_path=args.handoff_path,
        reviewer_idempotency_key=args.reviewer_idempotency_key,
        handoff_idempotency_key=args.handoff_idempotency_key,
        coordinator_profile=args.coordinator_profile,
        title=args.title,
        idempotency_key=args.idempotency_key,
        max_runtime=args.max_runtime,
        workspace=args.workspace,
        board=args.board,
        dry_run=False,
    )

    if isinstance(result, dict) and "error" in result:
        print(result["error"], file=sys.stderr)
        return result.get("exit_code", 1)

    if isinstance(result, dict):
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
