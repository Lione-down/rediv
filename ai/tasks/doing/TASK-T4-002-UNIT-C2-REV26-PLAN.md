# T4-002 Rev 26 — PLAN: stale_same row exclusion from INSERT set

## Objective
Fix `migrate_table()` so that rows classified as `stale_same` (existing PK with identical values) are excluded from the INSERT execution set, preventing Duplicate entry errors on re-run.

## Root Cause
The conflict-detection loop correctly classifies rows into `inserted` (new PK), `stale_same` (existing PK, same values), and `stale_diff` (existing PK, different values). However, the INSERT execution loop iterates over ALL `rows`, including `stale_same` rows. On the second migration run, all rows are `stale_same`, but the code still tries to INSERT them, triggering MySQL Duplicate entry errors.

## Implementation

### Change 1: `migrate_sqlite_to_mysql.py` — `migrate_table()` method

In the classification loop (lines 400-420), track which rows are truly new vs stale_same:
- Build an `insert_rows` list containing only rows whose PK is NOT in `existing_map`
- Replace the INSERT execution loop `for row in rows:` with `for row in insert_rows:`
- Update the report's `inserted` count to reflect actual rows attempted (already correct since `inserted` is counted during classification)
- Handle edge case: if `insert_rows` is empty (all rows are stale_same), skip INSERT entirely and report 0 inserted

### Change 2: Tests — verify stale_same exclusion

Add a new test `test_unit_b_ac10_stale_same_no_insert`:
- Mock existing_map with one stale_same row
- Source has one stale_same row (no new rows)
- Verify: stale_same=1, inserted=0, no INSERT executed

### Change 3: Tests — verify mixed new + stale_same

The existing `test_unit_b_ac10_mixed_rows` tests stale_diff abort. We need a test for new + stale_same mix:
- Mock existing_map with one stale_same row
- Source has: one stale_same + one new row
- Verify: stale_same=1, inserted=1, only the new row is INSERTed

## Verification Steps
1. `py_compile` both files
2. Run unit tests: `test_unit_b_ac10_stale_same_ok`, `test_unit_b_ac10_mixed_rows`
3. Run integration tests: AC1, AC2, AC3, AC5
4. `git diff --check`

## Files Modified
- `backend/scripts/migrate_sqlite_to_mysql.py` (implementation)
- `backend/tests/test_migration_tool.py` (tests)
