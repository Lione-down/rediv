# TASK-T6-018 Implementation Plan

- State: `DONE`
- Verification outcome: `PASS`
- Active unit: `complete`
- Task: [TASK-T6-018](../todo/TASK-T6-018.md).
- Progress: [TASK-T6-018-PROGRESS](TASK-T6-018-PROGRESS.md).

## Delivery rule

Deliver only the additive MySQL persistence foundation. Use strict TDD, preserve legacy Graph Template runtime
compatibility, and do not implement T6-019 lifecycle behavior or any later Task.

## Unit 0 - Baseline reconciliation

- Status: `complete`
- Read the complete governance, state, roadmap, PRD, behavior matrix, T6-017 handoff, redesign plan, linked ADRs, and
  architecture.
- Verified the protected untracked worktree boundary.
- Fetched `origin/main` and confirmed
  `HEAD == origin/main == 39f6c11543e8139013a387edcf80276e32b9a7a2`.
- Verified the single Alembic head `b7c8d9e0f1a2`.

## Unit 1 - Focused RED

- Status: `complete`
- Inspect current SQLAlchemy/Alembic/MySQL test patterns and the legacy `templates` boundary.
- Add model-contract, migration, and MySQL-constraint tests before production models or migration.
- Observe expected RED caused by missing T6-018 tables/models/revision, not syntax, environment, or secret access.

## Unit 2 - Smallest coherent GREEN

- Status: `complete`
- Add the minimal SQLAlchemy model module and exports required by the frozen persistence contract.
- Add one expand-first Alembic revision descended from `b7c8d9e0f1a2`.
- Add only the constraints, indexes, comments, and compatibility behavior proved by Unit 1.
- Keep all runtime APIs, repositories, services, and existing `templates` reads/writes unchanged.

## Unit 3 - Disposable MySQL and regression proof

- Status: `complete`
- Run focused model tests, migration/constraint tests, and relevant legacy template/migration regression.
- Run database identity guard and backup/preflight checks before a guarded disposable `revid_test_*` migration.
- Prove additive upgrade, comments, constraints, single head, legacy-row preservation, and restart persistence on real
  disposable MySQL.
- Run relevant broad backend checks; no frontend or browser behavior changes are expected from this backend contract
  Task.

## Unit 4 - Closure

- Status: `complete`
- Run the project-state validator, `git diff --check`, fresh diff review, exact-path staged security audit, and
  acceptance-criteria reconciliation.
- Update Task/PLAN/PROGRESS/CURRENT/ROADMAP and write `REPORT-T6-018`.
- Precisely stage only T6-018 paths, create one scoped conventional commit, push once, fetch, and verify
  `HEAD == origin/main`.
- Create the T6-019 goal session in the same saved `project_revid`, transfer the remaining program protocol, and stop
  modifying this repository.

## Stop boundaries

- No lifecycle API/domain service, capture/preflight, instantiate, UI, generation, provider, quota, or job behavior.
- No legacy `templates` rewrite/backfill and no user/runtime database migration.
- No destructive downgrade, `DROP`, `TRUNCATE`, or cleanup on a user/runtime database. Disposable downgrade regression
  is permitted only after the migration itself verifies a `revid_test_*` identity.
- No SQLite or in-memory substitute for required MySQL evidence.

## Outcome

- Units 0 through 4 are complete. T6-018 added eight commented additive tables through revision `c8d9e0f1a2b3`, with
  model/migration/constraint/restart evidence and no runtime switch.
- The remaining session operations are exact staging, one scoped commit/push, remote parity, and creation of the
  separate T6-019 session; no repository edit is allowed after that session is created.
