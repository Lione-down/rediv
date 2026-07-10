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

- Task: `T4-007 - Login/register UI and route/session guards`
- State: `TODO`
- Task file: `ai/tasks/todo/TASK-T4-007.md`
- Plan: not yet created
- Progress: not yet created
- Target report: `ai/reports/REPORT-T4-007.md`

## Latest Completed Task

- T4-005 Unit A: `DONE - PASS`
- Report: `ai/reports/REPORT-T4-005.md`
- Outcome: `generation_tasks` persistence, Alembic revision `e9f1a2b3c4d5`, store/schema/query API, provider status mapping, text/image/video task lifecycle integration, dry-run Agnes smoke script, migration-tool table coverage, and mock tests are complete.
- Fresh verification: changed module py_compile passed; focused generate tests passed with 16 tests; store/smoke tests passed with 10 tests; affected E2E mock tests passed with 11 tests; migration guard tests passed; Alembic head is `e9f1a2b3c4d5`; full backend unittest discover passed with 188 tests; `git diff --check` passed.
- External note: real Agnes text/image/video smoke was intentionally not run; T4-005 Unit B remains a Human cost gate.

## T4-007 Objective

Implement v3 dark-design login/register entry points, registration-mode-aware register availability, route/session recovery, and auth guards without modifying backend contracts.

## T4-007 Scope

- Allowed additions: `frontend/src/views/user/Login.vue`, `Register.vue`, and user-domain local components.
- Allowed edits: `frontend/src/router/index.ts`, `frontend/src/store/auth.ts`, `frontend/src/api/auth.ts`, `frontend/src/types/auth.ts`, and WeChat callback page.
- Forbidden: backend changes, Home/Space/Workspace changes, and global design token changes.

## T4-007 Current State

- Dependencies T4-004 and T4-006 are complete.
- PLAN and PROGRESS are not yet created; they must be created before frontend business-code edits.

## T4-007 Acceptance Focus

- Username/email password login, failed-password state, closed registration state, token invalidation, Admin/user route guards.
- Protected-page refresh restores session without flashing to the wrong page.
- WeChat and guest entry visibility follows backend settings.
- `npm run build` passes.
- Browser checks at 1440x900 and 375px pass.

## Remaining In Current Task

1. Create `ai/tasks/doing/TASK-T4-007-PLAN.md`.
2. Create `ai/tasks/doing/TASK-T4-007-PROGRESS.md`.
3. Audit existing frontend auth API/store/router/design patterns before business-code edits.

## Exact Next Action

Create the T4-007 PLAN and PROGRESS documents, then audit existing frontend auth, router, request, and design-system patterns before implementing login/register UI.

## Current Blockers

- T4-005 Unit B real Agnes smoke remains a Human cost gate and must not run without explicit authorization.
- T4-007 has no active blocker.

## Worktree Protection

- This run started from clean `main` at `778160f044c5e644d876703dfe9cbec04bb28d89`.
- Preserve unrelated modified and untracked files in future runs; do not reset, clean, or rewrite historical evidence.

## Historical Evidence

- T4-003 report: `ai/reports/REPORT-T4-003-DIRECT.md`
- T4-004 report: `ai/reports/REPORT-T4-004.md`
- Former CURRENT timeline: `ai/state/archive/CURRENT-HERMES-THROUGH-2026-07-10.md`
- Former T4-003 Hermes contracts: `ai/tasks/archive/TASK-T4-003-HERMES-THROUGH-REV47R2.md`
- Frozen Hermes operating files: `ai/automation/archive/hermes-retired-2026-07-10/`
