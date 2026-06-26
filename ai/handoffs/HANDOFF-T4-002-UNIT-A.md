# HANDOFF-T4-002 Unit A — Static Fixes

## Queue Revision
`phase4-wave2-unit-a-static-fixes-coordinator-budget-2026-06-26-12`

## Task ID
T4-002

## Unit
A (Static Fixes) → Handing off to Unit B (Same-PK and Rollback Unit Tests)

## Handoff Date
2026-06-26

---

## Unit A Summary

Completed static audit and fixes for the SQLite → MySQL migration tool. Targeted corrections applied to both allowed files:

1. **Source Validation Before Secret Gate** (`scripts/migrate_sqlite_to_mysql.py`): Moved source file existence/stat validation to BEFORE the `REVID_TEST_MYSQL_ADMIN_URL` secret gate. When source is missing, the error is now "Source SQLite database not found" instead of "REVID_TEST_MYSQL_ADMIN_URL is not set".

2. **AC12 Cleanup Patch Binding** (`tests/test_migration_tool.py`): Corrected the `unittest.mock.patch` target from `"scripts.migrate_sqlite_to_mysql.cleanup_test_database"` to `"test_migration_tool.cleanup_test_database"` to match the direct import binding, proving the injected cleanup failure propagates through the actual callable used by the test.

## Evidence Produced

| Artifact | Path | Status |
|----------|------|--------|
| PLAN | `ai/tasks/doing/TASK-T4-002-UNIT-A-PLAN.md` | Created |
| PROGRESS | `ai/tasks/doing/TASK-T4-002-UNIT-A-PROGRESS.md` | Created |
| REPORT | `ai/reports/REPORT-T4-002-UNIT-A.md` | Created |
| REVIEW | `ai/reviews/REVIEW-T4-002-UNIT-A.md` | Created |
| HANDOFF | `ai/handoffs/HANDOFF-T4-002-UNIT-A.md` | This file |

## Static Verification Results

| Check | Result |
|-------|--------|
| AST parse (migrate script) | PASS |
| AST parse (all 13 model files) | PASS |
| Git diff --check | PASS |
| No MySQL connection | CONFIRMED |
| No secret reads | CONFIRMED |
| No destructive operations | CONFIRMED |
| Partial diff preserved | YES |

## Modified Files

- `backend/scripts/migrate_sqlite_to_mysql.py` — source validation moved before secret gate
- `backend/tests/test_migration_tool.py` — AC12 cleanup patch target corrected

## Inherited State for Unit B

### What's Already Fixed (No Action Needed)
1. **Symmetric PK exclusion** in idempotency comparison (partial diff from previous revision)
2. **Per-table transaction rollback** in `migrate_table` (already correct)
3. **Database identity assertion** via `assert_database_name()` (already correct)
4. **Structured URL API** via `build_test_db_url()` using `sqlalchemy.engine.url.URL` (already correct)
5. **Secret-only-gate** via `get_admin_url()` — only `REVID_TEST_MYSQL_ADMIN_URL`, no fallbacks (already correct)

### What Unit B Needs to Do
1. **Same-PK different-value conflict unit test** — AC10: Create test that pre-inserts a row with same PK but different value, runs migration, verifies non-zero exit and data untouched.
2. **Partial rollback unit test** — AC11: Create test that forces a UNIQUE constraint violation mid-batch, verifies entire batch rolled back (no partial commit).
3. These tests require a real MySQL instance but can use the disposable test environment per ADR-003.

### What Unit C Needs to Do
1. **Disposable MySQL integration tests** — AC1-AC9: Full integration test suite using ADR-003 disposable test environment.
2. **Cleanup verification** — AC12: Verify cleanup failure is visible and fatal.

## Constraints for Next Units
- Business attempt ordinal: still 1
- No attempt 2
- ADR-003 disposable MySQL test environment required for Units B-E
- `REVID_TEST_MYSQL_ADMIN_URL` env var required for any MySQL work
- Database identity must be exactly `revid_test_t4_002`

## Handoff Status
**HANDOFF_READY** — Unit A static fixes complete. Ready for Codex PMC review and Unit B dispatch.
