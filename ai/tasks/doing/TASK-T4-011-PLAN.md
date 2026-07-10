# T4-011 Direct Delivery Plan

## Goal

Add a durable backend data boundary for Canvas connections so project node edges can be stored in MySQL, inspected through Navicat, and restored after refresh or backend restart.

## Implementation Units

1. Audit the existing project and canvas-node backend patterns: models, schemas, routers, store methods, migration comments, ownership checks, delete behavior, and tests.
2. Add failing tests for connection CRUD, duplicate edge conflicts, self-loop rejection, cross-project node rejection, permission denial, node deletion cleanup, SQLite persistence, and MySQL schema/comment evidence.
3. Add `CanvasConnection` model and schema types with comments for every table and field, including explicit documentation that directed cycles are allowed in this Task.
4. Add Alembic migration for the connection table, foreign keys, uniqueness constraints, indexes, and cascade or explicit cleanup behavior.
5. Implement store methods and `/projects/{project_id}/connections` list/create/update/delete endpoints using existing project ownership boundaries.
6. Register the model/router with the existing app structure and update node deletion so related connections are handled deterministically.
7. Run focused connection tests, full backend regression, migration smoke, MySQL integration evidence when available, `compileall`, `git diff --check`, and write `REPORT-T4-011.md` only after acceptance criteria pass.

## Non-Goals

- No frontend pointer interaction, visual connection rendering, DAG scheduling, generation execution, Auth changes, or broad store refactor.
- No destructive operation against user or production data.

## Human Gates

- Applying an additive migration to shared MySQL is in scope after fresh review.
- Stop for Human Owner approval if the migration becomes destructive, irreversible beyond the approved connection contract, or requires real secrets not already available through process environment.

## Completion

T4-011 is complete only when connection CRUD behavior, ownership boundaries, node cleanup, persistence, comments, SQLite regression, and MySQL schema/runtime evidence satisfy the Task acceptance criteria.
