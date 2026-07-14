from __future__ import annotations

import json
import io
import shutil
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
if str(REPOSITORY_ROOT) not in sys.path:
    sys.path.insert(0, str(REPOSITORY_ROOT))

from scripts.canvas_acceptance_supervisor import (
    AcceptanceSupervisor,
    HarnessError,
    SupervisorConfig,
    SupervisorDependencies,
    build_frontend_bundle_command,
    build_frontend_typecheck_command,
    build_seed_command,
    main,
)


class FakeSchemaGateway:
    def __init__(self, events: list[str]) -> None:
        self.events = events
        self.selected: str | None = None

    def create_database(self, schema_name: str) -> None:
        self.events.append("schema:create")
        self.selected = schema_name

    def selected_database(self, schema_name: str) -> str | None:
        self.events.append("schema:identity")
        return self.selected

    def drop_database(self, schema_name: str) -> None:
        self.events.append("schema:drop")


class FakeProcess:
    def __init__(self, label: str, *, alive: bool = True) -> None:
        self.label = label
        self.pid = 1000
        self.alive = alive

    def poll(self) -> int | None:
        return None if self.alive else 0


class AcceptanceOrchestrationTestCase(unittest.TestCase):
    def _config(self, repo_root: Path) -> SupervisorConfig:
        return SupervisorConfig(
            repo_root=repo_root,
            run_id="run-123",
            instance_id="instance-123",
            schema_name="revid_test_t5008_1234_deadbeef",
            api_port=8765,
            preview_port=9765,
            python_executable="python.exe",
            node_executable="node.exe",
            username="acceptance-user",
            password="browser-secret",
            jwt_secret="jwt-secret",
        )

    def _dependencies(
        self,
        events: list[str],
        *,
        fail_label: str | None = None,
        ports_available: bool = True,
        backend_alive: bool = True,
        preview_alive: bool = True,
        cleanup_error: bool = False,
    ) -> SupervisorDependencies:
        gateway = FakeSchemaGateway(events)

        def run_command(label, command, cwd, environment):
            events.append(f"run:{label}")
            self.assertIsInstance(command, tuple)
            if label.startswith("playwright-"):
                expected_phase = label.removeprefix("playwright-")
                self.assertEqual(environment["REVID_LIVE_PHASE"], expected_phase)
                self.assertEqual(
                    {key for key in environment if key.startswith("REVID_")},
                    {
                        "REVID_LIVE_API_ORIGIN",
                        "REVID_LIVE_APP_ORIGIN",
                        "REVID_LIVE_MANIFEST_PATH",
                        "REVID_LIVE_PASSWORD",
                        "REVID_LIVE_PHASE",
                        "REVID_LIVE_USERNAME",
                    },
                )
                if label == "playwright-pre-restart":
                    manifest_path = Path(environment["REVID_LIVE_MANIFEST_PATH"])
                    manifest_path.write_text(
                        json.dumps(
                            {
                                "run": manifest_path.parent.name,
                                "project": "project-id",
                                "canvas": "canvas-id",
                                "checksum": "a" * 64,
                                "revision": 7,
                                "count": {"canvases": 1, "nodes": 0, "connections": 0},
                            }
                        ),
                        encoding="utf-8",
                    )
            if label == "seed-user":
                revid_keys = {key for key in environment if key.startswith("REVID_")}
                self.assertIn("REVID_ACCEPTANCE_USERNAME", revid_keys)
                self.assertIn("REVID_ACCEPTANCE_PASSWORD", revid_keys)
                self.assertNotIn("REVID_DEV_ADMIN_KEY", revid_keys)
            if label.startswith("frontend-"):
                self.assertFalse(any(key.startswith("REVID_") for key in environment))
                self.assertEqual(
                    {key for key in environment if key.startswith("VITE_")},
                    {"VITE_API_BASE_URL"},
                )
            if label == "frontend-build":
                (cwd / "dist").mkdir()
            if label == fail_label:
                raise HarnessError(f"{label} failed")

        def launch_process(label, command, cwd, environment):
            events.append(f"launch:{label}")
            self.assertIsInstance(command, tuple)
            self.assertNotIn("REVID_ACCEPTANCE_USERNAME", environment)
            self.assertNotIn("REVID_ACCEPTANCE_PASSWORD", environment)
            if label == "backend":
                self.assertEqual(
                    environment["REVID_ACCEPTANCE_INSTANCE_ID"],
                    "instance-123",
                )
            if label == "preview":
                marker = cwd / "dist/revid-acceptance-marker.txt"
                self.assertEqual(marker.read_text(encoding="utf-8"), "instance-123\n")
            is_alive = backend_alive if label == "backend" else preview_alive
            return FakeProcess(label) if is_alive else FakeProcess(label, alive=False)

        def stop_process(process):
            events.append(f"stop:{process.label}")
            process.alive = False

        def remove_runtime(path, root):
            events.append("runtime:remove")
            self.assertEqual(path.parent, root)
            if cleanup_error:
                raise RuntimeError("runtime cleanup failed")
            shutil.rmtree(path)

        def wait_for_backend(origin, process, instance_id):
            self.assertEqual(instance_id, "instance-123")
            events.append("ready:backend")

        def wait_for_preview(origin, process, instance_id):
            self.assertEqual(instance_id, "instance-123")
            events.append("ready:preview")

        return SupervisorDependencies(
            port_is_available=lambda host, port: ports_available,
            schema_gateway_factory=lambda urls: gateway,
            command_runner=run_command,
            process_launcher=launch_process,
            process_stopper=stop_process,
            health_waiter=wait_for_backend,
            preview_waiter=wait_for_preview,
            runtime_remover=remove_runtime,
            environment_metadata=lambda: {
                "os": "Windows",
                "machine": "AMD64",
                "python": "3.13.2",
            },
        )

    def test_success_runs_pre_restart_restart_post_restart_and_exact_cleanup(self) -> None:
        events: list[str] = []
        with tempfile.TemporaryDirectory() as temporary_directory:
            repo_root = Path(temporary_directory)
            (repo_root / "backend").mkdir()
            (repo_root / "frontend").mkdir()
            config = self._config(repo_root)
            supervisor = AcceptanceSupervisor(
                config,
                environment={
                    "PATH": "bin",
                    "VITE_API_BASE_URL": "http://unknown.invalid",
                    "VITE_INHERITED_SECRET": "must-not-enter-build",
                    "REVID_TEST_MYSQL_ADMIN_URL": (
                        "mysql+pymysql://acceptance:admin-secret@127.0.0.1:3306/admin"
                    ),
                },
                dependencies=self._dependencies(events),
            )

            summary = supervisor.execute()
            retained = json.loads(summary.evidence_path.read_text(encoding="utf-8"))
            self.assertFalse((repo_root / "output/runtime/run-123/manifest.json").exists())
            self.assertEqual(retained["status"], "passed")
            self.assertEqual(retained["checksum"], "a" * 64)

        self.assertEqual(
            [event for event in events if event.startswith("run:")],
            [
                "run:migrate",
                "run:seed-user",
                "run:frontend-typecheck",
                "run:frontend-build",
                "run:playwright-pre-restart",
                "run:playwright-post-restart",
            ],
        )
        self.assertEqual(
            [event for event in events if event.startswith("launch:")],
            ["launch:backend", "launch:preview", "launch:backend"],
        )
        self.assertEqual(events.count("ready:backend"), 2)
        self.assertEqual(events.count("ready:preview"), 1)
        self.assertEqual(
            [event for event in events if event.startswith("stop:")],
            ["stop:backend", "stop:preview", "stop:backend"],
        )
        self.assertEqual(events[-4:], ["stop:backend", "runtime:remove", "schema:identity", "schema:drop"])
        serialized = json.dumps(summary.to_evidence())
        self.assertNotIn(config.password, serialized)
        self.assertNotIn(config.jwt_secret, serialized)
        self.assertNotIn("admin-secret", serialized)
        self.assertEqual(json.loads(serialized)["evidence_path"], str(summary.evidence_path))
        self.assertEqual(summary.checksum, "a" * 64)

    def test_cleanup_failure_leaves_retained_evidence_pending(self) -> None:
        events: list[str] = []
        with tempfile.TemporaryDirectory() as temporary_directory:
            repo_root = Path(temporary_directory)
            (repo_root / "backend").mkdir()
            (repo_root / "frontend").mkdir()
            supervisor = AcceptanceSupervisor(
                self._config(repo_root),
                environment={
                    "REVID_TEST_MYSQL_ADMIN_URL": (
                        "mysql+pymysql://acceptance:admin-secret@127.0.0.1:3306/admin"
                    )
                },
                dependencies=self._dependencies(events, cleanup_error=True),
            )

            with self.assertRaisesRegex(HarnessError, "cleanup"):
                supervisor.execute()

            evidence_path = repo_root / "output/playwright/t5-008-live/run-123/summary.json"
            self.assertEqual(
                json.loads(evidence_path.read_text(encoding="utf-8"))["status"],
                "verification_passed_cleanup_pending",
            )

    def test_exited_backend_fails_readiness_instead_of_adopting_unknown_listener(self) -> None:
        events: list[str] = []
        with tempfile.TemporaryDirectory() as temporary_directory:
            repo_root = Path(temporary_directory)
            (repo_root / "backend").mkdir()
            (repo_root / "frontend").mkdir()
            supervisor = AcceptanceSupervisor(
                self._config(repo_root),
                environment={
                    "REVID_TEST_MYSQL_ADMIN_URL": (
                        "mysql+pymysql://acceptance:admin-secret@127.0.0.1:3306/admin"
                    )
                },
                dependencies=self._dependencies(events, backend_alive=False),
            )

            with self.assertRaisesRegex(HarnessError, "backend.*exited"):
                supervisor.execute()

        self.assertNotIn("launch:preview", events)

    def test_exited_preview_fails_readiness_instead_of_adopting_unknown_listener(self) -> None:
        events: list[str] = []
        with tempfile.TemporaryDirectory() as temporary_directory:
            repo_root = Path(temporary_directory)
            (repo_root / "backend").mkdir()
            (repo_root / "frontend").mkdir()
            supervisor = AcceptanceSupervisor(
                self._config(repo_root),
                environment={
                    "REVID_TEST_MYSQL_ADMIN_URL": (
                        "mysql+pymysql://acceptance:admin-secret@127.0.0.1:3306/admin"
                    )
                },
                dependencies=self._dependencies(events, preview_alive=False),
            )

            with self.assertRaisesRegex(HarnessError, "preview.*exited"):
                supervisor.execute()

        self.assertNotIn("run:playwright-pre-restart", events)

    def test_migration_failure_cleans_owned_schema_without_starting_processes(self) -> None:
        events: list[str] = []
        with tempfile.TemporaryDirectory() as temporary_directory:
            repo_root = Path(temporary_directory)
            (repo_root / "backend").mkdir()
            (repo_root / "frontend").mkdir()
            supervisor = AcceptanceSupervisor(
                self._config(repo_root),
                environment={
                    "PATH": "bin",
                    "REVID_TEST_MYSQL_ADMIN_URL": (
                        "mysql+pymysql://acceptance:admin-secret@127.0.0.1:3306/admin"
                    ),
                },
                dependencies=self._dependencies(events, fail_label="migrate"),
            )

            with self.assertRaisesRegex(HarnessError, "migrate"):
                supervisor.execute()

        self.assertNotIn("launch:backend", events)
        self.assertEqual(events[-3:], ["runtime:remove", "schema:identity", "schema:drop"])

    def test_occupied_port_fails_before_runtime_or_schema_mutation(self) -> None:
        events: list[str] = []
        with tempfile.TemporaryDirectory() as temporary_directory:
            repo_root = Path(temporary_directory)
            runtime_path = repo_root / "output" / "runtime" / "run-123"
            supervisor = AcceptanceSupervisor(
                self._config(repo_root),
                environment={
                    "REVID_TEST_MYSQL_ADMIN_URL": (
                        "mysql+pymysql://acceptance:admin-secret@127.0.0.1:3306/admin"
                    )
                },
                dependencies=self._dependencies(events, ports_available=False),
            )

            with self.assertRaisesRegex(HarnessError, "occupied"):
                supervisor.execute()

            self.assertFalse(runtime_path.exists())
        self.assertEqual(events, [])

    def test_frontend_and_seed_commands_use_direct_interpreters(self) -> None:
        frontend = Path("frontend")
        self.assertEqual(
            build_frontend_typecheck_command("node.exe", frontend),
            ("node.exe", str(frontend / "node_modules/vue-tsc/bin/vue-tsc.js"), "-b"),
        )
        self.assertEqual(
            build_frontend_bundle_command("node.exe", frontend),
            ("node.exe", str(frontend / "node_modules/vite/bin/vite.js"), "build"),
        )
        self.assertEqual(
            build_seed_command("python.exe"),
            ("python.exe", "scripts/seed_acceptance_user.py"),
        )

    def test_cli_redacts_unexpected_failure_instead_of_printing_exception(self) -> None:
        config = self._config(Path.cwd())
        output = io.StringIO()
        with (
            patch.object(SupervisorConfig, "create", return_value=config),
            patch.object(
                AcceptanceSupervisor,
                "execute",
                side_effect=RuntimeError("mysql://user:credential-secret@localhost/db"),
            ),
            redirect_stdout(output),
        ):
            result = main(["--execute"])

        self.assertEqual(result, 1)
        self.assertNotIn("credential-secret", output.getvalue())
        self.assertEqual(
            json.loads(output.getvalue()),
            {"status": "failed", "error": "Acceptance lifecycle failed"},
        )


if __name__ == "__main__":
    unittest.main()
