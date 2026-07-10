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

- Task: `T4-007 - Login/register UI and route/session guards`
- State: `DOING`
- Task file: `ai/tasks/todo/TASK-T4-007.md`
- Plan: `ai/tasks/doing/TASK-T4-007-PLAN.md`
- Progress: `ai/tasks/doing/TASK-T4-007-PROGRESS.md`
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
- Allowed edits: `frontend/src/router/index.ts`, `frontend/src/store/auth.ts`, `frontend/src/api/auth.ts`, `frontend/src/types/auth.ts`, and WeChat callback page; `frontend/src/api/request.ts` is limited to stale-401 token correlation.
- Forbidden: backend changes, Home/Space/Workspace changes, and global design token changes.

## T4-007 Current State

- Dependencies T4-004 and T4-006 are complete.
- PLAN and PROGRESS are active and T4-007 is `DOING`.
- Slice A auth foundation is complete: backend-aligned types, public settings/password/logout APIs, and deterministic Pinia settings/session/password/guest actions are implemented.
- Slice B login/register UI is complete: the scoped dark auth shell, workflow preview, password login, settings-aware alternate entries, open/invitation/closed registration states, and focused registration form are implemented.
- Session restoration deduplicates concurrent `/me` requests, ignores stale responses after identity changes, clears invalid tokens through the existing 401 interceptor, and preserves valid tokens across transient failures.
- A delayed 401 now clears auth only when its request bearer still matches the current token; an old-token/new-login browser race passed.
- Registration-mode drift is written to Pinia before forced refresh; a generation guard prevents older in-flight settings responses from reverting it. Guest browsing refuses to start over an existing or restoring account identity.
- Accessibility review fixes associate labels/errors, focus the first invalid native input, strengthen field/focus contrast, and preserve 40px targets and form-first mobile order.
- Verification: final typecheck passed; Vite no-write multi-entry build passed with 4,576 modules; production build passed with 4,634 modules.
- Headed browser Slice B checks passed at 1440x900 and 375px, including settings states, validation focus, duplicate-submit locking, stale-401, guest identity, 72-byte password, mode-drift persistence, overflow, and JavaScript-exception checks.
- Route/session behavior is not yet claimed; `/login` and `/register` are not wired into the repository router and Slice C remains next.

## T4-007 Acceptance Focus

- Username/email password login, failed-password state, closed registration state, token invalidation, Admin/user route guards.
- Protected-page refresh restores session without flashing to the wrong page.
- WeChat entry visibility follows backend settings; guest entry follows the existing always-available backend contract.
- `npm run build` passes.
- Browser checks at 1440x900 and 375px pass.

## Remaining In Current Task

1. Wire `/login` and `/register`, router-owned restoration, restoration-aware user/Admin guards, safe redirects, and callback navigation.
2. Run the complete real-router desktop/mobile acceptance matrix and close the Task only after all acceptance evidence passes.
3. Track the backend direct-API 72-byte password boundary in a separately scoped backend security follow-up; the T4-007 UI guard does not replace a trust-boundary check.

## Exact Next Action

Implement Slice C: add `/login` and `/register`, make the router the single restoration decision point, apply restoration-aware `requiresAuth`/`requiresAdmin` guards, sanitize local redirects, and preserve callback navigation; then run the production build and focused browser routing checks.

## Current Blockers

- T4-005 Unit B real Agnes smoke remains a Human cost gate and must not run without explicit authorization.
- T4-007 has no active blocker.
- The backend direct registration API does not yet reject passwords over 72 UTF-8 bytes. This is normal engineering follow-up rather than a Human gate; a separately scoped backend validation and contract test are required before final auth hardening is complete.

## Worktree Protection

- This run started from clean `main` at `99ebd1faa1125554b8d5a66bb6691c7825f0e8fd` with no staged, modified, untracked, unmerged, detached, or in-progress Git-operation state.
- `frontend/.playwright-cli/` is a known current-run untracked browser artifact directory. It is excluded from delivery staging and preserved because deletion requires Human confirmation.
- Preserve unrelated modified and untracked files in future runs; do not reset, clean, or rewrite historical evidence.

## Historical Evidence

- T4-003 report: `ai/reports/REPORT-T4-003-DIRECT.md`
- T4-004 report: `ai/reports/REPORT-T4-004.md`
- Former CURRENT timeline: `ai/state/archive/CURRENT-HERMES-THROUGH-2026-07-10.md`
- Former T4-003 Hermes contracts: `ai/tasks/archive/TASK-T4-003-HERMES-THROUGH-REV47R2.md`
- Frozen Hermes operating files: `ai/automation/archive/hermes-retired-2026-07-10/`
