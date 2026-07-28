# TASK-T6-018 - Add additive MySQL workflow-template persistence foundation

- State: `DONE`
- Verification outcome: `PASS`
- Phase: `Product V3 / Phase 6 reusable cinematic workflow templates`
- Objective: add the MySQL-only persistence foundation for workflow-template definitions, immutable versions, slots,
  instances, bindings, instance steps, workflow runs, and run steps while preserving the legacy `templates` table and
  Graph Template runtime unchanged.
- Dependency: `T6-017 - DONE / PASS`; baseline commit
  `39f6c11543e8139013a387edcf80276e32b9a7a2`.
- Requirements: [Reusable cinematic template PRD](../../requirements/REVID-V3-REUSABLE-CINEMATIC-TEMPLATE-PRD.md).
- Behavior matrix:
  [Workflow Template V1 Behavior Matrix](../../requirements/REVID-V3-WORKFLOW-TEMPLATE-BEHAVIOR-MATRIX.md).
- Architecture: [V2 Canvas architecture](../../architecture/REVID-V2-CANVAS-ARCHITECTURE.md).
- Plan: [TASK-T6-018-PLAN](../doing/TASK-T6-018-PLAN.md).
- Progress: [TASK-T6-018-PROGRESS](../doing/TASK-T6-018-PROGRESS.md).

## Scope

1. Add SQLAlchemy models and one expand-first Alembic migration rooted at the verified current head
   `b7c8d9e0f1a2`.
2. Persist definition/version/slot/instance/binding/instance-step/workflow-run/run-step foundations with explicit
   owner, project, Canvas, version, fingerprint, lifecycle, state, lineage, and audit boundaries.
3. Add database constraints and indexes for scope, unique versioning, immutable-version identity, stable local
   lineage, idempotency keys, lifecycle/state enums, and step ordering.
4. Give every new table and column a non-empty MySQL comment and preserve InnoDB/utf8mb4 compatibility.
5. Prove upgrade, constraints, legacy-row preservation, and restart persistence on guarded disposable
   `revid_test_*` MySQL only.
6. Keep runtime compatibility additive: no API, repository, service, route, capture, preflight, instantiate, UI, job,
   quota, or provider behavior switches to the new tables in this Task.

## Non-goals

- No T6-019 lifecycle domain/API, built-in seeds, publish/deprecate/clone behavior, or runtime repository.
- No T6-020 capture/portable classifier/preflight, T6-021 Canvas instantiate, T6-022 UI, or later workflow behavior.
- No rewrite, backfill, delete, rename, or automatic migration of existing `templates` rows.
- No downgrade, `DROP`, `TRUNCATE`, destructive cleanup, user database mutation, real/paid provider call, external
  account, secret access, arbitrary-code template, or public/team marketplace.

## Acceptance criteria

1. Focused RED tests first fail only because the T6-018 models/migration are absent or incomplete.
2. The additive upgrade reaches one Alembic head on a guarded disposable MySQL database and leaves legacy
   `templates` rows byte-for-byte logically unchanged.
3. Every new table/column has a non-empty comment; required foreign keys, unique constraints, checks, and indexes are
   introspection-proven.
4. Invalid lifecycle/state, duplicate definition/version/local lineage/idempotency, and cross-scope references fail
   closed without partial writes.
5. Committed rows survive a new SQLAlchemy session/engine lifecycle against the same disposable schema.
6. Wrong dialect, unsafe database identity, and revision mismatch fail closed; no user database is migrated.
7. Focused regression, relevant migration/model regression, fresh broad backend checks, validator, diff/security
   audit, Task/PLAN/PROGRESS/REPORT reconciliation, one scoped commit, push, and remote parity are recorded.

## Stop boundaries

- Use only disposable schemas whose identity matches `revid_test_*`; refuse any ambiguous or user/runtime database.
- Do not read, print, copy, stage, or commit environment/secret files or credential-bearing URLs.
- Never run destructive downgrade or cleanup on a user/runtime database. Downgrade regression is allowed only after
  an in-migration identity guard proves a disposable `revid_test_*` database.
- If real disposable MySQL is unavailable after safe diagnostics, record the exact blocker and release condition
  without substituting SQLite or mock evidence.

## Completion state

T6-018 is `DONE / PASS`. The additive persistence foundation, guarded migration, comments, constraints, indexes,
legacy compatibility, and restart durability are proved on real disposable MySQL. No lifecycle API/runtime switch,
Canvas mutation, quota/job mutation, provider call, user database migration, or Human UI acceptance claim was added.
