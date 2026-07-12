# TASK-T5-003 Progress

- State: `DOING`
- Active unit: Unit A - schema and first-canvas compatibility (`COMPLETE - PASS`)
- Updated: 2026-07-13

## Completed

- Reconstructed state from AGENTS, CURRENT, ROADMAP, ADR-002/004/005, V2 PRD, Canvas architecture, Canvas acceptance, and automation memory.
- Confirmed clean `main` baseline at `bb54a0ad934b3bf71fd373771c8fbfae71f5c265`.
- Defined the T5-003 unit sequence and bounded Unit A before business-code edits.
- Inspected current models, Alembic history, MySQL test guard, and legacy project/node/connection store paths.
- Added `Canvas` and `CanvasRevision` models, project order revision, graph canvas ownership, group fields, composite scope keys, comments, and indexes.
- Added the MySQL-only `f0a1b2c3d4e5` expand-first migration with deterministic default-canvas backfill, invariant preflight, non-null conversion, composite FKs, and guarded downgrade refusal after multiple canvases.
- New project creation now flushes Project then inserts `画布 1` in the same transaction; legacy node/connection creates and lists resolve the first active canvas.
- Legacy project-scoped detail/update/delete routes reject rows from non-first canvases, and connection validation/uniqueness is canvas-scoped.
- Added migration-from-previous-head evidence that preserves node/connection IDs, validates comments/FKs, rejects cross-canvas edges in MySQL, and verifies first-canvas route isolation.
- Unit A compile, focused, full regression, Alembic head, cleanup, and fresh-diff gates passed.
- Precisely staged 18 owned paths; cached diff, UTF-8, sensitive-path, secret-candidate, and tracked-database-artifact gates passed with zero findings.

## Remaining

- Deliver Unit B canvas metadata/order APIs, Unit C duplication, and Unit D closure in later runs.

## Exact Next Action

Create Unit B schemas/controllers/routes for authenticated canvas create/list/read/rename and optimistic full-order replacement with last-active protection.

## Files Changed

- `ai/tasks/todo/TASK-T5-003.md` - active Task contract.
- `ai/tasks/doing/TASK-T5-003-PLAN.md` - delivery plan and Unit A design.
- `ai/tasks/doing/TASK-T5-003-PROGRESS.md` - active run evidence and next action.
- `ai/state/CURRENT.md` - activate T5-003 Unit A.
- `ai/state/ROADMAP.md` - mark T5-003 active.
- `backend/migrations/versions/f0a1b2c3d4e5_add_multi_canvas_foundation.py` - expand-first schema and backfill.
- `backend/models/canvas.py`, `backend/models/canvas_revision.py` - new persistence models.
- `backend/models/project.py`, `backend/models/canvas_node.py`, `backend/models/canvas_connection.py`, `backend/models/__init__.py` - canvas ownership and exports.
- `backend/controllers/store.py` - atomic default canvas and legacy first-canvas compatibility.
- `backend/api/canvas_nodes.py`, `backend/api/canvas_connections.py` - prevent legacy cross-canvas detail access.
- `backend/tests/mysql_test_database.py` - previous-head migration test support.
- `backend/tests/test_multi_canvas_foundation.py`, `backend/tests/test_canvas_connection_crud.py` - Unit A MySQL and schema evidence.

## Commands And Results

- `git status --short`, `git diff --stat`, `git diff --name-only` - clean baseline.
- `git rev-parse HEAD` - `bb54a0ad934b3bf71fd373771c8fbfae71f5c265`.
- Required source-document reads and targeted `rg`/file inspection - Unit A boundaries confirmed.
- `backend/.venv/Scripts/python.exe -m compileall -q api controllers core models schemas settings tests migrations` - PASS.
- focused migration suite - 5/5 PASS; isolated legacy-route selection also 1/1 PASS.
- focused migration/project/node/connection suite - 32/32 PASS.
- full backend `pytest -q` - 174 tests plus 5 subtests PASS in 152.42 seconds.
- `backend/.venv/Scripts/python.exe -m alembic heads` - one head, `f0a1b2c3d4e5`.
- guarded cleanup probe - only pre-existing untouched `revid_test_db` remains.
- fresh diff review and `git diff --check` - PASS before durable-state reconciliation.
- staged verification - 18 owned paths; UTF-8 failures 0; forbidden sensitive paths 0; staged secret candidates 0; tracked database artifacts 0.

## Blockers And Release Conditions

- No Unit A implementation blocker.
- The migration was applied only to guarded disposable `revid_test_*` schemas. Applying it to a user/runtime database requires the normal backup and Human migration authorization; this does not block Unit B repository work.
- Applying migrations to user or production data remains unauthorized; verification is limited to exact-name guarded disposable `revid_test_*` schemas.
- Ignored local `.db` files and pre-existing `revid_test_db` remain untouched pending exact Human authorization.
