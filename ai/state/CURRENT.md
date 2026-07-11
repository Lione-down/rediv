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

- Task: `T4-012 - Canvas interaction and persistence`
- State: `DOING`
- Active delivery: `Unit B - Advanced Interaction And Visual Acceptance` (`DOING`; Units B1-B2 `DONE - PASS`)
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

## T4-012 Current Objective

Unit A is frozen as `DONE - PASS`. Units B1-B2 are also `DONE - PASS`: selection/keyboard semantics plus scoped context actions, optimistic duplicate/delete, and world-coordinate double-click creation are verified. Unit B3 must close connection/minimap behavior and responsive real-browser acceptance without reopening the backend contract.

## T4-012 Scope

- Allowed edits: CanvasStage, canvas store/types, and Workspace project integration.
- Allowed additions: `frontend/src/modules/canvas/**`, Canvas-specific composables, and decomposition components.
- Forbidden: backend contract, Auth, Home, Space, global design-token, or second-canvas-engine changes.
- Unit A acceptance is complete. Unit B remains limited to connection interaction, selection, context menu, minimap/keyboard behavior, and responsive browser acceptance.

## Latest T4-012 Progress

- Unit A Units 1 through 5 are complete and frozen as `DONE - PASS`.
- Typed Canvas DTO/API functions and explicit render-model mappers now cover node list/create/update/delete plus connection list/create/delete contracts without leaking backend field names into Canvas rendering.
- The Canvas store no longer initializes fixture nodes or connections; it tracks active project/loading/error state and loads both collections with project-generation, session, and local-revision guards.
- Workspace normalizes the route `project_id`, clears stale project data for a missing/new ID, and immediately binds valid project context to guarded Canvas loading.
- Node/connection create/delete now use optimistic temporary entities, server-ID reconciliation, ownership-safe rollback, duplicate-edge suppression, and node-delete connection snapshots.
- Pointer-up moves use a per-node 400 ms trailing queue with confirmed/desired positions, serialized requests, newer-intent protection, and awaitable flush; Workspace surfaces mutation failures through `NMessage`.
- Controlled local-browser failures verified one PUT per drag, exact store/minimap/Leafer position rollback, visible move errors, connection ghost removal, and retryability without any real backend, database, secret, or paid call.
- Pure geometry/viewport, Leafer rendering, pointer interaction, scoped visual styling, and persistence lifecycle now have separate Canvas-local modules; Workspace route leave and project-route update guards await pending moves, and unmount performs a best-effort fallback.
- Controlled interaction QA verified wheel zoom, middle-button pan, and a successful SPA route leave that waited for one deliberately delayed queued PUT before navigation.
- Real local FastAPI/MySQL/API/browser acceptance passed load, store create, pointer move, connection create/delete, node delete/cascade, refresh recovery, and A/B route isolation using normal mock auth without a paid call or secret read.
- Controlled browser failures passed create/move/delete node and create/delete connection rollback with visible errors, exact graph restoration, selection restoration that preserves newer intent, and no temporary ghosts.
- Deep review fixed missing/loading/error/empty Canvas states with retry, removed pointermove full-scene rebuilds, and closed temporary node/connection rekey races by stabilizing server identity and settling all related in-flight edge creates before delete snapshots.
- A temp node plus two concurrent temp edges deleted successfully through the real API; all four promises fulfilled and refresh retained only the original 2 nodes/1 server edge.
- Focused backend Canvas CRUD regression passed 19/19; the final production build passed with 4,701 modules.
- Final sizes are `CanvasStage.vue` 89, `canvas.ts` 227, `use-canvas-stage.ts` 317, `mutations.ts` 434, and all Canvas-local files remain below 500 lines.
- Generation status/content persistence remains outside Unit A's locked scope; lack of a tracked frontend test runner remains a structural risk mitigated here with controlled and real browser/API evidence.
- Unit B1 added ordered multi-selection while retaining one primary node for existing Inspector/generation consumers; selection revisions protect rollback from newer intent.
- Default and modifier selection, marquee replacement/addition, editable-safe Delete/Backspace, Escape clear/cancel, and selected node/minimap visuals are implemented.
- Controlled browser QA passed cancelled-drag restoration, two failed multi-delete rollbacks, and marquee hit testing after 50% zoom plus middle-button pan; final network evidence contained 2 expected DELETE 503 responses and no selection-click PUT.
- Final Unit B1 build passed with 4,701 modules, backend Canvas regression passed 19/19, and every Canvas-local file remains below 500 lines.
- Unit B2 added scoped `NDropdown` stage text/image actions and node duplicate/delete actions through existing optimistic mutations and visible failure reporting.
- Reverse-order world-space hit testing makes node/stage context and double-click behavior deterministic after zoom/pan despite Leafer context-menu target differences.
- Controlled browser QA passed duplicate, exact failed delete rollback with visible error, stage image creation, 50% zoom plus pan double-click creation at the expected world coordinate, 375px menu containment, and Escape close.
- Final Unit B2 build passed with 4,702 modules, backend Canvas regression passed 19/19, and the stage/renderer/stage-composable/context-composable remain 110/193/425/108 lines.

