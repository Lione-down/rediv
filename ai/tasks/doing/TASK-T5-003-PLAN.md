# TASK-T5-003 Plan

- State: `DOING`
- Active unit: Unit C - transactional Canvas duplication and graph ID remapping (`COMPLETE - PASS`)
- Updated: 2026-07-13

## Objective

Deliver the multi-canvas backend in independently mergeable units while keeping the existing application usable throughout the frontend migration window.

## Unit A - Expand-first foundation

### Scope

1. Add `Canvas` and `CanvasRevision` SQLAlchemy models and export them.
2. Add `projects.canvas_order_revision` and canvas-scope fields to graph models.
3. Add an Alembic revision that:
   - creates `canvases` and `canvas_revisions` with non-empty comments;
   - creates one deterministic first canvas per existing project;
   - adds nullable graph scope fields, backfills them, validates preflight invariants, then makes them non-null;
   - installs composite keys, foreign keys, indexes, and canvas-scoped edge uniqueness;
   - preserves all existing node and connection IDs.
4. Make database-backed project creation insert the project and `画布 1` in one transaction.
5. Make legacy project-scoped node and connection operations resolve and constrain themselves to the first active canvas.
6. Add focused tests for project default-canvas creation, compatibility scoping, schema comments/constraints, backfill identity, and cross-canvas rejection.

### Non-goals

- public canvas metadata routes;
- reorder, archive, duplicate, document mutation, or revision restore behavior;
- frontend changes;
- generation-task and asset origin-canvas expansion, which remains a later T5-003/T5-007 boundary decision.

### Success criteria

- Alembic upgrades a guarded disposable schema to one head without destructive access outside that schema.
- Existing projects/graphs backfill to exactly one first canvas with IDs unchanged.
- New projects atomically have `画布 1`.
- Legacy graph API behavior remains green and cannot cross canvas scope.
- All new or changed tables/columns have non-empty MySQL comments.
- Focused tests, backend regression, `git diff --check`, staged secret/path checks, commit, and push pass.

## Later Units

- Unit B (`COMPLETE - PASS`):
  1. Add strict Canvas request/response schemas and `/api/projects/{project_id}/canvases` routes.
  2. Implement request-scoped MySQL controllers for authenticated create/list/read/rename/archive operations.
  3. Lock the owning Project for create/archive/reorder, require `base_order_revision`, and increment it atomically.
  4. Reorder only when `ordered_canvas_ids` is the exact permutation of active Canvas IDs; persist dense zero-based order.
  5. Reject stale revisions without partial writes and reject archiving the last active Canvas.
  6. Add focused real-MySQL API tests for authentication, ownership, revision conflicts, permutation validation, dense persistence, and last-active protection.
- Unit C: deterministic transactional duplication and graph remapping.
- Unit D: complete T5-003 verification, compatibility review, REPORT, and DONE reconciliation.

## Unit C - Transactional duplication

### Scope

1. Add `POST /api/projects/{project_id}/canvases/{canvas_id}/duplicate` with required `base_order_revision` and an optional duplicate name.
2. Lock the owning Project and active Canvas set, enforce request-scoped ownership and the optimistic order revision, then append the duplicate at the dense active-order tail.
3. Copy Canvas viewport state into a new active Canvas while starting an independent graph history at revision 0.
4. Copy source graph rows with new Canvas, node, and connection IDs; insert nodes without parents first, then remap group parents and connection endpoints before commit.
5. Deep-copy node content and connection metadata so project-scoped asset references remain unchanged without sharing mutable Python payloads.
6. Increment the project order revision only in the same transaction as the complete duplicate.
7. Add guarded real-MySQL API evidence for authentication/ownership, stale revision atomicity, graph remapping, duplicate-name behavior, and forced transaction rollback.

### Non-goals

- Copying CanvasRevision history; the duplicate starts a new independent revision history at revision 0.
- Frontend routing or duplicate UI, graph document mutation APIs, hard deletion, or user/runtime database migration.
- Rewriting or cloning project-scoped assets, generation tasks, or asset IDs embedded in node content.

### Success criteria

- Duplicate requires authentication, project ownership, an active source Canvas, and the current project order revision.
- The new Canvas is appended densely, preserves viewport state, and advances `canvas_order_revision` exactly once.
- Every copied node and connection receives a new ID; group parents and edge endpoints reference only remapped nodes in the duplicate Canvas.
- Node content and connection metadata retain project-shared references exactly, while source graph rows remain unchanged.
- A stale revision or forced database failure leaves no Canvas, node, connection, or order-revision partial write.
- Focused MySQL tests, relevant backend regression, diff, staged secret hygiene, scoped commit, and push pass.

### Unit B non-goals

- Canvas duplication and graph ID remapping (Unit C).
- Hard delete, destructive purge, graph document mutation, revision restore, or frontend routing.
- Applying the migration to a user/runtime database.

### Unit B success criteria

- Canvas metadata routes require authentication and reject cross-owner access.
- Active Canvas listing is deterministic and returns the current project order revision.
- Create and archive serialize on the Project row and reject stale order revisions.
- Reorder is one transaction, accepts only an exact active-ID permutation, writes dense order, and returns HTTP 409 on stale revision without partial writes.
- The final active Canvas cannot be archived.
- Focused MySQL tests, relevant backend regression, diff, staged secret hygiene, scoped commit, and push pass.

## Verification Order

1. Python compile for changed backend modules and migration.
2. Focused pure/unit tests where applicable.
3. Guarded real-MySQL migration and compatibility integration tests.
4. Relevant backend regression suite.
5. Alembic single-head and schema/comment/FK inspection.
6. Fresh diff review, `git diff --check`, staged secret hygiene, exact staging, commit, and push.
