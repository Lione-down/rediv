from __future__ import annotations

import json
import os
import subprocess
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
if str(REPOSITORY_ROOT) not in sys.path:
    sys.path.insert(0, str(REPOSITORY_ROOT))

from scripts.canvas_acceptance_processes import (
    run_bounded_command,
    start_command_process,
    stop_windows_process,
    wait_for_backend,
    wait_for_preview,
)
from scripts.canvas_acceptance_support import HarnessError


class FakeProcess:
    def __init__(self, *, alive: bool) -> None:
        self.pid = 4321
        self.alive = alive
        self.events: list[object] = []
        self.wait_results: list[object] = []

    def poll(self) -> int | None:
        return None if self.alive else 0

    def send_signal(self, signal_value: int) -> None:
        self.events.append(("signal", signal_value))

    def wait(self, timeout: float) -> int:
        self.events.append(("wait", timeout))
        if self.wait_results:
            result = self.wait_results.pop(0)
            if isinstance(result, Exception):
                raise result
        self.alive = False
        return 0


class FakeResponse:
    def __init__(self, body: str, *, status: int = 200) -> None:
        self._body = body.encode("utf-8")
        self.status = status

    def __enter__(self):
        return self

    def __exit__(self, *_args) -> None:
        return None

    def read(self) -> bytes:
        return self._body


class ReadinessOwnershipTestCase(unittest.TestCase):
    def test_backend_waiter_rejects_exited_owned_process_before_http_probe(self) -> None:
        calls: list[str] = []

        with self.assertRaisesRegex(HarnessError, "backend.*exited"):
            wait_for_backend(
                "http://127.0.0.1:8765",
                FakeProcess(alive=False),
                "instance-123",
                timeout_seconds=0.01,
                opener=lambda *_args, **_kwargs: calls.append("http"),
                sleeper=lambda _seconds: None,
            )

        self.assertEqual(calls, [])

    def test_preview_waiter_rejects_exited_owned_process_before_http_probe(self) -> None:
        calls: list[str] = []

        with self.assertRaisesRegex(HarnessError, "preview.*exited"):
            wait_for_preview(
                "http://127.0.0.1:9765",
                FakeProcess(alive=False),
                "instance-123",
                timeout_seconds=0.01,
                opener=lambda *_args, **_kwargs: calls.append("http"),
                sleeper=lambda _seconds: None,
            )

        self.assertEqual(calls, [])

    def test_backend_waiter_rejects_a_different_live_instance(self) -> None:
        payload = {
            "status": "ok",
            "instance_id": "unknown-instance",
            "database": {
                "dialect": "mysql",
                "connected": True,
                "ready": True,
                "alembic_current": "revision-a",
                "alembic_head": "revision-a",
                "alembic_match": True,
            },
        }

        with self.assertRaisesRegex(HarnessError, "backend instance identity"):
            wait_for_backend(
                "http://127.0.0.1:8765",
                FakeProcess(alive=True),
                "instance-123",
                timeout_seconds=0.01,
                opener=lambda *_args, **_kwargs: FakeResponse(json.dumps(payload)),
                sleeper=lambda _seconds: None,
            )

    def test_backend_waiter_accepts_matching_instance_and_mysql_health(self) -> None:
        payload = {
            "status": "ok",
            "instance_id": "instance-123",
            "database": {
                "dialect": "mysql",
                "connected": True,
                "ready": True,
                "alembic_current": "revision-a",
                "alembic_head": "revision-a",
                "alembic_match": True,
            },
        }

        wait_for_backend(
            "http://127.0.0.1:8765",
            FakeProcess(alive=True),
            "instance-123",
            timeout_seconds=0.01,
            opener=lambda *_args, **_kwargs: FakeResponse(json.dumps(payload)),
            sleeper=lambda _seconds: None,
        )

    def test_preview_waiter_fetches_marker_and_rejects_a_different_instance(self) -> None:
        requested_urls: list[str] = []

        def open_marker(url: str, **_kwargs) -> FakeResponse:
            requested_urls.append(url)
            return FakeResponse("unknown-instance\n")

        with self.assertRaisesRegex(HarnessError, "preview instance identity"):
            wait_for_preview(
                "http://127.0.0.1:9765",
                FakeProcess(alive=True),
                "instance-123",
                timeout_seconds=0.01,
                opener=open_marker,
                sleeper=lambda _seconds: None,
            )

        self.assertEqual(
            requested_urls,
            ["http://127.0.0.1:9765/revid-acceptance-marker.txt"],
        )

    def test_preview_waiter_accepts_only_the_exact_marker(self) -> None:
        wait_for_preview(
            "http://127.0.0.1:9765",
            FakeProcess(alive=True),
            "instance-123",
            timeout_seconds=0.01,
            opener=lambda *_args, **_kwargs: FakeResponse("instance-123\n"),
            sleeper=lambda _seconds: None,
        )


