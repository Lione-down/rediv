#!/usr/bin/env python3
"""Fail-closed verifier for Revid Hermes Action/profile/tool contracts."""

from __future__ import annotations

import argparse
from pathlib import Path
import sys


EXPECTED_POLICIES = {
    "revid-dispatcher": {
        "DISPATCH_ONLY": [
            "read_file", "kanban_show", "kanban_create", "kanban_link",
            "kanban_complete", "kanban_block", "kanban_comment",
            "kanban_heartbeat",
        ],
    },
    "revid-pm": {
        "REVIEW_DISPATCH_ONLY": [
            "read_file", "kanban_show", "kanban_create", "kanban_link",
            "kanban_complete", "kanban_block", "kanban_comment",
            "kanban_heartbeat",
        ],
        "HANDOFF_ONLY": [
            "read_file", "write_file", "kanban_show", "kanban_complete",
            "kanban_block", "kanban_comment", "kanban_heartbeat",
        ],
    },
    "revid-backend": {
        "IMPLEMENT_AND_TEST_ONLY": [
            "read_file", "write_file", "patch", "search_files", "terminal",
            "process", "todo", "skill_view", "kanban_show",
            "kanban_complete", "kanban_block", "kanban_comment",
            "kanban_heartbeat",
        ],
    },
    "revid-frontend": {
        "IMPLEMENT_AND_TEST_ONLY": [
            "read_file", "write_file", "patch", "search_files", "terminal",
            "process", "todo", "skill_view", "browser_navigate",
            "browser_snapshot", "browser_set_viewport", "browser_screenshot",
            "browser_click", "browser_press", "browser_console",
            "kanban_show", "kanban_complete",
            "kanban_block", "kanban_comment", "kanban_heartbeat",
        ],
    },
    "revid-reviewer": {
        "INDEPENDENT_REVIEW_ONLY": [
            "read_file", "write_file", "search_files", "terminal", "process",
            "execute_code", "todo", "skill_view", "browser_navigate",
            "browser_snapshot", "browser_set_viewport", "browser_screenshot",
            "browser_click", "browser_press", "browser_console",
            "kanban_show", "kanban_complete",
            "kanban_block", "kanban_comment", "kanban_heartbeat",
        ],
    },
}

SOUL_TEMPLATES = {
    "revid-dispatcher": "hermes-revid-dispatcher-soul.md",
    "revid-pm": "hermes-revid-pm-soul.md",
    "revid-backend": "hermes-revid-backend-soul.md",
    "revid-frontend": "hermes-revid-frontend-soul.md",
    "revid-reviewer": "hermes-revid-reviewer-soul.md",
}

RUNTIME_MARKERS = {
    "hermes-agent/tools/kanban_tools.py": [
        "DISPATCH_CHILD_PROFILE_MISMATCH",
        "DISPATCH_CHILD_ACTION_MISMATCH",
        "REVIEW_DISPATCH_CHILD_CONTRACT_INVALID",
        "max_retries=(",
    ],
    "hermes-agent/hermes_cli/kanban_db.py": [
        "MISSING_WORKER_ACTION_MARKER",
        "DUPLICATE_WORKER_ACTION_MARKER",
        "UNKNOWN_WORKER_ACTION_MARKER",
    ],
    "hermes-agent/agent/agent_runtime_helpers.py": [
        "is_degenerate_no_tool_response",
    ],
    "hermes-agent/agent/conversation_loop.py": [
        "degenerate_no_tool_response_exhausted",
        "returned only placeholder punctuation",
    ],
    "hermes-agent/tools/process_registry.py": [
        'encoding="utf-8"',
        'errors="replace"',
    ],
    "hermes-agent/tools/browser_tool.py": [
        '"name": "browser_set_viewport"',
        '"name": "browser_screenshot"',
    ],
}

CHINESE_DELIVERY_MARKER = (
    "面向 Human Owner 的最终回复、执行总结、blocked/escalation 说明和 delivery "
    "必须使用中文。"
)


