# TASK-T4-003-REV47R1-PROGRESS.md

## MySQL Runtime Remediation — Progress Tracker

**Task ID:** T4-003
**Revision:** phase4-wave2-t4-003-mysql-runtime-cutover-remediation-2026-07-09-47r1

### Step Status

| # | Step | Status | Notes |
|---|------|--------|-------|
| 1 | Fix stale `_engine` reference in `database.py` | ✅ DONE | Removed top-level `_engine` import; `check_alembic_revision()` now reads from `models.base` at call time |
| 2 | Add regression test for rev47 bug | 🔄 IN_PROGRESS | Adding test that calls `init_mysql_engine()` then `check_alembic_revision()` without engine being None |
| 3 | Run unit tests (`test_mysql_runtime_cutover`, `test_health`) | ⏳ PENDING | |
| 4 | Run compileall on modified files | ⏳ PENDING | |
| 5 | Smoke test: `REVID_USE_SQLITE=false; python -c "import main"` | ⏳ PENDING | |
| 6 | Real MySQL runtime verification (if credentials available) | ⏳ PENDING | |
| 7 | Write REPORT-T4-003-REV47R1.md | ⏳ PENDING | |
