# Revid - Current Project State

Last updated: 2026-07-10

## Delivery Mode

- Mode: `CODEX_DIRECT_DELIVERY`
- Engineering owner: Codex Project Lead Engineer
- Human Owner gates: product direction, paid calls, real secrets, destructive or irreversible operations
- Hermes status: retired; no Queue, card, profile, Reviewer, or HANDOFF work is active
- Decision: `ai/decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md`

## Delivery Automation

- Active: `revid-codex-direct-delivery-controller`
- Cadence: hourly at minute 00 local time
- Model: `gpt-5.4`, xhigh reasoning
- Commit policy: every completed and verified bounded unit or Task phase ends in a scoped local commit; no empty, WIP, mixed-owner, sensitive, or automatic push commits
- Former `revid-codex-pmc-advisor`: `PAUSED`

## Active Task

- Task: `T4-011 - Canvas connection model and CRUD API`
- State: `DOING`
- Task file: `ai/tasks/todo/TASK-T4-011.md`
- Plan: `ai/tasks/doing/TASK-T4-011-PLAN.md`
- Progress: `ai/tasks/doing/TASK-T4-011-PROGRESS.md`
- Target report: `ai/reports/REPORT-T4-011.md`

## Latest Completed Task

- T4-004: `DONE - PASS`
- Report: `ai/reports/REPORT-T4-004.md`
- Outcome: username/email password Auth, registration-mode enforcement, env-driven Admin bootstrap, retained WeChat account compatibility, signed WeChat OAuth state validation, and shared MySQL migration are complete.
- Shared MySQL: `revid_db` on 8.0.43
- Alembic current/head at T4-004 close: `b7d4c2e9f001` / `b7d4c2e9f001`
- Health: `mysql`, connected, ready, revision match
- Fresh verification: backend compileall passed; backend unittest discover passed with 172 tests; frontend production build passed; shared MySQL health/Auth smoke passed.
- External note: real WeChat provider E2E remains unverified until Human Owner credentials/authorization are available; mocked real-mode exchange and signed state contract tests passed.

## T4-011 Objective

Add a durable backend Canvas connection model and CRUD API so node edges are persisted in MySQL, inspectable through Navicat, and restored after refresh or backend restart.

## T4-011 Scope

- Allowed new files: `backend/models/canvas_connection.py`, `backend/schemas/canvas_connection.py`, `backend/api/canvas_connections.py`, migration, and tests.
- Allowed edits: model registration, router registration, store methods, and node-delete cleanup required for connections.
- Forbidden: frontend pointer interaction, visual connection rendering, generation API, Auth changes, or broad store refactor.

## T4-011 Current State

- Dependencies T4-003 and T4-004 are complete.
- T4-011 PLAN and PROGRESS are created.
- First backend connection slice is implemented and verified in SQLite/test-regression scope.
- Added `CanvasConnection` model, schemas, CRUD router, store methods, node-delete cleanup, migration `d8c5b9a4e2f0`, and focused tests.
- Shared MySQL `revid_db` is not yet upgraded to `d8c5b9a4e2f0`; Navicat/comment evidence and final REPORT remain pending.

## T4-011 Acceptance Focus

- CRUD, duplicate, self-loop, cross-project, permission, and node cleanup tests.
- SQLite and MySQL integration evidence.
- Navicat-visible connection table, foreign keys, indexes, and non-empty table/field comments.
- Backend restart persistence.

## Remaining In Current Task

1. Apply and verify Alembic head `d8c5b9a4e2f0` on shared MySQL `revid_db`.
2. Inspect `canvas_connections` table/field comments, foreign keys, indexes, duplicate constraint, and revision match through MySQL evidence.
3. Record backend-restart persistence evidence after shared MySQL has the connection table.
4. Decide whether the SQLite-to-MySQL ETL script should be extended for future `canvas_connections` rows.
5. Run final focused/regression checks, write `ai/reports/REPORT-T4-011.md`, and mark T4-011 DONE only after all acceptance criteria are satisfied.

## Exact Next Action

Apply and verify the additive `d8c5b9a4e2f0` migration on shared MySQL `revid_db`, then inspect `canvas_connections` comments, columns, foreign keys, indexes, and revision match without exposing credentials.

## Current Blockers

- No active blocker.

## Worktree Protection

- This run started from clean `main` at `52908f434bf00e85fc110891698a2a9d1ef0cd51`.
- Preserve unrelated modified and untracked files in future runs; do not reset, clean, or rewrite historical evidence.

## Historical Evidence

- T4-003 report: `ai/reports/REPORT-T4-003-DIRECT.md`
- T4-004 report: `ai/reports/REPORT-T4-004.md`
- Former CURRENT timeline: `ai/state/archive/CURRENT-HERMES-THROUGH-2026-07-10.md`
- Former T4-003 Hermes contracts: `ai/tasks/archive/TASK-T4-003-HERMES-THROUGH-REV47R2.md`
- Frozen Hermes operating files: `ai/automation/archive/hermes-retired-2026-07-10/`
