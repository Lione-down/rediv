# PROGRESS - T4-002 Unit C3 Revision 43

## Revision

`phase4-wave2-unit-c3-shared-cleanup-lifecycle-correction-2026-07-07-43`

## Current Status

`CODE IMPLEMENTED / REAL MYSQL VERIFICATION BLOCKED BY MISSING RUNTIME ENV`

Human Owner requested fastest safe progress. Direct intervention repaired the bounded rev43 Allowed File instead of waiting for Hermes runtime recovery. No `.env`, secret, `revid_db`, Kanban card, Hermes status, migration file, frontend file, database schema, Independent REVIEW, or HANDOFF was modified.

## Files Modified

- `backend/tests/test_migration_tool.py`
- `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV43-PLAN.md`
- `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV43-PROGRESS.md`
- `ai/reports/REPORT-T4-002-UNIT-C3-REV43.md`

## Implementation Completed

- `_run_cleanup_lifecycle()` now builds valid `ExceptionGroup` values from exception instances, not tuples.
- Labelled cleanup exceptions preserve original causes for `fk_disable`, `delete`, `verify`, and `fk_restore`.
- `test_cleanup_lifecycle_restores_fk_when_delete_fails` now calls the shared lifecycle and proves `fk_restore` is attempted after DELETE failure.
- `test_cleanup_lifecycle_preserves_primary_close_and_restore_failures` keeps the Task-required selector name and uses actual cleanup lifecycle execution plus one combined wrapper to expose primary, resource close, and FK restore failures.
- Real AC4 asserts ordered MySQL cleanup recorder events.
- Resource close failures are collected and surfaced instead of silently swallowed.
- The non-MySQL AC4 cleanup regression also collects resource close failures instead of swallowing them.

## Verification Run

```powershell
backend\.venv\Scripts\python.exe -m py_compile backend\tests\test_migration_tool.py
```

Result: `PASS`.

```powershell
backend\.venv\Scripts\python.exe -m pytest backend\tests\test_migration_tool.py::TestUnitC3CleanupRegression::test_ac4_cleanup_runs_when_body_fails backend\tests\test_migration_tool.py::TestUnitC3CleanupRegression::test_cleanup_lifecycle_restores_fk_when_delete_fails backend\tests\test_migration_tool.py::TestUnitC3CleanupRegression::test_cleanup_lifecycle_preserves_primary_close_and_restore_failures -q -p no:cacheprovider
```

Result: `3 passed in 0.27s`.

```powershell
backend\.venv\Scripts\python.exe -m pytest backend\tests\test_migration_tool.py::TestMigrationTool::test_ac4_fk_orphan_detected backend\tests\test_migration_tool.py::TestMigrationTool::test_ac6_consistency_report backend\tests\test_migration_tool.py::TestMigrationTool::test_ac10_conflict_nonzero_exit backend\tests\test_migration_tool.py::TestMigrationTool::test_ac11_partial_rollback backend\tests\test_migration_tool.py::TestMigrationTool::test_ac12_cleanup_failure_visible -q -p no:cacheprovider
```

Result: `5 errors`, all at setup because `REVID_TEST_MYSQL_ADMIN_URL` is not set in the current process. This is the Task-defined hard block, not a skip and not a code regression.

```powershell
git diff --check -- backend/tests/test_migration_tool.py
```

Result: `PASS` with LF/CRLF warning only.

## Remaining Blocker

To complete rev43 acceptance, rerun the five real-MySQL selectors in a process where `REVID_TEST_MYSQL_ADMIN_URL` is set to the authorized disposable test admin URL. Do not read `.env`, print the URL, touch `revid_db`, or substitute mocks for the real-MySQL selectors.
