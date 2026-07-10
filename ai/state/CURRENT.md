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
- No T4-011 business code has been changed yet.

## T4-011 Acceptance Focus

- CRUD, duplicate, self-loop, cross-project, permission, and node cleanup tests.
- SQLite and MySQL integration evidence.
- Navicat-visible connection table, foreign keys, indexes, and non-empty table/field comments.
- Backend restart persistence.

## Remaining In Current Task

1. Audit existing project/canvas-node backend files and tests.
2. Add focused failing connection contract tests.
3. Implement connection model/schema/router/store/migration and node-delete cleanup.
4. Run focused and regression verification, then write `REPORT-T4-011.md`.

## Exact Next Action

Audit the existing project and canvas-node backend files and tests, then add the first focused connection contract tests before implementing the model/router/store changes.

## Current Blockers

- No active blocker.

## Worktree Protection

- Starting T4-011 from clean `main` after T4-004 closeout.
- Preserve unrelated modified and untracked files in future runs; do not reset, clean, or rewrite historical evidence.

## Historical Evidence

- T4-003 report: `ai/reports/REPORT-T4-003-DIRECT.md`
- T4-004 report: `ai/reports/REPORT-T4-004.md`
- Former CURRENT timeline: `ai/state/archive/CURRENT-HERMES-THROUGH-2026-07-10.md`
- Former T4-003 Hermes contracts: `ai/tasks/archive/TASK-T4-003-HERMES-THROUGH-REV47R2.md`
- Frozen Hermes operating files: `ai/automation/archive/hermes-retired-2026-07-10/`