class BoundedCommandTestCase(unittest.TestCase):
    def test_start_failure_reports_only_redacted_fingerprint(self) -> None:
        def fail_start(*_args):
            raise OSError("cannot start with browser-secret")

        with self.assertRaises(HarnessError) as raised:
            run_bounded_command(
                "playwright-pre-restart",
                ("node", "playwright"),
                Path("frontend"),
                {"REVID_LIVE_PASSWORD": "browser-secret"},
                process_factory=fail_start,
            )

        message = str(raised.exception)
        self.assertIn("failed to start", message)
        self.assertNotIn("browser-secret", message)
        self.assertRegex(message, r"fingerprint=[a-f0-9]{16}")

    def test_failure_is_bounded_and_reports_only_redacted_fingerprint(self) -> None:
        process = unittest.mock.MagicMock()
        process.returncode = 1
        process.communicate.return_value = (
            "request password=browser-secret\nassertion failed",
            None,
        )
        stopped: list[object] = []

        with self.assertRaises(HarnessError) as raised:
            run_bounded_command(
                "playwright-pre-restart",
                ("node", "playwright"),
                Path("frontend"),
                {"PATH": "bin", "REVID_LIVE_PASSWORD": "browser-secret"},
                process_factory=lambda *_args: process,
                process_stopper=lambda child: stopped.append(child),
            )

        message = str(raised.exception)
        self.assertNotIn("browser-secret", message)
        self.assertNotIn("assertion failed", message)
        self.assertRegex(message, r"fingerprint=[a-f0-9]{16}")
        process.communicate.assert_called_once_with(timeout=300)
        self.assertEqual(stopped, [process])

    def test_timeout_reports_fingerprint_without_partial_secret_output(self) -> None:
        process = unittest.mock.MagicMock()
        process.communicate.side_effect = subprocess.TimeoutExpired(
            cmd=("node", "playwright"),
            timeout=300,
            output="bearer browser-secret",
        )
        stopped: list[object] = []

        with self.assertRaises(HarnessError) as raised:
            run_bounded_command(
                "playwright-post-restart",
                ("node", "playwright"),
                Path("frontend"),
                {"REVID_LIVE_PASSWORD": "browser-secret"},
                process_factory=lambda *_args: process,
                process_stopper=lambda child: stopped.append(child),
            )

        message = str(raised.exception)
        self.assertIn("timed out", message)
        self.assertNotIn("browser-secret", message)
        self.assertRegex(message, r"fingerprint=[a-f0-9]{16}")
        self.assertEqual(stopped, [process])

    @patch("scripts.canvas_acceptance_processes.subprocess.Popen")
    def test_command_process_uses_an_owned_process_group_and_pipes(self, popen_mock) -> None:
        start_command_process(
            ("node", "playwright"),
            Path("frontend"),
            {"PATH": "bin"},
        )

        kwargs = popen_mock.call_args.kwargs
        self.assertFalse(kwargs["shell"])
        self.assertIs(kwargs["stdout"], subprocess.PIPE)
        self.assertIs(kwargs["stderr"], subprocess.STDOUT)
        self.assertEqual(
            bool(kwargs["creationflags"]),
            os.name == "nt",
        )
        self.assertEqual(kwargs["start_new_session"], os.name != "nt")


class WindowsProcessTreeTestCase(unittest.TestCase):
    def test_graceful_break_does_not_taskkill_a_dead_pid(self) -> None:
        process = FakeProcess(alive=True)
        commands: list[tuple[str, ...]] = []

        stop_windows_process(
            process,
            ctrl_break_event=999,
            tree_killer=lambda command: commands.append(command),
        )

        self.assertEqual(process.events[:2], [("signal", 999), ("wait", 10)])
        self.assertEqual(commands, [])

    def test_already_dead_process_is_not_signalled_or_taskkilled(self) -> None:
        process = FakeProcess(alive=False)
        commands: list[tuple[str, ...]] = []

        stop_windows_process(
            process,
            ctrl_break_event=999,
            tree_killer=lambda command: commands.append(command),
        )

        self.assertEqual(process.events, [])
        self.assertEqual(commands, [])

    def test_break_timeout_forces_owned_tree_and_waits_for_parent(self) -> None:
        process = FakeProcess(alive=True)
        process.wait_results = [subprocess.TimeoutExpired("owned", 10), 0]
        commands: list[tuple[str, ...]] = []

        stop_windows_process(
            process,
            ctrl_break_event=999,
            tree_killer=lambda command: commands.append(command),
        )

        self.assertEqual(commands, [("taskkill", "/PID", "4321", "/T", "/F")])
        self.assertEqual(process.events.count(("wait", 10)), 2)


if __name__ == "__main__":
    unittest.main()
