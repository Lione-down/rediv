# T5-002 Plan: P0 credential cleanup and complete MySQL-only retirement

Last updated: 2026-07-12

## Objective

Deliver a usable backend whose only runtime and integration-test database is MySQL, with fail-closed configuration, guarded disposable test schemas, and no credential literal.

## Independently Verifiable Units

### Unit A: P0 credential source cleanup

- inspect only the necessary redacted structure of `backend/run_alembic_mysql.py`;
- remove the hard-coded assignment and retire the redundant helper;
- run tracked and staged redacted credential scans;
- report whether Human Owner rotation is required without exposing the value;
- keep backend behavior unchanged otherwise.

### Unit B: MySQL-only runtime and health

- remove `use_sqlite`, `db_path`, SQLite URL/engine/schema branches, runtime `create_all()`, and production in-memory fallback;
- make MySQL configuration and Alembic head validation fail closed;
- update lifecycle, health, admin seed, and standard Alembic entrypoints;
- add focused runtime and health tests.

### Unit C: MySQL-only test and tooling migration

- create a reusable guarded disposable MySQL fixture;
- move persistence and integration tests from temporary `.db` files to isolated MySQL schemas;
- keep pure unit tests database-free;
- remove `aiosqlite`, SQLite migration tooling, wrappers, test configs, and active SQLite documentation;
- preserve historical ADR, Task, REPORT, and review evidence.

### Unit D: Full verification and closure

- run focused security/runtime tests, backend full regression, Alembic checks, schema comment/FK inspection, restart persistence, static retirement scan, and secret hygiene;
- update README, PROGRESS, CURRENT, ROADMAP, and REPORT;
- do not delete local ignored `.db` artifacts.

## Rollback

- Unit A is a source-only security cleanup.
- Runtime units must remain within one Task until the backend and its tests are usable together.
- SQLite is not a rollback path. Roll back application code only before MySQL-only writes change schema, or forward-fix after cutover.
- user database restore requires a verified MySQL backup and Human Owner authorization.

## Verification Commands

Commands use the repository virtual environment and process-injected test configuration. They must not echo secrets.

```powershell
backend/.venv/Scripts/python.exe -m compileall backend
backend/.venv/Scripts/python.exe -m unittest discover -s backend/tests -p "test_*.py"
backend/.venv/Scripts/python.exe -m alembic -c backend/alembic.ini heads
git diff --check
```

Static retirement and credential scans must report only path, line, and redacted fingerprint metadata.
