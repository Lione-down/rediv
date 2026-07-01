# TASK-T4-002-UNIT-C3-REV30-PROGRESS

## Revision
`phase4-wave2-unit-c3-ac4-failure-cleanup-2026-07-01-30`

## Status
COMPLETE — All verifications passed. REPORT_READY_REV30.

## Timeline

| Time (UTC) | Event |
|---|---|
| 2026-07-01 ~16:30 | Oriented on task, read TASK, CURRENT.md, source |
| 2026-07-01 ~16:35 | PLAN written |
| 2026-07-01 ~16:36 | Added `_cleanup_orphan_and_restore_fk()` helper |
| 2026-07-01 ~16:37 | Refactored AC4: moved orphan deletion into `finally`, calls shared helper |
| 2026-07-01 ~16:38 | Refactored regression: injects validator failure, calls same helper on SQLite, verifies deletion-equivalent state |
| 2026-07-01 ~16:39 | Fixed: `SET FOREIGN_KEY_CHECKS` fails on SQLite — made helper dialect-aware |
| 2026-07-01 ~16:40 | py_compile: PASS |
| 2026-07-01 ~16:40 | Regression test: 1 passed |
| 2026-07-01 ~16:41 | git diff --check: PASS (no whitespace errors) |
| 2026-07-01 ~16:42 | Real-MySQL selectors (AC4/AC6/AC10/AC11/AC12): 5 passed in 2.88s |
| 2026-07-01 ~16:43 | REPORT written |

## Selector names (final, confirmed)

1. `TestUnitC3CleanupRegression::test_ac4_cleanup_runs_when_body_fails` — non-MySQL regression
2. `TestMigrationTool::test_ac4_fk_orphan_detected` — real MySQL AC4
3. `TestMigrationTool::test_ac6_consistency_report` — real MySQL AC6
4. `TestMigrationTool::test_ac10_conflict_nonzero_exit` — real MySQL AC10
5. `TestMigrationTool::test_ac11_partial_rollback` — real MySQL AC11
6. `TestMigrationTool::test_ac12_cleanup_failure_visible` — real MySQL AC12

## Implementation Summary

### Changes to `backend/tests/test_migration_tool.py`

1. **Added `_cleanup_orphan_and_restore_fk()` helper** (line ~393-424):
   - Module-level private function
   - Dialect-aware: skips `SET FOREIGN_KEY_CHECKS` on SQLite, executes on MySQL
   - Performs: DELETE orphan → commit → verify count==0 → raise on failure
   - Called by both AC4 and regression

2. **Refactored `test_ac4_fk_orphan_detected`**:
   - Removed Phase 5 (inline deletion) from main `try` body
   - Uses `body_exc` variable to capture exceptions from phases 1-4
   - `finally` block: close resources → call `_cleanup_orphan_and_restore_fk` → dispose engine
   - Cleanup failure chains to body failure via `__cause__`
   - Body exception re-raised after `finally`

3. **Refactored `TestUnitC3CleanupRegression.test_ac4_cleanup_runs_when_body_fails`**:
   - Creates in-memory SQLite with `quotas` table and `q-orphan` row
   - Injects validator failure via `umock.patch.object(MigrationValidator, "validate", side_effect=RuntimeError(...))`
   - `finally` block: close resources → call `_cleanup_orphan_and_restore_fk(sqlite_engine)` → dispose
   - Verifies: exception propagated, deletion-equivalent (row deleted), FK-restoration-equivalent (helper executed without error)
   - Does NOT connect to MySQL

## Verification Results

| Command | Result |
|---|---|
| `python -m py_compile backend/tests/test_migration_tool.py` | PASS (exit 0) |
| `pytest ...::TestUnitC3CleanupRegression::test_ac4_cleanup_runs_when_body_fails -q` | 1 passed (0.28s) |
| `pytest ...::test_ac4_fk_orphan_detected ...::test_ac12_cleanup_failure_visible -q` | 5 passed (2.88s) |
| `git diff --check -- backend/tests/test_migration_tool.py` | PASS (no whitespace errors) |

## Allowed Files Modified

- `backend/tests/test_migration_tool.py` — only file modified

## Unverified Items

- None. All 6 selectors passed.
