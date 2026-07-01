# REPORT — T4-002 Unit C3 Revision 29 AC4 Cleanup Correction

## Revision
`phase4-wave2-unit-c3-ac4-cleanup-correction-2026-07-01-29`

## Task
`t_77c46dc4` — T4-002: Executor - Unit C3 revision 29 AC4 cleanup correction

## Commands Executed and Results

### 1. py_compile
```bash
python -m py_compile backend/tests/test_migration_tool.py
```
**Result:** PASS (exit code 0, no output)

### 2. Non-MySQL Targeted Regression
```bash
python -m pytest backend/tests/test_migration_tool.py::TestUnitC3CleanupRegression::test_ac4_cleanup_runs_when_body_fails -q -p no:cacheprovider
```
**Result:** 1 passed (0.27s)

**Failure-path evidence:** The test creates `SQLiteReader` + two `MySQLWriter` instances (using `sqlite:///:memory:`), wraps their `.close()` methods with tracked callables, mocks `MigrationValidator.validate()` to raise `RuntimeError("Simulated validator failure")`, and asserts that `reader.close`, `writer.close`, and `val_writer.close` all appear in the `cleanup_invoked` list. The `try/except/finally` pattern proves cleanup runs in `finally` before the exception propagates. No MySQL connection, no secrets, no destructive operations.

### 3. Real-MySQL Unit C3 Selectors
```bash
python -m pytest \
  backend/tests/test_migration_tool.py::TestMigrationTool::test_ac4_fk_orphan_detected \
  backend/tests/test_migration_tool.py::TestMigrationTool::test_ac6_consistency_report \
  backend/tests/test_migration_tool.py::TestMigrationTool::test_ac10_conflict_nonzero_exit \
  backend/tests/test_migration_tool.py::TestMigrationTool::test_ac11_partial_rollback \
  backend/tests/test_migration_tool.py::TestMigrationTool::test_ac12_cleanup_failure_visible \
  -q -p no:cacheprovider
```
**Result:** 5 passed (8.37s), 0 failed, 0 skipped, 0 errors

### 4. Whitespace Check
```bash
git diff --check -- backend/tests/test_migration_tool.py
```
**Result:** PASS (no whitespace errors)

## Summary of Changes

### File Modified
- `backend/tests/test_migration_tool.py`

### Change 1: `test_ac4_fk_orphan_detected` — Outer `try/finally` restructure
- **Before:** Two separate `try/finally` blocks — one for orphan insert (disposes engine in finally), one for orphan cleanup (sets `orphan_cleaned_up = True` in finally). Migration, validation, and assertion ran between the two blocks with no protection.
- **After:** Single outer `try/finally` covering all 5 phases: (1) disable FK checks + insert orphan, (2) migrate, (3) validate, (4) assert, (5) delete orphan + verify. Resources (`reader`, `writer`, `val_writer`) tracked as module-local vars initialized to `None`, set to `None` after close. Finally block safely closes each tracked resource (individually try/except'd) then disposes engine.
- **Deleted:** `orphan_cleaned_up` variable — was dead state (set to `True` in finally but never asserted).

### Change 2: New `TestUnitC3CleanupRegression` class
- **Test:** `test_ac4_cleanup_runs_when_body_fails`
- **Approach:** Non-MySQL regression. Creates real `SQLiteReader` + `MySQLWriter` objects, replaces `.close()` with tracked callables, mocks `MigrationValidator.validate()` to raise `RuntimeError`. Simulates the AC4 outer `try/except/finally` pattern. Asserts exception propagates AND all tracked `.close()` callables were invoked.
- **Proof:** Demonstrates that in the try/finally pattern, cleanup runs in `finally` even when the body raises an exception.

## Acceptance Criteria Verification

| AC | Status | Evidence |
|----|--------|----------|
| non-MySQL targeted regression proves cleanup on failure | PASS | `TestUnitC3CleanupRegression::test_ac4_cleanup_runs_when_body_fails` — 1 passed, tracks close invocations through mocked failure |
| AC4 outer `try/finally` covers all phases | PASS | Source code: single `try/finally` wraps orphan insert → migration → validation → assertion → cleanup → resource disposal |
| Five real-MySQL selectors 5 passed | PASS | 5 passed, 0 failed, 0 skipped, 0 errors (8.37s) |
| AC4 proves target-only orphan captured | PASS | `test_ac4_fk_orphan_detected` passes — validates `quotas`/`nonexistent-user` in error message, cleans up `q-orphan` |
| AC6, AC10, AC11, AC12 semantics not regressed | PASS | All four selectors pass |
| Only allowed files modified | PASS | Diff only touches `backend/tests/test_migration_tool.py` |
| No secret leakage / unauthorized DB access | PASS | No `.env` read, no `revid_db` touched, only `revid_test_t4_002` in real-MySQL tests |
| PLAN/PROGRESS/REPORT revision-29 consistent | PASS | All three documents reference revision `-29`, distinguish non-MySQL regression from real-MySQL integration evidence |

## Business Diff
- `backend/tests/test_migration_tool.py`: AC4 restructure (outer try/finally) + new `TestUnitC3CleanupRegression` class (~90 lines added/modified)
- `backend/scripts/migrate_sqlite_to_mysql.py`: **NO CHANGES** (read-only)
- No other files modified

## Unverified Items
- None. All required verification commands executed and passed.

## Fingerprint Inheritance
- `UNIT_C3_REV27_DESTINATION_FK_AND_TEST_ISOLATION_FAILURE` (inherited from rev -27)
- `REV28_AC4_CLEANUP_NOT_FAILURE_SAFE` (inherited from rev -28, resolved by this revision)

## Stop Condition
`UNIT_C3_AC4_CLEANUP_REPORT_READY_REV29` — REPORT complete. Ready for PMC review and potential Independent REVIEW/HANDOFF lifecycle.
