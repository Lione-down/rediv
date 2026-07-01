# PROGRESS — T4-002 Unit C3 Revision 29

## Revision
`phase4-wave2-unit-c3-ac4-cleanup-correction-2026-07-01-29`

## Timeline

### Step 1: Orient
- [x] Read task card `t_77c46dc4` body and worker_context
- [x] Read task specification `ai/tasks/todo/TASK-T4-002-UNIT-C3-REV29.md`
- [x] Read `ai/state/CURRENT.md` — revision -28 `PMC_BLOCKED` due to AC4 cleanup not in outer try/finally
- [x] Read current `test_ac4_fk_orphan_detected` implementation (lines 598-660)
- [x] Identified two separate try/finally blocks: first for orphan insert (lines 611-621), second for cleanup (lines 646-660)
- [x] Confirmed `orphan_cleaned_up` variable is dead state (constraint #5)

### Step 2: Implement AC4 restructure
- [x] Rewrote `test_ac4_fk_orphan_detected` with single outer `try/finally`
- [x] All 5 phases (insert orphan, migrate, validate, assert, cleanup orphan) in one try body
- [x] Resource tracking: `reader`, `writer`, `val_writer` init to None, set to None after close
- [x] Finally block: safely close each tracked resource, then dispose engine
- [x] Deleted `orphan_cleaned_up` variable

### Step 3: Add non-MySQL regression test
- [x] Created `TestUnitC3CleanupRegression` class
- [x] `test_ac4_cleanup_runs_when_body_fails` — mocks `MigrationValidator.validate()` to raise RuntimeError
- [x] Tracks `close()` invocations via wrapped methods
- [x] Asserts exception propagates AND all close methods were called
- [x] No MySQL connection, no secrets, no destructive operations

### Step 4: Write PLAN
- [x] Created `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV29-PLAN.md`

## Step 5: Verification
- [x] `py_compile` check — PASS (exit code 0)
- [x] Non-MySQL regression test — PASS (1 passed, 0.27s)
- [x] Real-MySQL selectors (5 tests) — PASS (5 passed, 8.37s)
- [x] `git diff --check` — PASS (no whitespace errors)
- [x] Write REPORT — DONE

## Files Modified
- `backend/tests/test_migration_tool.py` — AC4 restructure + new regression class

## Decisions
- Used `unittest.mock.patch.object(MigrationValidator, "validate", side_effect=...)` for the regression test
- Wrapped `.close()` methods with tracked versions instead of creating a separate cleanup helper (minimal, single-purpose)
- All resource close calls in finally are individually try/except'd to prevent one failure from masking another
