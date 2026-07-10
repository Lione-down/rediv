# Task T4-003 - MySQL Runtime Cutover And Acceptance

## Status

- State: `DONE - PASS`
- Owner: Codex Project Lead Engineer
- Priority: P0
- Phase: Phase 4A

## Objective

Run FastAPI with `REVID_USE_SQLITE=false` on MySQL using `DatabaseStore`, verify schema readiness without runtime schema mutation, expose safe database health, and prove create-read-restart persistence with non-secret evidence.

## Scope

Allowed business files:

- `backend/main.py`
- `backend/database.py`
- `backend/models/base.py`
- `backend/controllers/store.py` only for engine/session adaptation
- `backend/api/health.py`
- `backend/README.md`
- `backend/.env.example`
- `backend/tests/test_mysql_runtime_cutover.py`
- `backend/tests/test_health.py`
- `backend/migrations/versions/*t4_003*.py` only if a real schema gap is proven

Task artifacts:

- `ai/tasks/done/TASK-T4-003-DIRECT-PLAN.md`
- `ai/tasks/done/TASK-T4-003-DIRECT-PROGRESS.md`
- `ai/reports/REPORT-T4-003-DIRECT.md`

Out of scope: Auth product logic, frontend, Canvas interaction, Agnes integration, original SQLite data, and Hermes runtime.

## Current Baseline

- MySQL mode already configures `DatabaseStore`.
- MySQL startup does not call `create_all()`.
- The stale engine-reference defect from rev47 is fixed.
- Focused tests pass 13/13 and the safe backend regression passes 143 tests, but real MySQL, restart, and Navicat acceptance are not yet proven.
- Historical Hermes execution contracts are archived at `ai/tasks/archive/TASK-T4-003-HERMES-THROUGH-REV47R2.md`.

## Acceptance Criteria

- [ ] MySQL mode starts successfully and `/health` reports a connected, revision-ready database.
- [ ] Public API/store paths can create and read a user, project, node, and asset in a safe MySQL target.
- [ ] The same records remain readable after backend engine or process restart.
- [ ] Navicat or equivalent read-only database evidence confirms database name, Alembic revision, table count, record IDs, table comments, and field comments without exposing credentials.
- [ ] Focused tests and the relevant backend regression suite pass.
- [ ] `REVID_USE_SQLITE=true` remains functional.
- [ ] MySQL connection or revision failure is actionable and never falls back to in-memory storage.
- [ ] Health and reports contain no password, token, Authorization header, full database URL, or secret-derived value.

## Hard Gates

- Do not open `.env` or `.env.*`.
- Credentials may come only from process environment variables already supplied to the command.
- Before using MySQL, prove the target database identity without printing credentials.
- Do not run `DROP`, `TRUNCATE`, destructive `DELETE`, downgrade, reset, or cleanup against `revid_db` or any user database.
- A disposable database must be clearly named for T4-003 before any destructive test cleanup is considered; destructive cleanup still requires Human Owner authorization.
- MySQL startup must not call `create_all()`.
- Any new migration must include non-empty table and field comments.

## Required Verification

Run focused tests from `ai/` using `backend/.venv` so repository `.env` files are not discovered:

```powershell
& '..\backend\.venv\Scripts\python.exe' -m unittest discover -s '..\backend\tests' -p 'test_mysql_runtime_cutover.py'
& '..\backend\.venv\Scripts\python.exe' -m unittest discover -s '..\backend\tests' -p 'test_health.py'
```

Also run compile checks, the relevant backend regression suite, a MySQL import/startup check, safe create-read-restart verification, and read-only Navicat/database inspection when the safe target gate is satisfied.

## Completion

Write `ai/reports/REPORT-T4-003-DIRECT.md`, perform a fresh diff review against this Task, update CURRENT and ROADMAP, and mark T4-003 `DONE` only when every acceptance criterion is passed or an explicitly Human-owned acceptance gate is resolved.

Completion evidence: `ai/reports/REPORT-T4-003-DIRECT.md`.
