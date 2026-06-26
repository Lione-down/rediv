# T4-002 Progress — Final Rework Attempt 1 (Revision -08)

**Task ID:** T4-002
**Queue Revision:** `phase4-wave2-final-rework-2026-06-25-08`
**Executor Attempt:** 1 (FINAL)
**Failure Fingerprint:** `T4-002-SEMANTICS: IDEMPOTENCY_COMPARISON + FALSE_POSITIVE_CONFLICT + NON_MID_BATCH_ROLLBACK + SWALLOWED_CLEANUP + MISSING_SOURCE_COVERAGE`

## Attempt History

- Attempt 0 (revision -07): Infrastructure/runtime terminated; partial implementation had 5 semantic defects confirmed by fresh PMC audit.

## Checkpoint A: Static Semantic Fixes — DONE

### Defect 1: Idempotency comparison — FIXED
- File: `backend/scripts/migrate_sqlite_to_mysql.py` lines ~403-410
- Changed: Destination dict now excludes PK column, matching source exclusion. Both sides use identical column sets minus PK.
- Preserved: Existing `sort_keys=True` from revision -07 diff.

### Defect 4: Broad exception swallowing — FIXED
- File: `backend/tests/test_migration_tool.py`
- `_setup_test_db()`: Replaced `except Exception: pass` with specific `except RuntimeError` and `except ConnectionError`.
- `tearDownClass`: Replaced `except Exception` with `except (RuntimeError, ConnectionError)` and `except OSError`.
- AC11 cleanup: Replaced `except Exception` with specific catches.

### Defect 5: Validation errors hidden — FIXED
- File: `backend/scripts/migrate_sqlite_to_mysql.py` lines ~830-841
- Changed: `except Exception: pass` → `except Exception as e: print(...); validation_errors.append(...)`
- Source re-read failure now produces visible error and is included in validation_errors → non-zero exit.

### Defect 5: os.stat before isfile — FIXED
- File: `backend/scripts/migrate_sqlite_to_mysql.py` lines ~754-766
- Changed: `isfile` check now precedes `os.stat`. `os.stat` wrapped in `try/except OSError`.

## Checkpoint B: Test Semantics Fixes — DONE

### Defect 2: AC10 false-positive — FIXED
- File: `backend/tests/test_migration_tool.py` AC10 test
- Changed: Now creates temp fixture via `_create_fixture_sqlite()`, passes explicit `--source` to CLI.
- Proves non-zero exit comes from same-PK conflict, not missing default revid.db.

### Defect 3: AC11 mid-batch rollback — FIXED
- File: `backend/tests/test_migration_tool.py` AC11 test
- Changed: Pre-inserts users table (FK pass), pre-inserts quotas `q-000` with `user_id=user-002`.
- Migration: q-001 inserts first (success), q-002 fails on UNIQUE(user_id).
- Verifies: q-001 count = 0 (proves rollback of prior success).

### Defect 4+5: AC12 cleanup failure — FIXED
- File: `backend/tests/test_migration_tool.py` AC12 test
- Part 1: Normal cleanup succeeds, verifies DB actually gone via `OperationalError`.
- Part 2: Injects fake cleanup via `unittest.mock.patch`, asserts `RuntimeError` propagates.
- No broad `except Exception` swallowing `self.fail()`.

## Checkpoint C: Missing-Source Coverage — DONE

### AC13: Missing source test — ADDED
- File: `backend/tests/test_migration_tool.py`
- New test: `test_ac13_missing_source_nonzero_exit()`
- Does NOT depend on MySQL secret or class-level MySQL setup.
- Calls CLI with nonexistent `--source`, asserts non-zero exit.

## Total Tests

- Original 12 ACs (AC1-AC6, AC7-AC12)
- New AC13 (missing source)
- Total: 13 test methods

## Pending

- Run all 13 tests against real MySQL
- Generate REPORT
