# TASK-T4-002 PLAN — Revision -07 (Attempt 0)

**Revision:** `phase4-wave2-recovery-dispatch-2026-06-24-07`  
**Executor:** revid-backend, Attempt 0  
**Date:** 2026-06-24

## Goal

Fix all 5 known defects from previous PMC reviews so that all 12 ACs pass with real MySQL integration tests.

## Diff Ownership Audit

### `backend/scripts/migrate_sqlite_to_mysql.py` (846 lines changed)
- Complete rewrite from DDL-based to Alembic-based schema management
- Correct: FK-order table list, PK map, FK map, JSON/int col maps
- Correct: `get_admin_url()` now calls `sys.exit(1)` instead of skipping
- Correct: `build_test_db_url()` uses SQLAlchemy URL API with identity assertion
- Correct: `setup_schema_via_alembic()` runs `alembic.command.upgrade(cfg, "head")`
- Correct: `cleanup_test_database()` asserts identity before DROP, re-raises exceptions
- Correct: CLI defaults to dry-run, `--execute` flag required
- **Known gap:** Same-PK different-value via ON DUPLICATE KEY UPDATE still silently overwrites (AC10)
- **Known gap:** AC11 partial rollback test re-runs on same data (all stale-same), doesn't test mid-batch failure

### `backend/tests/test_migration_tool.py` (1729 lines changed)
- Complete rewrite from unit mocks to real MySQL integration tests
- Correct: 12-table fixture SQLite database
- Correct: AC1, AC2, AC3, AC5, AC6, AC8, AC9 tests
- **Known gap:** AC4 — `self.assertTrue(len(errors) >= 0)` is not a real assertion
- **Known gap:** AC10 — expects migration to overwrite with source value (wrong behavior; should fail)
- **Known gap:** AC11 — re-run migration on same data (all stale-same), no real batch failure
- **Known gap:** `tearDownClass` uses bare `except Exception: pass` (AC12)
- **Known gap:** `_get_admin_url()` uses `SkipTest` instead of blocking (AC7)

## Defect Fix Plan

### Checkpoint A — Missing-secret failure + cleanup visibility
1. **AC7 fix:** Replace `_get_admin_url()` `SkipTest` with direct `get_admin_url()` call that asserts `SystemExit(1)`. The fixture helper needs to NOT skip — if env is missing, tests should fail/block.
2. **AC12 fix:** Replace `tearDownClass` bare `except Exception: pass` with proper error logging and re-raise.
3. **AC4 fix:** Replace `self.assertTrue(len(errors) >= 0)` with real FK orphan assertion.

### Checkpoint B — Same-PK conflict + real partial rollback
4. **AC10 fix:** Change `MySQLWriter.migrate_table()` to detect stale-diff BEFORE executing ON DUPLICATE KEY UPDATE. If stale-diff > 0, collect errors and return non-zero exit code WITHOUT writing conflicting data.
5. **AC11 fix:** Create a real mid-batch failure scenario: insert a row that violates a constraint (e.g., duplicate UNIQUE key on `quotas.user_id`) to force a genuine batch rollback.

### Checkpoint C — Verification
6. Run all 12 AC tests against real MySQL.
7. Verify 12 tables created by Alembic.
8. Verify idempotency (second run = same counts).

### Checkpoint D — Report
9. Generate `ai/reports/REPORT-T4-002-phase4-wave2-recovery-dispatch-2026-06-24-07.md`.

## Allowed Files
- `backend/scripts/migrate_sqlite_to_mysql.py`
- `backend/tests/test_migration_tool.py`
- `ai/tasks/doing/TASK-T4-002-PLAN-phase4-wave2-recovery-dispatch-2026-06-24-07.md`
- `ai/tasks/doing/TASK-T4-002-PROGRESS-phase4-wave2-recovery-dispatch-2026-06-24-07.md`
- `ai/reports/REPORT-T4-002-phase4-wave2-recovery-dispatch-2026-06-24-07.md`

## Forbidden
- Any file not listed above
- Business code, frontend, original `revid.db`, user database `revid_db`
- Committing or pushing
