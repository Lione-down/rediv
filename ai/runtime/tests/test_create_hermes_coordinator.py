from __future__ import annotations

import argparse
import importlib.util
import json
import subprocess
import sys
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "create-hermes-coordinator.py"
SUPERVISOR_PROMPT = Path(__file__).resolve().parents[2] / "prompts" / "hermes-scheduled-supervisor.md"
SPEC = importlib.util.spec_from_file_location("create_hermes_coordinator", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class CoordinatorBodyTransportTests(unittest.TestCase):
    def setUp(self) -> None:
        self.revision = "phase4-test-revision"
        self.task_path = "ai/tasks/todo/TASK-TEST.md"
        self.idempotency_key = "revid:phase4-test-revision:T-TEST:coordinate"
        self.executor_idempotency_key = "revid:phase4-test-revision:T-TEST:execute:0"
        self.executor_max_runtime = 1800
        self.executor_stop_after = "T_TEST_REPORT_READY"

    def test_body_contains_standalone_action_and_task_reference(self) -> None:
        body = MODULE.build_body(
            action="DISPATCH_ONLY",
            revision=self.revision,
            task_id="T-TEST",
            task_path=self.task_path,
            executor_profile="revid-backend",
            executor_idempotency_key=self.executor_idempotency_key,
            executor_max_runtime=self.executor_max_runtime,
            executor_stop_after=self.executor_stop_after,
            idempotency_key=self.idempotency_key,
        )
        self.assertIn("Action: DISPATCH_ONLY", body.splitlines())
        self.assertIn(f"@{self.task_path}", body.splitlines())
        self.assertIn("Executor Max Runtime: 1800s", body.splitlines())
        self.assertIn(
            f"Executor Idempotency Key: {self.executor_idempotency_key}",
            body.splitlines(),
        )
        self.assertIn(
            f"Executor Stop After: {self.executor_stop_after}",
            body.splitlines(),
        )
        MODULE.validate_body(
            body,
            action="DISPATCH_ONLY",
            revision=self.revision,
            task_path=self.task_path,
        )

    def test_review_body_preserves_review_action_and_has_no_executor_contract(self) -> None:
        body = MODULE.build_body(
            action="REVIEW_DISPATCH_ONLY",
            revision=self.revision,
            task_id="T-TEST",
            task_path=self.task_path,
            executor_profile=None,
            review_profile="revid-reviewer",
            executor_card="t_executor",
            report_path="ai/reports/REPORT-T-TEST.md",
            review_path="ai/reviews/REVIEW-T-TEST.md",
            handoff_path="ai/handoffs/HANDOFF-T-TEST.md",
            reviewer_idempotency_key=f"{self.idempotency_key}:review:0",
            handoff_idempotency_key=f"{self.idempotency_key}:handoff:0",
            idempotency_key=self.idempotency_key,
        )

        lines = body.splitlines()
        self.assertIn("Action: REVIEW_DISPATCH_ONLY", lines)
        self.assertIn("Review Profile: revid-reviewer", lines)
        self.assertIn("Executor Evidence Card: t_executor", lines)
        self.assertNotIn("Action: DISPATCH_ONLY", lines)
        self.assertFalse(any(line.startswith("Executor Profile:") for line in lines))
        MODULE.validate_body(
            body,
            action="REVIEW_DISPATCH_ONLY",
            revision=self.revision,
            task_path=self.task_path,
        )

    def test_action_profile_mismatch_fails_closed(self) -> None:
        args = argparse.Namespace(
            action="REVIEW_DISPATCH_ONLY",
            coordinator_profile="revid-dispatcher",
            executor_profile=None,
            review_profile="revid-reviewer",
            max_runtime=180,
        )
        with self.assertRaisesRegex(ValueError, "COORDINATOR_ACTION_PROFILE_MISMATCH"):
            MODULE.validate_args_contract(args)

    def test_unknown_action_fails_closed(self) -> None:
        args = argparse.Namespace(
            action="UNKNOWN",
            coordinator_profile="revid-pm",
            executor_profile=None,
            review_profile=None,
            max_runtime=180,
        )
        with self.assertRaisesRegex(ValueError, "UNSUPPORTED_COORDINATOR_ACTION"):
            MODULE.validate_args_contract(args)

    def test_command_passes_multiline_body_as_one_argv_element(self) -> None:
        body = MODULE.build_body(
            action="DISPATCH_ONLY",
            revision=self.revision,
            task_id="T-TEST",
            task_path=self.task_path,
            executor_profile="revid-backend",
            executor_idempotency_key=self.executor_idempotency_key,
            executor_max_runtime=self.executor_max_runtime,
            executor_stop_after=self.executor_stop_after,
            idempotency_key=self.idempotency_key,
        )
        args = argparse.Namespace(
            action="DISPATCH_ONLY",
            board="revid",
            title="test coordinator",
            workspace="dir:D:/workspace",
            idempotency_key=self.idempotency_key,
            max_runtime=120,
            coordinator_profile="revid-pm",
        )
        command = MODULE.build_command(args, hermes_exe="hermes.exe", body=body)
        body_index = command.index("--body") + 1
        self.assertEqual(command[body_index], body)
        self.assertGreater(len(command[body_index].splitlines()), 1)
        self.assertEqual(command[command.index("--assignee") + 1], "revid-pm")
        self.assertEqual(command[command.index("--max-retries") + 1], "2")

    def test_review_dispatch_rejects_marginal_runtime_budget(self) -> None:
        args = argparse.Namespace(
            action="REVIEW_DISPATCH_ONLY",
            coordinator_profile="revid-pm",
            executor_profile=None,
            review_profile="revid-reviewer",
            executor_card="t_executor",
            report_path="ai/reports/REPORT-T-TEST.md",
            review_path="ai/reviews/REVIEW-T-TEST.md",
            handoff_path="ai/handoffs/HANDOFF-T-TEST.md",
            reviewer_idempotency_key="review-key",
            handoff_idempotency_key="handoff-key",
            max_runtime=120,
        )
        with self.assertRaisesRegex(
            ValueError, "COORDINATOR_RUNTIME_BUDGET_TOO_LOW"
        ):
            MODULE.validate_args_contract(args)

    def test_command_accepts_dedicated_dispatcher_profile(self) -> None:
        body = MODULE.build_body(
            action="DISPATCH_ONLY",
            revision=self.revision,
            task_id="T-TEST",
            task_path=self.task_path,
            executor_profile="revid-backend",
            executor_idempotency_key=self.executor_idempotency_key,
            executor_max_runtime=self.executor_max_runtime,
            executor_stop_after=self.executor_stop_after,
            idempotency_key=self.idempotency_key,
        )
        args = argparse.Namespace(
            action="DISPATCH_ONLY",
            board="revid",
            title="test dispatcher",
            workspace="dir:D:/workspace",
            idempotency_key=self.idempotency_key,
            max_runtime=120,
            coordinator_profile="revid-dispatcher",
        )

        command = MODULE.build_command(args, hermes_exe="hermes.exe", body=body)

        self.assertEqual(
            command[command.index("--assignee") + 1],
            "revid-dispatcher",
        )

    def test_dry_run_preserves_body_without_creating_card(self) -> None:
        completed = subprocess.run(
            [
                sys.executable,
                str(SCRIPT),
                "--revision",
                self.revision,
                "--action",
                "DISPATCH_ONLY",
                "--task-id",
                "T-TEST",
                "--task-path",
                self.task_path,
                "--executor-profile",
                "revid-backend",
                "--executor-idempotency-key",
                self.executor_idempotency_key,
                "--executor-max-runtime",
                str(self.executor_max_runtime),
                "--executor-stop-after",
                self.executor_stop_after,
                "--coordinator-profile",
                "revid-dispatcher",
                "--title",
                "test coordinator",
                "--idempotency-key",
                self.idempotency_key,
                "--max-runtime",
                "120",
                "--workspace",
                "dir:D:/workspace",
                "--hermes-exe",
                sys.executable,
                "--dry-run",
            ],
            check=True,
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        payload = json.loads(completed.stdout)
        self.assertIn("Action: DISPATCH_ONLY", payload["body"].splitlines())
        body_index = payload["command"].index("--body") + 1
        self.assertEqual(payload["command"][body_index], payload["body"])
        self.assertEqual(
            payload["command"][payload["command"].index("--assignee") + 1],
            "revid-dispatcher",
        )

    def test_supervisor_prompt_requires_launcher_and_forbids_shell_body(self) -> None:
        prompt = SUPERVISOR_PROMPT.read_text(encoding="utf-8")
        self.assertIn("ai/runtime/create-hermes-coordinator.py", prompt)
        self.assertIn("Action Routing Matrix", prompt)
        self.assertIn('Queue Action = `REVIEW_DISPATCH_ONLY`', prompt)
        self.assertIn('--action "<exact Queue Action>"', prompt)
        self.assertIn("--executor-idempotency-key", prompt)
        self.assertIn("--executor-max-runtime", prompt)
        self.assertIn("--executor-stop-after", prompt)
        self.assertIn("SUPERVISOR_QUEUE_ACTION_UNSUPPORTED", prompt)
        self.assertIn("严禁任何 fallback", prompt)
        self.assertNotIn("--body $body", prompt)
        self.assertNotIn('powershell -Command "& {$hermesExe', prompt)


if __name__ == "__main__":
    unittest.main()
