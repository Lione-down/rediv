# REPORT T4-005 Unit A - GenerationTask Persistence And Mock Verification

Date: 2026-07-10

## Result

`DONE - PASS` for T4-005 Unit A.

Unit A implemented non-paid generation task persistence, provider status mapping, task query API, dry-run-safe Agnes smoke behavior, and mock verification. T4-005 Unit B real Agnes text/image/video smoke remains a separate Human cost gate and was not executed.

## Delivered

- Added `generation_tasks` SQLAlchemy model and Alembic revision `e9f1a2b3c4d5`.
- Added store methods for creating, updating, fetching, and listing generation tasks in both in-memory and database stores.
- Added `/api/generation-tasks` list/detail API for authenticated users.
- Added provider status normalization to the Agnes provider integration.
- Updated text, image, and video generation endpoints to record task lifecycle:
  - `queued` and `running` before provider work;
  - `succeeded` with `result_asset_id` after asset persistence;
  - `failed` or `timed_out` with sanitized diagnostics for provider, network, timeout, and asset persistence failures.
- Preserved existing quota semantics:
  - provider failures do not deduct quota;
  - asset persistence failures refund quota after provider success.
- Added `scripts/smoke_agnes.py`, which defaults to dry run and requires `--execute` for real calls.
- Updated SQLite-to-MySQL migration table order so `generation_tasks` is covered after `assets`.

## Verification

- Syntax:
  - `python -m py_compile core/agnes_provider.py core/generation_task_utils.py api/text_generate.py api/image_generate.py api/video_generate.py api/generation_tasks.py models/generation_task.py schemas/generation_task.py` - PASS.
  - `python -m py_compile ..\scripts\smoke_agnes.py scripts\migrate_sqlite_to_mysql.py` - PASS.
- Focused mock tests:
  - `.\.venv\Scripts\python.exe -m unittest discover -s tests -p "test_*generate*.py"` - PASS, 16 tests.
  - `.\.venv\Scripts\python.exe -m unittest tests.test_database_store tests.test_smoke_agnes` - PASS, 10 tests.
  - `.\.venv\Scripts\python.exe -m unittest tests.test_migration_tool.TestCanvasConnectionMigrationConfig` - PASS, 2 tests.
  - `.\.venv\Scripts\python.exe -m unittest tests.test_e2e_workflow tests.test_image_e2e tests.test_video_e2e` - PASS, 11 tests.
  - `.\.venv\Scripts\python.exe -m unittest tests.test_migration_tool.TestMigrationTool.test_ac6_consistency_report` - PASS, 1 test.
- Migration:
  - `.\.venv\Scripts\python.exe -m alembic -c alembic.ini heads` - PASS, head `e9f1a2b3c4d5`.
- Regression:
  - `.\.venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py"` - PASS, 188 tests.
- Diff hygiene:
  - `git diff --check` - PASS.

## Real Smoke Status

No real Agnes API call was made in Unit A. This is intentional. Real text/image/video smoke belongs to T4-005 Unit B and requires explicit Human Owner cost authorization before running `scripts/smoke_agnes.py --media <type> --execute`.

## Residual Risk

- Real Agnes provider behavior is still unverified until Unit B authorization.
- Manual Navicat inspection of a real successful and controlled-failure task remains part of the later real-service acceptance path.
