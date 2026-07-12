# T4-005 Progress - GenerationTask Diagnostics And Real Smoke

Last updated: 2026-07-12

## State

- Task: `T4-005 Unit B - Authorized real Agnes smoke`
- State: `DONE - PASS`
- Branch at start of current run: `main`
- Base HEAD at start of current run: `0cb8d82844c0875114db31ea45bbdf5cce0ec7b5`
- Pre-existing worktree changes at start: 45 untracked root `.playwright-cli/*.yml` snapshots; no tracked modifications
- Pre-existing staged changes at start: none
- Unmerged paths at start: none

## Unit B Work This Run

- Confirmed the restarted Codex process inherited `REVID_AGNES_API_KEY` without reading or printing its value.
- Authorized provider smoke succeeded for text (`agnes-2.0-flash`, request ID present, 67,558 ms), image (`agnes-image-2.1-flash`, provider returned no request ID, 16,843 ms), and video (`agnes-video-v2.0`, request ID present, 6,374 ms).
- Runtime MySQL initially contained zero generation tasks, proving standalone provider smoke alone did not satisfy the persistence acceptance criterion.
- Created a clearly named non-production T4-005 fixture through the existing FastAPI business path. Real text generation returned HTTP 200, persisted `succeeded`, retained a provider request ID, and linked `generation_tasks.result_asset_id` to an existing `assets.id`.
- Executed a controlled local image-provider failure through the same business path without an external call. It returned HTTP 500 and persisted `failed/provider_error` with no result asset.
- Preserved all fixture data for Navicat inspection; no destructive cleanup was performed.

## Completed Work

- Created the Unit A PLAN and PROGRESS documents.
- Audited the existing Agnes provider, generation routers, DB model registration, asset persistence, quota behavior, and generate tests.
- Added `GenerationTask` model, Alembic revision `e9f1a2b3c4d5`, model registration, store helpers, schemas, and authenticated query API.
- Integrated text/image/video generation endpoints with task lifecycle persistence, provider request IDs where available, result asset linkage, sanitized diagnostics, and status mapping.
- Preserved existing quota semantics: provider failures do not deduct quota; asset persistence failures refund quota.
- Added dry-run-safe `scripts/smoke_agnes.py`; default mode makes no Agnes call and `--execute` remains gated.
- Updated SQLite-to-MySQL migration table order and report handling for the new empty/non-empty table.
- Added mock tests for success, provider failure, network failure, timeout, asset persistence failure, task query, persistence reload, smoke dry-run, and migration table order.
- Wrote `ai/reports/REPORT-T4-005.md`.

## Remaining Work

- No remaining T4-005 work.

## Exact Next Action

Continue T4-013 from its PLAN/PROGRESS by inventorying Phase 4 reports and mapping remaining E2E, MySQL, browser, security, and documentation evidence gaps.

## Unit B Completion Verification

- Process key presence check - PASS; value was never read or printed.
- `scripts/smoke_agnes.py --media text --execute` - real-service PASS; request ID present.
- `scripts/smoke_agnes.py --media image --execute` - real-service PASS; provider response contained no request ID.
- `scripts/smoke_agnes.py --media video --execute` - real-service PASS; request ID present.
- Runtime MySQL read-only precheck - 0 existing generation tasks.
- FastAPI real text persistence smoke - HTTP 200, task `succeeded`, provider request ID present, result asset relation valid.
- FastAPI controlled image provider failure - HTTP 500, task `failed/provider_error`, no result asset, no paid call.
- `python -m unittest tests.test_smoke_agnes tests.test_database_store` - PASS, 11 tests.
- `python -m unittest discover -s tests -p "test_*generate*.py"` - PASS, 16 tests.
- `python -m unittest discover -s tests -p "test_*.py"` - PASS, 189 tests.

## Unit B Files Changed This Run

- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `ai/tasks/todo/TASK-T4-005.md`
- `ai/tasks/doing/TASK-T4-005-PLAN.md`
- `ai/tasks/doing/TASK-T4-005-PROGRESS.md`
- `backend/tests/test_smoke_agnes.py`
- `scripts/smoke_agnes.py`
- `pitfalls.md`

## Unit B Commands And Summarized Results

- Process-environment presence check - `REVID_AGNES_API_KEY` absent; no value was read or printed.
- Initial `scripts/smoke_agnes.py --media text --execute` - FAILED with sanitized `401 Unauthorized`; this exposed implicit local `.env` loading and no provider result/asset was created.
- Regression test on old implementation - expected FAIL, return code mismatch `2 != 1`, proving the local `.env` path reached provider execution.
- `python -m unittest tests.test_smoke_agnes` - PASS, 3 tests.
- `python -m py_compile scripts/smoke_agnes.py backend/tests/test_smoke_agnes.py` - PASS.
- Post-fix root execute preflight - BLOCKED before network call with exit code 2 because the process key is absent.
- `python -m unittest discover -s tests -p "test_*.py"` - PASS, 189 tests.

## Files Changed

- `ai/reports/REPORT-T4-005.md`
- `ai/tasks/doing/TASK-T4-005-PLAN.md`
- `ai/tasks/doing/TASK-T4-005-PROGRESS.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `ai/tasks/todo/TASK-T4-005.md`
- `backend/api/generation_tasks.py`
- `backend/api/image_generate.py`
- `backend/api/router.py`
- `backend/api/text_generate.py`
- `backend/api/video_generate.py`
- `backend/controllers/store.py`
- `backend/core/agnes_provider.py`
- `backend/core/generation_task_utils.py`
- `backend/migrations/versions/e9f1a2b3c4d5_add_generation_tasks.py`
- `backend/models/__init__.py`
- `backend/models/generation_task.py`
- `backend/schemas/generation_task.py`
- `backend/scripts/migrate_sqlite_to_mysql.py`
- `backend/tests/test_database_store.py`
- `backend/tests/test_image_generate.py`
- `backend/tests/test_migration_tool.py`
- `backend/tests/test_smoke_agnes.py`
- `backend/tests/test_text_generate.py`
- `backend/tests/test_video_generate.py`
- `scripts/smoke_agnes.py`

## Commands And Summarized Results

- `git status --short` - clean at run start.
- `git diff --stat` - no unstaged diff at run start.
- `git diff --name-only` - no unstaged paths at run start.
- `git diff --cached --name-status` - no staged paths at run start.
- `git diff --name-only --diff-filter=U` - no unmerged paths at run start.
- `git branch --show-current` - `main`.
- `git rev-parse HEAD` - `778160f044c5e644d876703dfe9cbec04bb28d89`.
- `python -m py_compile ...` for changed backend modules and smoke/migration scripts - PASS.
- `.\.venv\Scripts\python.exe -m unittest discover -s tests -p "test_*generate*.py"` - PASS, 16 tests.
- `.\.venv\Scripts\python.exe -m unittest tests.test_database_store tests.test_smoke_agnes` - PASS, 10 tests.
- `.\.venv\Scripts\python.exe -m unittest tests.test_migration_tool.TestCanvasConnectionMigrationConfig` - PASS, 2 tests.
- `.\.venv\Scripts\python.exe -m unittest tests.test_e2e_workflow tests.test_image_e2e tests.test_video_e2e` - PASS, 11 tests.
- `.\.venv\Scripts\python.exe -m alembic -c alembic.ini heads` - PASS, head `e9f1a2b3c4d5`.
- `.\.venv\Scripts\python.exe -m unittest tests.test_migration_tool.TestMigrationTool.test_ac6_consistency_report` - PASS, 1 test.
- `.\.venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py"` - PASS, 188 tests.
- `git diff --check` - PASS.

## Blockers And Release Conditions

- None for T4-005. Human cost authorization and the process credential gate are complete.
