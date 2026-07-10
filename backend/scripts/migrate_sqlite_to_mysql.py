#!/usr/bin/env python3
"""SQLite -> MySQL data migration CLI tool.

Usage:
    python migrate_sqlite_to_mysql.py --dry-run
    python migrate_sqlite_to_mysql.py --execute

Defaults to dry-run. Only --execute writes to MySQL.

Schema ownership: Alembic owns schema. This script only handles data ETL.
Transaction: per-batch transaction — failure rolls back entire batch.
Idempotent: same-PK re-run detects stale values without silent overwrite.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.engine.url import URL


# ---------------------------------------------------------------------------
# FK-order-aware table list (12 tables)
# ---------------------------------------------------------------------------
TABLE_ORDER = [
    "users",
    "store_configs",
    "quotas",
    "projects",
    "identities",
    "guests",
    "invitation_codes",
    "canvas_nodes",
    "assets",
    "templates",
    "quota_ledger",
    "admin_logs",
]

# Primary key column per table
PK_MAP = {
    "users": "id",
    "store_configs": "key",
    "quotas": "id",
    "projects": "id",
    "identities": "id",
    "guests": "id",
    "invitation_codes": "id",
    "canvas_nodes": "id",
    "assets": "id",
    "templates": "id",
    "quota_ledger": "id",
    "admin_logs": "id",
}

# Foreign-key columns per table: {table: [(src_col, "ref_table(ref_col)"), ...]}
FK_MAP: dict[str, list[tuple[str, str]]] = {
    "users": [],
    "store_configs": [],
    "quotas": [("user_id", "users(id)")],
    "projects": [("user_id", "users(id)")],
    "identities": [("user_id", "users(id)")],
    "guests": [("converted_user_id", "users(id)")],
    "invitation_codes": [("created_by_admin_id", "users(id)")],
    "canvas_nodes": [("project_id", "projects(id)")],
    "assets": [
        ("user_id", "users(id)"),
        ("project_id", "projects(id)"),
        ("canvas_node_id", "canvas_nodes(id)"),
    ],
    "templates": [("user_id", "users(id)")],
    "quota_ledger": [
        ("user_id", "users(id)"),
        ("admin_id", "users(id)"),
    ],
    "admin_logs": [("admin_id", "users(id)")],
}

# Critical JSON columns that must round-trip correctly
CRITICAL_JSON_COLS: dict[str, list[str]] = {
    "store_configs": ["value"],
    "identities": ["raw_profile"],
    "guests": ["local_project_snapshot"],
    "canvas_nodes": ["content"],
    "templates": ["node_data"],
    "admin_logs": ["detail"],
}

# Business-critical integer columns
BUSINESS_INT_COLS: dict[str, set[str]] = {
    "quotas": {"text_quota", "image_quota", "video_quota"},
    "invitation_codes": {"max_uses", "used_count"},
    "canvas_nodes": {"width", "height"},
    "templates": {"node_count"},
    "quota_ledger": {"change_amount"},
}

# Alembic migration directory — script is in backend/scripts/, migrations are in backend/
_ALEMBIC_ROOT = Path(__file__).resolve().parent.parent
ALEMBIC_SCRIPTS_DIR = _ALEMBIC_ROOT / "migrations"
ALEMBIC_INI_PATH = _ALEMBIC_ROOT / "alembic.ini"

# Fixed test database name
TEST_DB_NAME = "revid_test_t4_002"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _redact_sensitive(value: str) -> str:
    """Mask password-like substrings in output."""
    parts = value.split(":")
    if len(parts) >= 5:
        parts[3] = "***"
        return ":".join(parts)
    return value


def compute_checksum(rows: list[dict], pk_col: str) -> str:
    """Deterministic checksum of PK values."""
    hashes = sorted(str(r[pk_col]) for r in rows)
    return hashlib.sha256(",".join(hashes).encode()).hexdigest()[:16]


def _safe_str(val: Any) -> str | None:
    if val is None:
        return None
    if isinstance(val, datetime):
        return val.isoformat()
    if isinstance(val, (dict, list)):
        return json.dumps(val, ensure_ascii=False)
    return str(val)


def _safe_int(val: Any) -> int | None:
    if val is None:
        return None
    return int(val)


def _safe_float(val: Any) -> float | None:
    if val is None:
        return None
    return float(val)


# ---------------------------------------------------------------------------
# Secret validation — ONLY REVID_TEST_MYSQL_ADMIN_URL
# ---------------------------------------------------------------------------

def get_admin_url() -> str:
    """Return admin URL from env ONLY. No fallbacks."""
    url = os.environ.get("REVID_TEST_MYSQL_ADMIN_URL", "").strip()
    if not url:
        print(
            "BLOCKED: REVID_TEST_MYSQL_ADMIN_URL is not set.\n"
            "  No credential fallback is permitted.\n"
            "  Set this env var to run this tool."
        )
        sys.exit(1)
    return url


def build_test_db_url(admin_url: str) -> str:
    """Build the test database connection URL using SQLAlchemy URL API.

    Parses admin URL, extracts credentials, constructs a new URL
    pointing to TEST_DB_NAME. Asserts database identity.
    """
    from urllib.parse import urlparse, quote_plus

    parsed = urlparse(admin_url)
    if not parsed.hostname:
        raise RuntimeError("Admin URL has no hostname")

    db_url = URL.create(
        drivername=parsed.scheme,
        username=parsed.username or "root",
        password=parsed.password or "",
        host=parsed.hostname,
        port=parsed.port or 3306,
        database=TEST_DB_NAME,
    )

    # Hard gate: assert database identity
    actual_db = db_url.database
    if actual_db != TEST_DB_NAME:
        raise RuntimeError(
            f"Database identity mismatch: expected '{TEST_DB_NAME}', got '{actual_db}'"
        )

    return db_url.render_as_string(hide_password=False)


# ---------------------------------------------------------------------------
# Database identity assertion
# ---------------------------------------------------------------------------

def assert_database_name(engine: Engine, expected: str) -> None:
    """Assert the current database name matches expected. Raises on mismatch."""
    with engine.connect() as conn:
        result = conn.execute(text("SELECT DATABASE()"))
        actual = result.scalar()
    if actual != expected:
        raise RuntimeError(
            f"Database identity gate failed: expected '{expected}', "
            f"got '{actual}'. ABORTING to prevent accidental destructive ops."
        )


# ---------------------------------------------------------------------------
# Alembic schema setup
# ---------------------------------------------------------------------------

def setup_schema_via_alembic(test_db_url: str) -> None:
    """Run Alembic upgrade head on the test database.

    Uses the project's Alembic config and model metadata.
    No handwritten DDL.
    """
    # Parse test_db_url to set settings overrides BEFORE any model/env.py imports.
    # settings.config uses pydantic-settings with env_prefix="REVID_", so these
    # env vars override the defaults in the cached Settings singleton.
    from urllib.parse import urlparse, unquote_plus
    parsed = urlparse(test_db_url)
    os.environ["REVID_USE_SQLITE"] = "false"
    os.environ["REVID_DB_HOST"] = parsed.hostname or "localhost"
    if parsed.port:
        os.environ["REVID_DB_PORT"] = str(parsed.port)
    os.environ["REVID_DB_NAME"] = TEST_DB_NAME
    if parsed.username:
        os.environ["REVID_DB_USER"] = unquote_plus(parsed.username)
    if parsed.password:
        os.environ["REVID_DB_PASSWORD"] = unquote_plus(parsed.password)

    # Invalidate the cached settings singleton so env vars take effect.
    # This is critical because env.py imports settings.config which caches
    # the Settings object — without clearing, stale defaults persist.
    from settings.config import get_settings, settings as _settings
    get_settings.cache_clear()
    # Re-read settings from env (now contains our overrides)
    from pydantic_settings import SettingsConfigDict
    from pydantic import BaseModel
    # Directly patch the settings object used by build_mysql_url()
    _settings.db_host = parsed.hostname or "localhost"
    _settings.db_port = parsed.port or 3306
    _settings.db_name = TEST_DB_NAME
    _settings.db_user = parsed.username or "root"
    _settings.db_password = parsed.password or ""
    _settings.use_sqlite = False

    import alembic.config
    from importlib import import_module

    # Strip hermes-agent venv from path BEFORE any model imports
    # (avoids pydantic_core ABI mismatch)
    for p in list(sys.path):
        if "hermes-agent" in p:
            sys.path.remove(p)

    # Ensure models are importable
    backend_dir = Path(__file__).resolve().parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))

    # Import models to register them with Base.metadata
    for mod in [
        "models.user", "models.project", "models.quota",
        "models.template", "models.asset", "models.canvas_node",
        "models.guest", "models.identity", "models.invitation",
        "models.admin_log",
    ]:
        try:
            import_module(mod)
        except ImportError:
            pass  # some modules may not exist

    cfg = alembic.config.Config(str(ALEMBIC_INI_PATH))
    cfg.set_main_option("script_location", str(ALEMBIC_SCRIPTS_DIR))
    cfg.set_main_option("use_sqlite", "false")

    # Override the URL — env.py's engine_from_config reads this
    cfg.set_main_option("sqlalchemy.url", test_db_url)

    # Run upgrade head
    from alembic import command
    command.upgrade(cfg, "head")


# ---------------------------------------------------------------------------
# SQLite Reader (read-only)
# ---------------------------------------------------------------------------

class SQLiteReader:
    def __init__(self, db_path: str) -> None:
        self.engine = create_engine(f"sqlite:///{db_path}", future=True)
        self._data: dict[str, list[dict]] = {}

    def read_all(self) -> None:
        with self.engine.connect() as conn:
            existing_tables = {
                row[0]
                for row in conn.execute(
                    text("SELECT name FROM sqlite_master WHERE type='table'")
                ).fetchall()
            }
            for table_name in TABLE_ORDER:
                if table_name not in existing_tables:
                    self._data[table_name] = []
                    continue
                result = conn.execute(text(f'SELECT * FROM "{table_name}"'))
                rows = [dict(r._mapping) for r in result]
                self._data[table_name] = rows

    def get_rows(self, table_name: str) -> list[dict]:
        return self._data.get(table_name, [])

    def close(self) -> None:
        self.engine.dispose()


# ---------------------------------------------------------------------------
# MySQL Writer
# ---------------------------------------------------------------------------

class MySQLWriter:
    def __init__(self, target_url: str, dry_run: bool = True) -> None:
        self.dry_run = dry_run
        self.engine = create_engine(target_url, future=True, pool_pre_ping=True)
        self._committed = False

    def check_schema_exists(self) -> None:
        """Verify Alembic-created tables exist. Raises if missing."""
        with self.engine.connect() as conn:
            tables = conn.execute(
                text("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE()")
            ).fetchall()
            existing = {t[0] for t in tables}
            missing = [t for t in TABLE_ORDER if t not in existing]
            if missing:
                raise RuntimeError(
                    f"Schema check failed: missing tables (run Alembic upgrade head first): "
                    f"{', '.join(missing)}"
                )

    def migrate_table(
        self,
        table_name: str,
        rows: list[dict],
        report: dict,
    ) -> None:
        """Batch-insert rows with per-table transaction.

        Uses SELECT-before-INSERT with explicit conflict detection.
        Same-PK different-value → records stale_diff error and does NOT write.
        On any error, rolls back the entire table transaction.
        """
        pk_col = PK_MAP[table_name]

        if not rows:
            report[table_name] = {
                "source_count": 0,
                "inserted": 0,
                "skipped": 0,
                "stale_same": 0,
                "stale_diff": 0,
                "stale_diff_values": [],
                "errors": [],
                "checksum": compute_checksum(rows, pk_col),
            }
            return

        # Load existing data for stale detection
        existing_map: dict[str, dict] = {}
        if not self.dry_run:
            with self.engine.connect() as conn:
                result = conn.execute(text(f'SELECT * FROM `{table_name}`'))
                for r in result:
                    d = dict(r._mapping)
                    existing_map[str(d[pk_col])] = d

        inserted = 0
        stale_same = 0
        stale_diff = 0
        stale_diff_values: list[str] = []
        errors: list[str] = []
        insert_rows: list[dict] = []

        # Detect conflicts BEFORE any writes (AC10: same-PK different-value)
        conflict_rows: list[dict] = []
        for row in rows:
            pk_value = str(row[pk_col])
            if pk_value in existing_map:
                # Symmetric comparison: exclude PK from BOTH source and dest dicts
                src_excluded = {k: row[k] for k in row.keys() if k != pk_col}
                dst_excluded = {
                    k: existing_map[pk_value].get(k)
                    for k in row.keys()
                    if k != pk_col
                }
                src_json = json.dumps(
                    src_excluded, sort_keys=True, default=str,
                )
                dst_json = json.dumps(
                    dst_excluded, sort_keys=True, default=str,
                )
                if src_json == dst_json:
                    stale_same += 1
                else:
                    stale_diff += 1
                    stale_diff_values.append(pk_value)
                    conflict_rows.append(row)
            else:
                inserted += 1
                insert_rows.append(row)

        # AC10: If stale-diff detected, DO NOT write — record error and return
        if stale_diff > 0:
            errors.append(
                f"Same-PK conflict detected: {stale_diff} row(s) with different values "
                f"(first: {', '.join(stale_diff_values[:3])}). "
                f"ON DUPLICATE KEY UPDATE would silently overwrite — ABORTING."
            )
            report[table_name] = {
                "source_count": len(rows),
                "inserted": 0,
                "skipped": 0,
                "stale_same": stale_same,
                "stale_diff": stale_diff,
                "stale_diff_values": stale_diff_values,
                "errors": errors,
                "checksum": compute_checksum(rows, pk_col),
            }
            return

        # Build bulk INSERT SQL (no ON DUPLICATE KEY UPDATE since we already handled conflicts)
        col_names = list(rows[0].keys())
        placeholders = ", ".join(f":{c}" for c in col_names)
        cols_sql = ", ".join(f"`{c}`" for c in col_names)
        sql = f"INSERT INTO `{table_name}` ({cols_sql}) VALUES ({placeholders})"

        if self.dry_run:
            report[table_name] = {
                "source_count": len(rows),
                "inserted": inserted,
                "skipped": 0,
                "stale_same": stale_same,
                "stale_diff": stale_diff,
                "stale_diff_values": stale_diff_values,
                "errors": errors,
                "checksum": compute_checksum(rows, pk_col),
            }
            return

        # Execute in a single transaction (skip INSERT if no new rows)
        if not insert_rows:
            # All rows are stale_same — nothing to insert
            report[table_name] = {
                "source_count": len(rows),
                "inserted": 0,
                "skipped": stale_same,
                "stale_same": stale_same,
                "stale_diff": stale_diff,
                "stale_diff_values": stale_diff_values,
                "errors": errors,
                "checksum": compute_checksum(rows, pk_col),
            }
            return

        try:
            with self.engine.connect() as conn:
                for row in insert_rows:
                    try:
                        sanitized = {}
                        for c in col_names:
                            raw = row.get(c)
                            if c in ("text_quota", "image_quota", "video_quota",
                                     "max_uses", "used_count", "node_count",
                                     "change_amount", "width", "height",
                                     "position_x", "position_y"):
                                sanitized[c] = _safe_int(raw) if raw is not None else 0
                            elif c in ("position_x", "position_y"):
                                sanitized[c] = _safe_float(raw)
                            elif any(k in c.upper() for k in ("JSON",)):
                                sanitized[c] = _safe_str(raw)
                            else:
                                sanitized[c] = _safe_str(raw)
                        conn.execute(text(sql), sanitized)
                    except Exception as e:
                        errors.append(f"Row {str(row[pk_col])}: {e}")
                        conn.rollback()
                        raise
                conn.commit()
        except Exception as e:
            errors.append(f"Table-level transaction failed: {e}")
            report[table_name] = {
                "source_count": len(rows),
                "inserted": 0,
                "skipped": 0,
                "stale_same": 0,
                "stale_diff": 0,
                "stale_diff_values": [],
                "errors": errors,
                "checksum": compute_checksum(rows, pk_col),
            }
            raise

        report[table_name] = {
            "source_count": len(rows),
            "inserted": inserted,
            "skipped": 0,
            "stale_same": stale_same,
            "stale_diff": stale_diff,
            "stale_diff_values": stale_diff_values,
            "errors": errors,
            "checksum": compute_checksum(rows, pk_col),
        }

    def close(self) -> None:
        self.engine.dispose()
# ---------------------------------------------------------------------------
# Validator
# ---------------------------------------------------------------------------

class MigrationValidator:
    """Validate migration consistency between SQLite and MySQL."""

    def __init__(self, reader: SQLiteReader, writer: MySQLWriter) -> None:
        self.reader = reader
        self.writer = writer

    def validate(self) -> list[str]:
        """Return list of validation failure messages."""
        errors: list[str] = []
        with self.writer.engine.connect() as conn:
            for table_name in TABLE_ORDER:
                src_rows = self.reader.get_rows(table_name)
                src_count = len(src_rows)
                result = conn.execute(text(f'SELECT COUNT(*) FROM `{table_name}`'))
                dst_count = result.scalar()

                if src_count != dst_count:
                    errors.append(
                        f"{table_name}: row count mismatch -- SQLite={src_count}, MySQL={dst_count}"
                    )

                pk_col = PK_MAP[table_name]
                src_pks = {str(r[pk_col]) for r in src_rows}
                result = conn.execute(text(f'SELECT `{pk_col}` FROM `{table_name}`'))
                dst_pks = {str(r[0]) for r in result}

                missing = src_pks - dst_pks
                extra = dst_pks - src_pks
                if missing:
                    errors.append(
                        f"{table_name}: {len(missing)} rows missing in MySQL (first: {list(missing)[:3]})"
                    )
                if extra:
                    errors.append(
                        f"{table_name}: {len(extra)} extra rows in MySQL (first: {list(extra)[:3]})"
                    )

                # Critical JSON field check
                json_cols = CRITICAL_JSON_COLS.get(table_name, [])
                for src_row in src_rows:
                    src_pk = str(src_row[pk_col])
                    result = conn.execute(
                        text(f'SELECT * FROM `{table_name}` WHERE `{pk_col}` = :pk'),
                        {"pk": src_pk},
                    )
                    dst_row_raw = result.fetchone()
                    if dst_row_raw is None:
                        continue
                    dst_row = dict(dst_row_raw._mapping)

                    for col in json_cols:
                        if col not in src_row or col not in dst_row:
                            continue
                        src_val = _safe_str(src_row[col])
                        dst_val = str(dst_row[col]) if dst_row[col] is not None else None
                        try:
                            src_parsed = json.loads(src_val) if src_val else None
                            dst_parsed = json.loads(dst_val) if dst_val else None
                            src_val = json.dumps(src_parsed, separators=(",", ":"), ensure_ascii=False, sort_keys=True)
                            dst_val = json.dumps(dst_parsed, separators=(",", ":"), ensure_ascii=False, sort_keys=True)
                        except (json.JSONDecodeError, TypeError):
                            pass
                        if src_val != dst_val:
                            errors.append(
                                f"{table_name}.{src_pk}.{col}: JSON mismatch"
                            )

                # Business integer field check
                biz_cols = BUSINESS_INT_COLS.get(table_name, set())
                for src_row in src_rows:
                    src_pk = str(src_row[pk_col])
                    result = conn.execute(
                        text(f'SELECT * FROM `{table_name}` WHERE `{pk_col}` = :pk'),
                        {"pk": src_pk},
                    )
                    dst_row_raw = result.fetchone()
                    if dst_row_raw is None:
                        continue
                    dst_row = dict(dst_row_raw._mapping)
                    for col in biz_cols:
                        if col not in src_row or col not in dst_row:
                            continue
                        sv = _safe_int(src_row.get(col))
                        dv = _safe_int(dst_row.get(col))
                        if sv != dv:
                            errors.append(
                                f"{table_name}.{src_pk}.{col}: value mismatch -- SQLite={sv}, MySQL={dv}"
                            )

                # FK orphan detection — read FK values from TARGET child table,
                # not from source rows (an orphan may exist only in MySQL).
                fk_cols = FK_MAP.get(table_name, [])
                for src_col, ref in fk_cols:
                    ref_table, _, ref_col_raw = ref.partition("(")
                    ref_col = ref_col_raw.rstrip(")")
                    if src_col == pk_col:
                        continue
                    # Read FK values from the MySQL target child table
                    result = conn.execute(
                        text(f'SELECT DISTINCT `{src_col}` FROM `{table_name}` '
                             f'WHERE `{src_col}` IS NOT NULL')
                    )
                    dst_values = {str(r[0]) for r in result}
                    if not dst_values:
                        continue
                    # Read referenced IDs from the target parent table
                    result = conn.execute(text(f'SELECT `{ref_col}` FROM `{ref_table}`'))
                    ref_ids = {str(r[0]) for r in result}
                    orphans = dst_values - ref_ids
                    if orphans:
                        errors.append(
                            f"{table_name}.{src_col}: {len(orphans)} orphan references "
                            f"(first: {list(orphans)[:3]})"
                        )

        return errors

    def validate_source_immutable(self, source_path: str, initial_size: int, initial_mtime: float) -> list[str]:
        """Verify source SQLite database was not modified."""
        errors: list[str] = []
        try:
            st = os.stat(source_path)
            if st.st_size != initial_size:
                errors.append(
                    f"Source immutability violated: size changed {initial_size} -> {st.st_size}"
                )
            if abs(st.st_mtime - initial_mtime) > 1:
                errors.append(
                    f"Source immutability violated: mtime changed {initial_mtime} -> {st.st_mtime}"
                )
        except OSError as e:
            errors.append(f"Cannot stat source: {e}")
        return errors


# ---------------------------------------------------------------------------
# Cleanup
# ---------------------------------------------------------------------------

def cleanup_test_database(admin_url: str) -> None:
    """DROP the test database. Asserts identity before dropping.

    Failure is visible and raises — no silent swallowing.
    Connects to admin URL first to check existence, avoiding
    OperationalError when the DB hasn't been created yet.
    """
    from urllib.parse import urlparse
    from sqlalchemy.exc import OperationalError

    parsed = urlparse(admin_url)
    # Connect to admin URL (no database) to check existence
    admin_conn_url = URL.create(
        drivername=parsed.scheme,
        username=parsed.username or "root",
        password=parsed.password or "",
        host=parsed.hostname,
        port=parsed.port or 3306,
    )
    admin_engine = create_engine(
        admin_conn_url.render_as_string(hide_password=False), future=True
    )
    try:
        # Check if the test database exists
        db_exists = False
        with admin_engine.connect() as conn:
            result = conn.execute(
                text("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA "
                     "WHERE SCHEMA_NAME = :name"),
                {"name": TEST_DB_NAME},
            )
            db_exists = result.scalar() is not None

        if not db_exists:
            print(f"[cleanup] Database {TEST_DB_NAME} does not exist — nothing to drop.")
            return

        # DB exists: assert identity and drop
        conn_url = URL.create(
            drivername=parsed.scheme,
            username=parsed.username or "root",
            password=parsed.password or "",
            host=parsed.hostname,
            port=parsed.port or 3306,
            database=TEST_DB_NAME,
        )
        engine = create_engine(
            conn_url.render_as_string(hide_password=False), future=True
        )
        try:
            assert_database_name(engine, TEST_DB_NAME)
            with engine.connect() as conn:
                conn.execute(text(f"DROP DATABASE `{TEST_DB_NAME}`"))
                conn.commit()
                print(f"[cleanup] Database {TEST_DB_NAME} dropped successfully.")
        except Exception as e:
            print(f"[cleanup] ERROR dropping {TEST_DB_NAME}: {e}")
            raise
        finally:
            engine.dispose()
    except OperationalError as e:
        # Admin connection failure is VISIBLE and fatal — cleanup cannot
        # silently assume the DB does not exist when the admin URL itself
        # is unreachable.  Re-raise so the caller sees the failure.
        print(f"[cleanup] Admin connection failed: {e}")
        raise
    except Exception as e:
        print(f"[cleanup] Unexpected error during cleanup: {e}")
        raise
    finally:
        admin_engine.dispose()


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="SQLite -> MySQL data migration tool")
    parser.add_argument(
        "--source",
        default="revid.db",
        help="SQLite database path (default: revid.db)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=True,
        help="Dry run mode (default: no MySQL writes)",
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        default=False,
        help="Actually execute migration (write to MySQL)",
    )
    parser.add_argument(
        "--setup-schema",
        action="store_true",
        default=False,
        help="Run Alembic upgrade head before migration",
    )
    parser.add_argument(
        "--cleanup",
        action="store_true",
        default=False,
        help="Drop the test database and exit",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    if args.cleanup:
        # Cleanup mode: only drop test DB
        admin_url = get_admin_url()
        try:
            cleanup_test_database(admin_url)
        except Exception as e:
            print(f"Cleanup failed: {e}")
            return 1
        return 0

    if args.execute:
        args.dry_run = False

    # Step 0: Validate source file BEFORE secret gate
    source_path = os.path.abspath(args.source)

    if not os.path.isfile(source_path):
        print(f"ERROR: Source SQLite database not found: {source_path}")
        return 1

    try:
        source_stat = os.stat(source_path)
    except OSError as e:
        print(f"ERROR: Cannot stat source database: {e}")
        return 1
    source_size = source_stat.st_size
    source_mtime = source_stat.st_mtime

    # Step 0.5: Validate secret (only reached if source exists)
    admin_url = get_admin_url()
    test_db_url = build_test_db_url(admin_url)

    print("=" * 60)
    print("SQLite -> MySQL Migration Tool")
    print(f"Mode: {'EXECUTE' if not args.dry_run else 'DRY-RUN'}")
    print(f"Target DB: {TEST_DB_NAME} (asserted)")
    print("=" * 60)

    # Step 0.6: Setup schema via Alembic if requested
    if args.setup_schema:
        print("\n[0.5] Setting up schema via Alembic upgrade head...")
        try:
            setup_schema_via_alembic(test_db_url)
            print("[0.5] Schema setup complete.")
        except Exception as e:
            print(f"[0.5] Schema setup failed: {e}")
            return 1

    # Step 1: Read SQLite
    print("\n[1/5] Reading SQLite database...")
    reader = SQLiteReader(source_path)
    try:
        reader.read_all()
    except Exception as e:
        print(f"ERROR: Failed to read SQLite: {e}")
        return 1

    # Verify source immutability
    new_stat = os.stat(source_path)
    if new_stat.st_size != source_size or abs(new_stat.st_mtime - source_mtime) > 1:
        print("ERROR: Source database was modified during read! Aborting.")
        reader.close()
        return 1

    for table_name in TABLE_ORDER:
        rows = reader.get_rows(table_name)
        if rows:
            print(f"  {table_name}: {len(rows)} rows")

    # Step 2: Connect to MySQL
    print(f"\n[2/5] Connecting to MySQL (target={TEST_DB_NAME}, dry_run={args.dry_run})...")
    writer = MySQLWriter(test_db_url, dry_run=args.dry_run)
    try:
        assert_database_name(writer.engine, TEST_DB_NAME)
        writer.check_schema_exists()
    except RuntimeError as e:
        print(f"ERROR: {e}")
        reader.close()
        writer.close()
        return 1
    except Exception as e:
        print(f"ERROR: MySQL connection failed: {e}")
        reader.close()
        writer.close()
        return 1

    # Step 3: Migrate
    print(f"\n[3/5] Migrating data...")
    report: dict[str, dict] = {}
    table_failures = 0
    for table_name in TABLE_ORDER:
        rows = reader.get_rows(table_name)
        if not rows:
            print(f"  {table_name}: skip (empty)")
            continue
        start = time.time()
        try:
            writer.migrate_table(table_name, rows, report)
        except Exception as e:
            print(f"  {table_name}: FAILED -- {e}")
            table_failures += 1
            continue
        elapsed = time.time() - start
        r = report[table_name]
        print(f"  {table_name}: {r['inserted']} inserted, "
              f"{r['stale_same']} stale-same, "
              f"{r['stale_diff']} stale-diff, "
              f"{len(r['errors'])} errors ({elapsed:.2f}s)")

    reader.close()

    # Step 4: Validate
    print(f"\n[4/5] Validating migration...")
    validation_errors: list[str] = []
    if args.dry_run:
        print("  Skipping validation (dry-run mode).")
    elif table_failures > 0:
        validation_errors.append(
            f"Skipping validation: {table_failures} table(s) failed during migration"
        )
        print(f"  SKIPPED: {table_failures} table(s) failed, validation skipped.")
    else:
        # Only validate when migration succeeded for all tables.
        # Re-read source for validation (reader was closed).
        validator = MigrationValidator(SQLiteReader(source_path), writer)
        try:
            validator.reader.read_all()
        except Exception as e:
            print(f"ERROR: Failed to re-read source for validation: {e}")
            validation_errors.append(f"Source re-read failed: {e}")
        validate_errors = validator.validate()
        validation_errors.extend(validate_errors)
        immutability_errors = validator.validate_source_immutable(
            source_path, source_size, source_mtime
        )
        validation_errors.extend(immutability_errors)
        print(f"  Validation passed.")
    writer.close()

    # Step 5: Report
    print(f"\n[5/5] Generating report...")
    print("\n" + "=" * 60)
    print("Migration Report")
    print("=" * 60)
    total_inserted = 0
    total_stale_same = 0
    total_stale_diff = 0
    total_errors = 0
    for table_name in TABLE_ORDER:
        if table_name not in report:
            continue
        r = report[table_name]
        total_inserted += r["inserted"]
        total_stale_same += r.get("stale_same", 0)
        total_stale_diff += r.get("stale_diff", 0)
        total_errors += len(r["errors"])
        print(f"  {table_name}: insert={r['inserted']} "
              f"stale-same={r.get('stale_same', 0)} "
              f"stale-diff={r.get('stale_diff', 0)} "
              f"errors={len(r['errors'])} "
              f"checksum={r['checksum']}")

    print(f"\nTotals: inserted={total_inserted} "
          f"stale-same={total_stale_same} "
          f"stale-diff={total_stale_diff} "
          f"errors={total_errors}")

    if validation_errors:
        print(f"\nValidation FAILED:")
        for e in validation_errors:
            print(f"  FAILED: {e}")
        return 1

    if total_errors > 0:
        print(f"\nMigration completed with {total_errors} error(s).")
        return 1

    # AC10: Check for stale-diff conflicts (same-PK different-value)
    for table_name in TABLE_ORDER:
        if table_name not in report:
            continue
        r = report[table_name]
        if r.get("stale_diff", 0) > 0:
            print(f"\n[CONFLICT] Table '{table_name}' has {r['stale_diff']} same-PK conflict(s).")
            print(f"  Data was NOT overwritten. Resolve conflicts and re-run.")
            return 1

    if args.dry_run:
        print(f"\n[Dry-run] No data was written to MySQL.")
        print(f"  Run with --execute --setup-schema to apply changes.")
    else:
        print(f"\n[OK] Migration completed successfully.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
