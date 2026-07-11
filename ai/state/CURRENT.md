# Revid - Current Project State

Last updated: 2026-07-12

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

- Task: `T4-012 Unit A - Canvas decomposition and persistence`
- State: `DOING`
- Task file: `ai/tasks/todo/TASK-T4-012.md`
- Plan: `ai/tasks/doing/TASK-T4-012-PLAN.md`
- Progress: `ai/tasks/doing/TASK-T4-012-PROGRESS.md`
- Target report: `ai/reports/REPORT-T4-012.md`

## Latest Completed Task

- T4-009: `DONE - PASS`
- Report: `ai/reports/REPORT-T4-009.md`
- Outcome: Space is a 497-line real-data asset workspace with guarded asset/template stores, filters, pagination, accessible prompt/image/video media, detail/project navigation, template reuse, confirmed deletion, and explicit loading/empty/error/boundary behavior.
- Real acceptance: local FastAPI/MySQL/API/UI evidence matched 13 visible + 1 hidden pre-mutation assets, filter totals 10/2/1, 2 templates, quotas 100/20/3, real media/fallback, asset soft-delete/page recovery, template use/hard-delete, and post-mutation 12 active + 1 deleted + 1 hidden assets, 1 template, and 2 projects.
- Browser/build: 1440x900, 920x900, and 375x900 had no overflow with 3/2/1 asset-grid columns and 0 unexpected console/page/API failures; 22/22 focused backend tests and the 4,693-module production build passed.
- Residual local data: `t4009_mrgisxgt` plus 14 asset rows, 1 template, and 2 projects remain in `revid_db`; broad cleanup was not authorized. Earlier T4-008 residual fixture data also remains.

## T4-012 Unit A Objective

Decompose the 1000+ line CanvasStage into clear render, viewport, interaction, and persistence responsibilities, then implement project-driven node/connection load plus create/move/delete persistence, debounce/flush, and optimistic rollback using the existing backend contracts.

## T4-012 Unit A Scope

- Allowed edits: CanvasStage, canvas store/types, and Workspace project integration.
- Allowed additions: `frontend/src/modules/canvas/**`, Canvas-specific composables, and decomposition components.
- Forbidden: backend contract, Auth, Home, Space, global design-token, or second-canvas-engine changes.
- Unit A acceptance requires real project-driven node/connection load, persistence across refresh, API-failure rollback with visible error, production build, and `CanvasStage.vue` at most 500 lines before Unit B begins.

## Latest T4-012 Progress

- Unit 1 contract/decomposition audit is complete; PLAN and PROGRESS now lock five bounded Unit A delivery units.
- `CanvasStage.vue` is 1,071 lines and mixes render, Leafer lifecycle, viewport, pointer interaction, minimap, overlays, and local-only connection creation.
- The Canvas store still contains global fixture nodes/connections and has no project identity, server mapping, async load guard, persistence, debounce/flush, or rollback.
- Existing authenticated node/connection APIs are sufficient; Unit A requires no backend contract or migration change.
- Unit 2 will establish project-scoped DTO/API mapping and guarded server load before optimistic mutations or CanvasStage decomposition begin.
- Unit B advanced selection, context menu, minimap work, keyboard behavior, and responsive QA remains gated on Unit A persistence and rollback acceptance.

## Exact Next Action

Implement Unit 2 only: add `frontend/src/modules/canvas/` DTO/API mapping and replace fixture initialization in `frontend/src/store/canvas.ts` with a generation-guarded `loadProject(projectId)` path; update Workspace only enough to bind the normalized route project ID, then run `frontend: npm run build`.

## Current Blockers

- T4-012 Unit A has no recorded Human gate or dependency blocker.
- T4-005 Unit B real Agnes smoke remains a separate Human cost gate and must not run without explicit authorization.
- The backend direct registration API 72-byte password boundary remains a separate normal engineering follow-up.
- Existing backend asset ordering lacks a stable secondary key when MySQL `created_at` values tie within one second; route this to a future backend follow-up without reopening completed T4-009.
- No push is authorized; local cleanup and closure commits remain local until the Human Owner explicitly requests push.

## Worktree Protection

- This run started from clean `main` at `5b64ca13398651aaea3c29d0d095efa0bdc6e1b3`, with no staged, modified, untracked, unmerged, detached, or in-progress Git-operation state.
- The Codex task-list single-flight query did not return, so branch/HEAD/index and Git-operation state must remain unchanged through staging and commit.
- Pre-run commit `5b64ca1` contains only the formerly untracked zero-byte root Playwright snapshot and is already `origin/main`; it is outside T4-012 ownership and must not be modified or reverted in this Task.
- The current bounded unit owns only the T4-012 PLAN/PROGRESS plus CURRENT and ROADMAP state transition; no frontend business code, backend code, dependency, generated output, secret, or global design file belongs to it.
- `/frontend/.playwright-cli/` and `/output/playwright/` remain ignored local evidence directories and must not be deleted, moved, force-added, or included without new explicit scope.
- Preserve unrelated future worktree changes; never reset, clean, or overwrite them.

## Historical Evidence

- T4-003 report: `ai/reports/REPORT-T4-003-DIRECT.md`
- T4-004 report: `ai/reports/REPORT-T4-004.md`
- T4-007 report: `ai/reports/REPORT-T4-007.md`
- T4-008 report: `ai/reports/REPORT-T4-008.md`
- T4-009 report: `ai/reports/REPORT-T4-009.md`
- Former CURRENT timeline: `ai/state/archive/CURRENT-HERMES-THROUGH-2026-07-10.md`
- Frozen Hermes operating files: `ai/automation/archive/hermes-retired-2026-07-10/`
