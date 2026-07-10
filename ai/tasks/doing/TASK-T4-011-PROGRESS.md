# T4-011 Direct Delivery Progress

Last updated: 2026-07-10

State: `VERIFYING`

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
- Applied and verified Alembic head `d8c5b9a4e2f0` on shared MySQL `revid_db`.
- Fixed a real MySQL FK compatibility issue by making the `canvas_connections` migration inherit the existing `projects.id` column collation when running on MySQL; this keeps shared `revid_db` and disposable MySQL test databases compatible.
- Verified shared MySQL `canvas_connections` table comment, all column comments, cascade foreign keys, project/source/target indexes, duplicate-edge unique constraint, and Alembic current/head match.
- Recorded backend restart persistence evidence on shared MySQL by creating one acceptance user, one project, three nodes, and two connections, then reloading the first connection and connection list from a separate Python process after engine close/re-init.

## Remaining

- Decide whether T4-011 should update `backend/scripts/migrate_sqlite_to_mysql.py` for future `canvas_connections` data ETL; this is outside the original allowed edit list but affects future migration completeness.
- Write `REPORT-T4-011.md` and mark T4-011 DONE only after the ETL decision and final evidence review are recorded.

## Exact Next Action

Decide the SQLite-to-MySQL ETL scope for `canvas_connections`, then write `ai/reports/REPORT-T4-011.md` and close T4-011 if no new implementation is required.

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
- `ai/tasks/todo/TASK-T4-011.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`

## Commands And Summarized Results

- `git status --short`, `git diff --stat`, `git diff --name-only`, `git diff --cached --name-status`, `git diff --name-only --diff-filter=U`, `git branch --show-current`, `git rev-parse HEAD`: starting baseline was clean on `main` at `52908f434bf00e85fc110891698a2a9d1ef0cd51`; no staged or unmerged paths.
- `python -m unittest discover -s tests -p "test_canvas_connection_crud.py"` with system Python: failed before tests because global environment lacked FastAPI dependency `annotated_doc`; reran with project venv.
- `.\\.venv\\Scripts\\python.exe -m unittest discover -s tests -p "test_canvas_connection_crud.py"`: passed, 10 tests.
- `.\\.venv\\Scripts\\python.exe -m unittest discover -s tests -p "test_canvas_node_crud.py"`: passed, 9 tests.
- `.\\.venv\\Scripts\\python.exe -m compileall api controllers models schemas tests/test_canvas_connection_crud.py`: passed.
- `.\\.venv\\Scripts\\python.exe -m unittest discover -s tests -p "test_mysql_runtime_cutover.py"`: passed, 9 tests.
- Temporary SQLite Alembic `upgrade head` smoke: passed; verified `canvas_connections`, `metadata`, `uq_canvas_connections_edge`, and source-node index exist at head.
- `.\\.venv\\Scripts\\python.exe -m unittest discover -s tests -p "test_*.py"`: passed, 182 tests; migration-tool negative-path output appeared during expected tests but final unittest result was OK.
- Shared MySQL first `alembic upgrade head` attempt: failed with MySQL error 3780 because the new table collation did not match parent FK columns; no `canvas_connections` table was created and revision remained `b7d4c2e9f001`.
- Shared MySQL schema inspection: confirmed `projects.id`, `canvas_nodes.id`, and `canvas_nodes.project_id` are `varchar(36)` using `utf8mb4_unicode_ci` with comments.
- Shared MySQL `alembic upgrade head` after dynamic collation fix: passed; `revid_db` moved from `b7d4c2e9f001` to `d8c5b9a4e2f0`; `canvas_connections` table comment, column comments, cascade FKs, indexes, unique constraint, and revision match verified.
- Shared MySQL backend restart persistence smoke: passed; child Python process reloaded connection `9c662d04-ea31-46ab-a881-8be2dbd94761` and listed two connections in project `0e191223-05a7-415e-ae33-d0d86c4d3eca` after engine close/re-init.
- `.\\.venv\\Scripts\\python.exe -m unittest discover -s tests -p "test_canvas_connection_crud.py"`: passed, 10 tests after the collation fix.
- `.\\.venv\\Scripts\\python.exe -m unittest discover -s tests -p "test_mysql_runtime_cutover.py"`: passed, 9 tests after the first shared MySQL fix.
- `.\\.venv\\Scripts\\python.exe -m compileall models/canvas_connection.py migrations/versions/d8c5b9a4e2f0_add_canvas_connections.py tests/test_canvas_connection_crud.py`: passed.
- First full `.\\.venv\\Scripts\\python.exe -m unittest discover -s tests -p "test_*.py"` after hardcoded collation: failed in disposable MySQL migration setup with the same FK incompatibility against a different parent collation; this drove the dynamic collation fix.
- Final `.\\.venv\\Scripts\\python.exe -m unittest discover -s tests -p "test_*.py"` after dynamic collation: passed, 182 tests; expected migration-tool negative-path output appeared but final unittest result was OK.
- `git diff --check`: passed with only existing LF-to-CRLF warnings.

## Verification

- Focused SQLite/API/store verification passed for the first backend connection slice.
- Test MySQL upgrade paths executed inside existing regression tests and completed with final unittest OK.
- Shared MySQL `revid_db` is upgraded from `b7d4c2e9f001` to `d8c5b9a4e2f0`.
- Shared MySQL table/comment/FK/index/unique-constraint evidence and backend restart persistence evidence are complete.
- Final REPORT remains pending until the SQLite-to-MySQL ETL scope decision is recorded.

## Blockers

- No active blocker.
