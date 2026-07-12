# REPORT T4-005 - GenerationTask Persistence And Authorized Agnes Smoke

Date: 2026-07-12

## Result

`DONE - PASS` for T4-005 Units A and B.

Unit A implemented non-paid generation task persistence, provider status mapping, task query API, dry-run-safe Agnes smoke behavior, and mock verification. Unit B used an explicitly authorized process-provided credential to complete text/image/video real smoke and runtime MySQL task/asset acceptance.

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

## Unit B Real Smoke

- Credential source: process environment only; no local `.env` credential was inspected or used.
- Text: `succeeded`, model `agnes-2.0-flash`, provider request ID present, 67,558 ms.
- Image: `succeeded`, model `agnes-image-2.1-flash`, 16,843 ms. This provider response did not expose a request ID; no ID was fabricated.
- Video: `succeeded`, model `agnes-video-v2.0`, provider request ID present, 6,374 ms.
- A second authorized real text call used the existing FastAPI business path and persisted a `succeeded` GenerationTask with provider request ID and a valid `result_asset_id -> assets.id` relationship in runtime MySQL.
- A controlled local image-provider failure used the same business path without an external call and persisted `failed/provider_error` with no result asset.
- The non-production fixture is retained under project name prefix `T4-005 Agnes Smoke` for Navicat inspection.

## Final Verification

- Focused persistence/smoke tests: PASS, 11/11.
- Generate tests: PASS, 16/16.
- Full backend regression: PASS, 189/189.
- Runtime MySQL task/asset relationship: PASS.
- Controlled failure persistence: PASS.

## Residual Risk

- Agnes image generation returned a successful result without a provider request ID. Evidence records this provider behavior explicitly; the application leaves `provider_request_id` nullable by contract.
- Cross-surface browser E2E, final security checks, and Phase 4 documentation closure remain in T4-013.
