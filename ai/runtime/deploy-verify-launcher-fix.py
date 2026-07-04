#!/usr/bin/env python3
"""Deploy/verification script for create-hermes-coordinator.py fix.

This script verifies the launcher fix by:
1. Checking that the file has been rewritten (no subprocess.run)
2. Checking that _resolve_kanban_create resolves correctly
3. Running a dry-run to verify body construction
4. Verifying the least-privilege path works

Usage:
    python deploy-verify-launcher-fix.py [--check-only]
"""

import json
import sys
import subprocess
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
LAUNCHER_PATH = PROJECT_ROOT / "ai" / "runtime" / "create-hermes-coordinator.py"
HERMES_VENV_PYTHON = Path(r"C:\Users\mkd\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe")


def check_no_subprocess_run():
    """Verify the old subprocess.run approach has been removed from code (not just comments)."""
    content = LAUNCHER_PATH.read_text(encoding="utf-8")
    # Remove triple-quoted docstrings
    import re
    content = re.sub(r'""".*?"""', '', content, flags=re.DOTALL)
    content = re.sub(r"'''.*?'''", '', content, flags=re.DOTALL)
    
    lines = content.split('\n')
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        # Skip comments
        if stripped.startswith('#'):
            continue
        if 'import subprocess' in stripped or 'subprocess.run(' in stripped:
            print(f"FAIL: subprocess.run found in code at line {i}: {stripped}")
            return False
    print("PASS: No subprocess.run in code (only in docstrings/comments)")
    return True


def check_kanban_create_import():
    """Verify _resolve_kanban_create resolves correctly."""
    python = str(HERMES_VENV_PYTHON)
    result = subprocess.run(
        [python, "-c", f"""
import sys
sys.path.insert(0, r'{PROJECT_ROOT}')
import importlib.util
spec = importlib.util.spec_from_file_location('launcher', r'{LAUNCHER_PATH}')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
cmd = mod._resolve_kanban_create()
assert cmd.__module__ == 'hermes_cli.kanban', f'Expected hermes_cli.kanban, got {{cmd.__module__}}'
assert cmd.__name__ == '_cmd_create', f'Expected _cmd_create, got {{cmd.__name__}}'
print('OK')
"""],
        capture_output=True, text=True, timeout=30
    )
    if result.returncode != 0:
        print(f"FAIL: _resolve_kanban_create failed: {result.stderr}")
        return False
    print("PASS: _resolve_kanban_create resolves to hermes_cli.kanban._cmd_create")
    return True


def check_dry_run():
    """Run a dry-run to verify body construction."""
    python = str(HERMES_VENV_PYTHON)
    result = subprocess.run(
        [
            python, str(LAUNCHER_PATH),
            "--action", "DISPATCH_ONLY",
            "--revision", "phase4-wave3-workspace-shell-2026-07-02-31",
            "--task-id", "T4-010",
            "--task-path", "ai/tasks/todo/TASK-T4-010.md",
            "--executor-profile", "revid-frontend",
            "--executor-idempotency-key", "revid:verify:T4-010:execute:0",
            "--executor-max-runtime", "1800",
            "--executor-stop-after", "T4_010_WORKSPACE_SHELL_REPORT_READY",
            "--coordinator-profile", "revid-dispatcher",
            "--title", "T4-010: Dispatcher - Workspace shell revision 31",
            "--idempotency-key", "revid:verify:T4-010:dispatch",
            "--max-runtime", "120",
            "--workspace", "dir:D:/works/codexWorks/project_revid",
            "--dry-run",
        ],
        capture_output=True, text=True, timeout=30,
        cwd=str(PROJECT_ROOT)
    )
    if result.returncode != 0:
        print(f"FAIL: Dry-run failed: {result.stderr}")
        return False
    
    data = json.loads(result.stdout)
    assert "body" in data, "Missing 'body' in dry-run output"
    assert "command" in data, "Missing 'command' in dry-run output"
    assert data["body"].startswith("Role: Dispatcher"), "Body doesn't start with Role: Dispatcher"
    assert "Executor Idempotency Key: revid:verify:T4-010:execute:0" in data["body"]
    assert "Executor Max Runtime: 1800s" in data["body"]
    assert "Executor Stop After: T4_010_WORKSPACE_SHELL_REPORT_READY" in data["body"]
    
    print("PASS: Dry-run produces valid body and command")
    return True


def check_regression_tests():
    """Run the regression test suite."""
    # Use the backend venv which has pytest installed
    test_python = str(PROJECT_ROOT / "backend" / ".venv" / "Scripts" / "python.exe")
    test_path = PROJECT_ROOT / "backend" / "tests" / "test_create_hermes_coordinator.py"
    result = subprocess.run(
        [test_python, "-m", "pytest", str(test_path), "-v", "--tb=short"],
        capture_output=True, text=True, timeout=60,
        cwd=str(PROJECT_ROOT / "backend")
    )
    if result.returncode != 0:
        print(f"FAIL: Regression tests failed:\n{result.stdout}\n{result.stderr}")
        return False
    
    # Count passed tests
    passed = result.stdout.count(" PASSED")
    if "passed" in result.stdout:
        parts = result.stdout.split()
        for i, p in enumerate(parts):
            if p == "passed":
                print(f"PASS: All {parts[i-1]} regression tests passed")
                return True
    
    print(f"PASS: {passed} regression tests passed")
    return True


def main():
    checks = [
        ("No subprocess.run", check_no_subprocess_run),
        ("_resolve_kanban_create", check_kanban_create_import),
        ("Dry-run", check_dry_run),
        ("Regression tests", check_regression_tests),
    ]
    
    all_passed = True
    for name, fn in checks:
        try:
            ok = fn()
        except Exception as e:
            print(f"FAIL: {name} raised exception: {e}")
            ok = False
        if not ok:
            all_passed = False
    
    if all_passed:
        print("\nALL CHECKS PASSED - Launcher fix verified")
        return 0
    else:
        print("\nSOME CHECKS FAILED")
        return 1


if __name__ == "__main__":
    sys.exit(main())
