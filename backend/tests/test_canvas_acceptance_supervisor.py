from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from sqlalchemy.engine import make_url

REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
if str(REPOSITORY_ROOT) not in sys.path:
    sys.path.insert(0, str(REPOSITORY_ROOT))

from scripts.canvas_acceptance_supervisor import (
    AcceptanceSupervisor,
    HarnessError,
    HarnessResources,
    OwnedProcess,
    OwnedSchema,
    SupervisorConfig,
    SupervisorDependencies,
    build_backend_command,
    build_backend_environment,
    build_frontend_bundle_command,
    build_frontend_typecheck_command,
    build_live_browser_environment,
    build_migration_command,
    build_playwright_command,
    build_preview_command,
    build_seed_command,
    generate_schema_name,
    parse_admin_database_urls,
    preflight_ports,
    redact_mapping,
    resolve_owned_runtime_path,
    validate_health_payload,
)


class FakeSchemaGateway:
    def __init__(self, *, selected_schema: str | None = None) -> None:
        self.selected_schema = selected_schema
        self.events: list[tuple[str, str]] = []
        self.create_error: Exception | None = None
        self.selected_errors: list[Exception] = []

    def create_database(self, schema_name: str) -> None:
        self.events.append(("create", schema_name))
        if self.create_error is not None:
            raise self.create_error
        self.selected_schema = self.selected_schema or schema_name

    def selected_database(self, schema_name: str) -> str | None:
        self.events.append(("select", schema_name))
        if self.selected_errors:
            raise self.selected_errors.pop(0)
        return self.selected_schema

    def drop_database(self, schema_name: str) -> None:
        self.events.append(("drop", schema_name))


class FakeProcess:
    def __init__(self, *, alive: bool = True) -> None:
        self.alive = alive
        self.pid = 31415

    def poll(self) -> int | None:
        return None if self.alive else 0


class SchemaOwnershipTestCase(unittest.TestCase):
    def test_schema_name_contains_only_guarded_generated_components(self) -> None:
        self.assertEqual(
            generate_schema_name(pid=1234, nonce="A1b2_C3d4"),
            "revid_test_t5008_1234_a1b2_c3d4",
        )

    def test_schema_name_rejects_untrusted_nonce(self) -> None:
        with self.assertRaisesRegex(HarnessError, "nonce"):
            generate_schema_name(pid=1234, nonce="unsafe-name")

    def test_collision_never_adopts_or_drops_preexisting_schema(self) -> None:
        gateway = FakeSchemaGateway()
        gateway.create_error = RuntimeError("database exists")
        schema = OwnedSchema("revid_test_t5008_1234_deadbeef", gateway)

        with self.assertRaisesRegex(RuntimeError, "exists"):
            schema.create()
        self.assertFalse(schema.owns_schema)
        self.assertFalse(schema.created_by_process)
        self.assertFalse(schema.cleanup())
        self.assertEqual(
            gateway.events,
            [("create", "revid_test_t5008_1234_deadbeef")],
        )

    def test_identity_mismatch_tracks_creation_but_refuses_unsafe_drop(self) -> None:
        gateway = FakeSchemaGateway(selected_schema="revid_test_someone_else")
        schema = OwnedSchema("revid_test_t5008_1234_deadbeef", gateway)

        with self.assertRaisesRegex(HarnessError, "identity"):
            schema.create()

        self.assertFalse(schema.owns_schema)
        self.assertTrue(schema.created_by_process)
        with self.assertRaisesRegex(HarnessError, "identity"):
            schema.cleanup()
        self.assertNotIn(("drop", schema.schema_name), gateway.events)

    def test_identity_probe_exception_is_retried_during_final_cleanup(self) -> None:
        gateway = FakeSchemaGateway()
        gateway.selected_errors.append(RuntimeError("temporary probe failure"))
        schema = OwnedSchema("revid_test_t5008_1234_deadbeef", gateway)

        with self.assertRaisesRegex(RuntimeError, "temporary probe"):
            schema.create()

        self.assertTrue(schema.created_by_process)
        self.assertFalse(schema.owns_schema)
        gateway.selected_schema = schema.schema_name
        self.assertTrue(schema.cleanup())
        self.assertFalse(schema.created_by_process)
        self.assertEqual(gateway.events[-1], ("drop", schema.schema_name))

    def test_owned_cleanup_rechecks_identity_before_exact_drop(self) -> None:
        gateway = FakeSchemaGateway()
        schema = OwnedSchema("revid_test_t5008_1234_deadbeef", gateway)
        schema.create()
        gateway.selected_schema = schema.schema_name

        self.assertTrue(schema.cleanup())
        self.assertFalse(schema.owns_schema)
        self.assertEqual(gateway.events[-1], ("drop", schema.schema_name))

    def test_cleanup_fails_closed_when_owned_identity_changes(self) -> None:
        gateway = FakeSchemaGateway()
        schema = OwnedSchema("revid_test_t5008_1234_deadbeef", gateway)
        schema.create()
        gateway.selected_schema = "revid_test_wrong_target"

        with self.assertRaisesRegex(HarnessError, "identity"):
            schema.cleanup()

        self.assertTrue(schema.owns_schema)
        self.assertNotEqual(gateway.events[-1][0], "drop")

    def test_admin_url_is_mysql_and_target_schema_is_exact(self) -> None:
        urls = parse_admin_database_urls(
            "mysql+pymysql://acceptance:password@127.0.0.1:3306/admin",
            "revid_test_t5008_1234_deadbeef",
        )

        self.assertIsNone(urls.admin.database)
        self.assertEqual(urls.target.database, "revid_test_t5008_1234_deadbeef")

    def test_admin_url_rejects_non_mysql_dialect(self) -> None:
        with self.assertRaisesRegex(HarnessError, "MySQL"):
            parse_admin_database_urls(
                "postgresql://acceptance:password@127.0.0.1/admin",
                "revid_test_t5008_1234_deadbeef",
            )


