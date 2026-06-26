# T4-002 Plan — Final Rework Attempt 1 (Revision -08)

**Task ID:** T4-002
**Queue Revision:** `phase4-wave2-final-rework-2026-06-25-08`
**Executor Attempt:** 1 (FINAL)
**Failure Fingerprint:** `T4-002-SEMANTICS: IDEMPOTENCY_COMPARISON + FALSE_POSITIVE_CONFLICT + NON_MID_BATCH_ROLLBACK + SWALLOWED_CLEANUP + MISSING_SOURCE_COVERAGE`

## Objective

Fix 5 semantic defects from PMC REWORK review in the existing partial diff, then pass all 12+ acceptance criteria with real MySQL integration tests.

## Defects to Fix

### Defect 1: Idempotency comparison structurally incorrect
- **Root Cause:** `migrate_table()` excludes PK from source dict but includes ALL columns (including PK) from destination dict. Asymmetric comparison causes same-data rows to be classified as `stale_diff`.
- **Fix:** Exclude PK from BOTH source and destination dicts in the JSON comparison. Both sides must have identical column sets minus PK.
- **File:** `backend/scripts/migrate_sqlite_to_mysql.py` lines ~403-410

### Defect 2: AC10 false-positive conflict
- **Root Cause:** AC10 CLI test doesn't pass temp fixture `--source`; non-zero exit may come from missing default `revid.db` path, not same-PK conflict.
- **Fix:** Create temp fixture SQLite, pass it via `--source`, prove non-zero exit comes from same-PK conflict. Verify target value unchanged.
- **File:** `backend/tests/test_migration_tool.py` AC10 test

### Defect 3: AC11 no mid-batch rollback proof
- **Root Cause:** Pre-set conflict uses `user-001` which matches fixture's first quotas row — failure happens on first row, no prior successful write to prove rollback.
- **Fix:** Pre-insert users table (FK pass), pre-insert quotas `q-000` with `user_id=user-002` (conflicts with second fixture row). Migrate: q-001 succeeds first, q-002 fails second, verify q-001 was also rolled back.
- **File:** `backend/tests/test_migration_tool.py` AC11 test

### Defect 4: Cleanup failure semantics unsound
- **Root Cause:** `_setup_test_db()` uses `except Exception: pass` for pre-cleanup. AC12's dropped-database check uses broad `except Exception` wrapping `self.fail()`.
- **Fix:** Replace broad catches with specific exceptions (`RuntimeError`, `ConnectionError`, `OSError`). AC12: verify DB actually dropped via `OperationalError`, inject fake cleanup to test exception propagation.
- **Files:** `backend/tests/test_migration_tool.py` (_setup_test_db, tearDownClass, AC12)

### Defect 5: Validation errors hidden / missing-source absent
- **Root Cause:** CLI re-reads source and silently passes on failure (`except Exception: pass`). No missing-source test. CLI calls `os.stat` before `isfile` check.
- **Fix:** Source read/validation exceptions must print error and return non-zero. Fix `isfile` before `os.stat` ordering. Add AC13 missing-source test that does NOT depend on MySQL secret.
- **Files:** `backend/scripts/migrate_sqlite_to_mysql.py` (CLI), `backend/tests/test_migration_tool.py` (AC13)

## Hard Gates

1. `REVID_TEST_MYSQL_ADMIN_URL` required; no fallback
2. CREATE/DROP only on exact name `revid_test_t4_002`
3. Test schema via Alembic `upgrade head` only
4. CLI default dry-run, `--execute` required for writes
5. No secret leakage
6. Migration idempotent; non-zero exit on validation failure
7. Destructive ops only with `--execute`
8. Database identity proven as `revid_test_t4_002`

## Allowed Files

- `backend/scripts/migrate_sqlite_to_mysql.py`
- `backend/tests/test_migration_tool.py`

## Test Plan

All 12 original ACs + AC13 (missing source) = 13 tests total.
Must run against real MySQL with `REVID_TEST_MYSQL_ADMIN_URL`.
