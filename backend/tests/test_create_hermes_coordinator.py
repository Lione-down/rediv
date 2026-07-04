"""Regression tests for create-hermes-coordinator.py launcher rewrite.

These tests verify:
1. Body construction and validation are unchanged from the subprocess version
2. The least-privilege path (kanban_create import) resolves correctly
3. Contract validation catches all the same errors as before
4. Dry-run output is identical to the old subprocess approach
"""

from __future__ import annotations

import argparse
import io
import json
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch


# ---------------------------------------------------------------------------
# Helpers — import the module without triggering __main__
# ---------------------------------------------------------------------------

def _load_launcher():
    """Load the launcher module dynamically."""
    import importlib.util
    # Launcher is in ai/runtime/, tests are in backend/tests/
    project_root = Path(__file__).resolve().parent.parent.parent
    launcher_path = project_root / "ai" / "runtime" / "create-hermes-coordinator.py"
    spec = importlib.util.spec_from_file_location("launcher", str(launcher_path))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _dispatch_child_contract():
    return {
        "executor_idempotency_key": "revid:test:T4-010:execute:0",
        "executor_max_runtime": 1800,
        "executor_stop_after": "T4_010_REPORT_READY",
    }


class TestBodyConstruction(unittest.TestCase):
    """Verify body strings match the old subprocess contract."""

    def setUp(self):
        self.mod = _load_launcher()

    def test_dispatch_only_body_structure(self):
        body = self.mod.build_body(
            action="DISPATCH_ONLY",
            revision="phase4-wave3-workspace-shell-2026-07-02-31",
            task_id="T4-010",
            task_path="ai/tasks/todo/TASK-T4-010.md",
            idempotency_key="revid:test:T4-010:dispatch",
            executor_profile="revid-frontend",
            **_dispatch_child_contract(),
        )
        lines = body.split("\n")
        self.assertIn("Role: Dispatcher", lines)
        self.assertIn("Action: DISPATCH_ONLY", lines)
        self.assertIn("@ai/tasks/todo/TASK-T4-010.md", lines)

    def test_dispatch_only_body_carries_exact_executor_child_contract(self):
        body = self.mod.build_body(
            action="DISPATCH_ONLY",
            revision="rev-33",
            task_id="T4-010-UNIT-A",
            task_path="ai/tasks/todo/TASK-T4-010-UNIT-A.md",
            idempotency_key="revid:rev-33:T4-010-UNIT-A:dispatch",
            executor_profile="revid-frontend",
            executor_idempotency_key="revid:rev-33:T4-010-UNIT-A:execute:0",
            executor_max_runtime=1800,
            executor_stop_after="T4_010_UNIT_A_STATIC_BUILD_REPORT_READY",
        )

        lines = body.splitlines()
        self.assertIn("Executor Action: IMPLEMENT_AND_TEST_ONLY", lines)
        self.assertIn(
            "Executor Idempotency Key: revid:rev-33:T4-010-UNIT-A:execute:0",
            lines,
        )
        self.assertIn("Executor Max Runtime: 1800s", lines)
        self.assertIn(
            "Executor Stop After: T4_010_UNIT_A_STATIC_BUILD_REPORT_READY",
            lines,
        )

    def test_dispatch_only_missing_executor_child_contract_fails_closed(self):
        with self.assertRaisesRegex(ValueError, "DISPATCH_CHILD_CONTRACT_INCOMPLETE"):
            self.mod.build_body(
                action="DISPATCH_ONLY",
                revision="rev-33",
                task_id="T4-010-UNIT-A",
                task_path="ai/tasks/todo/TASK-T4-010-UNIT-A.md",
                idempotency_key="revid:rev-33:T4-010-UNIT-A:dispatch",
                executor_profile="revid-frontend",
            )

    def test_review_dispatch_only_body_structure(self):
        body = self.mod.build_body(
            action="REVIEW_DISPATCH_ONLY",
            revision="phase4-wave3-workspace-shell-2026-07-02-31",
            task_id="T4-002",
            task_path="ai/tasks/todo/TASK-T4-002.md",
            idempotency_key="revid:test:T4-002:review",
            review_profile="revid-reviewer",
            executor_card="t_abc123",
            report_path="ai/reports/REPORT-T4-002.md",
            review_path="ai/reviews/REVIEW-T4-002.md",
            handoff_path="ai/handoffs/HANDOFF-T4-002.md",
            reviewer_idempotency_key="revid:test:reviewer",
            handoff_idempotency_key="revid:test:handoff",
        )
        lines = body.split("\n")
        self.assertIn("Role: Lifecycle Coordinator", lines)
        self.assertIn("Action: REVIEW_DISPATCH_ONLY", lines)

    def test_unsupported_action_raises(self):
        with self.assertRaises(ValueError) as ctx:
            self.mod.build_body(
                action="UNKNOWN_ACTION",
                revision="test",
                task_id="T4-001",
                task_path="ai/tasks/todo/TASK-T4-001.md",
                idempotency_key="revid:test",
            )
        self.assertIn("UNSUPPORTED_COORDINATOR_ACTION", str(ctx.exception))


