# T5-002 Plan: P0 credential cleanup and complete MySQL-only retirement

Last updated: 2026-07-13

## Objective

Deliver a usable backend whose only runtime and integration-test database is MySQL, with fail-closed configuration, guarded disposable test schemas, and no credential literal.

## Independently Verifiable Units

### Unit A: P0 credential source cleanup

- inspect only the necessary redacted structure of `backend/run_alembic_mysql.py`;
- remove the hard-coded assignment and retire the redundant helper;
- run tracked and staged redacted credential scans;
- report whether Human Owner rotation is required without exposing the value;
- keep backend behavior unchanged otherwise.

### Unit A.1: Human-requested repository hygiene prerequisite

- remove tracked one-off diagnostics and status-repair scripts with no active product caller;
- retire obsolete Hermes PowerShell task entrypoints without deleting historical evidence;
- stop tracking generated browser/runtime lock artifacts and add narrow durable ignore rules;
- normalize the root agent-instruction filename to `AGENTS.md` for cross-platform consistency;
- preserve MySQL/SQLite migration and test surfaces owned by Units B/C, local databases, `.env`, current runtime logs, historical documents, and frontend orphan candidates;
- verify tracked references, ignore behavior, UTF-8 text, compile/test discovery, frontend build, staged secret hygiene, and the final staged diff.

### Unit B: MySQL-only runtime and health

- B1: remove runtime `use_sqlite` / `db_path` selection, require MySQL configuration, initialize only through the FastAPI lifespan, reject non-MySQL engines, require Alembic head parity, and update health, admin seed, standard Alembic entrypoints, and focused pure-mock tests;
- B2: remove the temporary SQLite-only engine/schema helpers still used by legacy database-backed tests, after Unit C provides the guarded disposable MySQL fixture;
- remove runtime `create_all()` and production in-memory fallback before Unit B closes.

### Unit C: MySQL-only test and tooling migration

- create a reusable guarded disposable MySQL fixture;
- first bounded slice: give `test_database_store.py` its own exact-name `revid_test_*` schema, run Alembic to head, assert `SELECT DATABASE()` before use and cleanup, and restore process settings after the class;
- move persistence and integration tests from temporary `.db` files to isolated MySQL schemas;
- keep pure unit tests database-free;
- remove `aiosqlite`, SQLite migration tooling, wrappers, test configs, and active SQLite documentation;
- preserve historical ADR, Task, REPORT, and review evidence.

### Unit D: Full verification and closure

- D1: remove the placeholder JWT and dev-admin defaults, require an explicit JWT secret before runtime startup, disable dev-admin login when its key is absent, and cover both gates with focused configuration/auth tests;
- D2: add one guarded disposable-MySQL closure test that inspects every migrated table and column for non-empty comments, confirms actual foreign keys, and proves a committed record survives engine disposal and reconstruction;
- D2: run that focused closure test first, then backend full regression, Alembic checks, static retirement scan, tracked/staged secret hygiene, and final diff review;
- update active README/configuration guidance with D1, then update PROGRESS, CURRENT, ROADMAP, and REPORT only when D2 satisfies every remaining acceptance criterion;
- do not delete local ignored `.db` artifacts.

### Unit D2 Success Criteria

- only the exact-name guarded `revid_test_t5_002_closure` schema is created and cleaned by the new test;
- `SELECT DATABASE()` identity gates run through the reusable fixture before use and cleanup;
- all Alembic-managed application tables and columns report non-empty MySQL comments, and the schema exposes at least one foreign key;
- a committed persistence record remains readable after the first SQLAlchemy engine is disposed and a new engine/store is constructed from process-supplied test settings;
- focused closure tests, full backend regression, single-head Alembic, retirement scans, database-artifact checks, credential hygiene, and `git diff --check` pass;
- no paid provider call, user/non-test database write, `.env` access, local `.db` access, or cleanup of the pre-existing `revid_test_db` schema occurs.

## Rollback

- Unit A is a source-only security cleanup.
- Runtime units must remain within one Task until the backend and its tests are usable together.
- SQLite is not a rollback path. Roll back application code only before MySQL-only writes change schema, or forward-fix after cutover.
- user database restore requires a verified MySQL backup and Human Owner authorization.

## Verification Commands

Commands use the repository virtual environment and process-injected test configuration. They must not echo secrets.

```powershell
Push-Location backend
.venv/Scripts/python.exe -m compileall .
.venv/Scripts/python.exe -m unittest tests.test_mysql_test_database tests.test_database_store
.venv/Scripts/python.exe -m unittest discover -s tests -p "test_*.py"
.venv/Scripts/python.exe -m alembic -c alembic.ini heads
Pop-Location
git diff --check
```

Static retirement and credential scans must report only path, line, and redacted fingerprint metadata.
