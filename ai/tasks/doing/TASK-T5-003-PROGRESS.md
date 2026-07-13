# TASK-T5-003 Progress

- State: `DOING`
- Active unit: Unit B - canvas metadata and optimistic ordering APIs (`COMPLETE - PASS`)
- Updated: 2026-07-13

## Completed

- Started Unit B from clean `main` baseline `d8352bad80fc217ad1c4c3cb991ef83c1c648048`; no pre-existing tracked, untracked, staged, unmerged, or Git-operation state was present.
- Re-read the authoritative Task, PLAN, PROGRESS, ADR-002/004/005, Canvas architecture, Canvas acceptance, ROADMAP, CURRENT, and automation cursor.
- Defined the Unit B API/transaction boundary before business-code edits: active metadata CRUD, project-row optimistic ordering, exact-permutation reorder, and last-active archive protection.
- Added strict Canvas create/update/reorder and response schemas with whitespace normalization, length/range checks, duplicate-order rejection, and forbidden extra fields.
- Added request-scoped Canvas controllers that enforce project ownership, active-canvas visibility, Project row locks, stale revision conflicts, dense ordering, exact permutations, and last-active archive protection.
- Added canonical `/api/projects/{project_id}/canvases` create/list/read/rename/archive/reorder routes with explicit 403/404/409/422 domain mapping.
- Added guarded real-MySQL API coverage for authentication, ownership, duplicate names, stale create/reorder atomicity, dense persistence, invalid permutations, archive compaction, and last-active protection.
- Unit B compile, 40-test focused regression, 182-test full backend regression plus 5 subtests, Alembic head, cleanup probe, and fresh-diff gates passed.
- Precisely staged 9 Unit B paths; cached diff, UTF-8, sensitive-path, secret-candidate, and tracked-database-artifact gates passed with zero findings.
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

- Deliver Unit C transactional duplication and Unit D closure in later runs.

## Exact Next Action

Implement Unit C transactional canvas duplication with new graph IDs, group-parent and endpoint remapping, project ownership, order revision, and rollback tests.

## Files Changed

- `ai/tasks/doing/TASK-T5-003-PLAN.md` - activate and bound Unit B.
- `ai/tasks/doing/TASK-T5-003-PROGRESS.md` - record Unit B baseline, scope, and next action.
- `ai/state/CURRENT.md` - point active delivery at Unit B.
- `ai/state/ROADMAP.md` - record Unit B completion and Unit C next.
- `backend/schemas/canvas.py` - strict Canvas metadata and ordering contracts.
- `backend/controllers/canvases.py` - request-scoped MySQL ownership, metadata, ordering, and archive transactions.
- `backend/api/canvases.py` - authenticated Canvas metadata routes and HTTP error mapping.
- `backend/api/router.py` - register the Canvas router.
- `backend/tests/test_canvas_metadata_api.py` - guarded real-MySQL Unit B API evidence.
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

- Unit B required source reads and git baseline commands - PASS; clean HEAD `d8352bad80fc217ad1c4c3cb991ef83c1c648048`.
- Initial compile command used a duplicated `backend/` prefix from the backend working directory and did not start; corrected command then passed.
- `.venv/Scripts/python.exe -m compileall -q api controllers core models schemas settings tests migrations` - PASS.
- `.venv/Scripts/python.exe -m pytest -q tests/test_canvas_metadata_api.py` - 8/8 PASS.
- focused Canvas/project/legacy graph regression - 40/40 PASS.
- full backend `.venv/Scripts/python.exe -m pytest -q` - 182 tests plus 5 subtests PASS in 150.01 seconds.
- `.venv/Scripts/python.exe -m alembic heads` - one head, `f0a1b2c3d4e5`.
- guarded schema cleanup probe - only pre-existing untouched `revid_test_db` remains; the first runtime-URL probe failed closed before connection, then the test-admin read-only probe passed.
- fresh diff review and `git diff --check` - PASS before durable-state reconciliation.
- staged verification - 9 owned paths; UTF-8 failures 0; forbidden sensitive paths 0; staged secret candidates 0; tracked database artifacts 0.
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

- No Unit B implementation blocker.
- No Unit A implementation blocker.
- The migration was applied only to guarded disposable `revid_test_*` schemas. Applying it to a user/runtime database requires the normal backup and Human migration authorization; this does not block Unit B repository work.
- Applying migrations to user or production data remains unauthorized; verification is limited to exact-name guarded disposable `revid_test_*` schemas.
- Ignored local `.db` files and pre-existing `revid_test_db` remain untouched pending exact Human authorization.
