# T4-005 Progress - GenerationTask Diagnostics And Real Smoke

Last updated: 2026-07-12

## State

- Task: `T4-005 Unit B - Authorized real Agnes smoke`
- State: `BLOCKED - PROCESS KEY REQUIRED`
- Branch at start of current run: `main`
- Base HEAD at start of current run: `cec8e747b478f4bac8a18e227813be25c6f2d749`
- Pre-existing worktree changes at start: 45 untracked root `.playwright-cli/*.yml` snapshots; no tracked modifications
- Pre-existing staged changes at start: none
- Unmerged paths at start: none

## Unit B Work This Run

- Human Owner explicitly authorized paid text/image/video Agnes real smoke.
- The initial text execute attempt returned sanitized `401 Unauthorized`; no provider result or asset was created.
- Root cause: `scripts/smoke_agnes.py` consumed `settings.agnes_api_key`, and `Settings(env_file=".env")` loaded a local root `.env` key even though `REVID_AGNES_API_KEY` was absent from the process environment.
- Further image/video calls are paused until the process-only credential gate is repaired and a valid process-provided key is available.
- Added a regression test proving a local `.env` key is ignored when the process key is absent; it failed on the old implementation and passed after the fix.
- Updated `scripts/smoke_agnes.py` to read `REVID_AGNES_API_KEY` directly from `os.environ`.
- Verified the root-directory execute path now exits before network access when the process key is absent.

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

- No remaining Unit A implementation work.
- Run authorized text/image/video real smoke with a valid process-provided key.
- Verify non-sensitive provider metadata and the required generation task/asset relationship evidence.

## Exact Next Action

Supply a valid `REVID_AGNES_API_KEY` through the process environment, then rerun `scripts/smoke_agnes.py --media text --execute`; only after text succeeds, continue image and video smoke.

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

- Unit A has no active blocker.
- Human cost authorization is complete.
- Completing Unit B real smoke requires a valid `REVID_AGNES_API_KEY` supplied in the process environment; do not inspect or reuse the rejected local `.env` credential. Release condition: process key presence followed by a successful text smoke.
