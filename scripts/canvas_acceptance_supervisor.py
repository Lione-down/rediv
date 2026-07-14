#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import secrets
import shutil
import sys
from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from pathlib import Path

_REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
if str(_REPOSITORY_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPOSITORY_ROOT))

from scripts.canvas_acceptance_processes import (  # noqa: E402
    HarnessResources,
    OwnedProcess,
    SupervisorDependencies,
    default_dependencies,
)
from scripts.canvas_acceptance_evidence import (  # noqa: E402
    EvidenceReference,
    finalize_retained_evidence,
    retain_live_evidence,
)
from scripts.canvas_acceptance_support import (  # noqa: E402
    LOOPBACK_HOST,
    DatabaseUrls,
    HarnessError,
    OwnedSchema,
    assert_acceptance_instance_id,
    build_backend_environment,
    build_live_browser_environment,
    generate_schema_name,
    parse_admin_database_urls,
    preflight_ports,
    redact_mapping,
    resolve_owned_runtime_path,
    validate_health_payload,
)


def build_backend_command(python_executable: str, api_port: int) -> tuple[str, ...]:
    return (
        python_executable,
        "-m",
        "uvicorn",
        "main:app",
        "--host",
        LOOPBACK_HOST,
        "--port",
        str(api_port),
        "--workers",
        "1",
        "--lifespan",
        "on",
    )


def build_migration_command(python_executable: str) -> tuple[str, ...]:
    return (python_executable, "-m", "alembic", "-c", "alembic.ini", "upgrade", "head")


def build_seed_command(python_executable: str) -> tuple[str, ...]:
    return (python_executable, "scripts/seed_acceptance_user.py")


def build_frontend_typecheck_command(
    node_executable: str,
    frontend_directory: Path,
) -> tuple[str, ...]:
    return (
        node_executable,
        str(frontend_directory / "node_modules/vue-tsc/bin/vue-tsc.js"),
        "-b",
    )


def build_frontend_bundle_command(
    node_executable: str,
    frontend_directory: Path,
) -> tuple[str, ...]:
    return (
        node_executable,
        str(frontend_directory / "node_modules/vite/bin/vite.js"),
        "build",
    )


def build_preview_command(
    node_executable: str,
    vite_cli: Path,
    preview_port: int,
) -> tuple[str, ...]:
    return (
        node_executable,
        str(vite_cli),
        "preview",
        "--host",
        LOOPBACK_HOST,
        "--port",
        str(preview_port),
        "--strictPort",
    )


def build_playwright_command(
    node_executable: str,
    playwright_cli: Path,
) -> tuple[str, ...]:
    return (
        node_executable,
        str(playwright_cli),
        "test",
        "--config",
        "playwright.live.config.ts",
    )


@dataclass(frozen=True)
class SupervisorConfig:
    repo_root: Path
    run_id: str
    instance_id: str
    schema_name: str
    api_port: int
    preview_port: int
    python_executable: str
    node_executable: str
    username: str
    password: str = field(repr=False)
    jwt_secret: str = field(repr=False)

    @classmethod
    def create(
        cls,
        repo_root: Path,
        *,
        api_port: int,
        preview_port: int,
        python_executable: str,
        node_executable: str,
    ) -> "SupervisorConfig":
        nonce = secrets.token_hex(8)
        process_id = os.getpid()
        return cls(
            repo_root=repo_root.resolve(),
            run_id=f"t5008-{process_id}-{nonce}",
            instance_id=f"t5008-instance-{process_id}-{nonce}",
            schema_name=generate_schema_name(pid=process_id, nonce=nonce),
            api_port=api_port,
            preview_port=preview_port,
            python_executable=python_executable,
            node_executable=node_executable,
            username=f"t5008_{process_id}_{nonce}",
            password=f"T5a-{secrets.token_urlsafe(24)}-9",
            jwt_secret=secrets.token_urlsafe(48),
        )


