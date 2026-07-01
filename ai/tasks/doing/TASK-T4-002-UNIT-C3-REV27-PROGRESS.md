# Task: T4-002 Unit C3 — PROGRESS (revision -27)

## Execution Identity

- Revision: `phase4-wave2-unit-c3-integrity-verification-2026-07-01-27`
- Unit: C3 (Disposable MySQL Conflict and Integrity Verification)
- Attempt: 1 continuation
- Executor: `revid-backend`
- Date: 2026-07-01

## Timeline

### 1. Preparation

- Read task spec: `ai/tasks/todo/TASK-T4-002-UNIT-C3-REV27.md`
- Read business files: `backend/scripts/migrate_sqlite_to_mysql.py` (976 lines), `backend/tests/test_migration_tool.py` (1516 lines)
- Verified `REVID_TEST_MYSQL_ADMIN_URL` is set in env
- Verified business files are unmodified (no prior ownership changes)

### 2. Static Verification

- Command: `python -m py_compile backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py`
- Result: PASS (exit 0, no syntax errors)

### 3. Runtime Execution

- Command: `python -m pytest <5 selectors> -q -p no:cacheprovider`
- Database: `revid_test_t4_002` (confirmed via `_setup_test_db` → Alembic upgrade head)
- MySQL: real connection (no mock substitution)

### 4. Post-Run Verification

- Command: `git diff --check -- backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py`
- Result: empty diff (no business file modifications)

## Selector Results Summary

| Selector | Result | Notes |
|----------|--------|-------|
| `test_ac4_fk_orphan_detected` | FAIL | Validator returns row-count mismatch, not FK-orphan message |
| `test_ac6_consistency_report` | FAIL | Cascading from AC4 (orphan row persists) |
| `test_ac10_conflict_nonzero_exit` | FAIL | Duplicate entry for `user-001` — DB state from prior run |
| `test_ac11_partial_rollback` | PASS | UNIQUE violation → batch rollback confirmed |
| `test_ac12_cleanup_failure_visible` | FAIL | `ModuleNotFoundError` on `patch("test_migration_tool.cleanup_test_database", ...)` |

## Observations

- AC4/AC6: The `MigrationValidator.validate()` does check FK orphans at line 622-639, but the test expects error messages containing both `"quotas"` AND `"nonexistent-user"`. The actual errors are `"quotas: row count mismatch"` and `"quotas: 1 extra rows in MySQL (first: ['q-orphan'])"` — these come from the row-count/PK-set checks (lines 549-568) which run BEFORE the FK orphan check (lines 622-639). Since the row-count check already flagged the orphan, the FK-orphan error is never reached (or is overshadowed by the count errors).
- AC10: The AC4 test inserts an orphan into `quotas` and cleans it up, but the AC10 test tries to INSERT `user-001` which already exists from the class-level `setUpClass` fixture data. The test assumes a clean state.
- AC11: Passed cleanly — proves batch rollback works.
- AC12: The `patch("test_migration_tool.cleanup_test_database", ...)` target is wrong because pytest runs from `backend/tests/` directory, making the module `tests.test_migration_tool`, not `test_migration_tool`.
