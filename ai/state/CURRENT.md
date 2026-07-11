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

- Task: `T4-012 Unit A - Canvas decomposition and persistence`
- State: `TODO - NEXT`
- Task file: `ai/tasks/todo/TASK-T4-012.md`
- Plan: not created; target `ai/tasks/doing/TASK-T4-012-PLAN.md`
- Progress: not created; target `ai/tasks/doing/TASK-T4-012-PROGRESS.md`
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

- T4-012 Unit A is dependency-ready because T4-007, T4-010, and T4-011 are complete.
- No T4-012 PLAN, PROGRESS, implementation, runtime mutation, or browser evidence exists yet.
- The first bounded unit must audit CanvasStage, canvas store/types, Workspace route/project ownership, and existing node/connection API contracts before choosing decomposition and persistence boundaries.
- Unit B advanced connection interaction, selection, context menu, minimap, keyboard, and responsive QA must not start until Unit A persistence and rollback gates pass.

## Exact Next Action

Create `ai/tasks/doing/TASK-T4-012-PLAN.md` and `ai/tasks/doing/TASK-T4-012-PROGRESS.md`, then audit CanvasStage, canvas store/types, Workspace integration, and the existing node/connection APIs before any T4-012 business-code edit.

## Current Blockers

- T4-012 Unit A has no recorded Human gate or dependency blocker.
- T4-005 Unit B real Agnes smoke remains a separate Human cost gate and must not run without explicit authorization.
- The backend direct registration API 72-byte password boundary remains a separate normal engineering follow-up.
- Existing backend asset ordering lacks a stable secondary key when MySQL `created_at` values tie within one second; route this to a future backend follow-up without reopening completed T4-009.
- No push is authorized; local cleanup and closure commits remain local until the Human Owner explicitly requests push.

## Worktree Protection

- The T4-009 closure run started from clean `main` at `8e6cba89e029ab587ffbd3cba3b3c9e575e3330a`, with no staged, modified, untracked, unmerged, detached, or in-progress Git-operation state.
- The Codex task-list single-flight query was unavailable, so branch/HEAD/index and Git-operation state must remain unchanged through staging and commit.
- The closure commit owns only `ai/reports/REPORT-T4-009.md`, T4-009 Task/PLAN/PROGRESS, ROADMAP, CURRENT, and `pitfalls.md`. No implementation, backend, dependency, generated output, secret, or global design file belongs to this commit.
- `/frontend/.playwright-cli/` and `/output/playwright/` are ignored local evidence directories. Their files remain on disk and must not be deleted, moved, force-added, or included in delivery commits without a new explicit scope.
- `/.playwright-cli/page-2026-07-11T15-29-19-414Z.yml` is a current-run untracked browser snapshot created before the CLI working directory was corrected. Deletion or moving was not authorized; preserve it and never stage it with T4-009 closure.
- Preserve unrelated future worktree changes; never reset, clean, or overwrite them.

## Historical Evidence

- T4-003 report: `ai/reports/REPORT-T4-003-DIRECT.md`
- T4-004 report: `ai/reports/REPORT-T4-004.md`
- T4-007 report: `ai/reports/REPORT-T4-007.md`
- T4-008 report: `ai/reports/REPORT-T4-008.md`
- T4-009 report: `ai/reports/REPORT-T4-009.md`
- Former CURRENT timeline: `ai/state/archive/CURRENT-HERMES-THROUGH-2026-07-10.md`
- Frozen Hermes operating files: `ai/automation/archive/hermes-retired-2026-07-10/`
