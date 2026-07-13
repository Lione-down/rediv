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
- Database direction: MySQL-only; runtime, test, tooling, security, and closure acceptance passed in T5-002

## Active Delivery

- Active implementation Task: `T5-003 - Multi-canvas MySQL schema, safe backfill, APIs, duplication, and compatibility route`
- State: `DOING`
- Task: `ai/tasks/todo/TASK-T5-003.md`
- Plan: `ai/tasks/doing/TASK-T5-003-PLAN.md`
- Progress: `ai/tasks/doing/TASK-T5-003-PROGRESS.md`
- Latest bounded unit: Unit B - authenticated Canvas metadata and optimistic ordering APIs (`COMPLETE - PASS`)
- Exact next unit: Unit C - transactional Canvas duplication and graph ID remapping
- Dependency: T5-002 complete

## Latest Completed Task

- Task: `T5-002 - P0 credential cleanup and complete MySQL-only retirement`
- State: `DONE - PASS`
- Task: `ai/tasks/todo/TASK-T5-002.md`
- Plan: `ai/tasks/doing/TASK-T5-002-PLAN.md`
- Progress: `ai/tasks/doing/TASK-T5-002-PROGRESS.md`
- Report: `ai/reports/REPORT-T5-002.md`
- Outcome: tracked credential literal removed without disclosure; runtime/tests/tooling are MySQL-only and fail closed; security configuration, schema/FK, restart persistence, full regression, static retirement, and hygiene gates passed.

## Locked V2 Documents

- PRD: `ai/requirements/REVID-V2-PRD.md`
- Canvas acceptance: `ai/requirements/REVID-V2-CANVAS-ACCEPTANCE.md`
- Canvas architecture: `ai/architecture/REVID-V2-CANVAS-ARCHITECTURE.md`
- V2 design system: `ui/REVID-V2-DESIGN-SYSTEM.md`
- MySQL-only ADR: `ai/decisions/ADR-004-mysql-only-runtime-and-tests.md`
- Multi-canvas ADR: `ai/decisions/ADR-005-project-multi-canvas.md`
- Roadmap: `ai/state/ROADMAP.md`

## Current Facts And Risks

- T5-002 is `DONE - PASS`; runtime and database-backed tests remain MySQL-only and fail closed.
- Unit A adds Alembic head `f0a1b2c3d4e5`, `canvases`, `canvas_revisions`, graph `canvas_id`, group fields, project order revision, and composite MySQL scope constraints with non-empty comments.
- Migration-from-previous-head evidence created one deterministic `画布 1` per project and preserved existing node and connection IDs.
- New project creation inserts Project then `画布 1` in one transaction; legacy graph routes resolve and expose only the first active canvas.
- Database constraints reject cross-canvas connection endpoints; focused verification passed 32/32 and full backend regression passed 174 tests plus 5 subtests.
- Unit B adds strict authenticated Canvas create/list/read/rename/archive/reorder APIs with request-scoped ownership checks and deterministic active ordering.
- Create, archive, and reorder lock the Project row, enforce `base_order_revision`, increment it atomically, and return HTTP 409 on stale requests without partial writes.
- Reorder requires an exact active-ID permutation and writes dense zero-based order; archive compacts remaining order and rejects the last active Canvas.
- Unit B focused verification passed 40/40 and full backend regression passed 182 tests plus 5 subtests; Alembic remains at the single head `f0a1b2c3d4e5`.
- All disposable schemas created by this run were cleaned; only the pre-existing untouched `revid_test_db` remains.
- The new migration has not been applied to a user/runtime database. Application requires the normal reviewed migration and backup discipline before that runtime can use this code.
- Canvas duplication and the explicit frontend route are not implemented yet; Unit C duplication is next.
- Ignored local `.db` artifacts remain untouched; credential rotation remains a separate Human gate only if the removed T5-002 assignment was real or reused.

## Exact Next Action

Implement T5-003 Unit C transactional Canvas duplication with graph ID remapping and rollback evidence.

## Blockers And Release Conditions

- Credential rotation becomes Human-required only if the assignment was ever real or reused; release by rotating it in the owning system and recording only the outcome.
- Local ignored `.db` artifact deletion is blocked pending exact-path Human approval after MySQL backup and parity evidence.
- The pre-existing `revid_test_db` schema requires ownership confirmation before destructive cleanup; it does not block T5-003 planning or implementation.
- Human Owner standing authorization (2026-07-13): scheduled delivery may push completed, verified, scoped commits to `origin` for this repository. This does not authorize secret access, paid calls, operations outside this project, or destructive user/production-data operations.

## Worktree Protection

- Unit B run started from clean `main` at `d8352bad80fc217ad1c4c3cb991ef83c1c648048`.
- Pre-existing staged, tracked-modified, unmerged, detached, and in-progress Git-operation state: none.
- Root `.playwright-cli/`, `output/runtime/`, and local runtime evidence are ignored and excluded from delivery staging.
- Ignored `.env` and `.db` artifacts must not be opened, deleted, moved, or committed without explicit authorization.

## Delivery Automation

- Automation: `revid-codex-direct-delivery-controller`
- Commit/push policy: each completed verified unit ends in a scoped commit and an `origin` push after staged secret hygiene and diff review; no WIP or empty commit/push
- Automation memory is only a cursor and never overrides this file, ROADMAP, Tasks, code, tests, or runtime evidence.
- Project conversation archive: `ai/state/archive/PROJECT-CONVERSATION-ARCHIVE-THROUGH-2026-07-13.md`
