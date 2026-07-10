# REPORT-T4-011 - Canvas connection model and CRUD API

Date: 2026-07-10

## Result

Status: `DONE - PASS`

T4-011 added a durable backend boundary for Canvas connections. Connections are persisted in MySQL, exposed through project-owned CRUD endpoints, protected by the existing ownership model, and reload after backend restart.

## Delivered

- Added `CanvasConnection` SQLAlchemy model with non-empty table and column comments, cascade foreign keys, project/source/target indexes, and duplicate-edge uniqueness.
- Added Pydantic schemas and `/projects/{project_id}/connections` list/create/update/delete endpoints.
- Added `InMemoryStore` and `DatabaseStore` connection CRUD with same-project node validation, self-loop rejection, duplicate detection, permission checks, directed-cycle allowance, and node-delete cleanup.
- Added Alembic revision `d8c5b9a4e2f0_add_canvas_connections.py`.
- Fixed MySQL migration collation handling by inheriting the parent `projects.id` collation before creating `canvas_connections`.
- Extended `backend/scripts/migrate_sqlite_to_mysql.py` so future SQLite-to-MySQL ETL includes `canvas_connections` after `canvas_nodes`, with PK/FK/JSON validation coverage.

## ETL Decision

`canvas_connections` is included in the SQLite-to-MySQL ETL script as part of T4-011 closure.

Reason: the table is a new durable data boundary. Leaving it out would make future migration runs silently omit saved Canvas edges from old SQLite databases. The implementation is narrow, keeps FK order after `canvas_nodes`, adds `metadata` to critical JSON validation, and adds a mock-safe unit guard plus fixture coverage.

## Acceptance Evidence

- CRUD, duplicate edge, self-loop, cross-project node rejection, permission denial, node cleanup, persistence, directed cycle allowance, SQLite schema/model comments, and InMemory behavior are covered by `test_canvas_connection_crud.py`.
- MySQL schema evidence on shared `revid_db`: Alembic revision `d8c5b9a4e2f0`, table and column comments, cascade FKs, indexes, and unique constraint verified.
- Backend restart persistence evidence: acceptance project `0e191223-05a7-415e-ae33-d0d86c4d3eca` has three nodes and two persisted connections reloaded from a separate Python process after engine close/re-init.
- SQLite-to-MySQL ETL fixture now includes two canvas nodes and one `canvas_connections` row; full migration-tool tests show `canvas_connections: 1 rows` read and migrated in the relevant paths.

## Verification

- `.\backend\.venv\Scripts\python.exe -m unittest backend.tests.test_migration_tool.TestCanvasConnectionMigrationConfig`: passed, 1 test.
- `.\backend\.venv\Scripts\python.exe -m py_compile backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py`: passed.
- `.\backend\.venv\Scripts\python.exe -m unittest discover -s backend/tests -p "test_canvas_connection_crud.py"`: passed, 10 tests.
- From `backend`: `.\.venv\Scripts\python.exe -m unittest discover -s tests -p "test_migration_tool.py"`: passed, 27 tests.
- From `backend`: `.\.venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py"`: passed, 183 tests.

Expected migration-tool negative-path output appeared during regression tests for conflict and missing-secret cases; final unittest results were OK.

## Deferred / Human Gates

- No T4-011 blocker remains.
- Real WeChat provider E2E remains outside T4-011 and still requires Human Owner credentials/authorization.
- T4-005 Unit B real Agnes smoke remains a later Human cost gate.
