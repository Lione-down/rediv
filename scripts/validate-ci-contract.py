#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github" / "workflows" / "ci.yml"
CONSTRAINTS = ROOT / "backend" / "constraints.txt"
REQUIREMENTS = ROOT / "backend" / "requirements.txt"
PACKAGE_JSON = ROOT / "frontend" / "package.json"
PLAYWRIGHT_CONFIG = ROOT / "frontend" / "playwright.ci.config.ts"


def _normalized_package_name(value: str) -> str:
    return re.sub(r"[-_.]+", "-", value).lower()


def _require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def _validate_workflow(errors: list[str]) -> None:
    if not WORKFLOW.is_file():
        errors.append("missing .github/workflows/ci.yml")
        return
    text = WORKFLOW.read_text(encoding="utf-8")
    action_refs = re.findall(r"^\s*-?\s*uses:\s*([^\s#]+)", text, re.MULTILINE)
    _require(bool(action_refs), "CI must use pinned actions", errors)
    for action_ref in action_refs:
        _require(
            re.fullmatch(r"[^@\s]+@[0-9a-f]{40}", action_ref) is not None,
            f"action is not pinned to a full commit: {action_ref}",
            errors,
        )

    required_fragments = (
        "permissions:\n  contents: read",
        "image: mysql:8.0.42@sha256:63823b8e2cbe4ae0c558155e02d00beba56130fbc3d147efccbdb328ae2dbb9e",
        "REVID_TEST_MYSQL_ADMIN_URL: mysql+pymysql://root@127.0.0.1:3306/mysql",
        "python -m pip install --constraint constraints.txt --requirement requirements.txt",
        "python ../scripts/run-backend-tests.py",
        "npm ci",
        "npm run build",
        "npm run test:e2e:ci",
        "gitleaks/gitleaks-action",
        "github/codeql-action/init",
        "github/codeql-action/analyze",
        "if: failure()",
        "retention-days: 3",
    )
    for fragment in required_fragments:
        _require(fragment in text, f"CI missing contract: {fragment}", errors)
    _require("secrets." not in text, "ordinary CI must not consume repository secrets", errors)
    _require("pull-requests: write" not in text, "CI must not write pull requests", errors)
    _require("id-token: write" not in text, "CI must not mint OIDC tokens", errors)
    _require(
        (ROOT / "scripts" / "run-backend-tests.py").is_file(),
        "missing process-worker-safe backend test runner",
        errors,
    )


def _validate_dependencies(errors: list[str]) -> None:
    if not CONSTRAINTS.is_file():
        errors.append("missing backend/constraints.txt")
        return
    constraints = {}
    for line in CONSTRAINTS.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        match = re.fullmatch(r"([A-Za-z0-9_.-]+)==([^\s;]+)", stripped)
        _require(match is not None, f"constraint is not an exact pin: {stripped}", errors)
        if match:
            constraints[_normalized_package_name(match.group(1))] = match.group(2)

    direct_names = []
    for line in REQUIREMENTS.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if stripped and not stripped.startswith("#"):
            direct_names.append(_normalized_package_name(re.split(r"[<>=!~[]", stripped, maxsplit=1)[0]))
    for direct_name in direct_names:
        _require(direct_name in constraints, f"direct dependency is not constrained: {direct_name}", errors)


def _validate_frontend(errors: list[str]) -> None:
    package = json.loads(PACKAGE_JSON.read_text(encoding="utf-8"))
    _require(
        package.get("scripts", {}).get("test:e2e:ci")
        == (
            "playwright test --config playwright.ci.config.ts --grep-invert "
            '"200-node 300-connection Canvas passes focused interaction thresholds"'
        ),
        "frontend must expose the deterministic test:e2e:ci script",
        errors,
    )
    _require(
        package.get("scripts", {}).get("test:e2e:performance:headed")
        == (
            "playwright test --config playwright.performance.config.ts --headed --grep "
            '"200-node 300-connection Canvas passes focused interaction thresholds"'
        ),
        "frontend must retain the unchanged headed hardware performance gate",
        errors,
    )
    config = PLAYWRIGHT_CONFIG.read_text(encoding="utf-8")
    for fragment in ("workers: 1", "retries: 0", "reuseExistingServer: false", "webServer:"):
        _require(fragment in config, f"Playwright CI config missing: {fragment}", errors)


def main() -> int:
    errors: list[str] = []
    _validate_workflow(errors)
    _validate_dependencies(errors)
    _validate_frontend(errors)
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print("CI contract validation passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
