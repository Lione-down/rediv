# Report: T5-003 multi-canvas schema, APIs, duplication, and compatibility

## Result

`DONE - PASS` on 2026-07-13.

Revid now has an expand-first MySQL multi-canvas persistence foundation, authenticated Canvas metadata operations, optimistic atomic ordering, transactional duplication, and a first-active-canvas compatibility path that keeps the Phase 4 workspace usable until T5-004 migrates the frontend.

## Delivered

- Added Canvas and CanvasRevision persistence, project order revision, graph Canvas ownership, group fields, viewport state, comments, indexes, uniqueness, and composite scope constraints.
- Added a guarded Alembic migration that creates one deterministic `画布 1` per existing project, preserves existing node/connection IDs, validates invariants, and makes graph Canvas ownership non-null.
- Made new project creation atomically insert Project and its first Canvas.
- Scoped legacy node and connection routes to the first active Canvas and rejected cross-Canvas detail access and endpoints.
- Added authenticated create/list/read/rename/archive/reorder Canvas APIs with ownership checks, Project row locking, optimistic revision conflicts, dense order, exact permutations, and last-active protection.
- Added transactional Canvas duplication with copied viewport, independent graph revision 0, new Canvas/node/connection IDs, remapped group parents and endpoints, and preserved project-scoped asset references.
- Verified stale revisions and forced commit failures produce no partial Canvas, graph, or order-revision writes.

## Acceptance Evidence

| Gate | Evidence | Result |
|---|---|---|
| First Canvas invariant | Migration backfill and atomic project creation tests | PASS |
| Backfill identity | Existing node and connection IDs compared before/after migration | PASS |
| Non-null and graph integrity | Migration preflight plus MySQL null/orphan/cross-scope constraints | PASS |
| Schema contract | MySQL comment, index, uniqueness, project/Canvas, endpoint, and group-parent inspection | PASS |
| Legacy compatibility | First-active-Canvas node/connection API isolation tests | PASS |
| Authentication and ownership | Canvas metadata and duplication API negative tests | PASS |
| Atomic dense reorder | Exact-permutation persistence and stale/no-partial-write tests | PASS |
| Transactional duplication | New IDs, parent/endpoint remap, shared asset references, stale and forced rollback tests | PASS |
| Focused closure | Migration, metadata, duplication, project, node, and connection suites, 44/44 | PASS |
| Full backend regression | 186 tests plus 5 subtests in 154.59 seconds | PASS |
| Alembic | Single head `f0a1b2c3d4e5` | PASS |
| Disposable cleanup | Only pre-existing untouched `revid_test_db` remains | PASS |
| Diff and hygiene | Fresh review, `git diff --check`, UTF-8, sensitive-path, secret-candidate, and tracked DB gates | PASS |

## Compatibility And Deferred Boundaries

- Legacy project-scoped graph routes intentionally resolve only the first active Canvas until T5-004 switches the frontend to explicit Canvas identity.
- Graph document mutation, idempotent revision history, restore, and autosave conflict handling belong to T5-006.
- Project assets remain shared by reference; generation-origin expansion belongs to the later Canvas delivery sequence.
- Browser, visual, performance, and full Canvas accessibility acceptance remain T5-004 through T5-008 work and are not claimed by this backend Task.

## Human Owner Gates Remaining

- Applying `f0a1b2c3d4e5` to a user/runtime database requires reviewed backup discipline and Human migration authorization.
- Ignored local `.db` artifacts and the pre-existing `revid_test_db` schema remain untouched pending exact authorization and ownership confirmation.
- Credential rotation remains required only if the removed T5-002 assignment was ever real or reused.

These gates do not invalidate T5-003 repository acceptance because no user/runtime migration or destructive cleanup was in scope.

## Next Task

Create and activate T5-004 Task/PLAN/PROGRESS before implementing the shared V2 token source, full-screen Canvas shell, explicit Canvas route/navigation, and viewport persistence.
