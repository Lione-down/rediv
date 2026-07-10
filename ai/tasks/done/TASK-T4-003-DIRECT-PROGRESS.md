# T4-003 Direct Delivery Progress

Last updated: 2026-07-10

State: `DONE - PASS`

## Completed

- Retired the Hermes execution dependency and preserved its exact historical documents.
- Confirmed the live-engine reference fix is present in `backend/database.py`.
- Replaced the live-connection-dependent engine-reference test with deterministic mocked-engine evidence.
- Added schema-mismatch rejection and secret-safe actionable database errors.
- Added deterministic health `ready` semantics and failed-connection coverage.
- Removed the unused `InMemoryStore` import from MySQL startup code.
- Ran `test_mysql_runtime_cutover.py`: 9 passed.
- Ran `test_health.py`: 5 passed.
- Ran safe backend regression: 132 tests passed outside real migration integration.
- Ran migration mock/regression classes: 12 tests passed.
- Confirmed MySQL 8.0 is running locally, but no `REVID_DB_*` variables are present in the automation process and unauthenticated root access is denied.
- Human Owner authorized runtime-only consumption of the existing local `.env` on 2026-07-10; Codex remains prohibited from opening or outputting its contents.
- Verified `revid_db` on MySQL 8.0.43 at Alembic revision `a1b2c3d4e5f6` with revision match.
- Fixed cwd-dependent Alembic resolution by using the absolute backend migration path.
- Fixed MySQL foreign-key error 1452 by flushing the user before inserting its quota row.
- Created user/project/node/asset acceptance records and verified API reads after engine restart, separate process restart, and real uvicorn startup.
- Verified 13 tables, 11 foreign keys, zero missing app-table comments, and zero missing app-column comments.
- Verified fail-closed MySQL connection errors and SQLite rollback.
- Wrote `ai/reports/REPORT-T4-003-DIRECT.md` and completed fresh diff review.

## Remaining

None for T4-003.

## Exact Next Action

Transition the single active Task to T4-004 and begin its source/contract audit.

## Files Changed In This Run

- `backend/main.py`
- `backend/database.py`
- `backend/controllers/store.py`
- `backend/api/health.py`
- `backend/README.md`
- `backend/tests/test_mysql_runtime_cutover.py`
- `backend/tests/test_health.py`
- governance, state, archive, and Task documentation listed by the current git diff

## Verification Evidence

| Command scope | Result |
|---|---|
| `test_mysql_runtime_cutover.py` | 9 passed |
| `test_health.py` | 5 passed |
| safe backend suite excluding real migration integration | 132 passed |
| migration mock/regression classes | 12 passed |
| total safe regression | 144 passed |
| compileall on changed Python files | passed |
| real MySQL startup/health | passed |
| API create-read and engine/process restart | passed |
| real uvicorn HTTP health and record reads | passed |
| read-only schema/comments/record inspection | passed |

Both commands used `backend/.venv` from `ai/` to avoid repository `.env` discovery.

## Blockers

None.
