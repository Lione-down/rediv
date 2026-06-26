# TASK-T4-002-UNIT-B-PLAN

## Queue Revision
`phase4-wave2-unit-b-unit-tests-2026-06-26-14`

## Task ID
T4-002

## Unit
B — Same-PK Conflict (AC10) + Partial Rollback (AC11) Unit-Test Semantics

## Objective
Implement Unit B: mock-based unit tests for AC10 (same-PK conflict detection and non-zero exit) and AC11 (partial rollback on mid-batch failure) for the SQLite to MySQL migration tool.

## Scope
- **Modify ONLY**: `backend/scripts/migrate_sqlite_to_mysql.py` and `backend/tests/test_migration_tool.py`
- Focus on AC10 (same-PK conflict detection) and AC11 (partial rollback semantics)
- Unit B tests MUST work WITHOUT real MySQL connection — pure logic via mocking
- NO MySQL connection, NO secret reading, NO .env access
- NO CREATE/DROP/TRUNCATE/DELETE/migration write
- NO Unit C work

## Inherited Changes from Unit A Correction (rev -13)
1. `migrate_sqlite_to_mysql.py`: source validation before secret gate, cleanup re-raise, validation order fix
2. `test_migration_tool.py`: AC12 cleanup patch target corrected, AC13 missing source test, various test improvements

These must be preserved.

## Acceptance Criteria

### AC10: Same-PK Conflict Detection
- **AC10a**: Same-PK different-value → stale_diff > 0, error recorded, no INSERT
- **AC10b**: Same-PK same-value → stale_same > 0, stale_diff == 0, no error
- **AC10c**: PK excluded from comparison (symmetric exclusion verified)
- **AC10d**: Mixed scenario — stale_same + stale_diff → entire table aborts
- **AC10e**: CLI returns non-zero exit code on conflict
- **AC10f**: Conflicting data NOT overwritten

### AC11: Partial Rollback
- **AC11a**: Exception during INSERT → entire batch rolled back
- **AC11b**: Rows inserted BEFORE failure point also rolled back
- **AC11c**: Rollback preserves prior success (rollback was called)
- **AC11d**: New rows (no existing PK) insert normally — no false conflict

## Implementation Plan

### 1. Source Code Audit (migrate_sqlite_to_mysql.py)
- Verify AC10: symmetric comparison (lines 404-418) excludes PK from both dicts
- Verify AC10: stale_diff > 0 → early return with error (lines 422-439)
- Verify AC11: transaction rollback on exception (lines 461-497)
- Verify AC11: report reset on failure (lines 487-497)

### 2. Unit B Tests (test_migration_tool.py)
Create `TestUnitB` class with 6 test methods:

#### AC10 Tests (4 tests):
1. `test_unit_b_ac10_conflict_detected` — mock existing_map with different value → stale_diff=1, error, inserted=0
2. `test_unit_b_ac10_stale_same_ok` — mock existing_map with same value → stale_same=1, stale_diff=0, no error
3. `test_unit_b_ac10_symmetric_comparison` — verify PK excluded from comparison
4. `test_unit_b_ac10_mixed_rows` — mixed stale_same + stale_diff → entire table abort

#### AC11 Tests (3 tests):
5. `test_unit_b_ac11_mid_batch_rollback` — rollback called, inserted=0
6. `test_unit_b_ac11_rollback_preserves_prior_success` — 3 rows, failure on row 3 → ALL rolled back
7. `test_unit_b_ac11_new_rows_no_conflict` — new rows insert normally

### 3. Verification
- Syntax check: `python -m py_compile` on both files
- Git diff check: `git diff --check`
- Unit B tests: mock-based, no MySQL connection needed
- Preserve all Unit A correction changes

## Risk Assessment
- **Low risk**: Changes are targeted to specific logic paths
- **No MySQL dependency**: Tests use mock objects exclusively
- **Backward compatible**: Existing tests unchanged

## Constraints
- Business attempt ordinal: 1
- No attempt 2 permitted
- No destructive operations
- No MySQL integration
