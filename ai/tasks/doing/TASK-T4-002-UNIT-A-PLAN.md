# TASK-T4-002 Unit A Plan — Static Fixes

## Queue Revision
`phase4-wave2-unit-a-static-fixes-coordinator-budget-2026-06-26-12`

## Task ID
T4-002

## Unit
A (Static Fixes)

## Business Attempt Ordinal
1 (preserved from original T4-002)

## Scope
Perform static audit and fixes for:
1. **Validation Order** — Ensure validation is only run when migration succeeds (no table_failures)
2. **Cleanup Failure Visibility** — Ensure OperationalError in cleanup is re-raised, not silently swallowed
3. **Idempotency Comparison** — Already fixed in partial diff (symmetric PK exclusion)
4. **Rollback Test Preparation** — Already correct (per-table transaction rollback verified)

## Allowed Files
- `backend/scripts/migrate_sqlite_to_mysql.py`
- `backend/models/**` (type compatibility only)

## Constraints
- NO MySQL connection
- NO secret reading
- NO destructive operations
- NO `.env` file access
- Max runtime: 800s

## Verification Steps
1. AST parse: `python -m py_compile scripts/migrate_sqlite_to_mysql.py`
2. Git diff --check: `git diff --check -- backend/scripts/migrate_sqlite_to_mysql.py`
3. Confirm no MySQL connections or secret reads in changes
4. Confirm model files are type-compatible (no changes needed)

## Expected Changes
1. **Validation Order Fix**: Restructure Step 4 to clearly separate dry-run, table-failure, and success paths. Validation only runs when migration succeeds for all tables.
2. **Cleanup Failure Visibility Fix**: Change `except OperationalError:` to `except OperationalError as e:` and re-raise instead of silently returning.

## Risk Assessment
- Low risk: These are targeted static fixes that only affect error handling and control flow
- No schema changes, no data changes, no API changes
- Existing partial diff preserved