def write_preview_marker(frontend_directory: Path, instance_id: str) -> Path:
    assert_acceptance_instance_id(instance_id)
    frontend_root = frontend_directory.resolve()
    dist_directory = (frontend_root / "dist").resolve()
    if dist_directory.parent != frontend_root or not dist_directory.is_dir():
        raise HarnessError("Frontend build output is missing")
    marker_path = (dist_directory / "revid-acceptance-marker.txt").resolve()
    if marker_path.parent != dist_directory:
        raise HarnessError("Frontend acceptance marker path is unsafe")
    marker_path.write_text(f"{instance_id}\n", encoding="utf-8", newline="\n")
    return marker_path


@dataclass(frozen=True)
class RunSummary:
    run_id: str
    schema_name: str
    api_port: int
    preview_port: int
    evidence_path: Path
    checksum: str
    revision: int
    count: dict[str, int]
    acceptance: dict[str, object] | None = None

    def to_evidence(self) -> dict[str, object]:
        evidence = {
            "status": "passed",
            "run_id": self.run_id,
            "schema_name": self.schema_name,
            "api_port": self.api_port,
            "preview_port": self.preview_port,
            "evidence_path": str(self.evidence_path),
            "checksum": self.checksum,
            "revision": self.revision,
            "count": self.count,
        }
        if self.acceptance is not None:
            evidence["acceptance"] = self.acceptance
        return evidence


