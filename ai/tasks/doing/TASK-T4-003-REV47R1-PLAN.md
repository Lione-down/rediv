# TASK-T4-003-REV47R1-PLAN.md

## MySQL Runtime Remediation — Plan

**Task ID:** T4-003
**Revision:** phase4-wave2-t4-003-mysql-runtime-cutover-remediation-2026-07-09-47r1
**Date:** 2026-07-09

### Objective
Remediate the stale `_engine` reference bug in `database.py` that causes `check_alembic_revision()` to raise `RuntimeError: Database engine is not initialized` even after `init_mysql_engine()` has set `models.base._engine`.

### Root Cause
In rev47, `database.py` imports `_engine` by value from `models.base` at module load time. When `init_mysql_engine()` calls `init_engine()`, it sets `models.base._engine` but the local reference `database._engine` remains `None`. So `check_alembic_revision()` sees a stale `None` and raises.

### Fix Plan

1. **database.py**: Remove `_engine` from the top-level import. In `check_alembic_revision()`, import `_engine` from `models.base` inside the function body so it always reads the current value. Rename to local alias `engine` to avoid confusion.

2. **test_mysql_runtime_cutover.py**: Add a regression test that:
   - Clears any cached modules
   - Sets `REVID_USE_SQLITE=false`
   - Calls `init_mysql_engine()` (which sets `models.base._engine`)
   - Then calls `check_alembic_revision()` — this must NOT raise "Database engine is not initialized"
   - The test verifies the fix by checking that the engine reference is alive

3. **Run required verification commands**:
   ```powershell
   cd backend
   ..\.venv\Scripts\python.exe -m unittest tests.test_mysql_runtime_cutover tests.test_health
   ..\.venv\Scripts\python.exe -m compileall main.py database.py api\health.py tests\test_mysql_runtime_cutover.py tests\test_health.py
   $env:REVID_USE_SQLITE='false'
   ..\.venv\Scripts\python.exe -c "import main"
   ```

4. **Attempt real MySQL runtime verification** if safe credentials are available (non-destructive, no `.env` reads).

5. **Write REPORT-T4-003-REV47R1.md** with pass/fail results for all checks.

### Allowed Files
- `backend/main.py`
- `backend/database.py`
- `backend/models/base.py`
- `backend/controllers/store.py`
- `backend/api/health.py`
- `backend/README.md`
- `backend/.env.example`
- `backend/tests/test_mysql_runtime_cutover.py`
- `backend/tests/test_health.py`
- `ai/tasks/doing/TASK-T4-003-REV47R1-PLAN.md`
- `ai/tasks/doing/TASK-T4-003-REV47R1-PROGRESS.md`
- `ai/reports/REPORT-T4-003-REV47R1.md`

### Hard Gates
- Do not read `.env` or `.env.*`
- No `create_all()` in MySQL mode
- No destructive operations against `revid_db`
- Health output must not expose secrets
- Keep `REVID_USE_SQLITE=true` behavior intact
- Reviewer/HANDOFF not authorized in rev47r1

### Stop Condition
Write `REPORT-T4-003-REV47R1.md` and stop at `T4_003_MYSQL_RUNTIME_REMEDIATION_REPORT_READY_REV47R1`.
