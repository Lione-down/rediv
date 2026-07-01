import importlib.util
from pathlib import Path


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
    ):
        assert marker in text


def test_installed_runtime_matches_or_accepts_patch():
    state = MODULE.classify(MODULE.DEFAULT_HERMES_ROOT, MODULE.PATCH_PATH)
    assert state in {"applied", "applicable"}
