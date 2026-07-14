from __future__ import annotations

import json
import os
import re
import secrets as secrets_module
import socket
from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Protocol
from urllib.parse import urlsplit

from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL, make_url


LOOPBACK_HOST = "127.0.0.1"
SCHEMA_PREFIX = "revid_test_t5008_"
REDACTED = "[REDACTED]"
_SCHEMA_PATTERN = re.compile(r"^revid_test_t5008_[1-9][0-9]*_[a-z0-9_]+$")
_NONCE_PATTERN = re.compile(r"^[A-Za-z0-9_]+$")
_RUN_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]+$")
_INSTANCE_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{1,128}$")
_SENSITIVE_KEY_PATTERN = re.compile(
    r"(^|_)(authorization|cookie|password|secret|token|admin_url|database_url|db_url)($|_)",
    re.IGNORECASE,
)
_DATABASE_ENV_KEYS = (
    "REVID_DB_HOST",
    "REVID_DB_PORT",
    "REVID_DB_NAME",
    "REVID_DB_USER",
    "REVID_DB_PASSWORD",
)


class HarnessError(RuntimeError):
    """Fail-closed acceptance supervisor error with no credential payload."""


def assert_acceptance_instance_id(instance_id: str) -> None:
    if not _INSTANCE_ID_PATTERN.fullmatch(instance_id):
        raise HarnessError("Acceptance instance ID is unsafe")


def assert_owned_schema_name(schema_name: str) -> None:
    if not _SCHEMA_PATTERN.fullmatch(schema_name):
        raise HarnessError("Owned schema name must match revid_test_t5008_<pid>_<nonce>")


def generate_schema_name(*, pid: int | None = None, nonce: str | None = None) -> str:
    process_id = os.getpid() if pid is None else pid
    random_nonce = secrets_module.token_hex(8) if nonce is None else nonce
    if process_id <= 0:
        raise HarnessError("Schema pid must be positive")
    if not random_nonce or not _NONCE_PATTERN.fullmatch(random_nonce):
        raise HarnessError("Schema nonce must contain only ASCII letters, digits, or underscore")
    schema_name = f"{SCHEMA_PREFIX}{process_id}_{random_nonce.lower()}"
    assert_owned_schema_name(schema_name)
    return schema_name


@dataclass(frozen=True)
class DatabaseUrls:
    admin: URL
    target: URL


def parse_admin_database_urls(raw_admin_url: str, schema_name: str) -> DatabaseUrls:
    assert_owned_schema_name(schema_name)
    if not raw_admin_url.strip():
        raise HarnessError("BLOCKED: REVID_TEST_MYSQL_ADMIN_URL is required")
    try:
        supplied = make_url(raw_admin_url)
    except Exception:
        raise HarnessError("Invalid MySQL admin configuration") from None
    if supplied.get_backend_name() != "mysql":
        raise HarnessError("MySQL admin configuration must use the MySQL dialect")
    if not supplied.host or not supplied.username:
        raise HarnessError("MySQL admin configuration is missing required fields")
    admin = URL.create(
        drivername=supplied.drivername,
        username=supplied.username,
        password=supplied.password,
        host=supplied.host,
        port=supplied.port,
        query=supplied.query,
    )
    target = supplied.set(database=schema_name)
    if target.database != schema_name:
        raise HarnessError("MySQL target schema identity mismatch")
    return DatabaseUrls(admin=admin, target=target)


class SchemaGateway(Protocol):
    def create_database(self, schema_name: str) -> None: ...

    def selected_database(self, schema_name: str) -> str | None: ...

    def drop_database(self, schema_name: str) -> None: ...


