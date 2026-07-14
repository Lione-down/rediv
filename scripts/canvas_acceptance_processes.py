from __future__ import annotations

import json
import hashlib
import os
import shutil
import signal
import subprocess
import time
from collections.abc import Callable, Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol
from urllib.error import URLError
from urllib.request import urlopen

from scripts.canvas_acceptance_evidence import collect_environment_metadata
from scripts.canvas_acceptance_support import (
    DatabaseUrls,
    HarnessError,
    OwnedSchema,
    SQLAlchemySchemaGateway,
    SchemaGateway,
    assert_acceptance_instance_id,
    redact_mapping,
    socket_port_is_available,
    validate_health_payload,
)


WINDOWS_CTRL_BREAK_EVENT = getattr(signal, "CTRL_BREAK_EVENT", 1)


class ProcessHandle(Protocol):
    pid: int

    def poll(self) -> int | None: ...


def _kill_windows_tree(command: tuple[str, ...]) -> None:
    subprocess.run(
        command,
        check=False,
        shell=False,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        timeout=30,
    )


def stop_windows_process(
    process: ProcessHandle,
    *,
    ctrl_break_event: int = WINDOWS_CTRL_BREAK_EVENT,
    tree_killer: Callable[[tuple[str, ...]], None] = _kill_windows_tree,
) -> None:
    if process.poll() is not None:
        return
    try:
        process.send_signal(ctrl_break_event)  # type: ignore[attr-defined]
        process.wait(timeout=10)  # type: ignore[attr-defined]
    except (OSError, subprocess.TimeoutExpired):
        pass
    if process.poll() is None:
        tree_killer(("taskkill", "/PID", str(process.pid), "/T", "/F"))
    if process.poll() is None:
        process.wait(timeout=10)  # type: ignore[attr-defined]