def parse_worker_tool_policies(config_path: Path) -> dict[str, list[str]]:
    """Parse only the policy subsection without loading or printing secrets."""
    policies: dict[str, list[str]] = {}
    in_kanban = False
    in_policies = False
    current_action: str | None = None
    for raw_line in config_path.read_text(encoding="utf-8").splitlines():
        stripped = raw_line.strip()
        indent = len(raw_line) - len(raw_line.lstrip(" "))
        if not stripped or stripped.startswith("#"):
            continue
        if indent == 0:
            in_kanban = stripped == "kanban:"
            in_policies = False
            current_action = None
            continue
        if not in_kanban:
            continue
        if indent == 2 and stripped == "worker_tool_policies:":
            in_policies = True
            continue
        if indent == 2 and in_policies:
            break
        if in_policies and indent == 4 and stripped.endswith(":"):
            current_action = stripped[:-1]
            policies[current_action] = []
            continue
        if (
            in_policies
            and current_action
            and indent == 8
            and stripped.startswith("- ")
        ):
            policies[current_action].append(stripped[2:].strip())
    return policies


def normalized_text(path: Path) -> str:
    return path.read_text(encoding="utf-8").replace("\r\n", "\n").rstrip() + "\n"


def verify(project_root: Path, hermes_home: Path) -> list[str]:
    errors: list[str] = []
    prompt_root = project_root / "ai" / "prompts"
    profile_root = hermes_home / "profiles"

    for profile, expected in EXPECTED_POLICIES.items():
        config = profile_root / profile / "config.yaml"
        if not config.is_file():
            errors.append(f"{profile}: config missing")
            continue
        actual = parse_worker_tool_policies(config)
        if actual != expected:
            errors.append(f"{profile}: worker_tool_policies drift")

        template = prompt_root / SOUL_TEMPLATES[profile]
        deployed = profile_root / profile / "SOUL.md"
        if not template.is_file() or not deployed.is_file():
            errors.append(f"{profile}: SOUL template/deployment missing")
        elif normalized_text(template) != normalized_text(deployed):
            errors.append(f"{profile}: deployed SOUL differs from template")
        elif CHINESE_DELIVERY_MARKER not in normalized_text(deployed):
            errors.append(f"{profile}: Chinese delivery marker missing")

    default_template = prompt_root / "hermes_system_prompt.md"
    default_deployed = hermes_home / "SOUL.md"
    if not default_deployed.is_file() or normalized_text(
        default_template
    ) != normalized_text(default_deployed):
        errors.append("default: deployed SOUL differs from template")
    elif CHINESE_DELIVERY_MARKER not in normalized_text(default_deployed):
        errors.append("default: Chinese delivery marker missing")

    supervisor = normalized_text(prompt_root / "hermes-scheduled-supervisor.md")
    launcher = normalized_text(
        project_root / "ai" / "runtime" / "create-hermes-coordinator.py"
    )
    required_supervisor = [
        "Action Routing Matrix", '--action "<exact Queue Action>"',
        "SUPERVISOR_QUEUE_ACTION_UNSUPPORTED",
        "SUPERVISOR_ACTION_PROFILE_CONTRACT_INVALID",
        "--executor-idempotency-key",
        "--executor-max-runtime",
        "--executor-stop-after",
    ]
    for marker in required_supervisor:
        if marker not in supervisor:
            errors.append(f"supervisor: required marker missing: {marker}")
    for marker in [
        "ACTION_CONTRACTS",
        "validate_args_contract",
        "--action",
        "--executor-idempotency-key",
        "--executor-max-runtime",
        "--executor-stop-after",
    ]:
        if marker not in launcher:
            errors.append(f"launcher: required marker missing: {marker}")

    for relative_path, markers in RUNTIME_MARKERS.items():
        runtime_path = hermes_home / relative_path
        if not runtime_path.is_file():
            errors.append(f"runtime: missing file {runtime_path.name}")
            continue
        runtime_text = normalized_text(runtime_path)
        for marker in markers:
            if marker not in runtime_text:
                errors.append(
                    f"runtime: {runtime_path.name} missing marker {marker}"
                )
    return errors


def main() -> int:
    default_project = Path(__file__).resolve().parents[2]
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-root", type=Path, default=default_project)
    parser.add_argument(
        "--hermes-home",
        type=Path,
        default=Path.home() / "AppData" / "Local" / "hermes",
    )
    args = parser.parse_args()
    errors = verify(args.project_root.resolve(), args.hermes_home.resolve())
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print("ROLE_CONTRACTS_OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
