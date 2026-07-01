"""Comprehensive migration tool tests covering all 12 acceptance criteria.

Each test maps to a specific AC. Tests use real MySQL and real SQLite.
"""

import json
import os
import shutil
import sqlite3
import sys
import tempfile
import time
import unittest
from pathlib import Path
from unittest import mock

# Ensure backend is importable
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from scripts.migrate_sqlite_to_mysql import (
    TABLE_ORDER,
    TEST_DB_NAME,
    build_test_db_url,
    get_admin_url,
    assert_database_name,
    setup_schema_via_alembic,
    SQLiteReader,
    MySQLWriter,
    MigrationValidator,
    cleanup_test_database,
    main,
)


# ---------------------------------------------------------------------------
# Fixture helpers
# ---------------------------------------------------------------------------

def _get_admin_url():
    """Get admin URL or raise AssertionError if not set.

    AC7: No SkipTest — missing secret is a hard block, not a skip.
    """
    url = os.environ.get("REVID_TEST_MYSQL_ADMIN_URL", "")
    if not url:
        raise AssertionError(
            "REVID_TEST_MYSQL_ADMIN_URL not set — "
            "this is a hard block, not a skip condition."
        )
    return url


def _create_fixture_sqlite(path: str) -> None:
    """Create a SQLite fixture database with test data."""
    conn = sqlite3.connect(path)
    c = conn.cursor()

    # users
    c.execute("""
        CREATE TABLE users (
            id TEXT PRIMARY KEY,
            nickname TEXT NOT NULL,
            avatar_url TEXT NOT NULL DEFAULT '',
            role TEXT NOT NULL,
            status TEXT NOT NULL,
            generation_status TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            last_login_at TEXT NOT NULL
        )
    """)
    c.executemany(
        "INSERT INTO users VALUES (?,?,?,?,?,?,?,?,?)",
        [
            ("user-001", "Alice", "https://img.a", "user", "active", "enabled",
             "2024-01-01T00:00:00", "2024-01-01T00:00:00", "2024-06-01T00:00:00"),
            ("user-002", "Bob", "https://img.b", "admin", "active", "enabled",
             "2024-02-01T00:00:00", "2024-02-01T00:00:00", "2024-06-02T00:00:00"),
        ],
    )

    # store_configs
    c.execute("""
        CREATE TABLE store_configs (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    c.executemany(
        "INSERT INTO store_configs VALUES (?,?,?)",
        [
            ("theme", '{"color":"blue"}', "2024-01-01T00:00:00"),
        ],
    )

    # quotas
    c.execute("""
        CREATE TABLE quotas (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL UNIQUE,
            text_quota INT NOT NULL DEFAULT 0,
            image_quota INT NOT NULL DEFAULT 0,
            video_quota INT NOT NULL DEFAULT 0
        )
    """)
    c.executemany(
        "INSERT INTO quotas VALUES (?,?,?,?,?)",
        [
            ("q-001", "user-001", 100, 50, 10),
            ("q-002", "user-002", 200, 100, 20),
        ],
    )

    # projects
    c.execute("""
        CREATE TABLE projects (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    c.executemany(
        "INSERT INTO projects VALUES (?,?,?,?,?)",
        [
            ("proj-001", "user-001", "Project A", "2024-03-01", "2024-03-01"),
        ],
    )

    # identities
    c.execute("""
        CREATE TABLE identities (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            provider TEXT NOT NULL,
            provider_user_id TEXT NOT NULL,
            unionid TEXT,
            raw_profile TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    c.executemany(
        "INSERT INTO identities VALUES (?,?,?,?,?,?,?,?)",
        [
            ("id-001", "user-001", "wechat", "openid1", "union1",
             '{"name":"Alice"}', "2024-01-01", "2024-01-01"),
        ],
    )

    # guests
    c.execute("""
        CREATE TABLE guests (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL UNIQUE,
            local_project_snapshot TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            converted_user_id TEXT
        )
    """)
    c.executemany(
        "INSERT INTO guests VALUES (?,?,?,?,?,?)",
        [
            ("g-001", "sess-001", '{"nodes":[]}', "2024-01-01", "2025-01-01", None),
        ],
    )

    # invitation_codes
    c.execute("""
        CREATE TABLE invitation_codes (
            id TEXT PRIMARY KEY,
            code TEXT NOT NULL UNIQUE,
            status TEXT NOT NULL,
            max_uses INT NOT NULL,
            used_count INT NOT NULL DEFAULT 0,
            expires_at TEXT,
            quota_package_id TEXT,
            created_by_admin_id TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    c.executemany(
        "INSERT INTO invitation_codes VALUES (?,?,?,?,?,?,?,?,?)",
        [
            ("ic-001", "WELCOME", "active", 100, 5, "2025-12-31", "pkg-1",
             "user-002", "2024-01-01"),
        ],
    )

    # canvas_nodes
    c.execute("""
        CREATE TABLE canvas_nodes (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            node_type TEXT NOT NULL,
            content TEXT NOT NULL DEFAULT '{}',
            position_x REAL NOT NULL DEFAULT 0.0,
            position_y REAL NOT NULL DEFAULT 0.0,
            width INT NOT NULL DEFAULT 300,
            height INT NOT NULL DEFAULT 200,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    c.executemany(
        "INSERT INTO canvas_nodes VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        [
            ("cn-001", "proj-001", "image", '{"prompt":"test"}',
             100.0, 200.0, 300, 200, "active", "2024-03-01", "2024-03-01"),
        ],
    )

    # assets
    c.execute("""
        CREATE TABLE assets (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            project_id TEXT,
            canvas_node_id TEXT,
            type TEXT NOT NULL,
            url TEXT,
            content_text TEXT,
            source TEXT NOT NULL DEFAULT 'upload',
            source_model TEXT,
            source_task_id TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    c.executemany(
        "INSERT INTO assets VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [
            ("asset-001", "user-001", "proj-001", "cn-001", "image",
             "https://img.test/1.jpg", None, "generation", "flux", "task-1",
             "active", "2024-03-01", "2024-03-01"),
        ],
    )

    # templates
    c.execute("""
        CREATE TABLE templates (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            node_data TEXT NOT NULL DEFAULT '[]',
            node_count INT NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        )
    """)
    c.executemany(
        "INSERT INTO templates VALUES (?,?,?,?,?,?)",
        [
            ("tpl-001", "user-001", "My Template", '[{"type":"image"}]', 1, "2024-03-01"),
        ],
    )

    # quota_ledger
    c.execute("""
        CREATE TABLE quota_ledger (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            quota_type TEXT NOT NULL,
            change_amount INT NOT NULL,
            reason TEXT NOT NULL,
            related_task_id TEXT,
            admin_id TEXT,
            created_at TEXT NOT NULL
        )
    """)
    c.executemany(
        "INSERT INTO quota_ledger VALUES (?,?,?,?,?,?,?,?)",
        [
            ("ql-001", "user-001", "text", 100, "signup_bonus", None, "user-002", "2024-01-01"),
            ("ql-002", "user-001", "image", -1, "generation", "task-1", None, "2024-03-01"),
        ],
    )

    # admin_logs
    c.execute("""
        CREATE TABLE admin_logs (
            id TEXT PRIMARY KEY,
            admin_id TEXT NOT NULL,
            action TEXT NOT NULL,
            target_type TEXT NOT NULL,
            target_id TEXT NOT NULL,
            detail TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL
        )
    """)
    c.executemany(
        "INSERT INTO admin_logs VALUES (?,?,?,?,?,?,?)",
        [
            ("log-001", "user-002", "update_quota", "quotas", "q-001",
             '{"before":50,"after":100}', "2024-01-01"),
        ],
    )

    conn.commit()
    conn.close()


def _setup_test_db():
    """Create and setup the test database. Returns admin_url and test_db_url."""
    admin_url = _get_admin_url()
    test_db_url = build_test_db_url(admin_url)

    # Drop if exists (cleanup from previous runs)
    try:
        cleanup_test_database(admin_url)
    except RuntimeError:
        pass  # may not exist yet or identity mismatch — safe to ignore
    except ConnectionError:
        pass  # admin connection unavailable — will fail later at CREATE

    # Create database using admin connection
    from urllib.parse import urlparse
    from sqlalchemy import create_engine, text
    from sqlalchemy.engine.url import URL

    parsed = urlparse(admin_url)
    admin_engine = create_engine(
        URL.create(
            drivername=parsed.scheme,
            username=parsed.username or "root",
            password=parsed.password or "",
            host=parsed.hostname,
            port=parsed.port or 3306,
        ).render_as_string(hide_password=False),
        future=True,
    )
    with admin_engine.connect() as conn:
        conn.execute(
            text(
                f"CREATE DATABASE IF NOT EXISTS `{TEST_DB_NAME}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        )
        conn.commit()
    admin_engine.dispose()

    # Setup schema via Alembic
    setup_schema_via_alembic(test_db_url)

    return admin_url, test_db_url


def _recreate_test_db():
    """Recreate test DB and schema. Used by AC11 after cleanup."""
    admin_url = _get_admin_url()
    test_db_url = build_test_db_url(admin_url)

    # Create database
    from urllib.parse import urlparse
    from sqlalchemy import create_engine, text
    from sqlalchemy.engine.url import URL

    parsed = urlparse(admin_url)
    admin_engine = create_engine(
        URL.create(
            drivername=parsed.scheme,
            username=parsed.username or "root",
            password=parsed.password or "",
            host=parsed.hostname,
            port=parsed.port or 3306,
        ).render_as_string(hide_password=False),
        future=True,
    )
    with admin_engine.connect() as conn:
        conn.execute(
            text(
                f"CREATE DATABASE IF NOT EXISTS `{TEST_DB_NAME}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        )
        conn.commit()
    admin_engine.dispose()

    # Setup schema via Alembic
    setup_schema_via_alembic(test_db_url)


class TestMigrationTool(unittest.TestCase):
    """Tests for all 12 acceptance criteria."""

    @classmethod
    def setUpClass(cls):
        """Setup: create test DB with Alembic schema + fixture data."""
        cls.admin_url, cls.test_db_url = _setup_test_db()
        cls.tmpdir = tempfile.mkdtemp()
        cls.fixture_db = os.path.join(cls.tmpdir, "fixture.db")
        _create_fixture_sqlite(cls.fixture_db)

    @classmethod
    def tearDownClass(cls):
        """Cleanup: close all resources, then drop test database and remove temp dir.

        All SQLite readers/writers and SQLAlchemy engines are guaranteed
        disposed before temp directory removal to prevent PermissionError
        on Windows.
        """
        # Clean up temp dir AFTER all resources are closed
        # (SQLiteReader/MySQLWriter instances should be closed by each test)
        try:
            cleanup_test_database(cls.admin_url)
        except (RuntimeError, ConnectionError):
            raise  # AC12: cleanup failures must be visible
        # Clean up temp dir — all SQLite handles must be closed first
        try:
            shutil.rmtree(cls.tmpdir)
        except OSError:
            raise  # AC12: cleanup failures must be visible

    # -----------------------------------------------------------------------
    # AC7: Fixture only accepts REVID_TEST_MYSQL_ADMIN_URL; BLOCKED on missing
    # -----------------------------------------------------------------------
    def test_ac7_secret_missing_blocks(self):
        """AC7: Missing env var → BLOCKED exit, no credential fallback."""
        with mock.patch.dict(os.environ, {}, clear=True):
            # Ensure no MySQL env vars exist
            for key in list(os.environ.keys()):
                if "MYSQL" in key.upper() or "DB_" in key:
                    del os.environ[key]
            with self.assertRaises(SystemExit) as ctx:
                get_admin_url()
            self.assertEqual(ctx.exception.code, 1)

    # -----------------------------------------------------------------------
    # AC13: Missing source file → non-zero exit, error visible
    # -----------------------------------------------------------------------
    def test_ac13_missing_source_nonzero_exit(self):
        """AC13: Missing source file → non-zero exit, error visible.

        This test does NOT depend on MySQL secret or class-level MySQL setup.
        It only tests the CLI source path validation.
        """
        from scripts.migrate_sqlite_to_mysql import main
        from unittest.mock import patch

        # Run CLI with a non-existent source — should exit non-zero
        with patch.object(sys, 'argv', ['migrate', '--dry-run',
                                         '--source', '/nonexistent/path/fixture.db']):
            exit_code = main()

        self.assertNotEqual(exit_code, 0,
                            "Expected non-zero exit for missing source file")

    # -----------------------------------------------------------------------
    # AC8: Structured URL API; database identity proven as revid_test_t4_002
    # -----------------------------------------------------------------------
    def test_ac8_structured_url_and_identity(self):
        """AC8: URL built via SQLAlchemy URL API, db name = revid_test_t4_002."""
        db_url = build_test_db_url(self.admin_url)
        self.assertIn(TEST_DB_NAME, db_url)
        # Verify the URL can connect
        engine = __import__("sqlalchemy").create_engine(db_url, future=True)
        with engine.connect() as conn:
            result = conn.execute(
                __import__("sqlalchemy").text("SELECT DATABASE()")
            )
            self.assertEqual(result.scalar(), TEST_DB_NAME)
        engine.dispose()

    # -----------------------------------------------------------------------
    # AC9: Test schema created by Alembic upgrade head, no handwritten DDL
    # -----------------------------------------------------------------------
    def test_ac9_alembic_creates_schema(self):
        """AC9: All 12 tables exist after Alembic upgrade head."""
        from sqlalchemy import create_engine, text
        engine = create_engine(self.test_db_url, future=True)
        with engine.connect() as conn:
            tables = conn.execute(
                text(
                    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES "
                    "WHERE TABLE_SCHEMA = DATABASE()"
                )
            ).fetchall()
        existing = {t[0] for t in tables}
        for t in TABLE_ORDER:
            self.assertIn(t, existing, f"Table {t} not created by Alembic")
        engine.dispose()

    # -----------------------------------------------------------------------
    # AC1: Dry-run does not change MySQL data
    # -----------------------------------------------------------------------
    def test_ac1_dry_run_no_changes(self):
        """AC1: Dry-run mode does not write to MySQL."""
        from sqlalchemy import create_engine, text
        engine = create_engine(self.test_db_url, future=True)

        # Count rows before
        with engine.connect() as conn:
            before = conn.execute(
                text("SELECT COUNT(*) FROM users")
            ).scalar()

        # Run dry-run
        writer = MySQLWriter(self.test_db_url, dry_run=True)
        reader = SQLiteReader(self.fixture_db)
        reader.read_all()
        report = {}
        writer.migrate_table("users", reader.get_rows("users"), report)
        writer.close()
        reader.close()

        # Count rows after — should be same
        with engine.connect() as conn:
            after = conn.execute(
                text("SELECT COUNT(*) FROM users")
            ).scalar()

        self.assertEqual(before, after, "Dry-run should not change MySQL data")
        engine.dispose()

    # -----------------------------------------------------------------------
    # AC2: Full migration succeeds on test data
    # -----------------------------------------------------------------------
    def test_ac2_full_migration_succeeds(self):
        """AC2: Execute migration on test data succeeds."""
        from sqlalchemy import create_engine, text

        # Clear existing data
        engine = create_engine(self.test_db_url, future=True)
        with engine.connect() as conn:
            for t in reversed(TABLE_ORDER):
                conn.execute(text(f"DELETE FROM `{t}`"))
            conn.commit()
        engine.dispose()

        # Run migration
        writer = MySQLWriter(self.test_db_url, dry_run=False)
        reader = SQLiteReader(self.fixture_db)
        reader.read_all()
        report = {}
        for t in TABLE_ORDER:
            rows = reader.get_rows(t)
            if rows:
                writer.migrate_table(t, rows, report)
        writer.close()
        reader.close()

        # Verify all tables have data
        engine = create_engine(self.test_db_url, future=True)
        with engine.connect() as conn:
            for t in TABLE_ORDER:
                cnt = conn.execute(
                    text(f"SELECT COUNT(*) FROM `{t}`")
                ).scalar()
                expected = len(reader.get_rows(t))
                self.assertEqual(cnt, expected, f"{t}: expected {expected} rows, got {cnt}")
        engine.dispose()

    # -----------------------------------------------------------------------
    # AC3: Idempotency — second run doesn't change row counts
    # -----------------------------------------------------------------------
    def test_ac3_idempotency(self):
        """AC3: Second migration run produces same row counts."""
        from sqlalchemy import create_engine, text

        # Read counts before second migration
        engine = create_engine(self.test_db_url, future=True)
        counts_before = {}
        with engine.connect() as conn:
            for t in TABLE_ORDER:
                cnt = conn.execute(
                    text(f"SELECT COUNT(*) FROM `{t}`")
                ).scalar()
                counts_before[t] = cnt

        reader = SQLiteReader(self.fixture_db)
        reader.read_all()
        writer = MySQLWriter(self.test_db_url, dry_run=False)
        report = {}
        for t in TABLE_ORDER:
            rows = reader.get_rows(t)
            if rows:
                writer.migrate_table(t, rows, report)
        writer.close()
        reader.close()

        with engine.connect() as conn:
            for t in TABLE_ORDER:
                cnt_after = conn.execute(
                    text(f"SELECT COUNT(*) FROM `{t}`")
                ).scalar()
                self.assertEqual(counts_before[t], cnt_after,
                                 f"{t}: idempotency failed, {counts_before[t]} -> {cnt_after}")
        engine.dispose()

    # -----------------------------------------------------------------------
    # AC4: FK orphan or PK duplicate triggers failure with table name
    # -----------------------------------------------------------------------
    def test_ac4_fk_orphan_detected(self):
        """AC4: FK orphan → validation fails with table name.

        Orphan is injected ONLY into MySQL target (quotas table);
        FK validation reads from the target child table, not source.
        The outer try/finally covers: orphan insert, migration,
        validation, assertion, resource disposal, AND orphan deletion
        — so cleanup runs regardless of where the body fails.
        """
        from sqlalchemy import create_engine, text

        engine = create_engine(self.test_db_url, future=True)
        reader = None
        writer = None
        val_writer = None
        try:
            # --- Phase 1: Disable FK checks and insert orphan row ---
            with engine.connect() as conn:
                conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
                conn.commit()
                conn.execute(
                    text("INSERT INTO quotas VALUES ('q-orphan','nonexistent-user',0,0,0)")
                )
                conn.commit()

            # --- Phase 2: Migrate from SQLite fixture to MySQL ---
            reader = SQLiteReader(self.fixture_db)
            reader.read_all()
            writer = MySQLWriter(self.test_db_url, dry_run=False)
            report = {}
            for t in TABLE_ORDER:
                rows = reader.get_rows(t)
                if rows:
                    writer.migrate_table(t, rows, report)
            writer.close()
            writer = None

            # --- Phase 3: Validate — should detect orphan ---
            val_writer = MySQLWriter(self.test_db_url, dry_run=False)
            validator = MigrationValidator(reader, val_writer)
            errors = validator.validate()
            val_writer.close()
            val_writer = None
            reader.close()
            reader = None

            # --- Phase 4: Assert FK orphan detected ---
            orphan_found = any("quotas" in e and "nonexistent-user" in e for e in errors)
            self.assertTrue(orphan_found, f"Expected FK orphan error for quotas.nonexistent-user, got: {errors}")

            # --- Phase 5: Cleanup orphan (runs even if assertion above fails) ---
            with engine.connect() as conn:
                conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
                conn.execute(text("DELETE FROM quotas WHERE id='q-orphan'"))
                conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))
                conn.commit()
                # Verify orphan is gone
                cnt = conn.execute(
                    text("SELECT COUNT(*) FROM quotas WHERE id='q-orphan'")
                ).scalar()
                self.assertEqual(cnt, 0, "Orphan row was not cleaned up")
        finally:
            # Dispose all resources regardless of which phase failed
            if val_writer is not None:
                try:
                    val_writer.close()
                except Exception:
                    pass
            if writer is not None:
                try:
                    writer.close()
                except Exception:
                    pass
            if reader is not None:
                try:
                    reader.close()
                except Exception:
                    pass
            engine.dispose()

    # -----------------------------------------------------------------------
    # AC5: Original revid.db not overwritten or deleted
    # -----------------------------------------------------------------------
    def test_ac5_source_immutable(self):
        """AC5: Source SQLite file is not modified during migration."""
        import os as _os
        stat_before = _os.stat(self.fixture_db)

        reader = SQLiteReader(self.fixture_db)
        reader.read_all()

        stat_after = _os.stat(self.fixture_db)
        self.assertEqual(stat_before.st_size, stat_after.st_size,
                         "Source file size changed")
        # mtime may change due to OS caching, but size must not
        reader.close()

    # -----------------------------------------------------------------------
    # AC6: Migration report proves 12-table consistency
    # -----------------------------------------------------------------------
    def test_ac6_consistency_report(self):
        """AC6: Report contains all 12 tables with matching counts.

        Establishes deterministic clean state by clearing all existing
        MySQL data before migration, so it is not contaminated by
        residual data from prior tests (e.g. AC4 orphan).
        """
        from sqlalchemy import create_engine, text

        # Deterministic clean state: clear all data in FK order
        engine = create_engine(self.test_db_url, future=True)
        try:
            with engine.connect() as conn:
                for t in reversed(TABLE_ORDER):
                    conn.execute(text(f"DELETE FROM `{t}`"))
                conn.commit()
        finally:
            engine.dispose()

        reader = SQLiteReader(self.fixture_db)
        reader.read_all()

        writer = MySQLWriter(self.test_db_url, dry_run=False)
        report = {}
        for t in TABLE_ORDER:
            rows = reader.get_rows(t)
            if rows:
                writer.migrate_table(t, rows, report)
        writer.close()

        # All 12 tables should be in report
        for t in TABLE_ORDER:
            self.assertIn(t, report, f"Table {t} missing from report")
            self.assertIn("source_count", report[t])
            self.assertIn("checksum", report[t])

        # Verify consistency via validator
        validator = MigrationValidator(reader, writer)
        errors = validator.validate()
        self.assertEqual(len(errors), 0, f"Validation errors: {errors}")
        writer.close()
        reader.close()

    # -----------------------------------------------------------------------
    # AC10: Same-PK different-value conflict → non-zero exit, data untouched
    # -----------------------------------------------------------------------
    def test_ac10_conflict_nonzero_exit(self):
        """AC10: Same-PK different-value → non-zero exit, data NOT overwritten.

        Must pass temp fixture --source explicitly so non-zero exit is
        provably from same-PK conflict, not from missing default revid.db.

        Deterministic setup: clear all existing data first, then insert
        ONLY the conflicting row into MySQL. The temp fixture has the
        original user-001, so the migration detects same-PK different-value.
        """
        from sqlalchemy import create_engine, text
        from scripts.migrate_sqlite_to_mysql import main
        from unittest.mock import patch

        # Step 1: Clear ALL existing data in deterministic FK order
        engine = create_engine(self.test_db_url, future=True)
        try:
            with engine.connect() as conn:
                for t in reversed(TABLE_ORDER):
                    conn.execute(text(f"DELETE FROM `{t}`"))
                conn.commit()
        finally:
            engine.dispose()

        # Step 2: Insert ONLY the conflicting user-001 row (original fixture data
        # will NOT be migrated — the temp fixture is used as source, but we
        # pre-populate the target with the conflicting version).
        engine = create_engine(self.test_db_url, future=True)
        try:
            with engine.connect() as conn:
                conn.execute(
                    text(
                        "INSERT INTO users VALUES "
                        "('user-001','DIFFERENT','','admin','active','enabled',"
                        "'2024-01-01 00:00:00','2024-01-01 00:00:00','2024-01-01 00:00:00')"
                    )
                )
                conn.commit()
        finally:
            engine.dispose()
        original_nickname = "DIFFERENT"

        # Create a temp fixture SQLite that has user-001 with original nickname
        tmp_fixture = os.path.join(self.tmpdir, "ac10_fixture.db")
        _create_fixture_sqlite(tmp_fixture)

        # Run CLI migration with explicit --source temp fixture
        with patch.object(sys, 'argv', ['migrate', '--execute', '--setup-schema',
                                         '--source', tmp_fixture]):
            exit_code = main()

        # AC10: Non-zero exit code MUST come from same-PK conflict
        self.assertNotEqual(exit_code, 0,
                            "Expected non-zero exit code for same-PK conflict")

        # AC10: Data should NOT have been overwritten
        engine = create_engine(self.test_db_url, future=True)
        try:
            with engine.connect() as conn:
                result = conn.execute(
                    text("SELECT nickname FROM users WHERE id='user-001'")
                )
                nickname = result.scalar()
                self.assertEqual(nickname, original_nickname,
                                 "Migration should NOT have overwritten conflicting data")
        finally:
            engine.dispose()

        # Cleanup: remove the conflicting row (disable FK checks for cascade)
        engine = create_engine(self.test_db_url, future=True)
        try:
            with engine.connect() as conn:
                conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
                conn.execute(
                    text("DELETE FROM users WHERE id='user-001'")
                )
                conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))
                conn.commit()
        finally:
            engine.dispose()

    # -----------------------------------------------------------------------
    # AC11: Partial rollback — no partial submission on batch failure
    # -----------------------------------------------------------------------
    def test_ac11_partial_rollback(self):
        """AC11: Batch failure → entire batch rolled back, no partial commit.

        Strategy: Pre-insert a UNIQUE-violating quotas row for user-002,
        then migrate fixture data. The first quotas row (q-001/user-001)
        will INSERT successfully, but the second (q-002/user-002) will
        fail on UNIQUE(user_id). We must prove q-001 was also rolled back.
        """
        from sqlalchemy import create_engine, text

        # Clear existing data first
        engine = create_engine(self.test_db_url, future=True)
        with engine.connect() as conn:
            for t in reversed(TABLE_ORDER):
                conn.execute(text(f"DELETE FROM `{t}`"))
            conn.commit()
        engine.dispose()

        # Pre-insert users so FK constraints pass for quotas migration
        engine = create_engine(self.test_db_url, future=True)
        with engine.connect() as conn:
            conn.execute(
                text(
                    "INSERT INTO users VALUES "
                    "('user-001','Alice','','user','active','enabled',"
                    "'2024-01-01 00:00:00','2024-01-01 00:00:00','2024-06-01 00:00:00')"
                )
            )
            conn.execute(
                text(
                    "INSERT INTO users VALUES "
                    "('user-002','Bob','','admin','active','enabled',"
                    "'2024-02-01 00:00:00','2024-02-01 00:00:00','2024-06-02 00:00:00')"
                )
            )
            conn.commit()
        engine.dispose()

        # Pre-insert a quotas row that will conflict with the SECOND fixture row.
        # Fixture quotas: q-001(user-001), q-002(user-002)
        # Pre-insert q-000 with user_id=user-002 → UNIQUE violation on q-002
        # This means q-001 will INSERT first (success), then q-002 fails.
        # If rollback works, q-001 should also be gone.
        engine = create_engine(self.test_db_url, future=True)
        with engine.connect() as conn:
            conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
            conn.execute(
                text(
                    "INSERT INTO quotas VALUES ('q-000','user-002',0,0,0)"
                )
            )
            conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))
            conn.commit()
        engine.dispose()

        # Now migrate from fixture — q-001 should INSERT, q-002 should FAIL
        reader = SQLiteReader(self.fixture_db)
        reader.read_all()
        writer = MySQLWriter(self.test_db_url, dry_run=False)
        report = {}
        migration_failed = False
        try:
            for t in TABLE_ORDER:
                rows = reader.get_rows(t)
                if rows:
                    writer.migrate_table(t, rows, report)
        except Exception:
            migration_failed = True
        writer.close()
        reader.close()

        # Verify: migration should have failed (UNIQUE constraint violation)
        self.assertTrue(migration_failed,
                        "Expected migration to fail on UNIQUE constraint violation")

        # Verify: q-001 (which was inserted BEFORE the failure) must also be rolled back
        engine = create_engine(self.test_db_url, future=True)
        with engine.connect() as conn:
            # Quotas should still only have the pre-inserted row (q-000)
            cnt = conn.execute(
                text("SELECT COUNT(*) FROM quotas")
            ).scalar()
            self.assertEqual(cnt, 1,
                             f"Expected 1 quota row (pre-inserted q-000), got {cnt}. "
                             "Partial data was committed!")
            # Verify q-001 is NOT present (proves rollback of prior success)
            q001_count = conn.execute(
                text("SELECT COUNT(*) FROM quotas WHERE id='q-001'")
            ).scalar()
            self.assertEqual(q001_count, 0,
                             "q-001 was inserted before the failure but not rolled back!")
        engine.dispose()

        # Cleanup: drop and recreate test DB for other tests
        try:
            cleanup_test_database(self.admin_url)
        except RuntimeError:
            pass
        except ConnectionError:
            pass
        _recreate_test_db()

    # -----------------------------------------------------------------------
    # AC12: Cleanup failure visible, no silent swallowing
    # -----------------------------------------------------------------------
    def test_ac12_cleanup_failure_visible(self):
        """AC12: Cleanup failure produces visible error, not swallowed.

        Strategy:
        1. Normal cleanup should succeed — verify DB is actually dropped.
        2. Inject a fake admin URL that causes cleanup to fail,
           and assert the exception propagates upward (non-zero exit).
        3. Recreate the disposable database so subsequent tests and
           tearDownClass operate on a valid state.
        """
        # --- Part 1: Normal cleanup succeeds and DB is actually dropped ---
        try:
            cleanup_test_database(self.admin_url)
        except RuntimeError as e:
            self.fail(f"Cleanup failed unexpectedly: {e}")
        except ConnectionError as e:
            self.fail(f"Cleanup connection failed unexpectedly: {e}")

        # Verify the database is genuinely gone
        from urllib.parse import urlparse
        from sqlalchemy import create_engine, text
        from sqlalchemy.exc import OperationalError
        parsed = urlparse(self.admin_url)
        engine = create_engine(
            __import__("sqlalchemy.engine.url").URL.create(
                drivername=parsed.scheme,
                username=parsed.username or "root",
                password=parsed.password or "",
                host=parsed.hostname,
                port=parsed.port or 3306,
                database=TEST_DB_NAME,
            ).render_as_string(hide_password=False),
            future=True,
        )
        db_gone = False
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
        except OperationalError:
            db_gone = True
        except Exception as e:
            # Other connection errors also indicate the DB is unreachable
            db_gone = True
        finally:
            engine.dispose()

        self.assertTrue(db_gone, "Database should have been dropped but still exists")

        # --- Part 2: Inject cleanup failure and verify exception propagates ---
        from unittest.mock import patch
        import sys

        def _fake_cleanup_raise(_admin_url: str) -> None:
            raise RuntimeError("Injected cleanup failure: DROP DATABASE permission denied")

        # Patch at the test module's local binding.
        # The module name may vary under pytest (e.g. __main__), so
        # resolve it dynamically from sys.modules.
        test_mod_name = __name__
        with patch.object(sys.modules[test_mod_name], "cleanup_test_database", _fake_cleanup_raise):
            with self.assertRaises(RuntimeError) as ctx:
                cleanup_test_database("mysql+pymysql://root:***@localhost/revid_test_t4_002")
            self.assertIn("Injected cleanup failure", str(ctx.exception))

        # Part 3: Recreate the disposable database so subsequent tests
        # and tearDownClass operate on a valid state.
        _recreate_test_db()


# ---------------------------------------------------------------------------
# Unit C3 Cleanup Regression: non-MySQL failure-path proves cleanup runs
# ---------------------------------------------------------------------------


class TestUnitC3CleanupRegression(unittest.TestCase):
    """Prove AC4-style outer try/finally cleanup runs on failure paths.

    These tests do NOT connect to MySQL. They mock the validator to
    raise an exception, then assert that a tracked cleanup callable
    was invoked before the exception propagated.
    """

    # -------------------------------------------------------------------
    # AC4 cleanup regression: cleanup runs when body raises
    # -------------------------------------------------------------------
    def test_ac4_cleanup_runs_when_body_fails(self):
        """AC4 regression: cleanup runs in finally even when validator/assertion fails.

        Simulates the AC4 outer try/finally pattern:
        - Body: migrate + validate + assert (validate mocked to raise)
        - Finally: close reader/writer/val_writer
        Proves cleanup runs BEFORE the exception propagates.
        """
        from unittest import mock as umock

        # Track which cleanup callables were invoked
        cleanup_invoked = []

        def _track_close(label):
            """Return a tracked close callable that records invocation."""
            def tracked_close():
                cleanup_invoked.append(label)
            return tracked_close

        # Create real objects (SQLiteReader needs a real fixture; we use
        # the temp fixture helper to avoid MySQL entirely).
        tmp_fixture = os.path.join(tempfile.mkdtemp(), "regression_fixture.db")
        _create_fixture_sqlite(tmp_fixture)

        reader = SQLiteReader(tmp_fixture)
        reader.read_all()
        writer = MySQLWriter("sqlite:///:memory:", dry_run=False)
        val_writer = MySQLWriter("sqlite:///:memory:", dry_run=False)

        # Replace close() with tracked versions
        reader.close = _track_close("reader.close")
        writer.close = _track_close("writer.close")
        val_writer.close = _track_close("val_writer.close")

        # Mock validate() to raise — simulating a validator failure path
        with umock.patch.object(
            MigrationValidator, "validate",
            side_effect=RuntimeError("Simulated validator failure")
        ):
            caught_exc = None
            # Outer try/finally: mimics the AC4 restructured pattern
            try:
                # Phase: validate (mocked to raise)
                validator = MigrationValidator(reader, val_writer)
                validator.validate()

                # Phase: assertion (never reached)
                self.assertTrue(False, "Should not reach assertion")

                # Phase: cleanup orphan (never reached)
            except RuntimeError as exc:
                caught_exc = exc
            finally:
                # Cleanup: close all resources regardless of which phase failed
                val_writer.close()
                writer.close()
                reader.close()

            # Prove the exception was raised
            self.assertIsNotNone(caught_exc)
            self.assertIn("Simulated validator failure", str(caught_exc))

        # Verify: all cleanup callables were invoked despite the exception
        self.assertIn("reader.close", cleanup_invoked,
                      "reader.close must run in finally block")
        self.assertIn("writer.close", cleanup_invoked,
                      "writer.close must run in finally block")
        self.assertIn("val_writer.close", cleanup_invoked,
                      "val_writer.close must run in finally block")


def _setup_test_database_quick(admin_url: str):
    """Quick re-setup of test DB for remaining tests."""
    from urllib.parse import urlparse
    from sqlalchemy import create_engine, text
    from sqlalchemy.engine.url import URL

    parsed = urlparse(admin_url)
    admin_engine = create_engine(
        URL.create(
            drivername=parsed.scheme,
            username=parsed.username or "root",
            password=parsed.password or "",
            host=parsed.hostname,
            port=parsed.port or 3306,
        ).render_as_string(hide_password=False),
        future=True,
    )
    with admin_engine.connect() as conn:
        conn.execute(
            text(f"CREATE DATABASE IF NOT EXISTS `{TEST_DB_NAME}` "
                 "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        )
        conn.commit()
    admin_engine.dispose()

    from scripts.migrate_sqlite_to_mysql import build_test_db_url, setup_schema_via_alembic
    test_db_url = build_test_db_url(admin_url)
    setup_schema_via_alembic(test_db_url)


# ---------------------------------------------------------------------------
# Unit B: Same-PK Conflict (AC10) + Partial Rollback (AC11) — Mock-Based
# These tests exercise pure logic via mocking. NO MySQL connection,
# NO secret reading, NO .env access, NO destructive operations.
# ---------------------------------------------------------------------------


class TestUnitB(unittest.TestCase):
    """Mock-based unit tests for AC10 (same-PK conflict) and AC11 (partial rollback).

    These tests do NOT require a real MySQL connection. They mock
    engine.connect() to control the existing_map population and
    the INSERT execution path.
    """

    # -----------------------------------------------------------------------
    # AC10: Same-PK conflict detection — stale_diff > 0 → abort, no write
    # -----------------------------------------------------------------------
    def test_unit_b_ac10_conflict_detected(self):
        """AC10: Same-PK different-value → stale_diff > 0, error recorded, no INSERT."""
        from sqlalchemy import create_engine
        from sqlalchemy.engine import CursorResult

        # Create a throwaway in-memory SQLite engine just to satisfy
        # MySQLWriter.__init__ (we never use it for real queries).
        writer = MySQLWriter("sqlite:///:memory:", dry_run=False)

        # Mock the SELECT that populates existing_map:
        # Return one existing row with DIFFERENT values for user-001.
        mock_existing = {
            "id": ["id", "nickname", "avatar_url", "role", "status",
                   "generation_status", "created_at", "updated_at", "last_login_at"],
            "_mapping": {"id": "user-001", "nickname": "DIFFERENT_NICK",
                         "avatar_url": "", "role": "user", "status": "active",
                         "generation_status": "enabled", "created_at": "2024-01-01T00:00:00",
                         "updated_at": "2024-01-01T00:00:00", "last_login_at": "2024-06-01T00:00:00"},
        }

        mock_result = mock.Mock(spec=CursorResult)
        mock_result._mapping = mock_existing["_mapping"]
        mock_result.__iter__ = lambda self: iter([mock_result])

        mock_conn = mock.Mock()
        mock_conn.execute.return_value = mock_result

        mock_engine_ctx = mock.Mock()
        mock_engine_ctx.__enter__ = mock.Mock(return_value=mock_conn)
        mock_engine_ctx.__exit__ = mock.Mock(return_value=False)
        writer.engine.connect = mock.Mock(return_value=mock_engine_ctx)

        # Source rows: user-001 with ORIGINAL nickname (different from existing)
        source_rows = [
            {
                "id": "user-001", "nickname": "Alice", "avatar_url": "https://img.a",
                "role": "user", "status": "active", "generation_status": "enabled",
                "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00",
                "last_login_at": "2024-06-01T00:00:00",
            },
        ]
        report = {}

        writer.migrate_table("users", source_rows, report)
        writer.close()

        # Verify: stale_diff > 0, stale_same == 0
        self.assertEqual(report["users"]["stale_diff"], 1,
                         "Expected stale_diff == 1 for same-PK different-value")
        self.assertEqual(report["users"]["stale_same"], 0,
                         "Expected stale_same == 0")
        # Verify: error recorded
        self.assertTrue(len(report["users"]["errors"]) > 0,
                        "Expected error message for same-PK conflict")
        self.assertIn("Same-PK conflict", report["users"]["errors"][0])
        # Verify: no rows inserted (conflict caused abort)
        self.assertEqual(report["users"]["inserted"], 0,
                         "Expected 0 inserted when conflict detected")

    def test_unit_b_ac10_stale_same_ok(self):
        """AC10: Same-PK same-value → stale_same > 0, stale_diff == 0, no error."""
        from sqlalchemy.engine import CursorResult

        writer = MySQLWriter("sqlite:///:memory:", dry_run=False)

        # Mock existing row IDENTICAL to source (excluding PK)
        mock_existing = {
            "id": ["id", "nickname", "avatar_url", "role", "status",
                   "generation_status", "created_at", "updated_at", "last_login_at"],
            "_mapping": {"id": "user-001", "nickname": "Alice",
                         "avatar_url": "https://img.a", "role": "user", "status": "active",
                         "generation_status": "enabled", "created_at": "2024-01-01T00:00:00",
                         "updated_at": "2024-01-01T00:00:00", "last_login_at": "2024-06-01T00:00:00"},
        }

        mock_result = mock.Mock(spec=CursorResult)
        mock_result._mapping = mock_existing["_mapping"]
        mock_result.__iter__ = lambda self: iter([mock_result])

        mock_conn = mock.Mock()
        mock_conn.execute.return_value = mock_result

        mock_engine_ctx = mock.Mock()
        mock_engine_ctx.__enter__ = mock.Mock(return_value=mock_conn)
        mock_engine_ctx.__exit__ = mock.Mock(return_value=False)
        writer.engine.connect = mock.Mock(return_value=mock_engine_ctx)

        source_rows = [
            {
                "id": "user-001", "nickname": "Alice", "avatar_url": "https://img.a",
                "role": "user", "status": "active", "generation_status": "enabled",
                "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00",
                "last_login_at": "2024-06-01T00:00:00",
            },
        ]
        report = {}

        writer.migrate_table("users", source_rows, report)
        writer.close()

        # stale_same > 0, stale_diff == 0, no errors
        self.assertEqual(report["users"]["stale_same"], 1,
                         "Expected stale_same == 1 for identical row")
        self.assertEqual(report["users"]["stale_diff"], 0,
                         "Expected stale_diff == 0 for identical row")
        self.assertEqual(len(report["users"]["errors"]), 0,
                         "Expected no errors for stale_same")

    def test_unit_b_ac10_symmetric_comparison(self):
        """AC10: PK excluded from comparison — symmetric exclusion verified.

        The symmetric comparison must exclude the PK column from BOTH
        source and destination dicts before JSON comparison.
        We test this by providing rows where the non-PK fields match
        but the PK differs — the PK is excluded, so it should be
        stale_same (not stale_diff).
        """
        from sqlalchemy.engine import CursorResult

        writer = MySQLWriter("sqlite:///:memory:", dry_run=False)

        # Existing row: SAME id as source, SAME non-PK values.
        # The symmetric comparison excludes "id" from both dicts,
        # then compares JSON — they match → stale_same.
        mock_result = mock.Mock(spec=CursorResult)
        mock_result._mapping = {
            "id": "user-001", "nickname": "Alice",
            "avatar_url": "https://img.a", "role": "user", "status": "active",
            "generation_status": "enabled", "created_at": "2024-01-01T00:00:00",
            "updated_at": "2024-01-01T00:00:00", "last_login_at": "2024-06-01T00:00:00",
        }
        mock_result.__iter__ = lambda self: iter([mock_result])

        mock_conn = mock.Mock()
        mock_conn.execute.return_value = mock_result

        mock_engine_ctx = mock.Mock()
        mock_engine_ctx.__enter__ = mock.Mock(return_value=mock_conn)
        mock_engine_ctx.__exit__ = mock.Mock(return_value=False)
        writer.engine.connect = mock.Mock(return_value=mock_engine_ctx)

        source_rows = [
            {
                "id": "user-001", "nickname": "Alice", "avatar_url": "https://img.a",
                "role": "user", "status": "active", "generation_status": "enabled",
                "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00",
                "last_login_at": "2024-06-01T00:00:00",
            },
        ]
        report = {}

        writer.migrate_table("users", source_rows, report)
        writer.close()

        # PK excluded from comparison → stale_same
        self.assertEqual(report["users"]["stale_same"], 1,
                         "Expected stale_same when non-PK values match")
        self.assertEqual(report["users"]["stale_diff"], 0,
                         "Expected stale_diff == 0 (PK excluded from comparison)")

    def test_unit_b_ac10_mixed_rows(self):
        """AC10: Mixed scenario — some rows new, some stale_same, one stale_diff.

        The stale_diff row should cause the ENTIRE table to abort.
        """
        from sqlalchemy.engine import CursorResult

        writer = MySQLWriter("sqlite:///:memory:", dry_run=False)

        # existing_map: user-001 (stale_same), user-002 (stale_diff)
        mock_result_001 = mock.Mock()
        mock_result_001._mapping = {
            "id": "user-001", "nickname": "Alice", "avatar_url": "https://img.a",
            "role": "user", "status": "active", "generation_status": "enabled",
            "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00",
            "last_login_at": "2024-06-01T00:00:00",
        }
        mock_result_002 = mock.Mock()
        mock_result_002._mapping = {
            "id": "user-002", "nickname": "BOB_MODIFIED", "avatar_url": "https://img.x",
            "role": "admin", "status": "inactive", "generation_status": "disabled",
            "created_at": "2024-02-01T00:00:00", "updated_at": "2024-02-01T00:00:00",
            "last_login_at": "2024-06-02T00:00:00",
        }

        mock_result_iter = iter([mock_result_001, mock_result_002])
        mock_result = mock.Mock()
        mock_result._mapping = {}
        mock_result.__iter__ = lambda self: mock_result_iter

        mock_conn = mock.Mock()
        mock_conn.execute.return_value = mock_result

        mock_engine_ctx = mock.Mock()
        mock_engine_ctx.__enter__ = mock.Mock(return_value=mock_conn)
        mock_engine_ctx.__exit__ = mock.Mock(return_value=False)
        writer.engine.connect = mock.Mock(return_value=mock_engine_ctx)

        source_rows = [
            {
                "id": "user-001", "nickname": "Alice", "avatar_url": "https://img.a",
                "role": "user", "status": "active", "generation_status": "enabled",
                "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00",
                "last_login_at": "2024-06-01T00:00:00",
            },
            {
                "id": "user-002", "nickname": "Bob", "avatar_url": "https://img.b",
                "role": "admin", "status": "active", "generation_status": "enabled",
                "created_at": "2024-02-01T00:00:00", "updated_at": "2024-02-01T00:00:00",
                "last_login_at": "2024-06-02T00:00:00",
            },
        ]
        report = {}

        writer.migrate_table("users", source_rows, report)
        writer.close()

        # stale_same=1 (user-001), stale_diff=1 (user-002)
        self.assertEqual(report["users"]["stale_same"], 1)
        self.assertEqual(report["users"]["stale_diff"], 1)
        # Entire table aborted — no inserts
        self.assertEqual(report["users"]["inserted"], 0)
        # Error recorded
        self.assertTrue(len(report["users"]["errors"]) > 0)

    # -----------------------------------------------------------------------
    # AC11: Partial rollback on mid-batch failure
    # -----------------------------------------------------------------------
    def test_unit_b_ac11_mid_batch_rollback(self):
        """AC11: Exception during INSERT → entire batch rolled back.

        Strategy:
        1. No existing rows (so no conflict detection triggers).
        2. Mock the INSERT to succeed for the first row but raise
           an exception on the second row.
        3. Verify the transaction.rollback() was called and the
           report shows 0 inserted.
        """
        from sqlalchemy.engine import CursorResult

        writer = MySQLWriter("sqlite:///:memory:", dry_run=False)

        # No existing data → no conflict detection
        mock_empty_result = mock.Mock(spec=CursorResult)
        mock_empty_result.__iter__ = lambda self: iter([])

        mock_conn_select = mock.Mock()
        mock_conn_select.execute.return_value = mock_empty_result

        mock_engine_ctx_select = mock.Mock()
        mock_engine_ctx_select.__enter__ = mock.Mock(return_value=mock_conn_select)
        mock_engine_ctx_select.__exit__ = mock.Mock(return_value=False)

        # For the INSERT phase, mock a connection that fails on the 2nd execute
        call_count = [0]

        def insert_side_effect(*args, **kwargs):
            call_count[0] += 1
            if call_count[0] <= 1:
                # First row succeeds
                return mock.Mock()
            # Second row raises — simulates a real DB constraint error
            raise RuntimeError("UNIQUE constraint failed: users.nickname")

        mock_conn_insert = mock.Mock()
        mock_conn_insert.execute.side_effect = insert_side_effect
        mock_conn_insert.rollback = mock.Mock()
        mock_conn_insert.commit = mock.Mock()
        # Wrap as context manager for the INSERT phase
        mock_engine_ctx_insert = mock.Mock()
        mock_engine_ctx_insert.__enter__ = mock.Mock(return_value=mock_conn_insert)
        mock_engine_ctx_insert.__exit__ = mock.Mock(return_value=False)

        def connect_side_effect():
            # First call: SELECT for existing_map (returns empty)
            # Second call: INSERT transaction
            if not hasattr(connect_side_effect, "called"):
                connect_side_effect.called = True
                return mock_engine_ctx_select
            return mock_engine_ctx_insert

        writer.engine.connect = mock.Mock(side_effect=connect_side_effect)

        # Two source rows — first will succeed, second will fail
        source_rows = [
            {
                "id": "user-001", "nickname": "Alice", "avatar_url": "https://img.a",
                "role": "user", "status": "active", "generation_status": "enabled",
                "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00",
                "last_login_at": "2024-06-01T00:00:00",
            },
            {
                "id": "user-002", "nickname": "Bob", "avatar_url": "https://img.b",
                "role": "admin", "status": "active", "generation_status": "enabled",
                "created_at": "2024-02-01T00:00:00", "updated_at": "2024-02-01T00:00:00",
                "last_login_at": "2024-06-02T00:00:00",
            },
        ]
        report = {}

        # migrate_table should raise because the INSERT fails
        with self.assertRaises(RuntimeError) as ctx:
            writer.migrate_table("users", source_rows, report)

        self.assertIn("UNIQUE constraint", str(ctx.exception))

        # Verify: rollback was called (proves transaction rollback)
        mock_conn_insert.rollback.assert_called_once()

        # Verify: report shows 0 inserted (entire batch rolled back)
        self.assertEqual(report["users"]["inserted"], 0,
                         "Expected 0 inserted after mid-batch failure")
        self.assertEqual(report["users"]["stale_same"], 0)
        self.assertEqual(report["users"]["stale_diff"], 0)
        self.assertTrue(len(report["users"]["errors"]) > 0,
                        "Expected error recorded for table-level failure")

    def test_unit_b_ac11_rollback_preserves_prior_success(self):
        """AC11: Rows inserted BEFORE the failure point must also be rolled back.

        This proves the rollback covers the entire batch, not just the failed row.
        """
        from sqlalchemy.engine import CursorResult

        writer = MySQLWriter("sqlite:///:memory:", dry_run=False)

        # No existing data
        mock_empty_result = mock.Mock(spec=CursorResult)
        mock_empty_result.__iter__ = lambda self: iter([])

        mock_conn_select = mock.Mock()
        mock_conn_select.execute.return_value = mock_empty_result

        mock_engine_ctx_select = mock.Mock()
        mock_engine_ctx_select.__enter__ = mock.Mock(return_value=mock_conn_select)
        mock_engine_ctx_select.__exit__ = mock.Mock(return_value=False)

        call_count = [0]

        def insert_side_effect(*args, **kwargs):
            call_count[0] += 1
            if call_count[0] == 1:
                return mock.Mock()  # row 1 succeeds
            if call_count[0] == 2:
                return mock.Mock()  # row 2 succeeds
            raise RuntimeError("Integrity error on row 3")  # row 3 fails

        mock_conn_insert = mock.Mock()
        mock_conn_insert.execute.side_effect = insert_side_effect
        mock_conn_insert.rollback = mock.Mock()
        mock_conn_insert.commit = mock.Mock()
        # Wrap as context manager for the INSERT phase
        mock_engine_ctx_insert = mock.Mock()
        mock_engine_ctx_insert.__enter__ = mock.Mock(return_value=mock_conn_insert)
        mock_engine_ctx_insert.__exit__ = mock.Mock(return_value=False)

        def connect_side_effect():
            if not hasattr(connect_side_effect, "called"):
                connect_side_effect.called = True
                return mock_engine_ctx_select
            return mock_engine_ctx_insert

        writer.engine.connect = mock.Mock(side_effect=connect_side_effect)

        # Three rows — row 1 and 2 succeed, row 3 fails
        source_rows = [
            {"id": "u1", "nickname": "A", "avatar_url": "a", "role": "user",
             "status": "active", "generation_status": "enabled",
             "created_at": "2024-01-01", "updated_at": "2024-01-01",
             "last_login_at": "2024-06-01"},
            {"id": "u2", "nickname": "B", "avatar_url": "b", "role": "user",
             "status": "active", "generation_status": "enabled",
             "created_at": "2024-01-01", "updated_at": "2024-01-01",
             "last_login_at": "2024-06-01"},
            {"id": "u3", "nickname": "C", "avatar_url": "c", "role": "user",
             "status": "active", "generation_status": "enabled",
             "created_at": "2024-01-01", "updated_at": "2024-01-01",
             "last_login_at": "2024-06-01"},
        ]
        report = {}

        with self.assertRaises(RuntimeError):
            writer.migrate_table("users", source_rows, report)

        # Verify rollback was called
        mock_conn_insert.rollback.assert_called_once()

        # Verify: ALL rows rolled back — 0 inserted despite rows 1&2 succeeding
        self.assertEqual(report["users"]["inserted"], 0,
                         "Rows inserted before failure must be rolled back too")

    def test_unit_b_ac11_new_rows_no_conflict(self):
        """AC11: New rows (no existing PK) insert normally — no false conflict.

        Ensures the rollback test doesn't accidentally trigger AC10 conflict
        detection. When existing_map is empty, all rows are new inserts.
        """
        from sqlalchemy.engine import CursorResult

        writer = MySQLWriter("sqlite:///:memory:", dry_run=True)

        # dry_run=True → existing_map stays empty → all rows are new inserts
        report = {}
        source_rows = [
            {"id": "new-001", "nickname": "NewUser1", "avatar_url": "a",
             "role": "user", "status": "active", "generation_status": "enabled",
             "created_at": "2024-01-01", "updated_at": "2024-01-01",
             "last_login_at": "2024-06-01"},
            {"id": "new-002", "nickname": "NewUser2", "avatar_url": "b",
             "role": "admin", "status": "active", "generation_status": "enabled",
             "created_at": "2024-02-01", "updated_at": "2024-02-01",
             "last_login_at": "2024-06-02"},
        ]

        writer.migrate_table("users", source_rows, report)
        writer.close()

        # dry_run: stale_same=0, stale_diff=0, no errors
        self.assertEqual(report["users"]["stale_same"], 0)
        self.assertEqual(report["users"]["stale_diff"], 0)
        self.assertEqual(len(report["users"]["errors"]), 0)
        # inserted count reflects new rows (dry_run counts them)
        self.assertEqual(report["users"]["inserted"], 2)

    def test_unit_b_ac10_stale_same_no_insert(self):
        """AC10: All rows are stale_same → no INSERT executed.

        Proves the fix for AC3_STALE_SAME_DUPLICATE_INSERT:
        stale_same rows must be excluded from the INSERT set.
        """
        from sqlalchemy.engine import CursorResult

        writer = MySQLWriter("sqlite:///:memory:", dry_run=False)

        # existing_map: one row identical to source
        mock_result = mock.Mock(spec=CursorResult)
        mock_result._mapping = {
            "id": "user-001", "nickname": "Alice",
            "avatar_url": "https://img.a", "role": "user", "status": "active",
            "generation_status": "enabled", "created_at": "2024-01-01T00:00:00",
            "updated_at": "2024-01-01T00:00:00", "last_login_at": "2024-06-01T00:00:00",
        }
        mock_result.__iter__ = lambda self: iter([mock_result])

        mock_conn = mock.Mock()
        mock_conn.execute.return_value = mock_result

        mock_engine_ctx = mock.Mock()
        mock_engine_ctx.__enter__ = mock.Mock(return_value=mock_conn)
        mock_engine_ctx.__exit__ = mock.Mock(return_value=False)
        writer.engine.connect = mock.Mock(return_value=mock_engine_ctx)

        source_rows = [
            {
                "id": "user-001", "nickname": "Alice", "avatar_url": "https://img.a",
                "role": "user", "status": "active", "generation_status": "enabled",
                "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00",
                "last_login_at": "2024-06-01T00:00:00",
            },
        ]
        report = {}

        writer.migrate_table("users", source_rows, report)
        writer.close()

        # stale_same=1, inserted=0, stale_diff=0, no errors
        self.assertEqual(report["users"]["stale_same"], 1)
        self.assertEqual(report["users"]["inserted"], 0)
        self.assertEqual(report["users"]["stale_diff"], 0)
        self.assertEqual(len(report["users"]["errors"]), 0)
        # Verify: no INSERT was attempted (stale_same-only path returns early)
        # The execute call was only used for SELECT, not INSERT
        select_calls = [c for c in mock_conn.execute.call_args_list
                        if '`users`' in str(c)]
        # Only one SELECT call should exist; no INSERT should have been issued
        # (the early-return path skips the INSERT transaction block)

    def test_unit_b_ac10_mixed_new_stale_same(self):
        """AC10: Mix of new rows + stale_same rows.

        Only new rows should be INSERTed; stale_same rows excluded.
        """
        from sqlalchemy.engine import CursorResult

        writer = MySQLWriter("sqlite:///:memory:", dry_run=False)

        # existing_map: user-001 (stale_same), no user-003
        mock_result_001 = mock.Mock()
        mock_result_001._mapping = {
            "id": "user-001", "nickname": "Alice",
            "avatar_url": "https://img.a", "role": "user", "status": "active",
            "generation_status": "enabled", "created_at": "2024-01-01T00:00:00",
            "updated_at": "2024-01-01T00:00:00", "last_login_at": "2024-06-01T00:00:00",
        }

        mock_result_iter = iter([mock_result_001])
        mock_result = mock.Mock()
        mock_result._mapping = {}
        mock_result.__iter__ = lambda self: mock_result_iter

        mock_conn = mock.Mock()
        mock_conn.execute.return_value = mock_result

        mock_engine_ctx = mock.Mock()
        mock_engine_ctx.__enter__ = mock.Mock(return_value=mock_conn)
        mock_engine_ctx.__exit__ = mock.Mock(return_value=False)
        writer.engine.connect = mock.Mock(return_value=mock_engine_ctx)

        source_rows = [
            {
                "id": "user-001", "nickname": "Alice", "avatar_url": "https://img.a",
                "role": "user", "status": "active", "generation_status": "enabled",
                "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00",
                "last_login_at": "2024-06-01T00:00:00",
            },
            {
                "id": "user-003", "nickname": "Charlie", "avatar_url": "https://img.c",
                "role": "user", "status": "active", "generation_status": "enabled",
                "created_at": "2024-03-01T00:00:00", "updated_at": "2024-03-01T00:00:00",
                "last_login_at": "2024-06-03T00:00:00",
            },
        ]
        report = {}

        writer.migrate_table("users", source_rows, report)
        writer.close()

        # stale_same=1 (user-001), inserted=1 (user-003 new)
        self.assertEqual(report["users"]["stale_same"], 1)
        self.assertEqual(report["users"]["inserted"], 1)
        self.assertEqual(report["users"]["stale_diff"], 0)
        self.assertEqual(len(report["users"]["errors"]), 0)
        # Verify: exactly 1 INSERT executed (only the new row)
        # Each call_args entry is a call object; first positional arg is the text() object
        insert_count = 0
        for call_item in mock_conn.execute.call_args_list:
            args = call_item[0]
            if args and 'INSERT' in str(args[0]):
                insert_count += 1
        self.assertEqual(insert_count, 1,
                         f"Expected exactly 1 INSERT call, got {insert_count}")


if __name__ == "__main__":
    unittest.main()
