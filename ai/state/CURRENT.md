# Revid Current Project State

Last updated: 2026-07-13

## Delivery Mode

- Mode: `CODEX_DIRECT_DELIVERY`
- Engineering owner: Codex Project Lead Engineer
- Human Owner gates: product direction, paid calls, real secrets, destructive or irreversible operations
- Hermes: retired; no Queue, card, profile, Reviewer, HANDOFF, or runtime reconciliation is active
- Delivery decision: `ai/decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md`

## Product State

- Phase 4 initial version: `COMPLETE - PASS`
- Product V2 / Phase 5: active
- V2 priority: Canvas first acceptance
- Visual direction: premium graphite-black and dark-purple system
- Database direction: MySQL-only; runtime/test/tooling/security closure passed in T5-002, and multi-canvas persistence foundation passed in T5-003

## Active Delivery

- Active implementation Task: none
- Latest completed Task: `T5-004 - V2 Canvas shell, navigation, and viewport persistence`
- State: `DONE - PASS`
- Task: `ai/tasks/todo/TASK-T5-004.md`
- Plan: `ai/tasks/doing/TASK-T5-004-PLAN.md`
- Progress: `ai/tasks/doing/TASK-T5-004-PROGRESS.md`
- Report: `ai/reports/REPORT-T5-004.md`
- Next Task: `T5-005 - incremental renderer and command interactions` (`TODO`, Task documents not yet created)

## Previous Completed Task

- Task: `T5-003 - Multi-canvas MySQL schema, safe backfill, APIs, duplication, and compatibility route`
- State: `DONE - PASS`
- Task: `ai/tasks/todo/TASK-T5-003.md`
- Plan: `ai/tasks/doing/TASK-T5-003-PLAN.md`
- Progress: `ai/tasks/doing/TASK-T5-003-PROGRESS.md`
- Report: `ai/reports/REPORT-T5-003.md`
- Outcome: guarded MySQL expand-first migration, atomic default Canvas, strict metadata APIs, optimistic ordering, first-canvas compatibility, and transactional duplication with complete graph ID remapping all passed closure.

## Locked V2 Documents

- PRD: `ai/requirements/REVID-V2-PRD.md`
- Canvas acceptance: `ai/requirements/REVID-V2-CANVAS-ACCEPTANCE.md`
- Canvas architecture: `ai/architecture/REVID-V2-CANVAS-ARCHITECTURE.md`
- V2 design system: `ui/REVID-V2-DESIGN-SYSTEM.md`
- MySQL-only ADR: `ai/decisions/ADR-004-mysql-only-runtime-and-tests.md`
- Multi-canvas ADR: `ai/decisions/ADR-005-project-multi-canvas.md`
- Roadmap: `ai/state/ROADMAP.md`

## Current Facts And Risks

- T5-002 and T5-003 are `DONE - PASS`; runtime and database-backed tests remain MySQL-only and fail closed.
- Alembic head `f0a1b2c3d4e5` adds Canvas ownership, deterministic backfill, graph scope constraints, comments, ordering revision, viewport state, and revision storage foundation while preserving legacy graph IDs.
- New project creation inserts Project and `画布 1` atomically; legacy project-scoped graph routes expose only the first active Canvas during the frontend migration window.
- Canvas metadata APIs enforce authentication and ownership; create, archive, reorder, and duplicate use optimistic project order revision and atomic transactions.
- Reorder requires an exact active-ID permutation and persists dense order; archive rejects the last active Canvas.
- Duplication copies viewport and graph content into new IDs, remaps group parents and endpoints, retains project-shared asset references, and rolls back completely on conflict or commit failure.
- T5-003 closure passed 44 focused guarded MySQL/API/compatibility tests and 186 full backend tests plus 5 subtests; Alembic has one head.
- The canonical frontend Canvas route, strict metadata client/store, server-revision handling, validated user/project preference, and legacy first-active redirect passed Unit B browser/build evidence.
- The canonical route now renders a dedicated full-screen V2 shell with route-local tokens, project/Canvas identity, metadata navigation, contextual generation, save/recovery context, and no permanent app bar or inspector.
- Create, rename, reorder, switch, duplicate, and archive use the serialized server-revision store; stale order reload, last-active protection, and server-confirmed route navigation passed focused browser evidence.
- Widths below 768 px render a real review-only boundary that blocks graph and metadata mutations while retaining selection, pan, zoom, minimap, and Canvas switching.
- Unit C passed 4 focused shell tests, 12 full Chromium tests, the four required viewports, real screenshot review, and a 4711-module production build.
- Canonical graph reads now use one authenticated project/Canvas document boundary, and node/connection mutations use explicit Canvas-scoped paths with active ownership and entity isolation checks.
- Viewports restore independently per Canvas and persist through finite normalization, exact deduplication, a 500 ms debounce, and route-exit flushing without advancing graph revision.
- Unit D passed 3 focused guarded MySQL tests, 39 Canvas backend regression tests, 189 full backend tests, 14 full Chromium tests, and a 4711-module production build.
- Unit E corrected Chinese document language, 40px Canvas-switch geometry, reduced-motion stage animation, and the shared focus-ring alpha after real Chromium measured the prior ring at 2.52:1.
- T5-004 closure passed 6 focused shell tests, 16 full Chromium tests, a 4711-module production build, and real screenshot review at 1440x900, 1366x768, 920x900, and 375x812.
- The migration has not been applied to a user/runtime database and requires normal backup and Human migration authorization.
- Ignored local `.db` artifacts and the pre-existing `revid_test_db` remain untouched; credential rotation remains a separate Human gate only if the removed T5-002 assignment was real or reused.

## Exact Next Action

Create and activate T5-005 Task/PLAN/PROGRESS, inspect the existing Leafer renderer and interaction boundary, and define its first dependency-ready unit before business-code edits.

## Blockers And Release Conditions

- No blocker prevents T5-005 repository planning and implementation.
- Applying `f0a1b2c3d4e5` to user/runtime data requires reviewed backup discipline and Human migration authorization.
- Credential rotation becomes Human-required only if the removed assignment was ever real or reused.
- Local ignored `.db` deletion requires exact-path Human approval after MySQL backup/parity evidence.
- The pre-existing `revid_test_db` schema requires ownership confirmation before destructive cleanup.

## Worktree Protection

- Unit E started from clean `main` at `04d4a5ab729aa6bde2812296272f17102ad77567`.
- Pre-existing staged, tracked-modified, untracked, unmerged, detached, and in-progress Git-operation state: none.
- Root `.playwright-cli/`, `output/runtime/`, and local runtime evidence are ignored and excluded from delivery staging.
- Ignored `.env` and `.db` artifacts must not be opened, deleted, moved, or committed without explicit authorization.

## Delivery Automation

- Automation: `revid-codex-direct-delivery-controller`
- Commit/push policy: each completed verified unit ends in a scoped commit and an `origin` push after staged secret hygiene and diff review; no WIP or empty commit/push
- Automation memory is only a cursor and never overrides this file, ROADMAP, Tasks, code, tests, or runtime evidence.
- Project conversation archive: `ai/state/archive/PROJECT-CONVERSATION-ARCHIVE-THROUGH-2026-07-13.md`