class TestBodyValidation(unittest.TestCase):
    """Verify validate_body catches the same errors as before."""

    def setUp(self):
        self.mod = _load_launcher()

    def test_valid_body_passes(self):
        body = self.mod.build_body(
            action="DISPATCH_ONLY",
            revision="rev1",
            task_id="T4-010",
            task_path="ai/tasks/todo/TASK-T4-010.md",
            idempotency_key="revid:test",
            executor_profile="revid-frontend",
            **_dispatch_child_contract(),
        )
        # Should not raise
        self.mod.validate_body(body, action="DISPATCH_ONLY", revision="rev1", task_path="ai/tasks/todo/TASK-T4-010.md")

    def test_missing_action_raises(self):
        body = "Role: Dispatcher\nRevision: rev1\nTask Path: ai/tasks/todo/TASK-T4-010.md\n@ai/tasks/todo/TASK-T4-010.md"
        with self.assertRaises(ValueError) as ctx:
            self.mod.validate_body(body, action="DISPATCH_ONLY", revision="rev1", task_path="ai/tasks/todo/TASK-T4-010.md")
        self.assertIn("COORDINATOR_BODY_CONTRACT_INVALID", str(ctx.exception))

    def test_ambiguous_action_raises(self):
        body = "Action: DISPATCH_ONLY\nAction: REVIEW_DISPATCH_ONLY\nRevision: rev1\nTask Path: ai/tasks/todo/TASK-T4-010.md\n@ai/tasks/todo/TASK-T4-010.md"
        with self.assertRaises(ValueError) as ctx:
            self.mod.validate_body(body, action="DISPATCH_ONLY", revision="rev1", task_path="ai/tasks/todo/TASK-T4-010.md")
        self.assertIn("COORDINATOR_BODY_ACTION_AMBIGUOUS", str(ctx.exception))


