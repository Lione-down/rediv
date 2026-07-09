# REVIEW-T4-003-PMC-REV47-PUBLICATION-2026-07-09

## Verdict

`PMC_CONTINUATION_APPROVED - T4_003_MYSQL_RUNTIME_CUTOVER_REV47`

## Evidence Read

- `ai/state/CURRENT.md` states T4-002 reached `PMC_PASS - EMERGENCY DIRECT FINAL ACCEPTANCE`.
- `ai/state/ROADMAP.md` marks T4-003 as ready for PMC task/queue decision with dependency `T4-002` satisfied.
- `ai/automation/HERMES-EXECUTION-STATUS.md` records rev46 as `PMC_PASS - NOT EXECUTABLE / TERMINAL_RECONCILIATION_COMPLETE` with `PMC Verdict Confirmation = ACK_TERMINAL_VERDICT_AND_STOP`.
- `ai/tasks/todo/TASK-T4-003.md` exists and defines the MySQL runtime cutover objective, acceptance criteria, verification commands, and manual Navicat acceptance.
- ADR-001 accepts local MySQL 8.0 as the normal Revid runtime database; ADR-003 defines the disposable MySQL safety pattern and secret-handling constraints that must carry into T4-003 tests.

## Decision

Publish Queue revision `phase4-wave2-t4-003-mysql-runtime-cutover-2026-07-09-47` as the only active executable Queue.

This is a business execution stage only. It authorizes one `revid-dispatcher / DISPATCH_ONLY` Coordinator and one `revid-backend / IMPLEMENT_AND_TEST_ONLY` Executor. It does not authorize Independent Review, HANDOFF, frontend work, auth product work, Canvas product work, destructive production database operations, `.env` reads, secret output, historical card reuse, or automatic next-stage publication.

## Scope Guard

Allowed files are defined in `ai/tasks/todo/TASK-T4-003.md` under `PMC Revision 47 Execution Contract`. Any needed file outside that list must be reported as BLOCKED for PMC decision before modification.

Schema changes are not expected. If the Executor finds a real schema revision gap, it may add one T4-003-specific Alembic revision only when every new or modified table and field has a comment. Otherwise it must stop with BLOCKED evidence.

## Required Verification

- `cd backend; python -m unittest discover -s tests -p "test_*.py"`
- `cd backend; $env:REVID_USE_SQLITE='false'; python -c "import main"`
- MySQL runtime health check proving dialect, connection readiness, and Alembic/current revision without exposing credentials.
- API/store-path create/read/restart persistence proof for user, project, canvas node, and asset-level data sufficient for Navicat inspection.
- Rollback proof that `REVID_USE_SQLITE=true` still starts and uses the existing SQLite test path.

If MySQL credentials, Navicat/manual visibility, or disposable test database authority are unavailable, the Executor must write a BLOCKED report with exact missing capability and no secret material.

## Hermes Next Action

ACK rev47, create exactly one fresh `revid-dispatcher / DISPATCH_ONLY` Coordinator and exactly one `revid-backend / IMPLEMENT_AND_TEST_ONLY` Executor child for `ai/tasks/todo/TASK-T4-003.md`, then stop at `T4_003_MYSQL_RUNTIME_REPORT_READY_REV47`.

No Reviewer, HANDOFF, T4-004, T4-005, frontend, destructive database operation, `.env` read, secret output, historical card reuse, or PMC PASS action is authorized.
