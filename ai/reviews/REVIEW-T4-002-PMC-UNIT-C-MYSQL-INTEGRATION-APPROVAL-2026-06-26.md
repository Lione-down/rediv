# T4-002 PMC Unit C MySQL Integration Approval

## Verdict

`PMC APPROVED — Unit C disposable MySQL integration revision -16`

## Queue Revision

`phase4-wave2-unit-c-mysql-integration-2026-06-26-16`

## Basis

- Unit A correction revision `-13` has PMC PASS.
- Unit B revision `-15` has PMC PASS.
- ADR-003 authorizes a dedicated disposable database named exactly `revid_test_t4_002`.
- Unit B verified the mock-based same-PK and rollback semantics; Unit C now verifies the real MySQL integration behavior.

## Approved Scope

This revision is Unit C only:

- Task: `T4-002`
- Business attempt ordinal: still attempt `1` continuation, not attempt `2`
- Executor profile: `revid-backend`
- Reviewer profile: `revid-reviewer`
- Scope: disposable MySQL integration tests for the migration tool under ADR-003
- Stop after: Unit C REPORT, Independent REVIEW and HANDOFF

## Required Verification

Executor must run a fresh verification chain using the project backend environment:

```powershell
python -m py_compile backend/scripts/migrate_sqlite_to_mysql.py
python -m py_compile backend/tests/test_migration_tool.py
python -m pytest backend/tests/test_migration_tool.py::TestMigrationTool -q
git diff --check -- backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py
```

If `REVID_TEST_MYSQL_ADMIN_URL` is missing, lacks permission, points to the wrong database identity, or cannot safely create/drop only `revid_test_t4_002`, Executor must return BLOCKED. It must not read `.env`, use fallback credentials, or touch `revid_db`.

## Allowed Files

Business file edits are allowed only if strictly required to satisfy Unit C integration semantics:

- `backend/scripts/migrate_sqlite_to_mysql.py`
- `backend/tests/test_migration_tool.py`

Required artifact files:

- `ai/tasks/doing/TASK-T4-002-UNIT-C-REV16-PLAN.md`
- `ai/tasks/doing/TASK-T4-002-UNIT-C-REV16-PROGRESS.md`
- `ai/reports/REPORT-T4-002-UNIT-C-REV16.md`
- `ai/reviews/REVIEW-T4-002-UNIT-C-REV16.md`
- `ai/handoffs/HANDOFF-T4-002-UNIT-C-REV16.md`

## Hard Gates

- Test database name must be exactly `revid_test_t4_002`.
- Allowed destructive actions are limited to ADR-003: create/drop that dedicated test database and write test data inside it.
- No destructive action against `revid_db` or any other database.
- Do not print or persist credentials, full database URLs, tokens or secrets.
- Do not use fallback credentials or project `.env`.
- Do not run downgrade/reset/truncate against user data.
- Do not dispatch Unit D/E, T4-003 or T4-010.
- Do not create attempt 2 or reuse revision `-14` cards.

## Acceptance Evidence Required

Executor REPORT must distinguish:

- passed tests,
- skipped tests,
- BLOCKED conditions,
- any real MySQL operation performed against the disposable database,
- cleanup outcome,
- confirmation that no secret was printed and no user database was touched.

Independent REVIEW must independently rerun executable checks or explain a concrete environment blocker with evidence.

HANDOFF must state `UNIT_C_HANDOFF_READY_REV16` and stop for PMC final acceptance.
