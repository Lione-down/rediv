# PLAN — T4-002 Unit C3 Revision 29 AC4 Cleanup Correction

## Revision
`phase4-wave2-unit-c3-ac4-cleanup-correction-2026-07-01-29`

## Objective
Fix AC4 orphan test's failure-safe cleanup so that orphan insert, migration, validation, assertion, resource disposal, and orphan deletion are all covered by a single outer `try/finally`. Add a non-MySQL targeted regression test that proves cleanup runs when the body fails.

## Scope
- Modify only `backend/tests/test_migration_tool.py`
- No changes to business code (`migrate_sqlite_to_mysql.py` or any other file)
- No MySQL connection required for the regression test

## Changes

### 1. Restructure `test_ac4_fk_orphan_detected` (lines ~598-660)
- Merge the two separate `try/finally` blocks into one outer `try/finally`
- Move orphan insert, migration, validation, assertion, and cleanup into the same `try` body
- Track `reader`, `writer`, `val_writer` as module-scoped locals initialized to `None`
- In `finally`: close each tracked resource (with try/except around each close to prevent swallowing), then `engine.dispose()`
- Delete the `orphan_cleaned_up` variable (dead state per AC constraint #5)
- Restore `FOREIGN_KEY_CHECKS=1` as before

### 2. Add `TestUnitC3CleanupRegression` class
- New test: `test_ac4_cleanup_runs_when_body_fails`
- Non-MySQL: uses `SQLiteReader` + `MySQLWriter("sqlite:///:memory:")` + mocked `MigrationValidator.validate()`
- Wraps `close()` methods with tracked versions that append labels to a list
- Mocks `validate()` to raise `RuntimeError("Simulated validator failure")`
- Asserts the exception propagates
- Asserts `reader.close`, `writer.close`, and `val_writer.close` all appear in `cleanup_invoked`
- Proves cleanup runs before exception propagation (satisfies AC constraint #4)

### 3. Selector for real-MySQL verification
Final exact selectors to run after implementation:
- `TestMigrationTool.test_ac4_fk_orphan_detected`
- `TestMigrationTool.test_ac6_consistency_report`
- `TestMigrationTool.test_ac10_conflict_nonzero_exit`
- `TestMigrationTool.test_ac11_partial_rollback`
- `TestMigrationTool.test_ac12_cleanup_failure_visible`
- `TestUnitC3CleanupRegression.test_ac4_cleanup_runs_when_body_fails` (non-MySQL)

## Verification Commands
```bash
python -m py_compile backend/tests/test_migration_tool.py
python -m pytest backend/tests/test_migration_tool.py::TestUnitC3CleanupRegression::test_ac4_cleanup_runs_when_body_fails -q -p no:cacheprovider
python -m pytest backend/tests/test_migration_tool.py::TestMigrationTool::test_ac4_fk_orphan_detected backend/tests/test_migration_tool.py::TestMigrationTool::test_ac6_consistency_report backend/tests/test_migration_tool.py::TestMigrationTool::test_ac10_conflict_nonzero_exit backend/tests/test_migration_tool.py::TestMigrationTool::test_ac11_partial_rollback backend/tests/test_migration_tool.py::TestMigrationTool::test_ac12_cleanup_failure_visible -q -p no:cacheprovider
git diff --check -- backend/tests/test_migration_tool.py
```

## Risk Assessment
- Low risk: only test file modified; business code untouched
- The outer try/finally restructure is deterministic — all phases run sequentially within one try body
- Non-MySQL regression test uses in-memory SQLite and mocking; no secret/database access
- Existing test isolation should not be affected since cleanup now runs even on failure

## Hard Gates Check
- [x] No MySQL credentials read or written
- [x] No `.env` access
- [x] No database CREATE/DROP in regression test
- [x] Only allowed files modified
- [x] No revision -27/-28 cards reused or unblocked