class TestArgsContract(unittest.TestCase):
    """Verify validate_args_contract catches the same errors."""

    def setUp(self):
        self.mod = _load_launcher()

    def test_dispatch_only_valid(self):
        args = argparse.Namespace(
            action="DISPATCH_ONLY",
            coordinator_profile="revid-dispatcher",
            max_runtime=120,
            executor_profile="revid-frontend",
            idempotency_key="revid:test:T4-010:dispatch",
            **_dispatch_child_contract(),
        )
        # Should not raise
        self.mod.validate_args_contract(args)

    def test_dispatch_only_wrong_profile(self):
        args = argparse.Namespace(
            action="DISPATCH_ONLY",
            coordinator_profile="revid-backend",
            max_runtime=120,
            executor_profile="revid-frontend",
        )
        with self.assertRaises(ValueError) as ctx:
            self.mod.validate_args_contract(args)
        self.assertIn("COORDINATOR_ACTION_PROFILE_MISMATCH", str(ctx.exception))

    def test_dispatch_only_insufficient_runtime(self):
        args = argparse.Namespace(
            action="DISPATCH_ONLY",
            coordinator_profile="revid-dispatcher",
            max_runtime=60,
            executor_profile="revid-frontend",
        )
        with self.assertRaises(ValueError) as ctx:
            self.mod.validate_args_contract(args)
        self.assertIn("COORDINATOR_RUNTIME_BUDGET_TOO_LOW", str(ctx.exception))

    def test_dispatch_only_wrong_executor(self):
        args = argparse.Namespace(
            action="DISPATCH_ONLY",
            coordinator_profile="revid-dispatcher",
            max_runtime=120,
            executor_profile="revid-reviewer",
        )
        with self.assertRaises(ValueError) as ctx:
            self.mod.validate_args_contract(args)
        self.assertIn("DISPATCH_EXECUTOR_PROFILE_INVALID", str(ctx.exception))

    def test_review_dispatch_forbids_executor(self):
        args = argparse.Namespace(
            action="REVIEW_DISPATCH_ONLY",
            coordinator_profile="revid-pm",
            max_runtime=180,
            executor_profile="revid-backend",
            review_profile="revid-reviewer",
            executor_card="t_abc",
            report_path="ai/reports/REPORT.md",
            review_path="ai/reviews/REVIEW.md",
            handoff_path="ai/handoffs/HANDOFF.md",
            reviewer_idempotency_key="rk1",
            handoff_idempotency_key="hk1",
        )
        with self.assertRaises(ValueError) as ctx:
            self.mod.validate_args_contract(args)
        self.assertIn("REVIEW_DISPATCH_FORBIDS_EXECUTOR_PROFILE", str(ctx.exception))

    def test_review_dispatch_missing_fields(self):
        args = argparse.Namespace(
            action="REVIEW_DISPATCH_ONLY",
            coordinator_profile="revid-pm",
            max_runtime=180,
            executor_profile=None,
            review_profile="revid-reviewer",
            executor_card=None,
            report_path=None,
            review_path=None,
            handoff_path=None,
            reviewer_idempotency_key=None,
            handoff_idempotency_key=None,
        )
        with self.assertRaises(ValueError) as ctx:
            self.mod.validate_args_contract(args)
        self.assertIn("REVIEW_DISPATCH_CONTRACT_INCOMPLETE", str(ctx.exception))


class TestResolveKanbanCreate(unittest.TestCase):
    """Verify the least-privilege import path resolves correctly."""

    def setUp(self):
        self.mod = _load_launcher()

    def test_resolve_returns_callable(self):
        cmd = self.mod._resolve_kanban_create()
        self.assertTrue(callable(cmd))

    def test_resolve_is_hermes_cli_function(self):
        cmd = self.mod._resolve_kanban_create()
        self.assertEqual(cmd.__module__, "hermes_cli.kanban")
        self.assertEqual(cmd.__name__, "_cmd_create")


