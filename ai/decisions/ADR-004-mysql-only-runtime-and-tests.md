# ADR-004: MySQL-only runtime and database-backed tests

- Status: Accepted
- Date: 2026-07-12
- Decision owner: Human Owner
- Applies from: Product V2 / Phase 5

## Context

Phase 4 delivered a working MySQL runtime while retaining SQLite as a default runtime, test database, migration source, and rollback path. The Human Owner has now required SQLite and all related support to be retired. V2 also introduces multi-canvas persistence, optimistic revisions, and history recovery, whose behavior must be verified against the production database dialect rather than an alternate engine.

A read-only audit also identified a tracked hard-coded database password assignment at `backend/run_alembic_mysql.py:8`. The value must never be printed or copied. Removing the source literal and rotating a credential that may have been used are separate security actions.

## Decision

1. MySQL 8 is the only supported runtime database and the only database used by integration and persistence tests.
2. Unit tests may use pure fakes or mocks, but no alternate SQL database is permitted.
3. Missing MySQL configuration, an unsupported dialect, an unreachable database, a missing schema, or an Alembic revision mismatch must fail closed. The application must not fall back to SQLite or an in-memory production store.
4. Alembic remains the only schema creation and revision mechanism. Runtime `create_all()` is prohibited.
5. `aiosqlite`, `REVID_USE_SQLITE`, `REVID_DB_PATH`, `build_sqlite_url`, SQLite migration helpers, SQLite tests, and active SQLite documentation must be removed.
6. Database integration tests use isolated MySQL schemas whose exact names start with `revid_test_`. Creation and cleanup must assert the selected database name before any destructive operation.
7. User or production databases must never receive automated `DROP`, `TRUNCATE`, destructive `DELETE`, downgrade, reset, or migration-test writes.
8. Existing ignored `.db` files are local user artifacts, not supported runtime databases. They must not be opened or deleted automatically. Quarantine or deletion requires action-time Human Owner approval after MySQL backup and parity evidence.
9. The hard-coded assignment at `backend/run_alembic_mysql.py:8` is a P0 cleanup item. If the credential was ever real, the Human Owner must rotate it in the owning system. Source cleanup alone does not satisfy rotation.

## Superseded Decisions

This ADR supersedes only the following clauses of `ADR-001-local-mysql8-primary-database.md`:

- retaining SQLite as a test database;
- retaining SQLite as a migration source in active tooling;
- using SQLite as a rollback path;
- restoring `REVID_USE_SQLITE=true` during rollback.

It also replaces the T4-specific test lifecycle in `ADR-003-t4-002-disposable-mysql-test-environment.md` with the reusable `revid_test_*` isolation contract. Historical ADRs remain unchanged as evidence.

## Consequences

Benefits:

- runtime, migration, and integration behavior share one SQL dialect;
- startup cannot silently write an unexpected local database;
- MySQL comments, constraints, transactions, and revision behavior become first-class acceptance evidence;
- multi-canvas concurrency tests exercise the real persistence contract.

Costs:

- database-backed tests require an isolated MySQL service and are slower than SQLite tests;
- test fixtures must be worker-safe and strongly guard database identity;
- rollback uses forward fixes or verified MySQL backup restore, never a database-engine switch.

## Rollout

1. Remove the tracked credential literal without displaying it, and record whether Human Owner rotation is required.
2. Replace runtime configuration and health behavior with MySQL-only fail-closed behavior.
3. Replace SQLite-backed tests with pure unit fakes or isolated MySQL integration fixtures.
4. Remove SQLite dependencies, scripts, wrappers, and active documentation.
5. Run static retirement scans, backend regression, disposable MySQL schema checks, restart persistence, and secret hygiene checks.
6. Request separate Human approval before deleting any local `.db` artifact.

## Acceptance Gates

- active backend code, config, tests, requirements, scripts, and README contain no SQLite runtime or test path;
- `git ls-files -- "*.db" "*.sqlite" "*.sqlite3"` returns no tracked database artifact;
- `/health` is ready only for MySQL with `current == head`;
- missing MySQL configuration and wrong dialect fail before application writes;
- disposable MySQL tests never target `revid_db` or any non-test database;
- schema, table comments, column comments, foreign keys, and restart persistence pass on MySQL;
- staged and tracked credential scans report only redacted path, line, and fingerprint metadata.

## Reversal

Reintroducing SQLite, another database dialect, or an engine-switch rollback requires a new Human Owner ADR. It is not an implementation-level choice.