class ProcessAndNetworkTestCase(unittest.TestCase):
    def test_occupied_port_fails_closed_before_mutation_callback(self) -> None:
        probes: list[tuple[str, int]] = []

        def probe(host: str, port: int) -> bool:
            probes.append((host, port))
            return port != 8765

        with self.assertRaisesRegex(HarnessError, "8765"):
            preflight_ports(api_port=8765, preview_port=9765, is_available=probe)
        self.assertEqual(probes, [("127.0.0.1", 8765)])

    def test_ports_must_be_distinct_loopback_ports(self) -> None:
        with self.assertRaisesRegex(HarnessError, "distinct"):
            preflight_ports(
                api_port=8765,
                preview_port=8765,
                is_available=lambda _host, _port: True,
            )

    def test_unowned_process_is_never_stopped(self) -> None:
        calls: list[int] = []
        process = OwnedProcess("backend")

        self.assertFalse(process.stop(stopper=lambda child: calls.append(child.pid)))
        self.assertEqual(calls, [])

    def test_owned_process_stops_only_recorded_handle(self) -> None:
        calls: list[int] = []
        child = FakeProcess()
        process = OwnedProcess("backend")
        process.record_started(child)

        self.assertTrue(process.stop(stopper=lambda owned: calls.append(owned.pid)))
        self.assertEqual(calls, [31415])
        self.assertFalse(process.is_owned)

    def test_failed_stop_retains_owned_handle_for_final_cleanup_retry(self) -> None:
        process = OwnedProcess("backend")
        process.record_started(FakeProcess())

        with self.assertRaisesRegex(RuntimeError, "stop failed"):
            process.stop(stopper=lambda _child: (_ for _ in ()).throw(RuntimeError("stop failed")))

        self.assertTrue(process.is_owned)

    def test_health_requires_mysql_connection_and_exact_alembic_match(self) -> None:
        valid = {
            "status": "ok",
            "database": {
                "dialect": "mysql",
                "connected": True,
                "ready": True,
                "alembic_current": "abc123",
                "alembic_head": "abc123",
                "alembic_match": True,
            },
        }
        validate_health_payload(valid)

        for field, value in (
            ("dialect", "sqlite"),
            ("connected", False),
            ("ready", False),
            ("alembic_match", False),
            ("alembic_current", "old"),
        ):
            with self.subTest(field=field):
                invalid = json.loads(json.dumps(valid))
                invalid["database"][field] = value
                with self.assertRaises(HarnessError):
                    validate_health_payload(invalid)


