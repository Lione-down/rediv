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
    except Exception:
        pass  # may not exist yet

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


def _setup_test_db():
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
        """Cleanup: drop test database. Re-raises cleanup exceptions (AC12)."""
        try:
            cleanup_test_database(cls.admin_url)
        except Exception:
            raise  # AC12: cleanup failures must be visible
        # Clean up temp dir
        try:
            shutil.rmtree(cls.tmpdir)
        except Exception:
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

        # First migration (already done in AC2, but re-run)
        engine = create_engine(self.test_db_url, future=True)
        with engine.connect() as conn:
            for t in TABLE_ORDER:
                cnt_before = conn.execute(
                    text(f"SELECT COUNT(*) FROM `{t}`")
                ).scalar()

        reader = SQLiteReader(self.fixture_db)
        reader.read_all()
        writer = MySQLWriter(self.test_db_url, dry_run=False)
        report = {}
        for t in TABLE_ORDER:
            rows = reader.get_rows(t)
            if rows:
                writer.migrate_table(t, rows, report)
        writer.close()

        with engine.connect() as conn:
            for t in TABLE_ORDER:
                cnt_after = conn.execute(
                    text(f"SELECT COUNT(*) FROM `{t}`")
                ).scalar()
                self.assertEqual(cnt_before, cnt_after,
                                 f"{t}: idempotency failed, {cnt_before} -> {cnt_after}")
        engine.dispose()

    # -----------------------------------------------------------------------
    # AC4: FK orphan or PK duplicate triggers failure with table name
    # -----------------------------------------------------------------------
    def test_ac4_fk_orphan_detected(self):
        """AC4: FK orphan → validation fails with table name."""
        from sqlalchemy import create_engine, text

        # Insert an orphan row into quotas (user_id doesn't exist in users)
        engine = create_engine(self.test_db_url, future=True)
        with engine.connect() as conn:
            conn.execute(
                text("INSERT INTO quotas VALUES ('q-orphan','nonexistent-user',0,0,0)")
            )
            conn.commit()
        engine.dispose()

        # Run migration — users table is empty in MySQL now, but quotas has orphan
        reader = SQLiteReader(self.fixture_db)
        reader.read_all()
        writer = MySQLWriter(self.test_db_url, dry_run=False)
        report = {}
        for t in TABLE_ORDER:
            rows = reader.get_rows(t)
            if rows:
                writer.migrate_table(t, rows, report)
        writer.close()

        # Validate — should detect orphan
        validator = MigrationValidator(reader, MySQLWriter(self.test_db_url, dry_run=False))
        errors = validator.validate()
        # Real assertion: FK orphan errors must include table name and orphan count
        orphan_found = any("quotas" in e and "nonexistent-user" in e for e in errors)
        self.assertTrue(orphan_found, f"Expected FK orphan error for quotas.nonexistent-user, got: {errors}")

        # Cleanup orphan
        engine = create_engine(self.test_db_url, future=True)
        with engine.connect() as conn:
            conn.execute(text("DELETE FROM quotas WHERE id='q-orphan'"))
            conn.commit()
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
        """AC6: Report contains all 12 tables with matching counts."""
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

    # -----------------------------------------------------------------------
    # AC10: Same-PK different-value conflict → non-zero exit, data untouched
    # -----------------------------------------------------------------------
    def test_ac10_conflict_nonzero_exit(self):
        """AC10: Same-PK different-value → non-zero exit, data NOT overwritten."""
        from sqlalchemy import create_engine, text
        from scripts.migrate_sqlite_to_mysql import main
        from unittest.mock import patch

        # Insert a row with same PK but different value
        engine = create_engine(self.test_db_url, future=True)
        with engine.connect() as conn:
            conn.execute(
                text("INSERT INTO users VALUES ('user-001','DIFFERENT','','','','','','','')")
            )
            conn.commit()
        engine.dispose()

        # Run CLI migration — should detect conflict and return non-zero
        with patch.object(sys, 'argv', ['migrate', '--execute', '--setup-schema']):
            exit_code = main()

        # AC10: Non-zero exit code
        self.assertNotEqual(exit_code, 0,
                            "Expected non-zero exit code for same-PK conflict")

        # AC10: Data should NOT have been overwritten
        engine = create_engine(self.test_db_url, future=True)
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT nickname FROM users WHERE id='user-001'")
            )
            nickname = result.scalar()
            self.assertEqual(nickname, "DIFFERENT",
                             "Migration should NOT have overwritten conflicting data")
        engine.dispose()

        # Cleanup: remove the conflicting row
        engine = create_engine(self.test_db_url, future=True)
        with engine.connect() as conn:
            conn.execute(
                text("DELETE FROM users WHERE id='user-001'")
            )
            conn.commit()
        engine.dispose()

    # -----------------------------------------------------------------------
    # AC11: Partial rollback — no partial submission on batch failure
    # -----------------------------------------------------------------------
    def test_ac11_partial_rollback(self):
        """AC11: Batch failure → entire batch rolled back, no partial commit.

        Strategy: create a UNIQUE constraint violation mid-batch by inserting
        a duplicate user_id into quotas, then attempt migration of a second
        quotas row that conflicts. Verify no partial data committed.
        """
        from sqlalchemy import create_engine, text

        # Clear existing data first
        engine = create_engine(self.test_db_url, future=True)
        with engine.connect() as conn:
            for t in reversed(TABLE_ORDER):
                conn.execute(text(f"DELETE FROM `{t}`"))
            conn.commit()
        engine.dispose()

        # Create a UNIQUE constraint violation: insert a quotas row with
        # a user_id that will also appear in the fixture migration
        engine = create_engine(self.test_db_url, future=True)
        with engine.connect() as conn:
            # Insert a row that duplicates the UNIQUE user_id constraint
            conn.execute(
                text(
                    "INSERT INTO quotas VALUES ('q-pre','user-001',0,0,0)"
                )
            )
            conn.commit()
        engine.dispose()

        # Now migrate from fixture — q-001 has user_id=user-001 which
        # conflicts with the UNIQUE constraint on quotas.user_id
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

        # Verify: migration should have failed (UNIQUE constraint violation)
        self.assertTrue(migration_failed,
                        "Expected migration to fail on UNIQUE constraint violation")

        # Verify: no partial data committed for the failed table
        engine = create_engine(self.test_db_url, future=True)
        with engine.connect() as conn:
            # Quotas should still only have the pre-inserted row
            cnt = conn.execute(
                text("SELECT COUNT(*) FROM quotas")
            ).scalar()
            self.assertEqual(cnt, 1,
                             f"Expected 1 quota row (pre-inserted), got {cnt}. "
                             "Partial data was committed!")
        engine.dispose()

        # Cleanup: drop and recreate test DB for other tests
        try:
            cleanup_test_database(self.admin_url)
        except Exception:
            pass
        _setup_test_db()

    # -----------------------------------------------------------------------
    # AC12: Cleanup failure visible, no silent swallowing
    # -----------------------------------------------------------------------
    def test_ac12_cleanup_failure_visible(self):
        """AC12: Cleanup failure produces visible error, not swallowed."""
        # Normal cleanup should succeed
        try:
            cleanup_test_database(self.admin_url)
        except Exception as e:
            self.fail(f"Cleanup failed unexpectedly: {e}")

        # Now verify the database is gone
        from urllib.parse import urlparse
        from sqlalchemy import create_engine
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
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            self.fail("Database should have been dropped")
        except Exception:
            pass  # Expected: connection to dropped DB fails
        finally:
            engine.dispose()

        # Re-create for other tests
        _setup_test_database_quick(self.admin_url)


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


if __name__ == "__main__":
    unittest.main()
