# Task: P0 credential cleanup and complete MySQL-only retirement

## Status

- State: `DONE - PASS`
- Owner: Codex Project Lead Engineer
- Dependency: T5-001 complete

## Task ID

T5-002

## Phase

Product V2 / Phase 5

## Category

Security / Backend / Database / Tests

## Objective

Remove the tracked credential literal and every active SQLite runtime, test, dependency, migration-tool, and rollback path so Revid fails closed on MySQL and the repository remains fully testable.

## Scope

- redacted credential source cleanup;
- MySQL-only settings, engine, lifecycle, health, Alembic, seed, and store behavior;
- removal of SQLite dependencies, helpers, wrappers, migration tools, tests, and active documentation;
- replacement of database-backed tests with guarded disposable MySQL fixtures;
- removal of production `InMemoryStore` fallback;
- MySQL-only README and startup verification;
- security, schema, regression, and restart evidence.

## Non-Goals

- multi-canvas schema or API;
- frontend Canvas implementation;
- opening `.env` or printing credential values;
- deleting local `.db` files;
- destructive operations on user databases;
- paid provider calls.

## Acceptance Criteria

- [x] tracked hard-coded database password assignment is removed without value disclosure.
- [x] credential rotation requirement is reported separately to the Human Owner.
- [x] runtime has no SQLite or in-memory production fallback.
- [x] missing MySQL configuration, wrong dialect, connectivity failure, and revision mismatch fail closed.
- [x] `aiosqlite`, `REVID_USE_SQLITE`, `REVID_DB_PATH`, SQLite URL builders, active migration tools, and SQLite tests are removed.
- [x] database-backed tests run only on exact-name guarded `revid_test_*` MySQL schemas.
- [x] unit tests use pure fakes or mocks without a database engine.
- [x] no automated test writes, drops, truncates, deletes, downgrades, or resets `revid_db` or any non-test database.
- [x] `/health` is ready only for connected MySQL at Alembic head.
- [x] backend full regression, focused runtime/security tests, schema comments/FKs, and restart persistence pass.
- [x] active README and configuration describe MySQL only.
- [x] local `.db` artifacts remain untouched pending separate Human authorization.

## Hard Gates

- never output the candidate credential value or a credential-bearing URL;
- database creation and cleanup assert an exact `revid_test_` prefix and `SELECT DATABASE()` identity;
- a missing test-admin secret is `BLOCKED`, never a SQLite fallback;
- no user-database destructive operation;
- no local `.db` deletion.

## Deliverables

- MySQL-only backend code, tests, requirements, migration environment, and documentation;
- `ai/tasks/doing/TASK-T5-002-PLAN.md`;
- `ai/tasks/doing/TASK-T5-002-PROGRESS.md`;
- `ai/reports/REPORT-T5-002.md` after every AC passes.

## Completion Evidence

- Report: `ai/reports/REPORT-T5-002.md`
- Final backend regression: 169/169 PASS.
- Focused fixture and MySQL closure evidence: 6/6 PASS.
- Alembic: single head `e9f1a2b3c4d5`.
- Active retirement scan, tracked database-artifact gate, tracked credential hygiene, disposable-schema cleanup, fresh diff review, and `git diff --check`: PASS.
