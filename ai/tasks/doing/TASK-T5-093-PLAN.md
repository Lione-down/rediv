# TASK-T5-093 Plan

- State: `DOING`
- Objective: close the newly exposed legacy-MySQL collation incompatibility, safely advance the authorized local schema to head, and restore the local frontend/backend runtime.
- Baseline: `origin/main` and `HEAD` at `2b426a0e303a82f2ce4c0eb7c6863f415dfa135f`.

## Unit 0 - Incident lock and durable activation

- Status: `completed`

1. Confirm the schema gate, failed revision, absent partial table, exact parent collation, and MySQL server default without printing credentials.
2. Record the root cause, clean retry boundary, authorization, scope, non-goals, and acceptance criteria.
3. Activate T5-093 as the only implementation Task.

Success gate: source, database metadata, Task, PLAN, PROGRESS, CURRENT, and ROADMAP agree on one bounded migration hotfix.

## Unit 1 - Regression and minimal migration fix

- Status: `in progress`

1. Extend the focused migration test to create a deterministic legacy parent/server-default collation mismatch.
2. Confirm the regression fails against the existing migration.
3. Reuse the established dynamic parent-collation implementation in the provider acknowledgement migration.
4. Verify the child FK column collation equals the parent and the guarded migration reaches head.

Success gate: focused disposable-MySQL evidence passes and would fail if the migration again relied on MySQL's default collation.

## Unit 2 - Authorized local migration and runtime recovery

- Status: `pending`

1. Recheck the local revision and absence of a partial acknowledgement table.
2. Run `alembic upgrade head` through the repository-local `.env` under the Human authorization already granted.
3. Verify exact current/head revision and relevant schema metadata without exposing configuration values.
4. Start backend with the absolute env-file path; verify backend `/health` and the existing frontend listener.

Success gate: schema is at `a3b4c5d6e7f8`, backend and frontend both return HTTP 200, and no paid provider call occurs.

## Unit 3 - Closure and delivery

- Status: `pending`

1. Run focused regression, compile/migration-head, diff, encoding, sensitive-path, and secret checks.
2. Review only owned paths, update PROGRESS/CURRENT/ROADMAP, and write REPORT after all criteria pass.
3. Stage exactly owned files, commit using the repository convention, push, and verify `HEAD == origin/main`.

Success gate: implementation, evidence, durable state, commit, and remote agree on `DONE - PASS`.

## Stop rules

- Stop before destructive schema/data operations, downgrade, secret disclosure, paid calls, or unrelated runtime/product changes.
- If the failed migration left partial DDL or the revision/data boundary changes before retry, re-inspect rather than forcing the migration.
- Preserve `.env`, `.codex/`, `.hermes/plans/`, `output/`, and unrelated user files.
