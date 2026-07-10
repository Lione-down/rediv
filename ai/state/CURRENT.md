# Revid - Current Project State

Last updated: 2026-07-11

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

- Task: `T4-008 - Real-data Home project and asset dashboard`
- State: `DOING`
- Task file: `ai/tasks/todo/TASK-T4-008.md`
- Plan: `ai/tasks/doing/TASK-T4-008-PLAN.md`
- Progress: `ai/tasks/doing/TASK-T4-008-PROGRESS.md`
- Target report: `ai/reports/REPORT-T4-008.md`

## Latest Completed Task

- T4-007: `DONE - PASS`
- Report: `ai/reports/REPORT-T4-007.md`
- Outcome: dark login/register UI, password/settings/guest store actions, restoration-aware auth/Admin guards, safe redirects, token-correlated 401 cleanup, and race-safe WeChat callback handling are complete.
- Fresh verification: frontend typecheck and production build passed with 4,649 modules; backend password-auth contract passed 11 tests; mocked real-router matrix passed 16/16; real local-backend Admin/user/closed/token/WeChat/guest/logout matrix passed at 1440x900 and 375x812; visual, overflow, console, runtime-log, scope, diff, and redacted credential reviews passed.
- Security follow-up: the frontend rejects passwords over 72 UTF-8 bytes, while the separately scoped backend direct-API trust-boundary guard remains outstanding.

## T4-008 Objective

Replace the marketing-oriented Home with an authenticated personal dashboard that shows real projects, recent assets, quotas, and project creation/navigation using existing backend contracts.

## T4-008 Scope

- Allowed edits: `frontend/src/views/app/Home.vue` and related Home route entry as required.
- Allowed additions: `frontend/src/views/app/components/home/**` and `frontend/src/modules/project/{api,types,store}.ts`.
- Allowed minimal hardening: existing asset API/store/types only to remove fabricated state and add deterministic real-data/session behavior.
- Reuse: auth-store quota state after contract verification.
- Forbidden: backend, database, migration, Space, Workspace, Canvas, global design-token, and new UI-library changes.

## T4-008 Current State

- Dependencies T4-003, T4-006, and T4-007 are complete.
- Slice A project-domain foundation is implemented and verified.
- `modules/project/{types,api,store}.ts` now matches the exact backend list/create response fields and provides generation-safe load, refresh, create, duplicate-request, error, and reset behavior without fabricated state.
- `Home.vue` is 951 lines and mixes fabricated `quickStarts` values with real auth quota and asset-store reads.
- The root route remains public for the accepted guest/auth entry; authenticated Workspace navigation must pass the backend project ID as query `project_id`.
- The existing asset store still contains fabricated initial items and lacks request/session race controls; Slice B1 must harden it before Home uses it as truthful real or partial data.

## T4-008 Acceptance Focus

- Home projects/assets/quotas come from real contracts with no fabricated values.
- Project creation updates immediately and persists across refresh.
- Loading, empty, error, partial-data, and zero-quota states are explicit.
- `Home.vue` is reduced to at most 500 lines through domain-aligned components.
- Workspace navigation carries an explicit project ID.
- Build plus 1440x900, 920px, and 375px browser acceptance pass.

## Remaining In Current Task

1. Complete Slice B1 asset-domain real-data/session hardening.
2. Complete Slice B2 Home decomposition, real-data states, project creation, auth reset wiring, and explicit Workspace navigation.
3. Complete real local-backend/MySQL and responsive browser acceptance in Slice C before REPORT and closure.

## Exact Next Action

Read the complete backend asset list API/schema/store ordering contract; then implement only Slice B1 asset API/store/type hardening, run the focused adapter harness plus typecheck/build, review, update durable state, and commit. Do not edit Home in that bounded unit.

## Current Blockers

- T4-005 Unit B real Agnes smoke remains a Human cost gate and must not run without explicit authorization.
- T4-008 has no active implementation blocker.
- Slice B must wire project and asset store reset to auth-session changes before displaying cached cross-account data.
- Real MySQL acceptance later must use an authorized runtime without opening or printing `.env`/credential material.
- The backend direct registration API 72-byte boundary remains a separate normal engineering follow-up.

## Worktree Protection

- This run started from `main` at `5222ff8872d967890fbf8af2f90ebb0d1e1ae3d1` with no staged, modified, unmerged, detached, or in-progress Git-operation state.
- `frontend/.playwright-cli/` and `output/` were pre-existing untracked browser artifact directories. Slice D evidence was added under `output/playwright/t4-007-slice-d/run-20260711-qa/`; all are excluded from delivery staging and preserved because deletion requires Human confirmation.
- Preserve unrelated modified and untracked files in future runs; do not reset, clean, or rewrite historical evidence.

## Historical Evidence

- T4-003 report: `ai/reports/REPORT-T4-003-DIRECT.md`
- T4-004 report: `ai/reports/REPORT-T4-004.md`
- T4-007 report: `ai/reports/REPORT-T4-007.md`
- Former CURRENT timeline: `ai/state/archive/CURRENT-HERMES-THROUGH-2026-07-10.md`
- Former T4-003 Hermes contracts: `ai/tasks/archive/TASK-T4-003-HERMES-THROUGH-REV47R2.md`
- Frozen Hermes operating files: `ai/automation/archive/hermes-retired-2026-07-10/`
