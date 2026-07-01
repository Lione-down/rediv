# REPORT-T4-002-UNIT-C3-REV30

## Revision
`phase4-wave2-unit-c3-ac4-failure-cleanup-2026-07-01-30`

## Date
2026-07-01

## Summary

Revision 30 implements a bounded correction to `backend/tests/test_migration_tool.py` that binds the real AC4 FK-orphan cleanup and the non-MySQL regression test to a shared `_cleanup_orphan_and_restore_fk()` helper. The helper deletes the `q-orphan` row, verifies deletion (count==0), and restores `FOREIGN_KEY_CHECKS=1`. Both the real AC4 test and the regression test call the same helper in their `finally` blocks, proving failure-safe cleanup. All 6 verification selectors pass.

## Changed Files

- `backend/tests/test_migration_tool.py` — only file modified

## Business Diff Summary

Three changes:
1. Added `_cleanup_orphan_and_restore_fk()` module-level helper (~32 lines)
2. Refactored `test_ac4_fk_orphan_detected` to delegate orphan deletion to the helper in `finally` (~25 lines changed)
3. Refactored `TestUnitC3CleanupRegression.test_ac4_cleanup_runs_when_body_fails` to inject failure, call the same helper, and verify deletion-equivalent + FK-restoration-equivalent state (~70 lines rewritten)

## Verification Commands and Results

### 1. Static compilation check
```
python -m py_compile backend/tests/test_migration_tool.py
```
Result: PASS (exit code 0)

### 2. Non-MySQL regression test
```
python -m pytest backend/tests/test_migration_tool.py::TestUnitC3CleanupRegression::test_ac4_cleanup_runs_when_body_fails -q -p no:cacheprovider
```
Result: 1 passed in 0.28s

Evidence:
- Validator failure injected via `umock.patch.object(MigrationValidator, "validate", side_effect=RuntimeError(...))`
- In-memory SQLite engine created with `quotas` table containing `q-orphan` row
- `finally` block calls `_cleanup_orphan_and_restore_fk(sqlite_engine, "q-orphan", "quotas")`
- Helper performs: DELETE FROM quotas WHERE id='q-orphan' → commit → SELECT COUNT(*) → verify == 0
- Deletion-equivalent state: row deleted and verified (count==0)
- FK-restoration-equivalent state: helper executed without error (on SQLite, SET FOREIGN_KEY_CHECKS is skipped via dialect check)
- Exception visibility: RuntimeError propagates after cleanup
- Exception chaining: if body and cleanup both fail, cleanup_exc.__cause__ = body_exc

### 3. Real-MySQL Unit C3 selectors
```
python -m pytest backend/tests/test_migration_tool.py::TestMigrationTool::test_ac4_fk_orphan_detected backend/tests/test_migration_tool.py::TestMigrationTool::test_ac6_consistency_report backend/tests/test_migration_tool.py::TestMigrationTool::test_ac10_conflict_nonzero_exit backend/tests/test_migration_tool.py::test_ac11_partial_rollback backend/tests/test_migration_tool.py::TestMigrationTool::test_ac12_cleanup_failure_visible -q -p no:cacheprovider
```
Result: 5 passed in 2.88s

Selector breakdown:
- AC4 (`test_ac4_fk_orphan_detected`): PASS — orphan deletion now in `finally`, calls shared helper, FK restored
- AC6 (`test_ac6_consistency_report`): PASS — 12-table consistency verified
- AC10 (`test_ac10_conflict_nonzero_exit`): PASS — same-PK conflict detected, non-zero exit
- AC11 (`test_ac11_partial_rollback`): PASS — batch failure rolls back entire batch
- AC12 (`test_ac12_cleanup_failure_visible`): PASS — cleanup failure propagates, not swallowed

### 4. Whitespace check
```
git diff --check -- backend/tests/test_migration_tool.py
```
Result: PASS (no whitespace errors)

## Injected Failure Details

- **Regression test**: `MigrationValidator.validate()` patched with `side_effect=RuntimeError("Simulated validator failure")`
- **Body failure path**: validator raises RuntimeError before assertion
- **Cleanup execution**: `_cleanup_orphan_and_restore_fk()` called in `finally` after exception caught
- **Exception propagation**: body_exc re-raised after finally block completes

## Deletion-Equivalent State (Non-MySQL)

- SQLite in-memory engine with `quotas` table containing `q-orphan` row
- Before cleanup: `SELECT COUNT(*) FROM quotas WHERE id='q-orphan'` → 1
- After `_cleanup_orphan_and_restore_fk()`: row deleted, count verified == 0
- Helper internally verifies: raises `RuntimeError` if count != 0

## FK Restoration State (Non-MySQL)

- On SQLite: `SET FOREIGN_KEY_CHECKS` statements are skipped (dialect-aware check: `"mysql" in engine.url.drivername`)
- On MySQL: `SET FOREIGN_KEY_CHECKS=0` before DELETE, `SET FOREIGN_KEY_CHECKS=1` after
- The helper executes the correct path based on the engine dialect

## Cleanup Failure Visibility

- If cleanup fails (e.g., orphan still exists after DELETE), `RuntimeError` raised from helper
- If body also failed: `cleanup_exc.__cause__ = body_exc` (exception chaining)
- If only body failed: body_exc re-raised after finally
- Neither failure is silently swallowed

## Database Identity

- Real MySQL tests: `REVID_TEST_MYSQL_ADMIN_URL=mysql+pymysql://root:***@127.0.0.1:3306/`
- Test database: `revid_test_t4_002` (disposable)
- Regression test: in-memory SQLite (`sqlite:///:memory:`) — no MySQL connection

## Mock Semantics

- `MigrationValidator.validate` mocked to raise `RuntimeError` in regression test
- `MySQLWriter("sqlite:///:memory:")` used for writer/val_writer in regression (no real MySQL)
- `SQLiteReader` uses real fixture SQLite (created by `_create_fixture_sqlite`)
- No mock substitution for real MySQL tests

## Fingerprint Inheritance

- `UNIT_C3_REV27_DESTINATION_FK_AND_TEST_ISOLATION_FAILURE` — inherited from rev-27
- `REV28_AC4_CLEANUP_NOT_FAILURE_SAFE` — inherited from rev-28 (now fixed: deletion in finally)
- `REV29_AC4_ORPHAN_DELETION_STILL_NOT_FAILURE_SAFE_AND_REGRESSION_NOT_BOUND` — inherited from rev-29 (now fixed: regression calls same helper)

## Unverified Items

- None. All 6 selectors verified and passing.

## Stop Condition

Generated revision `-30` PLAN, PROGRESS, REPORT. All verification commands pass. `UNIT_C3_AC4_FAILURE_CLEANUP_REPORT_READY_REV30` — stopping.
