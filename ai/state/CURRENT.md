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

- Units 1 through 4 are complete: the contract/decomposition map, project-scoped load foundation, optimistic mutations, rollback, move queue, CanvasStage decomposition, and route persistence lifecycle are implemented and production-build verified.
- Typed Canvas DTO/API functions and explicit render-model mappers now cover node list/create/update/delete plus connection list/create/delete contracts without leaking backend field names into Canvas rendering.
- The Canvas store no longer initializes fixture nodes or connections; it tracks active project/loading/error state and loads both collections with project-generation, session, and local-revision guards.
- Workspace normalizes the route `project_id`, clears stale project data for a missing/new ID, and immediately binds valid project context to guarded Canvas loading.
- Node/connection create/delete now use optimistic temporary entities, server-ID reconciliation, ownership-safe rollback, duplicate-edge suppression, and node-delete connection snapshots.
- Pointer-up moves use a per-node 400 ms trailing queue with confirmed/desired positions, serialized requests, newer-intent protection, and awaitable flush; Workspace surfaces mutation failures through `NMessage`.
- Controlled local-browser failures verified one PUT per drag, exact store/minimap/Leafer position rollback, visible move errors, connection ghost removal, and retryability without any real backend, database, secret, or paid call.
- Pure geometry/viewport, Leafer rendering, pointer interaction, scoped visual styling, and persistence lifecycle now have separate Canvas-local modules; Workspace route leave and project-route update guards await pending moves, and unmount performs a best-effort fallback.
- Controlled interaction QA verified wheel zoom, middle-button pan, and a successful SPA route leave that waited for one deliberately delayed queued PUT before navigation.
- `CanvasStage.vue` is 76 lines, `canvas.ts` 227, `mutations.ts` 411, `use-canvas-stage.ts` 286, and every new Unit 4 file is below 500 lines.
- Unit B advanced selection, context menu, minimap work, keyboard behavior, and responsive QA remains gated on Unit A persistence and rollback acceptance.

## Exact Next Action

Implement Unit 5 only: run focused backend node/connection regression plus authorized local FastAPI/MySQL real load, create, move, connect, delete, refresh, and route-isolation acceptance; repeat remaining mutation failure classes, then fresh-review and close Unit A only if every gate passes.

## Current Blockers

- T4-012 Unit A has no recorded Human gate or dependency blocker.
- T4-005 Unit B real Agnes smoke remains a separate Human cost gate and must not run without explicit authorization.
- The backend direct registration API 72-byte password boundary remains a separate normal engineering follow-up.
- Existing backend asset ordering lacks a stable secondary key when MySQL `created_at` values tie within one second; route this to a future backend follow-up without reopening completed T4-009.
- No push is authorized; local cleanup and closure commits remain local until the Human Owner explicitly requests push.

## Worktree Protection

- This run started from `main` at `8ea8e84b9434d4805e00529158f51dbf29dd0861`, with no staged, modified, unmerged, detached, or in-progress Git-operation state; ten documented root Playwright snapshots were the only pre-existing untracked paths.
- Codex task-list capability was unavailable, so branch/HEAD/index and Git-operation state must remain unchanged through staging and commit.
- Pre-run commit `5b64ca1` contains only the formerly untracked zero-byte root Playwright snapshot and is already `origin/main`; it is outside T4-012 ownership and must not be modified or reverted in this Task.
- The current bounded unit owns only the Canvas stage decomposition modules, minimal Workspace persistence lifecycle bridge, T4-012 PROGRESS, and CURRENT paths documented above; no backend code, dependency, generated output, secret, or global design file belongs to the commit.
- Fifteen root `.playwright-cli/page-2026-07-11T16-*.yml` snapshots are untracked browser evidence generated across the prior and current runs; preserve and exclude them from staging pending a separate cleanup decision.
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