class SQLAlchemySchemaGateway:
    """Perform only exact guarded operations for one generated schema."""

    def __init__(self, urls: DatabaseUrls) -> None:
        self._urls = urls

    def _assert_target(self, schema_name: str) -> None:
        assert_owned_schema_name(schema_name)
        if self._urls.target.database != schema_name:
            raise HarnessError("MySQL target schema identity mismatch")

    def create_database(self, schema_name: str) -> None:
        self._assert_target(schema_name)
        engine = create_engine(self._urls.admin, future=True, pool_pre_ping=True)
        try:
            with engine.begin() as connection:
                connection.execute(
                    text(
                        f"CREATE DATABASE `{schema_name}` "
                        "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                    )
                )
        finally:
            engine.dispose()

    def selected_database(self, schema_name: str) -> str | None:
        self._assert_target(schema_name)
        engine = create_engine(self._urls.target, future=True, pool_pre_ping=True)
        try:
            with engine.connect() as connection:
                return connection.execute(text("SELECT DATABASE()")).scalar()
        finally:
            engine.dispose()

    def drop_database(self, schema_name: str) -> None:
        self._assert_target(schema_name)
        engine = create_engine(self._urls.admin, future=True, pool_pre_ping=True)
        try:
            with engine.begin() as connection:
                connection.execute(text(f"DROP DATABASE `{schema_name}`"))
        finally:
            engine.dispose()


class OwnedSchema:
    def __init__(self, schema_name: str, gateway: SchemaGateway) -> None:
        assert_owned_schema_name(schema_name)
        self.schema_name = schema_name
        self._gateway = gateway
        self.created_by_process = False
        self.owns_schema = False

    def create(self) -> None:
        if self.owns_schema:
            raise HarnessError("Owned schema is already created")
        self._gateway.create_database(self.schema_name)
        self.created_by_process = True
        selected = self._gateway.selected_database(self.schema_name)
        if selected != self.schema_name:
            raise HarnessError("Created schema identity verification failed")
        self.owns_schema = True

    def cleanup(self) -> bool:
        if not self.created_by_process:
            return False
        assert_owned_schema_name(self.schema_name)
        selected = self._gateway.selected_database(self.schema_name)
        if selected != self.schema_name:
            raise HarnessError("Owned schema cleanup identity verification failed")
        self._gateway.drop_database(self.schema_name)
        self.created_by_process = False
        self.owns_schema = False
        return True


def socket_port_is_available(host: str, port: int) -> bool:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        if hasattr(socket, "SO_EXCLUSIVEADDRUSE"):
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        sock.bind((host, port))
        return True
    except OSError:
        return False
    finally:
        sock.close()


def preflight_ports(
    *,
    api_port: int,
    preview_port: int,
    is_available: Callable[[str, int], bool] = socket_port_is_available,
) -> None:
    if api_port == preview_port:
        raise HarnessError("API and preview ports must be distinct")
    for port in (api_port, preview_port):
        if not 1 <= port <= 65535:
            raise HarnessError("Service port must be between 1 and 65535")
        if not is_available(LOOPBACK_HOST, port):
            raise HarnessError(f"Loopback port {port} is occupied")


def validate_health_payload(payload: Mapping[str, Any]) -> None:
    database = payload.get("database")
    if payload.get("status") != "ok" or not isinstance(database, Mapping):
        raise HarnessError("Backend readiness status is not ok")
    current = database.get("alembic_current")
    head = database.get("alembic_head")
    if database.get("dialect") != "mysql":
        raise HarnessError("Backend readiness did not report MySQL")
    if database.get("connected") is not True or database.get("ready") is not True:
        raise HarnessError("Backend readiness did not confirm database connectivity")
    if database.get("alembic_match") is not True or not current or current != head:
        raise HarnessError("Backend readiness did not confirm the exact Alembic head")


def _redact_text(value: str, secrets: Sequence[str]) -> str:
    redacted = value
    for secret in sorted((item for item in secrets if item), key=len, reverse=True):
        redacted = redacted.replace(secret, REDACTED)
    redacted = re.sub(r"(?i)\bBearer\s+\S+", f"Bearer {REDACTED}", redacted)
    return re.sub(
        r"([a-z][a-z0-9+.-]*://)[^/@\s]+@",
        rf"\1{REDACTED}@",
        redacted,
        flags=re.IGNORECASE,
    )


def redact_mapping(value: Any, *, secrets: Sequence[str] = ()) -> Any:
    if isinstance(value, Mapping):
        return {
            str(key): REDACTED
            if _SENSITIVE_KEY_PATTERN.search(str(key))
            else redact_mapping(item, secrets=secrets)
            for key, item in value.items()
        }
    if isinstance(value, list):
        return [redact_mapping(item, secrets=secrets) for item in value]
    if isinstance(value, tuple):
        return tuple(redact_mapping(item, secrets=secrets) for item in value)
    if isinstance(value, str):
        return _redact_text(value, secrets)
    return value


def _assert_loopback_origin(origin: str, label: str) -> None:
    parsed = urlsplit(origin)
    if parsed.scheme != "http" or parsed.hostname != LOOPBACK_HOST or parsed.port is None:
        raise HarnessError(f"{label} must be an explicit HTTP loopback origin")
    if (
        parsed.path not in ("", "/")
        or parsed.query
        or parsed.fragment
        or parsed.username is not None
        or parsed.password is not None
    ):
        raise HarnessError(f"{label} must not contain credentials, path, query, or fragment")


def _without_inherited_revid(environment: Mapping[str, str]) -> dict[str, str]:
    return {key: value for key, value in environment.items() if not key.startswith("REVID_")}


def build_backend_environment(
    base_environment: Mapping[str, str],
    *,
    target_url: URL,
    preview_origin: str,
    jwt_secret: str,
    storage_root: Path,
    instance_id: str,
) -> dict[str, str]:
    _assert_loopback_origin(preview_origin, "Preview origin")
    assert_acceptance_instance_id(instance_id)
    if target_url.get_backend_name() != "mysql" or not target_url.database:
        raise HarnessError("Backend target must be an explicit MySQL schema")
    if not target_url.host or not target_url.username or target_url.password is None:
        raise HarnessError("Backend target is missing required MySQL fields")
    child = _without_inherited_revid(base_environment)
    child.update(
        {
            "REVID_DB_HOST": target_url.host,
            "REVID_DB_PORT": str(target_url.port or 3306),
            "REVID_DB_NAME": target_url.database,
            "REVID_DB_USER": target_url.username,
            "REVID_DB_PASSWORD": target_url.password,
            "REVID_JWT_SECRET": jwt_secret,
            "REVID_ACCEPTANCE_INSTANCE_ID": instance_id,
            "REVID_CORS_ORIGINS": json.dumps([preview_origin], separators=(",", ":")),
            "REVID_STORAGE_BACKEND": "local",
            "REVID_STORAGE_LOCAL_ROOT": str(storage_root.resolve()),
            "REVID_AGNES_API_KEY": "",
        }
    )
    return child


def resolve_owned_runtime_path(runtime_root: Path, run_id: str) -> Path:
    root = runtime_root.resolve()
    if not _RUN_ID_PATTERN.fullmatch(run_id):
        raise HarnessError("Owned runtime run ID is unsafe")
    candidate = (root / run_id).resolve()
    try:
        candidate.relative_to(root)
    except ValueError:
        raise HarnessError("Owned runtime path escapes the runtime root") from None
    if candidate == root:
        raise HarnessError("Owned runtime path must be below the runtime root")
    return candidate


def build_live_browser_environment(
    base_environment: Mapping[str, str],
    *,
    app_origin: str,
    api_origin: str,
    phase: str,
    manifest_path: Path,
    runtime_root: Path,
    username: str,
    password: str,
) -> dict[str, str]:
    _assert_loopback_origin(app_origin, "Live app origin")
    _assert_loopback_origin(api_origin, "Live API origin")
    if phase not in {"pre-restart", "post-restart"}:
        raise HarnessError("Live browser phase is invalid")
    root = runtime_root.resolve()
    resolved_manifest = manifest_path.resolve()
    try:
        resolved_manifest.relative_to(root)
    except ValueError:
        raise HarnessError("Live manifest must be inside the owned runtime path") from None
    if not username or not password:
        raise HarnessError("Live browser credentials must be non-empty")
    child = _without_inherited_revid(base_environment)
    child.update(
        {
            "REVID_LIVE_APP_ORIGIN": app_origin,
            "REVID_LIVE_API_ORIGIN": api_origin,
            "REVID_LIVE_PHASE": phase,
            "REVID_LIVE_MANIFEST_PATH": str(resolved_manifest),
            "REVID_LIVE_USERNAME": username,
            "REVID_LIVE_PASSWORD": password,
        }
    )
    return child
