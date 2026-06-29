import importlib.util
from pathlib import Path


SCRIPT = Path(__file__).parents[1] / "verify-hermes-role-contracts.py"
SPEC = importlib.util.spec_from_file_location("role_contract_verifier", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


def test_policy_parser_reads_only_action_tool_lists(tmp_path):
    config = tmp_path / "config.yaml"
    config.write_text(
        "secret: do-not-report\n"
        "kanban:\n"
        "  dispatch_in_gateway: true\n"
        "  worker_tool_policies:\n"
        "    DISPATCH_ONLY:\n"
        "      allowed_tools:\n"
        "        - read_file\n"
        "        - kanban_create\n"
        "prompt_caching:\n"
        "  cache_ttl: 5m\n",
        encoding="utf-8",
    )
    assert MODULE.parse_worker_tool_policies(config) == {
        "DISPATCH_ONLY": ["read_file", "kanban_create"]
    }


def test_policy_parser_detects_missing_policy(tmp_path):
    config = tmp_path / "config.yaml"
    config.write_text("kanban:\n  dispatch_in_gateway: true\n", encoding="utf-8")
    assert MODULE.parse_worker_tool_policies(config) == {}