class AcceptanceSupervisor:
    def __init__(
        self,
        config: SupervisorConfig,
        *,
        environment: Mapping[str, str],
        dependencies: SupervisorDependencies | None = None,
    ) -> None:
        self.config = config
        self._environment = dict(environment)
        self._dependencies = dependencies or default_dependencies()

    def preflight(self) -> DatabaseUrls:
        preflight_ports(
            api_port=self.config.api_port,
            preview_port=self.config.preview_port,
            is_available=self._dependencies.port_is_available,
        )
        raw_admin_url = self._environment.get("REVID_TEST_MYSQL_ADMIN_URL", "")
        return parse_admin_database_urls(raw_admin_url, self.config.schema_name)

    def execute(self) -> RunSummary:
        urls = self.preflight()
        config = self.config
        deps = self._dependencies
        repo_root = config.repo_root.resolve()
        backend_dir = repo_root / "backend"
        frontend_dir = repo_root / "frontend"
        runtime_root = (repo_root / "output/runtime").resolve()
        runtime_path = resolve_owned_runtime_path(runtime_root, config.run_id)
        runtime_path.mkdir(parents=True, exist_ok=False)
        schema = OwnedSchema(config.schema_name, deps.schema_gateway_factory(urls))
        backend_process = OwnedProcess("backend")
        preview_process = OwnedProcess("preview")
        resources = HarnessResources(
            preview=preview_process,
            backend=backend_process,
            schema=schema,
            remove_runtime=lambda: deps.runtime_remover(runtime_path, runtime_root),
        )
        api_origin = f"http://{LOOPBACK_HOST}:{config.api_port}"
        app_origin = f"http://{LOOPBACK_HOST}:{config.preview_port}"
        manifest_path = runtime_path / "manifest.json"
        evidence_reference: EvidenceReference | None = None
        try:
            schema.create()
            backend_environment = build_backend_environment(
                self._environment,
                target_url=urls.target,
                preview_origin=app_origin,
                jwt_secret=config.jwt_secret,
                storage_root=runtime_path / "storage",
                instance_id=config.instance_id,
            )
            deps.command_runner(
                "migrate",
                build_migration_command(config.python_executable),
                backend_dir,
                backend_environment,
            )
            seed_environment = dict(backend_environment)
            seed_environment.update(
                {
                    "REVID_ACCEPTANCE_USERNAME": config.username,
                    "REVID_ACCEPTANCE_PASSWORD": config.password,
                }
            )
            deps.command_runner(
                "seed-user",
                build_seed_command(config.python_executable),
                backend_dir,
                seed_environment,
            )
            frontend_environment = {
                key: value
                for key, value in self._environment.items()
                if not key.startswith(("REVID_", "VITE_"))
            }
            frontend_environment["VITE_API_BASE_URL"] = api_origin
            deps.command_runner(
                "frontend-typecheck",
                build_frontend_typecheck_command(config.node_executable, frontend_dir),
                frontend_dir,
                frontend_environment,
            )
            deps.command_runner(
                "frontend-build",
                build_frontend_bundle_command(config.node_executable, frontend_dir),
                frontend_dir,
                frontend_environment,
            )
            write_preview_marker(frontend_dir, config.instance_id)
            backend_command = build_backend_command(config.python_executable, config.api_port)
            backend_child = deps.process_launcher(
                "backend", backend_command, backend_dir, backend_environment
            )
            backend_process.record_started(backend_child)
            deps.health_waiter(api_origin, backend_child, config.instance_id)
            backend_process.require_running()
            preview_child = deps.process_launcher(
                "preview",
                build_preview_command(
                    config.node_executable,
                    frontend_dir / "node_modules/vite/bin/vite.js",
                    config.preview_port,
                ),
                frontend_dir,
                frontend_environment,
            )
            preview_process.record_started(preview_child)
            deps.preview_waiter(app_origin, preview_child, config.instance_id)
            preview_process.require_running()
            playwright_command = build_playwright_command(
                config.node_executable,
                frontend_dir / "node_modules/@playwright/test/cli.js",
            )
            for phase in ("pre-restart", "post-restart"):
                if phase == "post-restart":
                    backend_process.stop(stopper=deps.process_stopper)
                    if not deps.port_is_available(LOOPBACK_HOST, config.api_port):
                        raise HarnessError("API port remained occupied after owned backend stop")
                    backend_child = deps.process_launcher(
                        "backend",
                        backend_command,
                        backend_dir,
                        backend_environment,
                    )
                    backend_process.record_started(backend_child)
                    deps.health_waiter(api_origin, backend_child, config.instance_id)
                    backend_process.require_running()
                browser_environment = build_live_browser_environment(
                    self._environment,
                    app_origin=app_origin,
                    api_origin=api_origin,
                    phase=phase,
                    manifest_path=manifest_path,
                    runtime_root=runtime_path,
                    username=config.username,
                    password=config.password,
                )
                deps.command_runner(
                    f"playwright-{phase}",
                    playwright_command,
                    frontend_dir,
                    browser_environment,
                )
            evidence_reference = retain_live_evidence(
                repo_root=repo_root,
                run_id=config.run_id,
                manifest_path=manifest_path,
                schema_name=config.schema_name,
                api_port=config.api_port,
                preview_port=config.preview_port,
                environment_metadata=deps.environment_metadata(),
            )
        finally:
            resources.cleanup(process_stopper=deps.process_stopper)
        if evidence_reference is None:
            raise HarnessError("Verified live evidence was not retained")
        finalize_retained_evidence(evidence_reference)
        return RunSummary(
            run_id=config.run_id,
            schema_name=config.schema_name,
            api_port=config.api_port,
            preview_port=config.preview_port,
            evidence_path=evidence_reference.path,
            checksum=evidence_reference.checksum,
            revision=evidence_reference.revision,
            count=evidence_reference.count,
            acceptance=evidence_reference.acceptance,
        )


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Owned T5-008 live acceptance supervisor")
    parser.add_argument("--execute", action="store_true", help="Run the owned live lifecycle")
    parser.add_argument("--api-port", type=int, default=8765)
    parser.add_argument("--preview-port", type=int, default=9765)
    parser.add_argument("--node", default=shutil.which("node") or "node")
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    config = SupervisorConfig.create(
        _REPOSITORY_ROOT,
        api_port=args.api_port,
        preview_port=args.preview_port,
        python_executable=sys.executable,
        node_executable=args.node,
    )
    supervisor = AcceptanceSupervisor(config, environment=os.environ)
    try:
        if not args.execute:
            supervisor.preflight()
            print(
                json.dumps(
                    {
                        "status": "dry_run",
                        "run_id": config.run_id,
                        "schema_name": config.schema_name,
                        "api_port": config.api_port,
                        "preview_port": config.preview_port,
                    },
                    separators=(",", ":"),
                )
            )
            return 0
        print(json.dumps(supervisor.execute().to_evidence(), separators=(",", ":")))
        return 0
    except HarnessError as error:
        print(json.dumps({"status": "failed", "error": str(error)}, separators=(",", ":")))
        return 1
    except Exception:
        print(
            json.dumps(
                {"status": "failed", "error": "Acceptance lifecycle failed"},
                separators=(",", ":"),
            )
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
