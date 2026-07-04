import importlib.util
from pathlib import Path
import subprocess


SCRIPT = Path(__file__).parents[1] / "deploy-hermes-runtime-contracts.py"
SPEC = importlib.util.spec_from_file_location("deploy_hermes_runtime_contracts", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


def test_patch_asset_contains_runtime_guards():
    text = MODULE.patch_bytes(MODULE.PATCH_PATH).decode("utf-8")
    for marker in (
        "DISPATCH_CHILD_PROFILE_MISMATCH",
        "REVIEW_DISPATCH_CHILD_CONTRACT_INVALID",
        "DUPLICATE_WORKER_ACTION_MARKER",
        "WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION",
        "is_degenerate_no_tool_response",
        "degenerate_no_tool_response_exhausted",
        '"name": "browser_set_viewport"',
        '"name": "browser_screenshot"',
    ):
        assert marker in text


def test_installed_runtime_matches_or_accepts_patch():
    state = MODULE.classify(MODULE.DEFAULT_HERMES_ROOT, MODULE.PATCH_PATH)
    assert state in {"applied", "applicable"}


def test_installed_process_registry_handles_invalid_utf8_output():
    python = MODULE.DEFAULT_HERMES_ROOT / "venv" / "Scripts" / "python.exe"
    project_root = Path(__file__).parents[3]
    script = (
        "from tools.process_registry import ProcessRegistry\n"
        "r = ProcessRegistry()\n"
        "s = r.spawn_local("
        "'python -c \"import os; os.write(1, bytes([180,10]))\"', "
        f"cwd={str(project_root)!r}, task_id='invalid-utf8-regression')\n"
        "result = r.wait(s.id, timeout=15)\n"
        "assert result['status'] == 'exited', result\n"
        "assert result['exit_code'] == 0, result\n"
        "assert '\\ufffd' in result['output'], result\n"
    )
    result = subprocess.run(
        [str(python), "-c", script],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=30,
        cwd=project_root,
    )
    assert result.returncode == 0, result.stdout + result.stderr
