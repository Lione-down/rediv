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
- Allowed minimal hardening: existing asset API/store/types for deterministic real-data/session behavior, plus the shared request interceptor only for synchronous credential binding across session switches.
- Reuse: auth-store quota state after contract verification.
- Forbidden: backend, database, migration, Space, Workspace, Canvas, global design-token, and new UI-library changes.

## T4-008 Current State

- Dependencies T4-003, T4-006, and T4-007 are complete.
- Slice A project-domain foundation is implemented and verified.
- Slice B1 asset-domain real-data and session hardening is implemented and verified.
- Slice B2 Home presentation, real-data states, project creation, responsive decomposition, session isolation, and explicit project navigation are implemented and verified.
- `modules/project/{types,api,store}.ts` now matches the exact backend list/create response fields and provides generation-safe load, refresh, create, duplicate-request, error, and reset behavior without fabricated state.
- Project state now resets synchronously on every auth-token change, and the shared Axios request interceptor binds Authorization synchronously before control returns so a session switch cannot retarget a mutating request.
- `api/assets.ts` and `types/asset.ts` now describe the complete list filters, pagination envelope, required/nullability fields, and unconstrained response strings while preserving constrained create input.
- The asset store now starts empty, preserves successful same-session data on refresh failure, deduplicates concurrent requests, resets synchronously on auth-token changes, and suppresses stale success/error completion across sessions.
- `Home.vue` is 499 lines and delegates route header, project list, recent assets, quota summary, and project creation to five Home-local components.
- The root route remains public for the accepted guest/auth entry; authenticated dashboard data is isolated behind the restored session, while Space/Admin navigation remains available.
- Home exposes no implicit Workspace link. Existing and newly created projects enter Workspace only with the backend project ID as scalar query `project_id`.
- Loading, empty, initial-error, refresh-error, partial-data, zero-quota, frozen-generation, create-success, and create-error states are explicit. Unknown asset wire values use neutral fallbacks.
- Pagination metadata remains at the asset API boundary rather than Pinia because Workspace directly mutates asset items and is outside T4-008 scope; Home describes the loaded page only as recent assets and never as an account-wide total.

## T4-008 Acceptance Focus

- Home projects/assets/quotas come from real contracts with no fabricated values.
- Project creation updates immediately and persists across refresh.
- Loading, empty, error, partial-data, and zero-quota states are explicit.
- `Home.vue` is reduced to at most 500 lines through domain-aligned components.
- Workspace navigation carries an explicit project ID.
- Build plus 1440x900, 920px, and 375px browser acceptance pass.

## Remaining In Current Task

1. Complete Slice C real local-backend/MySQL cross-check and responsive browser acceptance before REPORT and closure.

## Exact Next Action

Run Slice C against an authorized local backend/MySQL runtime: authenticate, compare Home project/asset/quota data with the real APIs, create one acceptance project and cross-check its ID/name/created_at in MySQL without opening or printing secrets, then repeat 1440x900, 920px, and 375px browser/console/overflow checks. If all non-deferred criteria pass, perform the final diff review, write REPORT, and close T4-008.

## Current Blockers

- T4-005 Unit B real Agnes smoke remains a Human cost gate and must not run without explicit authorization.
- T4-008 has no active implementation blocker.
- Real MySQL acceptance later must use an authorized runtime without opening or printing `.env`/credential material.
- The backend direct registration API 72-byte boundary remains a separate normal engineering follow-up.

## Worktree Protection

- This run started from `main` at `518682b14f00189b3815fe25addcb18e48398961` with no staged, modified, unmerged, detached, or in-progress Git-operation state.
- `frontend/.playwright-cli/` and `output/` were pre-existing untracked browser artifact directories. New mocked Slice B2 evidence is under `output/playwright/t4-008-slice-b2/`; all browser artifacts remain excluded from delivery staging and are preserved because deletion requires Human confirmation.
- Preserve unrelated modified and untracked files in future runs; do not reset, clean, or rewrite historical evidence.

## Historical Evidence

- T4-003 report: `ai/reports/REPORT-T4-003-DIRECT.md`
- T4-004 report: `ai/reports/REPORT-T4-004.md`
- T4-007 report: `ai/reports/REPORT-T4-007.md`
- Former CURRENT timeline: `ai/state/archive/CURRENT-HERMES-THROUGH-2026-07-10.md`
- Former T4-003 Hermes contracts: `ai/tasks/archive/TASK-T4-003-HERMES-THROUGH-REV47R2.md`
- Frozen Hermes operating files: `ai/automation/archive/hermes-retired-2026-07-10/`
