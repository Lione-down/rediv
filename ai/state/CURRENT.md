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

- Task: `T4-005 Unit A - GenerationTask persistence, provider integration and mock tests`
- State: `TODO`
- Task file: `ai/tasks/todo/TASK-T4-005.md`
- Plan: not yet created
- Progress: not yet created
- Target report: `ai/reports/REPORT-T4-005.md`

## Latest Completed Task

- T4-011: `DONE - PASS`
- Report: `ai/reports/REPORT-T4-011.md`
- Outcome: Canvas connection model, schemas, CRUD router, store methods, node-delete cleanup, migration `d8c5b9a4e2f0`, migration-tool ETL coverage, and tests are complete.
- Shared MySQL: `revid_db` on 8.0.43
- Alembic current/head at T4-011 close: `d8c5b9a4e2f0` / `d8c5b9a4e2f0`
- Fresh verification: connection tests passed with 10 tests; migration-tool tests passed with 27 tests; backend unittest discover passed with 183 tests; shared MySQL schema/comment/FK/index/unique evidence and restart persistence evidence are complete.
- External note: real WeChat provider E2E remains unverified until Human Owner credentials/authorization are available.

## T4-005 Unit A Objective

Persist generation task diagnostics and integrate provider status mapping without making paid Agnes calls. Unit A must add `generation_tasks`, query/smoke surfaces, and mock verification for text/image/video failure and status paths.

## T4-005 Unit A Scope

- Allowed edits: `backend/core/agnes_provider.py`, generation routers, related schemas/settings/tests.
- Allowed additions: `GenerationTask` model, Alembic revision, task query API, and `scripts/smoke_agnes.py`.
- Forbidden: frontend visual work, Auth changes, MySQL foundation changes, quota product-rule changes, and paid Agnes calls.
- Unit B real smoke remains blocked until explicit Human Owner cost authorization.

## T4-005 Unit A Current State

- Dependencies T4-003 and T4-004 are complete.
- T4-011 is complete, so T4-005 Unit A is now dependency-ready.
- PLAN and PROGRESS are not yet created; they must be created before any business-code edits.

## T4-005 Unit A Acceptance Focus

- Generation task persistence and Navicat-inspectable task/asset relationships.
- Provider status mapping to `queued/running/succeeded/failed/timed_out`.
- Mock tests for text, image, video, network failure, provider failure, timeout, asset persistence failure, and no-secret/no-paid-call smoke behavior.
- Full backend regression remains required for Unit A closure.

## Remaining In Current Task

1. Create `ai/tasks/doing/TASK-T4-005-PLAN.md`.
2. Create `ai/tasks/doing/TASK-T4-005-PROGRESS.md`.
3. Audit existing Agnes provider/generation router/schema/tests before business-code edits.

## Exact Next Action

Create the T4-005 Unit A PLAN and PROGRESS documents, then audit the existing Agnes provider and generation endpoints to define the first implementation slice.

## Current Blockers

- T4-005 Unit A has no active blocker.
- T4-005 Unit B real Agnes smoke remains a Human cost gate and must not run without explicit authorization.

## Worktree Protection

- This run started from clean `main` at `d971e56012ce0c03c1c2c0278f1a8bc197da9d9b`.
- Preserve unrelated modified and untracked files in future runs; do not reset, clean, or rewrite historical evidence.

## Historical Evidence

- T4-003 report: `ai/reports/REPORT-T4-003-DIRECT.md`
- T4-004 report: `ai/reports/REPORT-T4-004.md`
- Former CURRENT timeline: `ai/state/archive/CURRENT-HERMES-THROUGH-2026-07-10.md`
- Former T4-003 Hermes contracts: `ai/tasks/archive/TASK-T4-003-HERMES-THROUGH-REV47R2.md`
- Frozen Hermes operating files: `ai/automation/archive/hermes-retired-2026-07-10/`
