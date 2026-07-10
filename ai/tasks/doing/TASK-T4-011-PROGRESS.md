# T4-011 Direct Delivery Progress

Last updated: 2026-07-10

State: `DOING`

## Completed

- T4-003 completed with MySQL runtime, health, persistence, and restart acceptance.
- T4-004 completed with password authentication, Admin bootstrap, WeChat compatibility hardening, and shared MySQL migration to `b7d4c2e9f001`.
- Created the T4-011 direct-delivery PLAN and PROGRESS entry points.
- Confirmed T4-011 dependencies are complete and selected it as the single active Task.
- Audited existing project/canvas-node backend patterns for models, schemas, routers, `DatabaseStore`/`InMemoryStore`, Alembic comments, ownership checks, node deletion, and tests.
- Implemented the first T4-011 backend slice:
  - `CanvasConnection` SQLAlchemy model with `canvas_connections` table metadata, non-empty table/field comments, foreign keys, indexes, and duplicate-edge uniqueness.
  - Pydantic request/response schemas and `/projects/{project_id}/connections` create/list/update/delete API.
  - `InMemoryStore` and `DatabaseStore` connection CRUD, project ownership checks, same-project node validation, self-loop rejection, duplicate detection, directed-cycle allowance, persistence, and node-delete connection cleanup.
  - Alembic revision `d8c5b9a4e2f0_add_canvas_connections.py`.
  - Focused connection tests covering CRUD, duplicate, self-loop, cross-project node rejection, project permission denial, node cleanup, persistence, cycle allowance, SQLite schema/model comments, and InMemory consistency.

## Remaining

- Apply Alembic head `d8c5b9a4e2f0` to the shared MySQL `revid_db` when the next run starts, then verify current/head match and table/field comments, foreign keys, indexes, and duplicate constraint through MySQL inspector evidence.
- Add or record explicit backend-restart persistence evidence after shared MySQL has the connection table.
- Decide whether T4-011 should update `backend/scripts/migrate_sqlite_to_mysql.py` for future `canvas_connections` data ETL; this is not yet implemented in the first backend API slice.
- Run final focused/regression checks after shared MySQL migration, then write `ai/reports/REPORT-T4-011.md`.
- Write `REPORT-T4-011.md` and mark T4-011 DONE only after all non-deferred acceptance criteria pass.

## Exact Next Action

Apply and verify the additive `d8c5b9a4e2f0` migration on shared MySQL `revid_db`, then inspect the `canvas_connections` table comments, columns, foreign keys, indexes, and revision match without exposing credentials.

## Files Changed

- `backend/api/canvas_connections.py`
- `backend/api/router.py`
- `backend/controllers/store.py`
- `backend/migrations/versions/d8c5b9a4e2f0_add_canvas_connections.py`
- `backend/models/__init__.py`
- `backend/models/canvas_connection.py`
- `backend/schemas/canvas_connection.py`
- `backend/tests/test_canvas_connection_crud.py`
- `ai/tasks/doing/TASK-T4-011-PROGRESS.md`
- `ai/state/CURRENT.md`

## Commands And Summarized Results

- `git status --short`, `git diff --stat`, `git diff --name-only`, `git diff --cached --name-status`, `git diff --name-only --diff-filter=U`, `git branch --show-current`, `git rev-parse HEAD`: starting baseline was clean on `main` at `52908f434bf00e85fc110891698a2a9d1ef0cd51`; no staged or unmerged paths.
- `python -m unittest discover -s tests -p "test_canvas_connection_crud.py"` with system Python: failed before tests because global environment lacked FastAPI dependency `annotated_doc`; reran with project venv.
- `.\\.venv\\Scripts\\python.exe -m unittest discover -s tests -p "test_canvas_connection_crud.py"`: passed, 10 tests.
- `.\\.venv\\Scripts\\python.exe -m unittest discover -s tests -p "test_canvas_node_crud.py"`: passed, 9 tests.
- `.\\.venv\\Scripts\\python.exe -m compileall api controllers models schemas tests/test_canvas_connection_crud.py`: passed.
- `.\\.venv\\Scripts\\python.exe -m unittest discover -s tests -p "test_mysql_runtime_cutover.py"`: passed, 9 tests.
- Temporary SQLite Alembic `upgrade head` smoke: passed; verified `canvas_connections`, `metadata`, `uq_canvas_connections_edge`, and source-node index exist at head.
- `.\\.venv\\Scripts\\python.exe -m unittest discover -s tests -p "test_*.py"`: passed, 182 tests; migration-tool negative-path output appeared during expected tests but final unittest result was OK.
- `git diff --check`: passed with only existing LF-to-CRLF warnings.

## Verification

- Focused SQLite/API/store verification passed for the first backend connection slice.
- Test MySQL upgrade paths executed inside existing regression tests and completed with final unittest OK.
- Shared MySQL `revid_db` has not yet been upgraded from `b7d4c2e9f001` to `d8c5b9a4e2f0` in this run, so Navicat/shared-MySQL table comment evidence and final REPORT are still pending.

## Blockers

- No active blocker.
