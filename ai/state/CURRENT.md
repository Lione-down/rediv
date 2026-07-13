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

- Active implementation Task: `T5-006 - Autosave, conflicts, history, and recovery`
- State: `DOING`
- Completed units: Unit A - atomic backend document PATCH and Unit B - frontend autosave/recovery (`COMPLETE - PASS`)
- Next unit: Unit C - Canvas-scoped 100-step undo/redo
- Task: `ai/tasks/todo/TASK-T5-006.md`
- Plan: `ai/tasks/doing/TASK-T5-006-PLAN.md`
- Progress: `ai/tasks/doing/TASK-T5-006-PROGRESS.md`
- Previous report: `ai/reports/REPORT-T5-005.md`

## Previous Completed Task

- Task: `T5-004 - V2 Canvas shell, navigation, and viewport persistence`
- State: `DONE - PASS`
- Task: `ai/tasks/todo/TASK-T5-004.md`
- Plan: `ai/tasks/doing/TASK-T5-004-PLAN.md`
- Progress: `ai/tasks/doing/TASK-T5-004-PROGRESS.md`
- Report: `ai/reports/REPORT-T5-004.md`
- Outcome: canonical multi-Canvas routing, full-screen V2 shell, server-revision metadata navigation, exact graph scope, independent viewport persistence, mobile review boundary, and accessibility closure all passed.

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
- T5-005 is `DONE - PASS`: one persistent keyed Leafer world, typed convergent commands, deterministic selection/multi-drag/group/connect/arrange/lock, synchronized DOM graph access, and 10%-800% view controls are complete.
- Unit E adds requestAnimationFrame pointer coalescing, world-space SVG edges under one transform, memoized stable subtrees, 15 FPS minimap sampling, official axe analysis, and exact 200-node/300-connection mock-browser evidence.
- Final performance recorded a 330 ms stable render, 60.03 FPS average, 16.8 ms frame p95, 4.2 ms pointer p95, no observed interaction long task, and 11.93 minimap updates/s on Chromium 149 SwiftShader with hardware acceleration disabled.
- T5-005 closure passed Unit E 3/3, full Chromium 36/36, guarded backend 190/190, a 4731-module build, four required viewport screenshots, fresh diff review, and hygiene gates; `REPORT-T5-005.md` is authoritative.
- T5-006 Unit A is `COMPLETE - PASS`: `PATCH /document` now validates and commits one exact-Canvas graph batch, durable revision, and head advance in a serialized MySQL transaction.
- Unit A resolves matching mutation IDs before base validation with locking/current reads, returns exact retry results after application/store reconstruction, rejects fingerprint reuse and stale bases with structured 409 details, and preserves zero partial writes on invalid batches.
- RFC 8785 canonical JSON fingerprinting, normalized implicit edge/group-child changes, ownership/scope validation, and restart persistence passed focused guarded MySQL evidence.
- Unit A passed 10/10 focused tests, 44/44 Canvas backend regression, 196/196 full backend regression, compile/static/UTF-8/file-size/diff hygiene, and fresh concurrency review.
- T5-006 Unit B is `COMPLETE - PASS`: canonical frontend graph edits now use a serialized 500 ms atomic document autosave queue with optimistic local UUIDs, stable mutation-ID retry, committed-only revision advancement, and exact `Saving/Saved/Error/Conflict` state.
- Unsent, in-flight, failed, and conflicted work is retained in versioned user/project/Canvas local recovery storage; clean navigation does not delete a recovery detected after reload.
- Canvas switch and route exit await graph plus viewport flush, page hide preserves recovery synchronously, and a failed retry blocks silent navigation loss while retaining the local copy.
- Unit B passed 8/8 focused autosave browser tests, 23/23 directly affected Canvas regression, 44/44 full Chromium tests, a 4,732-module production build, and 10/10 guarded fingerprint/MySQL document contract tests.
- The existing Alembic head provides `canvases.graph_revision` and `canvas_revisions`; Unit A made no schema change or user/runtime database write.
- The migration has not been applied to a user/runtime database and requires normal backup and Human migration authorization.
- Ignored local `.db` artifacts and the pre-existing `revid_test_db` remain untouched; credential rotation remains a separate Human gate only if the removed T5-002 assignment was real or reused.

## Exact Next Action

Refresh T5-006 PLAN/PROGRESS for Unit C, inspect command serialization/inversion and Canvas-switch reset boundaries, then add failing Canvas-isolated 100-step undo/redo tests before business-code edits.

## Blockers And Release Conditions

- No Unit A or Unit B blocker remains; no blocker prevents Unit C planning and implementation.
- Applying `f0a1b2c3d4e5` to user/runtime data requires reviewed backup discipline and Human migration authorization.
- Credential rotation becomes Human-required only if the removed assignment was ever real or reused.
- Local ignored `.db` deletion requires exact-path Human approval after MySQL backup/parity evidence.
- The pre-existing `revid_test_db` schema requires ownership confirmation before destructive cleanup.

## Worktree Protection

- T5-006 Unit B started from clean `main` at `11242827daca5fcf58f476489d3a5bf01f6d4c41`.
- Pre-existing staged, tracked-modified, untracked, unmerged, detached, and in-progress Git-operation state: none.
- The Unit B worktree contains only the 16 owned Task/state/frontend/test paths; no unrelated dirty remainder was identified before delivery staging.
- Root `.playwright-cli/`, `output/runtime/`, and local runtime evidence are ignored and excluded from delivery staging.
- Ignored `.env` and `.db` artifacts must not be opened, deleted, moved, or committed without explicit authorization.

## Delivery Automation

- Automation: `revid-codex-direct-delivery-controller`
- Commit/push policy: each completed verified unit ends in a scoped commit and an `origin` push after staged secret hygiene and diff review; no WIP or empty commit/push
- Automation memory is only a cursor and never overrides this file, ROADMAP, Tasks, code, tests, or runtime evidence.
- Project conversation archive: `ai/state/archive/PROJECT-CONVERSATION-ARCHIVE-THROUGH-2026-07-13.md`
