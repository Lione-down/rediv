# TASK-T5-003 - Multi-canvas schema, APIs, duplication, and compatibility

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5
- Dependency: T5-002 `DONE - PASS`
- Owner: Codex Project Lead Engineer
- Started: 2026-07-13

## Objective

Move graph ownership from an implicit project canvas to explicit project-owned canvases without breaking the Phase 4 workspace during the migration window.

## Scope

- expand-first MySQL schema and deterministic backfill;
- one active first canvas named `画布 1` for every existing and newly created project;
- canvas-scoped nodes, connections, groups, viewport, graph revision, and durable revision storage;
- database constraints that reject cross-project and cross-canvas graph references;
- canvas metadata create/list/read/rename/reorder and transactional duplication APIs;
- first-active-canvas compatibility for legacy project-scoped graph routes;
- focused real-MySQL integration and backend regression evidence.

## Non-goals

- frontend route/store migration or V2 visual work (T5-004);
- command interaction, grouping UI, and renderer changes (T5-005);
- graph mutation queue, conflict handling, and revision restore APIs (T5-006);
- node registry and generation-origin rollout (T5-007);
- hard Canvas deletion or destructive user-database cleanup.

## Delivery Units

1. Unit A - expand-first schema, models, safe backfill, atomic default canvas creation, and legacy first-canvas compatibility.
2. Unit B - authenticated canvas metadata APIs with order revision and last-active protection.
3. Unit C - transactional canvas duplication with graph ID remapping.
4. Unit D - full T5-003 MySQL/API regression, compatibility closure, documentation, and REPORT.

## Acceptance Criteria

- [x] Every project has at least one active canvas and new project creation atomically creates `画布 1`.
- [x] Existing node and connection IDs survive migration unchanged.
- [x] Every graph row has a non-null `canvas_id` and no orphan or cross-canvas edge exists.
- [x] MySQL enforces canvas/project scope, endpoint scope, group-parent scope, comments, indexes, and uniqueness contracts.
- [x] Legacy project-scoped graph APIs resolve only the first active canvas until frontend migration.
- [x] Canvas create, list, read, rename, reorder, and duplicate operations enforce authentication and project ownership.
- [x] Reorder is atomic, dense, complete, and returns 409 for stale order revisions without partial writes.
- [x] Duplicate remaps node IDs, group parents, and endpoints transactionally while preserving project-scoped asset references.
- [x] Focused MySQL tests, relevant backend regression, Alembic single-head, diff, and secret-hygiene gates pass.

## Linked Decisions And Specifications

- `ai/decisions/ADR-004-mysql-only-runtime-and-tests.md`
- `ai/decisions/ADR-005-project-multi-canvas.md`
- `ai/architecture/REVID-V2-CANVAS-ARCHITECTURE.md`
- `ai/requirements/REVID-V2-CANVAS-ACCEPTANCE.md`

## Risks And Controls

- Migration scope corruption: validate and backfill from project ownership before non-null and composite constraints.
- Unsafe rollback after multiple canvases: keep rollout expand-first and use forward fixes; never flatten automatically.
- Dirty-worktree overlap: stage only the exact owned unit paths and preserve unrelated changes.
- Database safety: run migration tests only on exact-name guarded `revid_test_*` schemas with identity checks.