def stop_owned_process(process: ProcessHandle) -> None:
    if os.name == "nt":
        stop_windows_process(process)
        return
    if process.poll() is not None:
        return
    process.terminate()  # type: ignore[attr-defined]
    try:
        process.wait(timeout=10)  # type: ignore[attr-defined]
    except subprocess.TimeoutExpired:
        if os.name == "nt":
            subprocess.run(
                ("taskkill", "/PID", str(process.pid), "/T", "/F"),
                check=False,
                shell=False,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        else:
            process.kill()  # type: ignore[attr-defined]
        process.wait(timeout=10)  # type: ignore[attr-defined]


class OwnedProcess:
    def __init__(self, name: str) -> None:
        self.name = name
        self._process: ProcessHandle | None = None

    @property
    def is_owned(self) -> bool:
        return self._process is not None

    def record_started(self, process: ProcessHandle) -> None:
        if self._process is not None:
            raise HarnessError(f"Owned {self.name} process is already recorded")
        self._process = process

    def require_running(self) -> None:
        if self._process is None or self._process.poll() is not None:
            raise HarnessError(f"Owned {self.name} process exited before readiness")

    def stop(self, *, stopper: Callable[[ProcessHandle], None] = stop_owned_process) -> bool:
        if self._process is None:
            return False
        process = self._process
        stopper(process)
        self._process = None
        return True


@dataclass
class HarnessResources:
    preview: OwnedProcess
    backend: OwnedProcess
    schema: OwnedSchema
    remove_runtime: Callable[[], None]

    def cleanup(
        self,
        *,
        process_stopper: Callable[[ProcessHandle], None] = stop_owned_process,
    ) -> None:
        failures: list[str] = []
        actions = (
            ("preview process", lambda: self.preview.stop(stopper=process_stopper)),
            ("backend process", lambda: self.backend.stop(stopper=process_stopper)),
            ("runtime directory", self.remove_runtime),
            ("database schema", self.schema.cleanup),
        )
        for label, action in actions:
            try:
                action()
            except Exception:
                failures.append(label)
        if failures:
            raise HarnessError("Owned cleanup failed for: " + ", ".join(failures))


CommandRunner = Callable[[str, tuple[str, ...], Path, Mapping[str, str]], None]
ProcessLauncher = Callable[
    [str, tuple[str, ...], Path, Mapping[str, str]],
    ProcessHandle,
]
ReadinessWaiter = Callable[[str, ProcessHandle, str], None]
CommandProcessFactory = Callable[[tuple[str, ...], Path, Mapping[str, str]], ProcessHandle]


def _command_timeout(label: str) -> int:
    if label.startswith("playwright-"):
        return 300
    return {
        "migrate": 180,
        "seed-user": 60,
        "frontend-typecheck": 300,
        "frontend-build": 600,
    }.get(label, 300)


def _failure_fingerprint(output: object, environment: Mapping[str, str]) -> str:
    if isinstance(output, bytes):
        rendered = output.decode("utf-8", errors="replace")
    else:
        rendered = str(output or "")
    secret_values = tuple(
        value
        for key, value in environment.items()
        if value
        and any(
            marker in key.upper()
            for marker in ("AUTH", "COOKIE", "PASSWORD", "SECRET", "TOKEN", "USERNAME")
        )
    )
    redacted = redact_mapping(rendered, secrets=secret_values)
    return hashlib.sha256(str(redacted).encode("utf-8")).hexdigest()[:16]


def start_command_process(
    command: tuple[str, ...],
    cwd: Path,
    environment: Mapping[str, str],
) -> ProcessHandle:
    return subprocess.Popen(
        command,
        cwd=cwd,
        env=dict(environment),
        shell=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0,
        start_new_session=os.name != "nt",
    )


def run_bounded_command(
    label: str,
    command: tuple[str, ...],
    cwd: Path,
    environment: Mapping[str, str],
    *,
    process_factory: CommandProcessFactory = start_command_process,
    process_stopper: Callable[[ProcessHandle], None] = stop_owned_process,
) -> None:
    try:
        process = process_factory(command, cwd, environment)
    except Exception as error:
        fingerprint = _failure_fingerprint(error, environment)
        raise HarnessError(
            f"{label} failed to start (fingerprint={fingerprint})"
        ) from None
    output: object = ""
    timeout_error: subprocess.TimeoutExpired | None = None
    try:
        output, _stderr = process.communicate(  # type: ignore[attr-defined]
            timeout=_command_timeout(label)
        )
    except subprocess.TimeoutExpired as error:
        timeout_error = error
        output = error.output
    finally:
        process_stopper(process)
    if timeout_error is not None:
        fingerprint = _failure_fingerprint(output, environment)
        raise HarnessError(
            f"{label} timed out (fingerprint={fingerprint})"
        ) from None
    if process.returncode != 0:  # type: ignore[attr-defined]
        fingerprint = _failure_fingerprint(output, environment)
        raise HarnessError(
            f"{label} failed with exit code {process.returncode} "  # type: ignore[attr-defined]
            f"(fingerprint={fingerprint})"
        )


def _launch_process(
    _label: str,
    command: tuple[str, ...],
    cwd: Path,
    environment: Mapping[str, str],
) -> ProcessHandle:
    return subprocess.Popen(
        command,
        cwd=cwd,
        env=dict(environment),
        shell=False,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0,
        start_new_session=os.name != "nt",
    )


def wait_for_backend(
    origin: str,
    process: ProcessHandle,
    expected_instance_id: str,
    timeout_seconds: float = 45,
    *,
    opener: Callable = urlopen,
    sleeper: Callable[[float], None] = time.sleep,
) -> None:
    assert_acceptance_instance_id(expected_instance_id)
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise HarnessError("Owned backend process exited before readiness")
        try:
            with opener(f"{origin}/health", timeout=2) as response:  # noqa: S310
                payload = json.loads(response.read().decode("utf-8"))
        except (ValueError, OSError, URLError):
            sleeper(0.2)
            continue
        if (
            not isinstance(payload, Mapping)
            or payload.get("instance_id") != expected_instance_id
        ):
            raise HarnessError("Owned backend instance identity mismatch")
        try:
            validate_health_payload(payload)
        except HarnessError:
            sleeper(0.2)
            continue
        if process.poll() is not None:
            raise HarnessError("Owned backend process exited during readiness")
        return
    raise HarnessError("Backend structured readiness timed out")


def wait_for_preview(
    origin: str,
    process: ProcessHandle,
    expected_instance_id: str,
    timeout_seconds: float = 30,
    *,
    opener: Callable = urlopen,
    sleeper: Callable[[float], None] = time.sleep,
) -> None:
    assert_acceptance_instance_id(expected_instance_id)
    marker_url = f"{origin.rstrip('/')}/revid-acceptance-marker.txt"
    expected_marker = f"{expected_instance_id}\n".encode("utf-8")
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise HarnessError("Owned preview process exited before readiness")
        try:
            with opener(marker_url, timeout=2) as response:  # noqa: S310
                if 200 <= response.status < 400:
                    if response.read() != expected_marker:
                        raise HarnessError("Frontend preview instance identity mismatch")
                    if process.poll() is not None:
                        raise HarnessError("Owned preview process exited during readiness")
                    return
        except (OSError, URLError):
            sleeper(0.2)
            continue
        sleeper(0.2)
    raise HarnessError("Frontend preview readiness timed out")


def _remove_runtime(path: Path, runtime_root: Path) -> None:
    resolved_path = path.resolve()
    resolved_root = runtime_root.resolve()
    if resolved_path.parent != resolved_root:
        raise HarnessError("Refusing to remove a non-owned runtime path")
    if resolved_path.exists():
        shutil.rmtree(resolved_path)


@dataclass(frozen=True)
class SupervisorDependencies:
    port_is_available: Callable[[str, int], bool]
    schema_gateway_factory: Callable[[DatabaseUrls], SchemaGateway]
    command_runner: CommandRunner
    process_launcher: ProcessLauncher
    process_stopper: Callable[[ProcessHandle], None]
    health_waiter: ReadinessWaiter
    preview_waiter: ReadinessWaiter
    runtime_remover: Callable[[Path, Path], None]
    environment_metadata: Callable[[], Mapping[str, object]]


def default_dependencies() -> SupervisorDependencies:
    return SupervisorDependencies(
        port_is_available=socket_port_is_available,
        schema_gateway_factory=SQLAlchemySchemaGateway,
        command_runner=run_bounded_command,
        process_launcher=_launch_process,
        process_stopper=stop_owned_process,
        health_waiter=wait_for_backend,
        preview_waiter=wait_for_preview,
        runtime_remover=_remove_runtime,
        environment_metadata=collect_environment_metadata,
    )