## Exact Next Action

Execute Unit B3 connection hit/selection and minimap navigation/viewport checks across 25%-200% zoom, then run 1440x900, 920x900, and 375x900 real-browser acceptance without reopening Unit A backend contracts.

## Current Blockers

- T4-012 Units A, B1, and B2 have no remaining blocker; Unit B3 has no recorded Human gate or dependency blocker.
- T4-005 Unit B real Agnes smoke remains a separate Human cost gate and must not run without explicit authorization.
- The backend direct registration API 72-byte password boundary remains a separate normal engineering follow-up.
- Existing backend asset ordering lacks a stable secondary key when MySQL `created_at` values tie within one second; route this to a future backend follow-up without reopening completed T4-009.
- No push is authorized; local cleanup and closure commits remain local until the Human Owner explicitly requests push.

## Worktree Protection

- This run started from `main` at `0323ad018d1d9b744a088dfcab1b556b095f6988`, with no staged, modified, unmerged, detached, or in-progress Git-operation state; 26 documented root Playwright snapshots were the only pre-existing untracked paths.
- Single-flight task-list capability was unavailable; branch/HEAD/index and Git-operation state are the concurrency baseline for this run.
- Pre-run commit `5b64ca1` contains only the formerly untracked zero-byte root Playwright snapshot and is already `origin/main`; it is outside T4-012 ownership and must not be modified or reverted in this Task.
- The current bounded unit owns only Unit B2 Canvas context/double-click paths plus T4-012 PLAN/PROGRESS, ROADMAP, and CURRENT; no backend code, dependency, generated output, secret, or global design file belongs to the commit.
- Thirty-nine root `.playwright-cli/*.yml` snapshots are untracked browser evidence (26 pre-existing plus 13 created by this run); preserve and exclude them from staging pending a separate cleanup decision.
- `/frontend/.playwright-cli/` and `/output/playwright/` remain ignored local evidence directories and must not be deleted, moved, force-added, or included without new explicit scope.
- Two normal local mock users, two projects, three final nodes, and one final connection remain in MySQL as non-production Unit 5 fixture evidence; broad cleanup was not authorized.
- Preserve unrelated future worktree changes; never reset, clean, or overwrite them.

## Historical Evidence

- T4-003 report: `ai/reports/REPORT-T4-003-DIRECT.md`
- T4-004 report: `ai/reports/REPORT-T4-004.md`
- T4-007 report: `ai/reports/REPORT-T4-007.md`
- T4-008 report: `ai/reports/REPORT-T4-008.md`
- T4-009 report: `ai/reports/REPORT-T4-009.md`
- Former CURRENT timeline: `ai/state/archive/CURRENT-HERMES-THROUGH-2026-07-10.md`
- Frozen Hermes operating files: `ai/automation/archive/hermes-retired-2026-07-10/`