class EnvironmentAndCommandTestCase(unittest.TestCase):
    def test_sensitive_mapping_values_are_redacted_recursively(self) -> None:
        redacted = redact_mapping(
            {
                "plain": "visible",
                "REVID_DB_PASSWORD": "db-secret",
                "Authorization": "Bearer token-secret",
                "database_url": "mysql://user:url-secret@localhost/revid",
                "nested": {"password": "nested-secret"},
            },
            secrets=("db-secret", "token-secret", "url-secret", "nested-secret"),
        )

        rendered = json.dumps(redacted, sort_keys=True)
        self.assertEqual(redacted["plain"], "visible")
        self.assertEqual(redacted["REVID_DB_PASSWORD"], "[REDACTED]")
        for secret in ("db-secret", "token-secret", "url-secret", "nested-secret"):
            self.assertNotIn(secret, rendered)

    def test_backend_environment_excludes_admin_url_and_limits_cors(self) -> None:
        target = make_url(
            "mysql+pymysql://acceptance:db-password@127.0.0.1:3306/"
            "revid_test_t5008_1234_deadbeef"
        )
        child_env = build_backend_environment(
            {
                "PATH": "bin",
                "REVID_TEST_MYSQL_ADMIN_URL": "admin-secret",
                "REVID_DEV_ADMIN_KEY": "inherited-admin-secret",
                "REVID_LIVE_PASSWORD": "inherited-browser-secret",
            },
            target_url=target,
            preview_origin="http://127.0.0.1:9765",
            jwt_secret="jwt-secret",
            storage_root=Path("runtime/storage"),
            instance_id="instance-123",
        )

        self.assertNotIn("REVID_TEST_MYSQL_ADMIN_URL", child_env)
        self.assertEqual(child_env["REVID_DB_NAME"], target.database)
        self.assertEqual(child_env["REVID_CORS_ORIGINS"], '["http://127.0.0.1:9765"]')
        self.assertEqual(child_env["REVID_AGNES_API_KEY"], "")
        self.assertEqual(
            {key for key in child_env if key.startswith("REVID_")},
            {
                "REVID_AGNES_API_KEY",
                "REVID_CORS_ORIGINS",
                "REVID_DB_HOST",
                "REVID_DB_NAME",
                "REVID_DB_PASSWORD",
                "REVID_DB_PORT",
                "REVID_DB_USER",
                "REVID_JWT_SECRET",
                "REVID_ACCEPTANCE_INSTANCE_ID",
                "REVID_STORAGE_BACKEND",
                "REVID_STORAGE_LOCAL_ROOT",
            },
        )

    def test_live_browser_contract_keeps_credentials_only_in_child_env(self) -> None:
        runtime_root = Path("output/runtime/run-123").resolve()
        manifest_path = runtime_root / "manifest.json"
        child_env = build_live_browser_environment(
            {
                "PATH": "bin",
                "REVID_TEST_MYSQL_ADMIN_URL": "admin-secret",
                "REVID_DB_PASSWORD": "db-secret",
                "REVID_AGNES_API_KEY": "provider-secret",
            },
            app_origin="http://127.0.0.1:9765",
            api_origin="http://127.0.0.1:8765",
            phase="pre-restart",
            manifest_path=manifest_path,
            runtime_root=runtime_root,
            username="acceptance@example.invalid",
            password="browser-secret",
        )

        self.assertEqual(child_env["REVID_LIVE_PHASE"], "pre-restart")
        self.assertEqual(child_env["REVID_LIVE_MANIFEST_PATH"], str(manifest_path))
        self.assertEqual(child_env["REVID_LIVE_USERNAME"], "acceptance@example.invalid")
        self.assertEqual(child_env["REVID_LIVE_PASSWORD"], "browser-secret")
        self.assertEqual(
            {key for key in child_env if key.startswith("REVID_")},
            {
                "REVID_LIVE_API_ORIGIN",
                "REVID_LIVE_APP_ORIGIN",
                "REVID_LIVE_MANIFEST_PATH",
                "REVID_LIVE_PASSWORD",
                "REVID_LIVE_PHASE",
                "REVID_LIVE_USERNAME",
            },
        )

    def test_loopback_origin_rejects_password_only_userinfo(self) -> None:
        runtime_root = Path("output/runtime/run-123").resolve()
        with self.assertRaisesRegex(HarnessError, "credentials"):
            build_live_browser_environment(
                {"PATH": "bin"},
                app_origin="http://:fake-password@127.0.0.1:9765",
                api_origin="http://127.0.0.1:8765",
                phase="pre-restart",
                manifest_path=runtime_root / "manifest.json",
                runtime_root=runtime_root,
                username="acceptance@example.invalid",
                password="browser-secret",
            )

    def test_child_commands_are_argument_arrays_without_shell_expansion(self) -> None:
        self.assertEqual(
            build_backend_command("python.exe", 8765),
            (
                "python.exe",
                "-m",
                "uvicorn",
                "main:app",
                "--host",
                "127.0.0.1",
                "--port",
                "8765",
                "--workers",
                "1",
                "--lifespan",
                "on",
            ),
        )
        self.assertEqual(
            build_migration_command("python.exe"),
            ("python.exe", "-m", "alembic", "-c", "alembic.ini", "upgrade", "head"),
        )
        self.assertEqual(
            build_preview_command("node.exe", Path("node_modules/vite/bin/vite.js"), 9765),
            (
                "node.exe",
                str(Path("node_modules/vite/bin/vite.js")),
                "preview",
                "--host",
                "127.0.0.1",
                "--port",
                "9765",
                "--strictPort",
            ),
        )
        self.assertEqual(
            build_playwright_command("node.exe", Path("node_modules/@playwright/test/cli.js")),
            (
                "node.exe",
                str(Path("node_modules/@playwright/test/cli.js")),
                "test",
                "--config",
                "playwright.live.config.ts",
            ),
        )
        for command in (
            build_backend_command("python.exe", 8765),
            build_migration_command("python.exe"),
            build_preview_command("node.exe", Path("node_modules/vite/bin/vite.js"), 9765),
            build_playwright_command("node.exe", Path("node_modules/@playwright/test/cli.js")),
        ):
            self.assertIsInstance(command, tuple)
            self.assertNotIn("&&", command)

    def test_runtime_path_must_resolve_beneath_owned_root(self) -> None:
        root = Path("output/runtime").resolve()
        resolved = resolve_owned_runtime_path(root, "run-123")
        self.assertEqual(resolved, root / "run-123")
        with self.assertRaisesRegex(HarnessError, "runtime"):
            resolve_owned_runtime_path(root, "../outside")


class PartialCleanupTestCase(unittest.TestCase):
    def test_partial_start_cleanup_uses_owned_order_and_continues_after_error(self) -> None:
        events: list[str] = []
        schema_gateway = FakeSchemaGateway()
        schema = OwnedSchema("revid_test_t5008_1234_deadbeef", schema_gateway)
        schema.create()
        schema_gateway.events.clear()

        backend = OwnedProcess("backend")
        backend.record_started(FakeProcess())
        preview = OwnedProcess("preview")
        resources = HarnessResources(
            preview=preview,
            backend=backend,
            schema=schema,
            remove_runtime=lambda: events.append("runtime"),
        )

        def stop_process(child: FakeProcess) -> None:
            events.append(f"process:{child.pid}")
            raise subprocess.TimeoutExpired("owned", timeout=1)

        with self.assertRaisesRegex(HarnessError, "cleanup"):
            resources.cleanup(process_stopper=stop_process)

        self.assertEqual(events, ["process:31415", "runtime"])
        self.assertEqual(schema_gateway.events[-2:], [("select", schema.schema_name), ("drop", schema.schema_name)])


if __name__ == "__main__":
    unittest.main()
