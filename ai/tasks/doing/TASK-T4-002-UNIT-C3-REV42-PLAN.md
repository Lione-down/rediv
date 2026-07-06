# PLAN — T4-002 Unit C3 Revision 42: Failure-Safe Cleanup Lifecycle Remediation

## Goal

Fix revision -30's three Hard Gate gaps by unifying the failure-safe cleanup lifecycle across real AC4 and non-MySQL regressions, ensuring FK restoration is attempted on all failure paths, and preserving primary/close/delete/verification/restore failures via structured exception grouping.

## Scope

- **Only file modified**: `backend/tests/test_migration_tool.py`
- **Not modified**: `migrate_sqlite_to_mysql.py`, schema, models, API, frontend, Hermes runtime

## Design

### 1. Unified Cleanup Lifecycle (new module-level helper)

Create `_run_cleanup_lifecycle(engine, orphan_id, table, is_mysql, recorder=None)` that:

- Records ordered events in `recorder` list (if provided): `fk_disable`, `delete`, `verify`, `fk_restore`
- Disables FK checks (MySQL only) → records `fk_disable`
- Deletes orphan row → records `delete`
- Verifies deletion (COUNT==0) → records `verify`
- Restores FK checks (MySQL only) → records `fk_restore`
- All steps in a single try/finally ensuring FK restore is attempted even on delete/verify failure
- Returns ordered event list

### 2. Updated `_cleanup_orphan_and_restore_fk` helper

Refactor to delegate to the unified lifecycle. On non-MySQL (SQLite), skip FK disable/restore but still record events. The helper maintains backward compatibility.

### 3. Updated `test_ac4_cleanup_runs_when_body_fails`

- Use a `recorder` list to observe ordered events: `fk_disable -> delete -> verify -> fk_restore`
- Assert the recorder contains exactly these 4 events in order
- Prove delete/verify failure still triggers restore attempt
- Remove the dead `sqlite_engine2` code (disposed :memory: can't reconnect)

### 4. New Test: `test_cleanup_lifecycle_restores_fk_when_delete_fails`

- Simulate a scenario where the DELETE operation fails
- Verify that FK restore is still attempted (event recorded)
- Use `ExceptionGroup` or chained exceptions to preserve both delete failure and restore outcome

### 5. New Test: `test_cleanup_lifecycle_preserves_primary_close_and_restore_failures`

- Simulate simultaneous failures in primary body, resource close, and FK restore
- Verify all three failures are visible in the same exception structure
- Use `ExceptionGroup` with explicit chaining

## Implementation Steps

1. Add `_run_cleanup_lifecycle()` module-level function with recorder support
2. Refactor `_cleanup_orphan_and_restore_fk()` to use the unified lifecycle
3. Rewrite `test_ac4_cleanup_runs_when_body_fails` with ordered event assertions
4. Add `test_cleanup_lifecycle_restores_fk_when_delete_fails`
5. Add `test_cleanup_lifecycle_preserves_primary_close_and_restore_failures`
6. Run all verification commands

## Verification Plan

1. `python -m py_compile backend/tests/test_migration_tool.py` — syntax check
2. Run 3 non-MySQL regression selectors (TestUnitC3CleanupRegression)
3. Run 5 real-MySQL selectors (AC4, AC6, AC10, AC11, AC12)
4. `git diff --check -- backend/tests/test_migration_tool.py` — no trailing whitespace

## Hard Gates

- No MySQL connection needed for non-MySQL regressions
- FK state operations observed via recorder, not dialect skip
- ExceptionGroup or equivalent for chained failures — no bare `except: pass`
- Only Allowed Files modified
- No secret leakage, no unauthorized DB access
