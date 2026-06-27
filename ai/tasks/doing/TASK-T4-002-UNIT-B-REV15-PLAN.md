# T4-002 Unit B Revision -15 Plan

## Revision
`phase4-wave2-unit-b-unit-tests-bounded-continuation-2026-06-26-15`

## Attempt
Attempt 1 continuation (not attempt 2)

## Scope
Unit B — same-PK conflict and partial rollback unit-test semantics for `TestUnitB` class in `backend/tests/test_migration_tool.py`.

## Allowed Files
- `backend/scripts/migrate_sqlite_to_mysql.py` (read-only audit)
- `backend/tests/test_migration_tool.py` (read-only — TestUnitB already present)
- Artifacts: `ai/tasks/doing/TASK-T4-002-UNIT-B-REV15-PLAN.md`, `PROGRESS.md`, `ai/reports/REPORT-T4-002-UNIT-B-REV15.md`, `ai/reviews/REVIEW-T4-002-UNIT-B-REV15.md`, `ai/handoffs/HANDOFF-T4-002-UNIT-B-REV15.md`

## Prohibited
- No MySQL connection, no secret reads, no `.env` access
- No CREATE/DROP/TRUNCATE/DELETE, no migration write
- No Unit C/D/E work
- No attempt 2
- No reuse of revision -14 cards

## Verification Steps
1. `python -m py_compile backend/scripts/migrate_sqlite_to_mysql.py` — syntax check
2. `python -m py_compile backend/tests/test_migration_tool.py` — syntax check
3. `python -m pytest backend/tests/test_migration_tool.py::TestUnitB -q` — run Unit B tests
4. `git diff --check -- backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py` — whitespace check

## Inherited Failure Fingerprints
- `T4-002-SEMANTICS`: IDEMPOTENCY_COMPARISON + FALSE_POSITIVE_CONFLICT + NON_MID_BATCH_ROLLBACK + SWALLOWED_CLEANUP + MISSING_SOURCE_COVERAGE
- `REV14_RUNTIME_TIMEOUT`: coordinator t_bbbf72bd timed out 302s; executor t_7275328d timed out 847s/848s

## Success Criteria
- Both files pass py_compile (exit 0)
- TestUnitB passes all 7 tests in < 5s
- No trailing whitespace in allowed files
- No MySQL/secret usage in Unit B tests
