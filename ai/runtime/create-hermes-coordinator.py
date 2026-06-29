"""Create a Revid Coordinator card without shell-mediated multiline arguments."""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Sequence


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


def validate_args_contract(args: argparse.Namespace) -> None:
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


def build_body(
    *,
    action: str,
    revision: str,
    task_id: str,
    task_path: str,
    idempotency_key: str,
    executor_profile: str | None = None,
    review_profile: str | None = None,
    executor_card: str | None = None,
    report_path: str | None = None,
    review_path: str | None = None,
    handoff_path: str | None = None,
    reviewer_idempotency_key: str | None = None,
    handoff_idempotency_key: str | None = None,
) -> str:
    if action == "DISPATCH_ONLY":
        lines = [
            "Role: Dispatcher",
            "Action: DISPATCH_ONLY",
            f"Revision: {revision}",
            f"Task: {task_id}",
            f"Task Path: {task_path}",
            f"Executor Profile: {executor_profile}",
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


def validate_body(
    body: str, *, action: str, revision: str, task_path: str
) -> None:
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


def resolve_hermes_executable(explicit: str | None = None) -> str:
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


def build_command(args: argparse.Namespace, *, hermes_exe: str, body: str) -> list[str]:
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


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--action", required=True, choices=sorted(ACTION_CONTRACTS))
    parser.add_argument("--revision", required=True)
    parser.add_argument("--task-id", required=True)
    parser.add_argument("--task-path", required=True)
    parser.add_argument("--executor-profile")
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
    body = build_body(
        action=args.action,
        revision=args.revision,
        task_id=args.task_id,
        task_path=args.task_path,
        executor_profile=args.executor_profile,
        review_profile=args.review_profile,
        executor_card=args.executor_card,
        report_path=args.report_path,
        review_path=args.review_path,
        handoff_path=args.handoff_path,
        reviewer_idempotency_key=args.reviewer_idempotency_key,
        handoff_idempotency_key=args.handoff_idempotency_key,
        idempotency_key=args.idempotency_key,
    )
    validate_body(
        body,
        action=args.action,
        revision=args.revision,
        task_path=args.task_path,
    )
    hermes_exe = resolve_hermes_executable(args.hermes_exe)
    command = build_command(args, hermes_exe=hermes_exe, body=body)

    if args.dry_run:
        print(json.dumps({"body": body, "command": command}, ensure_ascii=False))
        return 0

    completed = subprocess.run(
        command,
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if completed.returncode != 0:
        print(completed.stderr or completed.stdout, file=sys.stderr)
        return completed.returncode

    try:
        card = json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError("HERMES_CREATE_INVALID_JSON") from exc
    persisted_body = card.get("body")
    if persisted_body != body:
        raise RuntimeError("SUPERVISOR_COORDINATOR_BODY_CONTRACT_INVALID")
    validate_body(
        persisted_body,
        action=args.action,
        revision=args.revision,
        task_path=args.task_path,
    )
    print(json.dumps(card, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
