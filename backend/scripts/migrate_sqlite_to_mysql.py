#!/usr/bin/env python3
"""SQLite -> MySQL 数据迁移 CLI 工具.

用法:
    python migrate_sqlite_to_mysql.py --dry-run
    python migrate_sqlite_to_mysql.py --execute

默认 dry-run，只有 --execute 才真正写入 MySQL。

Schema 所有权: Alembic owns schema. 迁移脚本只负责数据 ETL.
如果目标表不存在，脚本必须明确报错退出.
事务: 每张表一次事务（批量 INSERT），失败则整表回滚.
幂等: 对同一 PK 的 stale 值（quota/JSON/业务字段）不静默跳过，必须检测并报告.
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


# ---------------------------------------------------------------------------
# Table definitions: (name, columns, fk_columns)
# ---------------------------------------------------------------------------

TABLE_DEFS: dict[str, dict[str, Any]] = {
    "users": {
        "columns": [
            ("id", "CHAR(36)", "PRIMARY KEY"),
            ("nickname", "VARCHAR(255)", "NOT NULL"),
            ("avatar_url", "VARCHAR(1024)", "NOT NULL DEFAULT ''"),
            ("role", "VARCHAR(32)", "NOT NULL"),
            ("status", "VARCHAR(32)", "NOT NULL"),
            ("generation_status", "VARCHAR(32)", "NOT NULL"),
            ("created_at", "DATETIME", "NOT NULL"),
            ("updated_at", "DATETIME", "NOT NULL"),
            ("last_login_at", "DATETIME", "NOT NULL"),
        ],
        "order": 1,
    },
    "store_configs": {
        "columns": [
            ("key", "VARCHAR(100)", "PRIMARY KEY"),
            ("value", "JSON", "NOT NULL"),
            ("updated_at", "DATETIME", "NOT NULL"),
        ],
        "order": 2,
    },
    "quotas": {
        "columns": [
            ("id", "CHAR(36)", "PRIMARY KEY"),
            ("user_id", "CHAR(36)", "NOT NULL UNIQUE"),
            ("text_quota", "INT", "NOT NULL DEFAULT 0"),
            ("image_quota", "INT", "NOT NULL DEFAULT 0"),
            ("video_quota", "INT", "NOT NULL DEFAULT 0"),
        ],
        "fk": [("user_id", "users(id)")],
        "order": 3,
    },
    "projects": {
        "columns": [
            ("id", "CHAR(36)", "PRIMARY KEY"),
            ("user_id", "CHAR(36)", "NOT NULL"),
            ("name", "VARCHAR(255)", "NOT NULL"),
            ("created_at", "DATETIME", "NOT NULL"),
            ("updated_at", "DATETIME", "NOT NULL"),
        ],
        "fk": [("user_id", "users(id)")],
        "order": 4,
    },
    "identities": {
        "columns": [
            ("id", "CHAR(36)", "PRIMARY KEY"),
            ("user_id", "CHAR(36)", "NOT NULL"),
            ("provider", "VARCHAR(64)", "NOT NULL"),
            ("provider_user_id", "VARCHAR(255)", "NOT NULL"),
            ("unionid", "VARCHAR(255)", ""),
            ("raw_profile", "JSON", "NOT NULL"),
            ("created_at", "DATETIME", "NOT NULL"),
            ("updated_at", "DATETIME", "NOT NULL"),
        ],
        "fk": [("user_id", "users(id)")],
        "order": 5,
    },
    "guests": {
        "columns": [
            ("id", "CHAR(36)", "PRIMARY KEY"),
            ("session_id", "CHAR(36)", "NOT NULL UNIQUE"),
            ("local_project_snapshot", "JSON", "NOT NULL DEFAULT (json('{}'))"),
            ("created_at", "DATETIME", "NOT NULL"),
            ("expires_at", "DATETIME", "NOT NULL"),
            ("converted_user_id", "CHAR(36)", ""),
        ],
        "fk": [("converted_user_id", "users(id)")],
        "order": 6,
    },
    "invitation_codes": {
        "columns": [
            ("id", "CHAR(36)", "PRIMARY KEY"),
            ("code", "VARCHAR(64)", "NOT NULL UNIQUE"),
            ("status", "VARCHAR(32)", "NOT NULL"),
            ("max_uses", "INT", "NOT NULL"),
            ("used_count", "INT", "NOT NULL DEFAULT 0"),
            ("expires_at", "DATETIME", ""),
            ("quota_package_id", "VARCHAR(255)", ""),
            ("created_by_admin_id", "CHAR(36)", "NOT NULL"),
            ("created_at", "DATETIME", "NOT NULL"),
        ],
        "fk": [("created_by_admin_id", "users(id)")],
        "order": 7,
    },
    "canvas_nodes": {
        "columns": [
            ("id", "CHAR(36)", "PRIMARY KEY"),
            ("project_id", "CHAR(36)", "NOT NULL"),
            ("node_type", "VARCHAR(50)", "NOT NULL"),
            ("content", "JSON", "NOT NULL DEFAULT (json('{}'))"),
            ("position_x", "FLOAT", "NOT NULL DEFAULT 0.0"),
            ("position_y", "FLOAT", "NOT NULL DEFAULT 0.0"),
            ("width", "INT", "NOT NULL DEFAULT 300"),
            ("height", "INT", "NOT NULL DEFAULT 200"),
            ("status", "VARCHAR(20)", "NOT NULL DEFAULT 'active'"),
            ("created_at", "DATETIME", "NOT NULL"),
            ("updated_at", "DATETIME", "NOT NULL"),
        ],
        "fk": [("project_id", "projects(id)")],
        "order": 8,
    },
    "assets": {
        "columns": [
            ("id", "CHAR(36)", "PRIMARY KEY"),
            ("user_id", "CHAR(36)", "NOT NULL"),
            ("project_id", "CHAR(36)", ""),
            ("canvas_node_id", "CHAR(36)", ""),
            ("type", "VARCHAR(32)", "NOT NULL"),
            ("url", "VARCHAR(2048)", ""),
            ("content_text", "TEXT", ""),
            ("source", "VARCHAR(64)", "NOT NULL DEFAULT 'upload'"),
            ("source_model", "VARCHAR(255)", ""),
            ("source_task_id", "VARCHAR(255)", ""),
            ("status", "VARCHAR(32)", "NOT NULL DEFAULT 'active'"),
            ("created_at", "DATETIME", "NOT NULL"),
            ("updated_at", "DATETIME", "NOT NULL"),
        ],
        "fk": [
            ("user_id", "users(id)"),
            ("project_id", "projects(id)"),
            ("canvas_node_id", "canvas_nodes(id)"),
        ],
        "order": 9,
    },
    "templates": {
        "columns": [
            ("id", "CHAR(36)", "PRIMARY KEY"),
            ("user_id", "CHAR(36)", "NOT NULL"),
            ("name", "VARCHAR(255)", "NOT NULL"),
            ("node_data", "JSON", "NOT NULL DEFAULT (json('[]'))"),
            ("node_count", "INT", "NOT NULL DEFAULT 0"),
            ("created_at", "DATETIME", "NOT NULL"),
        ],
        "fk": [("user_id", "users(id)")],
        "order": 10,
    },
    "quota_ledger": {
        "columns": [
            ("id", "CHAR(36)", "PRIMARY KEY"),
            ("user_id", "CHAR(36)", "NOT NULL"),
            ("quota_type", "VARCHAR(32)", "NOT NULL"),
            ("change_amount", "INT", "NOT NULL"),
            ("reason", "VARCHAR(64)", "NOT NULL"),
            ("related_task_id", "VARCHAR(255)", ""),
            ("admin_id", "CHAR(36)", ""),
            ("created_at", "DATETIME", "NOT NULL"),
        ],
        "fk": [
            ("user_id", "users(id)"),
            ("admin_id", "users(id)"),
        ],
        "order": 11,
    },
    "admin_logs": {
        "columns": [
            ("id", "CHAR(36)", "PRIMARY KEY"),
            ("admin_id", "CHAR(36)", "NOT NULL"),
            ("action", "VARCHAR(64)", "NOT NULL"),
            ("target_type", "VARCHAR(64)", "NOT NULL"),
            ("target_id", "VARCHAR(255)", "NOT NULL"),
            ("detail", "JSON", "NOT NULL DEFAULT (json('{}'))"),
            ("created_at", "DATETIME", "NOT NULL"),
        ],
        "fk": [("admin_id", "users(id)")],
        "order": 12,
    },
}

# Ordered table list (FK dependency order)
TABLE_ORDER = sorted(TABLE_DEFS.keys(), key=lambda t: TABLE_DEFS[t]["order"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _safe_str(val: Any) -> str | None:
    """Convert a value to a safe SQL string literal."""
    if val is None:
        return None
    if isinstance(val, datetime):
        return val.isoformat()
    if isinstance(val, dict) or isinstance(val, list):
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


def _redact_sensitive(value: str) -> str:
    """Mask potential password-like substrings in output."""
    parts = value.split(":")
    if len(parts) >= 5:
        # mysql://user:***@host:port/db
        parts[3] = "***"
        value = ":".join(parts)
    return value


def compute_checksum(rows: list[dict], pk_col: str) -> str:
    """Compute a deterministic checksum of primary-key values."""
    hashes = sorted(r[pk_col] for r in rows)
    return hashlib.sha256(",".join(hashes).encode()).hexdigest()[:16]


# ---------------------------------------------------------------------------
# Reader: SQLite
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
                rows = []
                for row in result:
                    d = dict(row._mapping)
                    rows.append(d)
                self._data[table_name] = rows

    def get_rows(self, table_name: str) -> list[dict]:
        return self._data.get(table_name, [])

    def close(self) -> None:
        self.engine.dispose()


# ---------------------------------------------------------------------------
# Writer: MySQL
# ---------------------------------------------------------------------------

class MySQLWriter:
    def __init__(self, target_url: str, dry_run: bool = True) -> None:
        self.dry_run = dry_run
        self.engine = create_engine(target_url, future=True, pool_pre_ping=True)
        self._committed = False

    def check_schema_exists(self) -> None:
        """Check that all expected tables exist. Alembic owns schema.

        Raises RuntimeError if any expected table is missing.
        """
        with self.engine.connect() as conn:
            tables = conn.execute(
                text("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE()")
            ).fetchall()
            existing = {t[0] for t in tables}

            missing = []
            for table_name in TABLE_ORDER:
                if table_name not in existing:
                    missing.append(table_name)

            if missing:
                raise RuntimeError(
                    f"Schema check failed: missing tables (Alembic must run first): {', '.join(missing)}"
                )

    def _prepare_row(self, row: dict, table_name: str) -> tuple[list[str], dict]:
        """Prepare column names and sanitized values for INSERT."""
        col_defs = TABLE_DEFS[table_name]["columns"]
        col_list = [c[0] for c in col_defs]
        sanitized: dict[str, Any] = {}
        for col_name in col_list:
            raw = row.get(col_name)
            col_def = next((c for c in col_defs if c[0] == col_name), None)
            if col_def is None:
                sanitized[col_name] = raw
                continue
            col_type = col_def[1].upper()
            if "INT" in col_type:
                sanitized[col_name] = _safe_int(raw)
            elif "FLOAT" in col_type or "DOUBLE" in col_type:
                sanitized[col_name] = _safe_float(raw)
            elif "DATETIME" in col_type:
                sanitized[col_name] = _safe_str(raw)
            elif "JSON" in col_type:
                sanitized[col_name] = _safe_str(raw)
            elif "TEXT" in col_type:
                sanitized[col_name] = _safe_str(raw)
            else:
                sanitized[col_name] = _safe_str(raw)
        return col_list, sanitized

    def migrate_table(
        self,
        table_name: str,
        rows: list[dict],
        reader: SQLiteReader,
        report: dict,
    ) -> None:
        """Batch-insert rows with table-level transaction.

        Strategy:
        - For each row: INSERT ... ON DUPLICATE KEY UPDATE
        - All rows in one connection, one commit (or rollback on failure)
        - Detect stale same-PK values (existing rows whose values haven't changed)
        """
        pk_col = "id" if table_name != "store_configs" else "key"

        # Load existing PKs and their data for stale-value detection
        existing_map: dict[str, dict] = {}
        if not self.dry_run:
            with self.engine.connect() as conn:
                result = conn.execute(text(f'SELECT * FROM `{table_name}`'))
                for r in result:
                    d = dict(r._mapping)
                    pk_val = str(d[pk_col])
                    existing_map[pk_val] = d

        inserted = 0
        skipped_new = 0  # PK doesn't exist -> truly new
        stale_same = 0   # PK exists, values identical -> stale (no-op)
        stale_diff = 0   # PK exists, values differ -> updated
        errors = []

        # Build bulk INSERT SQL
        if not rows:
            report[table_name] = {
                "source_count": 0,
                "inserted": 0,
                "skipped": 0,
                "stale_same": 0,
                "stale_diff": 0,
                "errors": errors,
                "checksum": compute_checksum(rows, pk_col),
            }
            return

        col_list, sanitized = self._prepare_row(rows[0], table_name)
        placeholders = ", ".join(f":{c}" for c in col_list)
        col_placeholders = ", ".join(f"`{c}`=VALUES(`{c}`)" for c in col_list if c != pk_col)
        sql = f"INSERT INTO `{table_name}` ({', '.join(f'`{c}`' for c in col_list)}) VALUES ({placeholders})"
        if col_placeholders:
            sql += f" ON DUPLICATE KEY UPDATE {col_placeholders}"

        if self.dry_run:
            for row in rows:
                pk_value = str(row[pk_col])
                if pk_value in existing_map:
                    # Would be stale -- check if values differ
                    src_json = json.dumps({k: row[k] for k in col_list if k != pk_col}, sort_keys=True, default=str)
                    dst_json = json.dumps(existing_map[pk_value], sort_keys=True, default=str)
                    if src_json == dst_json:
                        stale_same += 1
                    else:
                        stale_diff += 1
                else:
                    skipped_new += 1
            report[table_name] = {
                "source_count": len(rows),
                "inserted": skipped_new,
                "skipped": 0,
                "stale_same": stale_same,
                "stale_diff": stale_diff,
                "errors": errors,
                "checksum": compute_checksum(rows, pk_col),
            }
            return

        # Execute in a single transaction per table
        try:
            with self.engine.connect() as conn:
                for row in rows:
                    pk_value = str(row[pk_col])
                    _, sanitized_row = self._prepare_row(row, table_name)
                    try:
                        conn.execute(text(sql), sanitized_row)
                        if pk_value in existing_map:
                            # Was an existing row -- ON DUPLICATE KEY UPDATE ran
                            src_json = json.dumps({k: row[k] for k in col_list if k != pk_col}, sort_keys=True, default=str)
                            dst_json = json.dumps(existing_map[pk_value], sort_keys=True, default=str)
                            if src_json == dst_json:
                                stale_same += 1
                            else:
                                stale_diff += 1
                        else:
                            inserted += 1
                    except Exception as e:
                        errors.append(f"  Error inserting row {pk_value}: {e}")
                        # Rollback the whole table transaction on any error
                        conn.rollback()
                        raise
                conn.commit()
        except Exception as e:
            errors.append(f"  Table-level transaction failed: {e}")
            report[table_name] = {
                "source_count": len(rows),
                "inserted": 0,
                "skipped": 0,
                "stale_same": 0,
                "stale_diff": 0,
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
            "errors": errors,
            "checksum": compute_checksum(rows, pk_col),
        }

    def close(self) -> None:
        self.engine.dispose()


# ---------------------------------------------------------------------------
# Validator
# ---------------------------------------------------------------------------

# Critical JSON fields that must round-trip correctly
CRITICAL_JSON_FIELDS = {
    "store_configs": ["value"],
    "identities": ["raw_profile"],
    "guests": ["local_project_snapshot"],
    "canvas_nodes": ["content"],
    "templates": ["node_data"],
    "admin_logs": ["detail"],
}

# Quota fields that must match exactly
QUOTA_FIELDS = {"text_quota", "image_quota", "video_quota"}

# Business-critical integer fields
BUSINESS_INT_FIELDS = {
    "quotas": QUOTA_FIELDS,
    "invitation_codes": {"max_uses", "used_count"},
    "canvas_nodes": {"width", "height"},
    "templates": {"node_count"},
    "quota_ledger": {"change_amount"},
}


class MigrationValidator:
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

                pk_col = "id" if table_name != "store_configs" else "key"
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

                # --- Stale value detection: check critical fields ---
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

                    # Check critical JSON fields
                    json_cols = CRITICAL_JSON_FIELDS.get(table_name, [])
                    for col in json_cols:
                        if col not in src_row or col not in dst_row:
                            continue
                        src_val = src_row[col]
                        dst_val = dst_row[col]
                        src_normalized = _safe_str(src_val)
                        dst_normalized = str(dst_val) if dst_val is not None else None
                        # Normalize JSON whitespace: parse and re-serialize
                        # to handle MySQL's JSON canonicalization
                        try:
                            src_parsed = json.loads(src_normalized) if src_normalized else None
                            dst_parsed = json.loads(dst_normalized) if dst_normalized else None
                            src_normalized = json.dumps(src_parsed, separators=(",", ":"), ensure_ascii=False)
                            dst_normalized = json.dumps(dst_parsed, separators=(",", ":"), ensure_ascii=False)
                        except (json.JSONDecodeError, TypeError):
                            pass  # fall back to raw comparison
                        if src_normalized != dst_normalized:
                            errors.append(
                                f"{table_name}.{src_pk}.{col}: JSON mismatch -- "
                                f"SQLite={src_normalized[:80]}..., MySQL={dst_normalized[:80]}..."
                            )

                    # Check quota/business integer fields
                    biz_int_cols = BUSINESS_INT_FIELDS.get(table_name, set())
                    for col in biz_int_cols:
                        if col not in src_row or col not in dst_row:
                            continue
                        src_val = _safe_int(src_row.get(col))
                        dst_val = _safe_int(dst_row.get(col))
                        if src_val != dst_val:
                            errors.append(
                                f"{table_name}.{src_pk}.{col}: value mismatch -- "
                                f"SQLite={src_val}, MySQL={dst_val}"
                            )

                # --- FK orphan detection ---
                fk_cols = TABLE_DEFS[table_name].get("fk", [])
                for src_col, ref in fk_cols:
                    ref_table, _, ref_col_raw = ref.partition("(")
                    ref_col = ref_col_raw.rstrip(")")
                    if src_col == pk_col:
                        continue
                    src_values = {str(r[src_col]) for r in src_rows if r.get(src_col) is not None}
                    if not src_values:
                        continue
                    result = conn.execute(text(f'SELECT `{ref_col}` FROM `{ref_table}`'))
                    ref_ids = {str(r[0]) for r in result}
                    orphans = src_values - ref_ids
                    if orphans:
                        errors.append(
                            f"{table_name}.{src_col}: {len(orphans)} orphan references "
                            f"(first: {list(orphans)[:3]})"
                        )

        return errors

    def validate_source_immutable(self, source_path: str, initial_size: int, initial_mtime: float) -> list[str]:
        """Verify the source SQLite database was not modified during migration."""
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
# CLI
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="SQLite -> MySQL 数据迁移工具")
    parser.add_argument(
        "--source",
        default="revid.db",
        help="SQLite 数据库路径 (默认: revid.db)",
    )
    parser.add_argument(
        "--target",
        default=os.environ.get("REVID_MYSQL_URL", ""),
        help="MySQL 连接字符串 (默认: REVID_MYSQL_URL env)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=True,
        help="Dry run 模式（默认开启，不写入 MySQL）",
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        default=False,
        help="实际执行迁移（写入 MySQL）",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    if args.execute:
        args.dry_run = False

    # Safety gate: verify source path is not the production DB
    source_path = os.path.abspath(args.source)
    if "revid.db" in source_path and "test" not in source_path.lower() and "temp" not in source_path.lower():
        print("WARNING: Source path contains 'revid.db'. This is likely the production database.")
        print("         Use --source with a copy or backup path.")

    if not os.path.isfile(source_path):
        print(f"ERROR: Source SQLite database not found: {source_path}")
        return 1

    # Validate target
    target_url = args.target
    if not target_url:
        host = os.environ.get("REVID_DB_HOST", "localhost")
        port = os.environ.get("REVID_DB_PORT", "3306")
        db = os.environ.get("REVID_DB_NAME", "revid_db")
        user = os.environ.get("REVID_DB_USER", "root")
        password = os.environ.get("REVID_DB_PASSWORD", "")
        if not password:
            print("ERROR: No MySQL target specified. Set --target or REVID_MYSQL_URL / REVID_DB_* env vars.")
            return 1
        from sqlalchemy.engine.url import URL
        url = URL.create(
            drivername="mysql+pymysql",
            username=user,
            password=password,
            host=host,
            port=int(port),
            database=db,
        )
        target_url = url.render_as_string(hide_password=False)

    print("=" * 60)
    print(f"SQLite -> MySQL Migration Tool")
    print(f"Mode: {'EXECUTE' if not args.dry_run else 'DRY-RUN'}")
    print(f"Source: {source_path}")
    print(f"Target: {_redact_sensitive(target_url)}")
    print("=" * 60)

    # Safety gate: verify source is NOT being modified
    source_stat = os.stat(source_path)
    source_size = source_stat.st_size
    source_mtime = source_stat.st_mtime

    # Step 1: Read SQLite
    print("\n[1/4] Reading SQLite database...")
    reader = SQLiteReader(source_path)
    try:
        reader.read_all()
    except Exception as e:
        print(f"ERROR: Failed to read SQLite: {e}")
        return 1
    finally:
        new_stat = os.stat(source_path)
        if new_stat.st_size != source_size or abs(new_stat.st_mtime - source_mtime) > 1:
            print("ERROR: Source database was modified during read! Aborting.")
            reader.close()
            return 1

    # Print source summary
    for table_name in TABLE_ORDER:
        rows = reader.get_rows(table_name)
        if rows:
            print(f"  {table_name}: {len(rows)} rows")

    # Step 2: Connect to MySQL and check schema (Alembic owns schema)
    print(f"\n[2/4] Connecting to MySQL (dry_run={args.dry_run})...")
    writer = MySQLWriter(target_url, dry_run=args.dry_run)
    try:
        writer.check_schema_exists()
    except RuntimeError as e:
        print(f"ERROR: {e}")
        reader.close()
        writer.close()
        return 1
    except Exception as e:
        print(f"ERROR: Failed to connect to MySQL: {e}")
        reader.close()
        writer.close()
        return 1

    # Step 3: Migrate
    print(f"\n[3/4] Migrating data...")
    report: dict[str, dict] = {}
    table_failures = 0
    for table_name in TABLE_ORDER:
        rows = reader.get_rows(table_name)
        if not rows:
            print(f"  {table_name}: skip (empty)")
            continue
        start = time.time()
        try:
            writer.migrate_table(table_name, rows, reader, report)
        except Exception as e:
            print(f"  {table_name}: FAILED -- {e}")
            table_failures += 1
            continue
        elapsed = time.time() - start
        r = report[table_name]
        print(f"  {table_name}: {r['inserted']} inserted, "
              f"{r['skipped']} skipped, "
              f"{r['stale_same']} stale-same, "
              f"{r['stale_diff']} stale-diff, "
              f"{len(r['errors'])} errors ({elapsed:.2f}s)")

    reader.close()

    # Step 4: Validate
    print(f"\n[4/4] Validating migration...")
    validation_errors: list[str] = []
    if not args.dry_run and table_failures == 0:
        validator = MigrationValidator(reader, writer)
        validation_errors = validator.validate()
        # Also check source immutability
        immutability_errors = validator.validate_source_immutable(
            source_path, source_size, source_mtime
        )
        validation_errors.extend(immutability_errors)
        writer.close()
    elif not args.dry_run:
        validation_errors.append(f"Skipping validation: {table_failures} table(s) failed during migration")
        writer.close()

    # Print report
    print("\n" + "=" * 60)
    print("Migration Report")
    print("=" * 60)
    total_inserted = 0
    total_skipped = 0
    total_stale_same = 0
    total_stale_diff = 0
    total_errors = 0
    for table_name in TABLE_ORDER:
        if table_name not in report:
            continue
        r = report[table_name]
        total_inserted += r["inserted"]
        total_skipped += r["skipped"]
        total_stale_same += r.get("stale_same", 0)
        total_stale_diff += r.get("stale_diff", 0)
        total_errors += len(r["errors"])
        print(f"  {table_name}: insert={r['inserted']} skip={r['skipped']} "
              f"stale-same={r.get('stale_same', 0)} stale-diff={r.get('stale_diff', 0)} "
              f"errors={len(r['errors'])} checksum={r['checksum']}")

    print(f"\nTotals: inserted={total_inserted} skipped={total_skipped} "
          f"stale-same={total_stale_same} stale-diff={total_stale_diff} errors={total_errors}")

    if validation_errors:
        print(f"\nValidation FAILED:")
        for e in validation_errors:
            print(f"  FAILED: {e}")
        return 1

    if total_errors > 0:
        print(f"\nMigration completed with {total_errors} error(s).")
        return 1

    if args.dry_run:
        print(f"\n[Dry-run] No data was written to MySQL.")
        print(f"  Run with --execute to apply changes.")
    else:
        print(f"\n[OK] Migration completed successfully.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
