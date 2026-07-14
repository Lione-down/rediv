from __future__ import annotations

import json
import os
import platform
import re
import secrets
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path

from scripts.canvas_acceptance_support import (
    HarnessError,
    assert_owned_schema_name,
    resolve_owned_runtime_path,
)


_MANIFEST_KEYS = {"canvas", "checksum", "count", "project", "revision", "run"}
_COUNT_KEYS = {"canvases", "connections", "nodes"}
_CHECKSUM_PATTERN = re.compile(r"^[a-f0-9]{64}$")
_ENVIRONMENT_KEYS = {
    "browser",
    "hardware_acceleration",
    "machine",
    "memory_bytes",
    "node",
    "os",
    "os_release",
    "processor",
    "python",
}
_MAX_MANIFEST_BYTES = 64 * 1024
_MAX_SAFE_INTEGER = 2**53 - 1


@dataclass(frozen=True)
class EvidenceReference:
    path: Path
    checksum: str
    revision: int
    count: dict[str, int]
    acceptance: dict[str, object] | None = None


def collect_environment_metadata() -> dict[str, str]:
    return {
        "os": platform.system(),
        "os_release": platform.release(),
        "machine": platform.machine(),
        "processor": platform.processor(),
        "python": platform.python_version(),
    }


def _atomic_write_json(path: Path, value: Mapping[str, object], *, replace: bool) -> None:
    if not replace and path.exists():
        raise HarnessError("Retained evidence already exists for this run")
    temporary_path = path.with_name(
        f".{path.name}.{os.getpid()}.{secrets.token_hex(4)}.tmp"
    )
    try:
        with temporary_path.open("x", encoding="utf-8", newline="\n") as evidence_file:
            json.dump(value, evidence_file, ensure_ascii=False, indent=2, sort_keys=True)
            evidence_file.write("\n")
            evidence_file.flush()
            os.fsync(evidence_file.fileno())
        if not replace and path.exists():
            raise HarnessError("Retained evidence already exists for this run")
        temporary_path.replace(path)
    except HarnessError:
        raise
    except Exception:
        raise HarnessError("Retained evidence could not be written") from None
    finally:
        if temporary_path.exists():
            temporary_path.unlink()


def _read_manifest(manifest_path: Path, expected_run: str) -> dict:
    try:
        if manifest_path.stat().st_size > _MAX_MANIFEST_BYTES:
            raise HarnessError("Live manifest exceeds the size limit")
        value = json.loads(manifest_path.read_text(encoding="utf-8"))
    except HarnessError:
        raise
    except Exception:
        raise HarnessError("Live manifest is missing or invalid") from None
    if not isinstance(value, dict):
        raise HarnessError("Live manifest must be an object")
    if set(value) != _MANIFEST_KEYS:
        raise HarnessError("Live manifest contains unsupported fields")
    if value.get("run") != expected_run:
        raise HarnessError("Live manifest run does not match the owned run")
    for key in ("project", "canvas"):
        if not isinstance(value.get(key), str) or not value[key]:
            raise HarnessError(f"Live manifest {key} is invalid")
    checksum = value.get("checksum")
    if not isinstance(checksum, str) or not _CHECKSUM_PATTERN.fullmatch(checksum):
        raise HarnessError("Live manifest checksum is invalid")
    revision = value.get("revision")
    if type(revision) is not int or not 0 <= revision <= _MAX_SAFE_INTEGER:
        raise HarnessError("Live manifest revision is invalid")
    count = value.get("count")
    if not isinstance(count, dict) or set(count) != _COUNT_KEYS:
        raise HarnessError("Live manifest count contains unsupported fields")
    for key in _COUNT_KEYS:
        item = count.get(key)
        if type(item) is not int or not 0 <= item <= _MAX_SAFE_INTEGER:
            raise HarnessError(f"Live manifest count.{key} is invalid")
    return value


def _validate_environment_metadata(metadata: Mapping[str, object]) -> dict[str, object]:
    if not metadata or not set(metadata).issubset(_ENVIRONMENT_KEYS):
        raise HarnessError("Retained environment metadata contains unsupported fields")
    validated: dict[str, object] = {}
    for key, value in metadata.items():
        if not isinstance(value, (str, int, bool)) or isinstance(value, str) and len(value) > 256:
            raise HarnessError("Retained environment metadata contains an invalid value")
        validated[key] = value
    return validated