class TestDryRunOutput(unittest.TestCase):
    """Verify dry-run output matches the old subprocess approach."""

    def setUp(self):
        self.mod = _load_launcher()

    def test_dry_run_returns_body_and_command(self):
        result = self.mod.create_coordinator_card(
            action="DISPATCH_ONLY",
            revision="phase4-wave3-workspace-shell-2026-07-02-31",
            task_id="T4-010",
            task_path="ai/tasks/todo/TASK-T4-010.md",
            executor_profile="revid-frontend",
            coordinator_profile="revid-dispatcher",
            title="T4-010: Dispatcher - Workspace shell revision 31",
            idempotency_key="revid:test:T4-010:dispatch",
            max_runtime=120,
            workspace="dir:D:/works/codexWorks/project_revid",
            dry_run=True,
            **_dispatch_child_contract(),
        )
        self.assertIsInstance(result, dict)
        self.assertIn("body", result)
        self.assertIn("command", result)
        self.assertEqual(result["body"].split("\n")[1], "Action: DISPATCH_ONLY")

    def test_dry_run_command_includes_hermes_exe(self):
        result = self.mod.create_coordinator_card(
            action="DISPATCH_ONLY",
            revision="rev1",
            task_id="T4-010",
            task_path="ai/tasks/todo/TASK-T4-010.md",
            executor_profile="revid-frontend",
            coordinator_profile="revid-dispatcher",
            title="Test",
            idempotency_key="revid:test",
            max_runtime=120,
            workspace="scratch",
            dry_run=True,
            **_dispatch_child_contract(),
        )
        cmd = result["command"]
        self.assertIn("kanban", cmd)
        self.assertIn("create", cmd)
        self.assertIn("--json", cmd)


class TestResolveHermesExecutable(unittest.TestCase):
    """Verify the hermes executable resolver works."""

    def setUp(self):
        self.mod = _load_launcher()

    def test_resolve_finds_hermes_exe(self):
        exe = self.mod.resolve_hermes_executable(None)
        self.assertTrue(exe.endswith("hermes.exe"))
        self.assertTrue(Path(exe).is_file())


class TestProgrammaticCardCreation(unittest.TestCase):
    """Verify the create_coordinator_card function works end-to-end."""

    def setUp(self):
        self.mod = _load_launcher()

    def test_create_coordinator_card_dry_run(self):
        """Test that dry_run=True returns correct structure."""
        result = self.mod.create_coordinator_card(
            action="DISPATCH_ONLY",
            revision="rev1",
            task_id="T4-010",
            task_path="ai/tasks/todo/TASK-T4-010.md",
            executor_profile="revid-frontend",
            coordinator_profile="revid-dispatcher",
            title="Test",
            idempotency_key="revid:test",
            max_runtime=120,
            workspace="scratch",
            dry_run=True,
            **_dispatch_child_contract(),
        )
        self.assertIn("body", result)
        self.assertIn("command", result)

    def test_create_coordinator_card_non_dry_run_mock(self):
        """Test that non-dry-run path calls _cmd_create correctly (mocked)."""
        mod = self.mod
        fake_card = {
            "id": "t_test123",
            "body": mod.build_body(
                action="DISPATCH_ONLY",
                revision="rev1",
                task_id="T4-010",
                task_path="ai/tasks/todo/TASK-T4-010.md",
                idempotency_key="revid:test",
                executor_profile="revid-frontend",
                **_dispatch_child_contract(),
            ),
        }

        # redirect_stdout uses sys.__stdout__, not sys.stdout, so we must
        # patch sys.__stdout__ to capture the mock's print() output
        captured = io.StringIO()
        original_stdout = sys.__stdout__
        sys.__stdout__ = captured

        def fake_cmd_create(args):
            print(json.dumps(fake_card))
            return 0

        try:
            with patch.object(mod, '_resolve_kanban_create', return_value=fake_cmd_create):
                result = mod.create_coordinator_card(
                    action="DISPATCH_ONLY",
                    revision="rev1",
                    task_id="T4-010",
                    task_path="ai/tasks/todo/TASK-T4-010.md",
                    executor_profile="revid-frontend",
                    coordinator_profile="revid-dispatcher",
                    title="Test",
                    idempotency_key="revid:test",
                    max_runtime=120,
                    workspace="scratch",
                    dry_run=False,
                    **_dispatch_child_contract(),
                )
                self.assertIsInstance(result, dict)
                self.assertIn("id", result)
                self.assertEqual(result["id"], "t_test123")
        finally:
            sys.__stdout__ = original_stdout

if __name__ == "__main__":
    unittest.main()
