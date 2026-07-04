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


def test_chinese_delivery_marker_is_canonical():
    assert "必须使用中文" in MODULE.CHINESE_DELIVERY_MARKER
    assert "Human Owner" in MODULE.CHINESE_DELIVERY_MARKER


def test_frontend_soul_has_bounded_runtime_smoke_fast_path():
    soul = (
        Path(__file__).parents[2]
        / "prompts"
        / "hermes-revid-frontend-soul.md"
    ).read_text(encoding="utf-8")
    assert "RUNTIME-SMOKE-" in soul


def test_runtime_markers_require_background_output_decode_guard():
    soul = (
        Path(__file__).parents[2]
        / "prompts"
        / "hermes-revid-frontend-soul.md"
    ).read_text(encoding="utf-8")
    markers = MODULE.RUNTIME_MARKERS["hermes-agent/tools/process_registry.py"]
    assert 'encoding="utf-8"' in markers
    assert 'errors="replace"' in markers
    assert "最多 5 个 tool turns" in soul
    assert "不得加载任何 skill" in soul
    assert "不得读取 CURRENT、ROADMAP、doing tasks" in soul


def test_frontend_and_reviewer_policies_require_browser_evidence_tools():
    for profile, action in (
        ("revid-frontend", "IMPLEMENT_AND_TEST_ONLY"),
        ("revid-reviewer", "INDEPENDENT_REVIEW_ONLY"),
    ):
        tools = MODULE.EXPECTED_POLICIES[profile][action]
        assert "browser_set_viewport" in tools
        assert "browser_screenshot" in tools


def test_frontend_soul_requires_real_viewport_and_screenshot_tools():
    soul = (
        Path(__file__).parents[2]
        / "prompts"
        / "hermes-revid-frontend-soul.md"
    ).read_text(encoding="utf-8")
    assert "browser_set_viewport" in soul
    assert "browser_screenshot" in soul