def _read_acceptance_state(path: Path) -> dict[str, object] | None:
    if not path.exists():
        return None
    try:
        state = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        raise HarnessError("Acceptance state is missing or invalid") from None
    if not isinstance(state, dict):
        raise HarnessError("Acceptance state is invalid")
    required = {"checksum", "revision", "order"}
    if set(state) != {"checksum", "revision", "order", "projectId", "projectName", "largeCanvasId", "duplicateCanvasId", "performance"}:
        raise HarnessError("Acceptance state contains unsupported fields")
    checksum = state["checksum"]
    revision = state["revision"]
    order = state["order"]
    performance = state["performance"]
    if not isinstance(checksum, str) or not _CHECKSUM_PATTERN.fullmatch(checksum):
        raise HarnessError("Acceptance state checksum is invalid")
    if type(revision) is not int or revision < 0 or revision > _MAX_SAFE_INTEGER:
        raise HarnessError("Acceptance state revision is invalid")
    if not isinstance(order, list) or not order or any(not isinstance(item, str) or not item for item in order):
        raise HarnessError("Acceptance state order is invalid")
    if any(not isinstance(state[key], str) or not state[key] for key in ("projectId", "projectName", "largeCanvasId", "duplicateCanvasId")):
        raise HarnessError("Acceptance state identity is invalid")
    if not isinstance(performance, dict) or set(performance) != {"stableRenderMs", "durationMs", "fps", "frameP95Ms", "pointerP95Ms", "longTasks"}:
        raise HarnessError("Acceptance state performance is invalid")
    for key in ("stableRenderMs", "durationMs", "fps", "frameP95Ms", "pointerP95Ms", "longTasks"):
        value = performance[key]
        if not isinstance(value, (int, float)) or value < 0 or value != value:
            raise HarnessError("Acceptance state performance is invalid")
    return {
        "checksum": checksum,
        "revision": revision,
        "count": {"canvases": len(order), "nodes": 200, "connections": 300},
        "performance": {
            "stableRenderMs": performance["stableRenderMs"],
            "durationMs": performance["durationMs"],
            "fps": performance["fps"],
            "frameP95Ms": performance["frameP95Ms"],
            "pointerP95Ms": performance["pointerP95Ms"],
            "longTasks": performance["longTasks"],
        },
    }


def retain_live_evidence(
    *,
    repo_root: Path,
    run_id: str,
    manifest_path: Path,
    schema_name: str,
    api_port: int,
    preview_port: int,
    environment_metadata: Mapping[str, object],
) -> EvidenceReference:
    root = repo_root.resolve()
    expected_runtime = resolve_owned_runtime_path(root / "output/runtime", run_id)
    expected_manifest = (expected_runtime / "manifest.json").resolve()
    if manifest_path.resolve() != expected_manifest:
        raise HarnessError("Live manifest path is outside the owned runtime")
    assert_owned_schema_name(schema_name)
    manifest = _read_manifest(expected_manifest, run_id)
    acceptance = _read_acceptance_state(expected_runtime / "acceptance-state.json")
    metadata = _validate_environment_metadata(environment_metadata)
    evidence_directory = resolve_owned_runtime_path(
        root / "output/playwright/t5-008-live",
        run_id,
    )
    evidence_directory.mkdir(parents=True, exist_ok=True)
    evidence_path = evidence_directory / "summary.json"
    retained = {
        "status": "verification_passed_cleanup_pending",
        "run_id": run_id,
        "schema_name": schema_name,
        "api_port": api_port,
        "preview_port": preview_port,
        "checksum": manifest["checksum"],
        "revision": manifest["revision"],
        "count": manifest["count"],
        "environment": metadata,
    }
    if acceptance is not None:
        retained["acceptance"] = acceptance
    _atomic_write_json(evidence_path, retained, replace=False)
    return EvidenceReference(
        path=evidence_path,
        checksum=manifest["checksum"],
        revision=manifest["revision"],
        count=dict(manifest["count"]),
        acceptance=acceptance,
    )


def finalize_retained_evidence(reference: EvidenceReference) -> None:
    try:
        retained = json.loads(reference.path.read_text(encoding="utf-8"))
    except Exception:
        raise HarnessError("Pending retained evidence is missing or invalid") from None
    if (
        not isinstance(retained, dict)
        or retained.get("status") != "verification_passed_cleanup_pending"
        or retained.get("checksum") != reference.checksum
        or retained.get("revision") != reference.revision
        or retained.get("count") != reference.count
    ):
        raise HarnessError("Pending retained evidence does not match the verified run")
    retained["status"] = "passed"
    _atomic_write_json(reference.path, retained, replace=True)
