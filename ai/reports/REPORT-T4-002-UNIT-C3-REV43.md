# REPORT - T4-002 Unit C3 Revision 43

## Revision

`phase4-wave2-unit-c3-shared-cleanup-lifecycle-correction-2026-07-07-43`

## Verdict

`IMPLEMENTED / BLOCKED ON REAL MYSQL ENVIRONMENT`

## Summary

Direct fast-path implementation completed the bounded rev43 code changes in `backend/tests/test_migration_tool.py`. The non-MySQL regression surface now passes and the rev42 `ExceptionGroup` tuple failure is eliminated. Full acceptance is still blocked because the current process lacks `REVID_TEST_MYSQL_ADMIN_URL`, and the Task explicitly treats that as a hard block.

## Changes

- Fixed `_run_cleanup_lifecycle()` grouped failure construction so `ExceptionGroup` receives exception instances instead of tuples.
- Preserved original exception causes in labelled cleanup failures.
- Added one cleanup-bound wrapper to expose primary body, resource close, and cleanup lifecycle failures in a valid exception structure.
- Reworked `test_cleanup_lifecycle_restores_fk_when_delete_fails` to call the shared lifecycle and prove FK restore is attempted after DELETE failure.
- Reworked `test_cleanup_lifecycle_preserves_primary_close_and_restore_failures` to keep the required selector name and verify primary, close, and FK restore failures through actual cleanup lifecycle execution.
- Updated real AC4 so ordered MySQL cleanup recorder events are asserted.
- Replaced silent resource-close swallowing with visible close failure collection.
- Applied visible close failure collection to the non-MySQL AC4 cleanup regression as well.

## Verification Results

| Command | Result |
|---|---|
| `backend\.venv\Scripts\python.exe -m py_compile backend\tests\test_migration_tool.py` | `PASS` |
| `backend\.venv\Scripts\python.exe -m pytest backend\tests\test_migration_tool.py::TestUnitC3CleanupRegression::test_ac4_cleanup_runs_when_body_fails backend\tests\test_migration_tool.py::TestUnitC3CleanupRegression::test_cleanup_lifecycle_restores_fk_when_delete_fails backend\tests\test_migration_tool.py::TestUnitC3CleanupRegression::test_cleanup_lifecycle_preserves_primary_close_and_restore_failures -q -p no:cacheprovider` | `3 passed in 0.27s` |
| in-memory injected delete+verify probe for `_run_cleanup_lifecycle()` | `ExceptionGroup Cleanup failures`, members `Cleanup delete failed`, `Cleanup verify failed`; no tuple `ValueError` |
| five real-MySQL selectors required by Task | `BLOCKED`: `REVID_TEST_MYSQL_ADMIN_URL not set` at setup for all five selectors |
| `git diff --check -- backend/tests/test_migration_tool.py` | `PASS` with LF/CRLF warning only |

## Real MySQL Blocker

The exact real-MySQL command was attempted:

```powershell
backend\.venv\Scripts\python.exe -m pytest backend\tests\test_migration_tool.py::TestMigrationTool::test_ac4_fk_orphan_detected backend\tests\test_migration_tool.py::TestMigrationTool::test_ac6_consistency_report backend\tests\test_migration_tool.py::TestMigrationTool::test_ac10_conflict_nonzero_exit backend\tests\test_migration_tool.py::TestMigrationTool::test_ac11_partial_rollback backend\tests\test_migration_tool.py::TestMigrationTool::test_ac12_cleanup_failure_visible -q -p no:cacheprovider
```

It failed closed before any database work because `REVID_TEST_MYSQL_ADMIN_URL` is not set in the current process. No `.env` fallback was read, no secret was printed, and no production database was touched.

## Acceptance Coverage

| Acceptance Item | Status |
|---|---|
| Delete-failure regression calls shared lifecycle | `PASS` |
| FK restore attempted after DELETE failure | `PASS` in fake MySQL lifecycle branch |
| Multi-failure path uses valid exception structure | `PASS` |
| Original failure causes remain inspectable | `PASS` |
| Rev42 tuple `ExceptionGroup` `ValueError` eliminated | `PASS` |
| Real AC4 ordered MySQL events asserted | `IMPLEMENTED`, pending real MySQL verification |
| Five real-MySQL selectors pass in one ordered run | `BLOCKED`, missing runtime env |
| No secret leakage / no `.env` fallback | `PASS` |

## Unverified Items

- Real MySQL selector pass count remains unverified until `REVID_TEST_MYSQL_ADMIN_URL` is provided in the process environment.

## Next Action

Run the five required real-MySQL selectors in an authorized environment with `REVID_TEST_MYSQL_ADMIN_URL` set. If they pass, rev43 can move to PMC queue decision for Independent Review continuation.
