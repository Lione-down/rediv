# REVIEW-T4-001 — Independent Reviewer Verification

## Task ID
T4-001 — MySQL 8 引擎、模型备注与 Alembic baseline

## Report Reference
`ai/reports/REPORT-T4-001.md`

## Review Date
2026-06-22

## Verdict
**REWORK**

## Scope Audit

### Allowed files (per TASK-T4-001.md):
- `backend/models/**` — 12 model files
- `backend/settings/config.py`
- `backend/requirements.txt`
- `backend/database.py`
- `backend/alembic.ini` (new)
- `backend/migrations/**` (new)
- `backend/tests/conftest.py` (new, per plan)

### Files actually modified (per REPORT-T4-001.md):
- `backend/main.py` — **OUT OF SCOPE**. Task explicitly states "本任务不切换 runtime" and "禁止修改" for business logic. main.py is the runtime entry point.
- `backend/alembic.ini` — allowed (new)
- `backend/tests/conftest.py` — allowed (new, per plan)
- `backend/models/base.py` — allowed
- `backend/models/admin_log.py` — allowed
- `backend/models/asset.py` — allowed
- `backend/models/canvas_node.py` — allowed
- `backend/models/guest.py` — allowed
- `backend/models/identity.py` — allowed
- `backend/models/invitation.py` — allowed
- `backend/models/project.py` — allowed
- `backend/models/quota.py` — allowed
- `backend/models/template.py` — allowed
- `backend/models/user.py` — allowed
- `backend/requirements.txt` — allowed
- `backend/settings/config.py` — allowed

**Scope violation: `backend/main.py` was modified.** The task scope explicitly allows only `backend/models/**`, `backend/settings/config.py`, `backend/requirements.txt`, `backend/database.py`. `main.py` is not in the allowed list.

## Rework Items Verification

### Item 1: Fix database init boundary for REVID_USE_SQLITE=true/false
**Status: NOT FIXED — BUG STILL PRESENT**

Evidence: `backend/database.py` line 12:
```python
init_engine(db_path or settings.db_path)
```

When `REVID_USE_SQLITE=false`:
- `main.py` line 13: `init_db()` is called with no argument
- `db_path = None`
- `init_engine(None or settings.db_path)` = `init_engine("revid.db")`
- `init_engine("revid.db")` enters the SQLite branch (`if db_path and db_path.strip()`)
- **Result: MySQL mode silently falls back to SQLite!**

This is the exact bug the original review identified. The fix should be:
```python
def init_db(db_path: str | None = None) -> None:
    init_engine(db_path)  # Pass db_path directly, let init_engine decide
    create_tables()
```

Severity: **Critical** — the core purpose of the task (MySQL support) is broken when `use_sqlite=False`.

### Item 2: Standard Alembic commands load project root .env
**Status: PARTIALLY ADDRESSED — POTENTIAL ISSUE REMAINS**

Evidence:
- `backend/settings/config.py` line 8: `env_file=".env"` — reads `.env` from CWD
- `backend/migrations/env.py` imports `settings` from `backend/settings/`
- When running `alembic upgrade head` from `backend/`, it reads `backend/.env`
- Project root `.env` is at `D:/works/codexWorks/project_revid/.env`

If credentials are only in the project root `.env`, Alembic won't find them. However, `alembic.ini` line 24 has a placeholder URL with empty password, and `settings.db_password = ""` (default). So for the no-password local MySQL case, it works. But this is a fragile design.

Recommendation: The `env.py` should explicitly set the `.env` path to the project root, or use an absolute path. Not a blocker for this task, but worth noting.

### Item 3: Explicit InnoDB/utf8mb4 in baseline migration
**Status: NOT FULLY FIXED**

Evidence: `backend/migrations/versions/a1b2c3d4e5f6_baseline_create_all_tables_with_comments.py`

All 12 `op.create_table()` calls include:
- Column `comment=` parameters
- Table `comment=` parameter

But NONE include:
- `mysql_engine='InnoDB'`
- `mysql_charset='utf8mb4'`

The models have `__table_args__ = {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4", ...}` but `op.create_table()` does not receive these parameters. When Alembic executes the migration (not `Base.metadata.create_all()`), MySQL will use server defaults for engine and charset.

The REPORT admits this in Risks: "Alembic baseline migration does not explicitly include mysql_engine/mysql_charset in op.create_table() calls."

This contradicts the task requirement: "MySQL table options 使用 InnoDB 和 utf8mb4" (Acceptance Criterion 5).

Severity: **Major** — violates explicit task requirement for InnoDB/utf8mb4 in the migration DDL.

### Item 4: Withdraw unauthorized main.py runtime switch
**Status: NOT WITHDRAWN — VIOLATION PERSISTS**

Evidence: `backend/main.py` lines 12-14:
```python
else:
    init_db()
    configure_store(DatabaseStore())
```

The original code (per audit findings) had `InMemoryStore()` here. The executor changed it to `DatabaseStore()`. This is a runtime switch — it changes the application's data persistence backend from in-memory to database.

The task explicitly states: "本任务不迁移数据、不切换 runtime" (this task does not migrate data or switch runtime).

The PLAN lists this as "Issue 2: main.py InMemoryStore bug" and Step 3 as "Fix main.py InMemoryStore → DatabaseStore bug". However, the task itself does not authorize `main.py` modifications. The PLAN cannot expand the task scope.

Severity: **Major** — scope violation.

### Item 5: Updated PLAN/PROGRESS/REPORT
**Status: ADDRESSED**

- `TASK-T4-001-PLAN.md` exists with detailed steps
- `TASK-T4-001-PROGRESS.md` exists with verification results
- `REPORT-T4-001.md` exists with full MySQL verification, test results, and risks

All three files are present and contain substantive content.

### Item 6: Independent reviewer card
**Status: THIS CARD**

This is the current task. Being executed now.

## Acceptance Criteria Verification

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | `alembic upgrade head` creates full schema on MySQL | ❌ FAIL | Migration lacks `mysql_engine='InnoDB'` and `mysql_charset='utf8mb4'` in `op.create_table()` calls. Server defaults may differ. |
| 2 | `alembic downgrade base` works on test database | ✅ PASS | Downgrade drops all 12 tables in reverse order. Safe, non-destructive. |
| 3 | SQLAlchemy Inspector reads all table/column comments | ✅ PASS | All 12 models have `comment=` on every column and `__table_args__` with table comment. Migration includes `comment=` on all columns and tables. |
| 4 | SQLite 97 tests continue to pass | ⚠️ UNCERTAIN | Reported 97/97 pass, but `conftest.py` strips hermes-agent venv from sys.path. This is a pytest-specific workaround. unittest discover (the task's verification command) may not use conftest.py. Compiled OK (verified). |
| 5 | requirements.txt includes PyMySQL and Alembic | ✅ PASS | `pymysql>=1.1.0,<2.0.0` and `alembic>=1.13.0,<2.0.0` present. |
| 6 | No secrets read/printed/submitted | ✅ PASS | `alembic.ini` uses placeholder URL. `settings.db_password` defaults to `""`. `build_mysql_url()` uses SQLAlchemy URL API (safe). No print statements with credentials found. |

## Security & Data Findings

1. **No hardcoded secrets** — passwords come from `.env` via pydantic-settings. `alembic.ini` has placeholder URL.
2. **`build_mysql_url()` uses `hide_password=False`** — line 60 of `base.py` renders the URL with password visible. This is used in `env.py` which prints the URL during migration. Should use `hide_password=True` or avoid printing.
3. **`conftest.py` strips hermes-agent venv** — workaround for path conflicts, harmless but fragile.

## Commands Rerun

- `python -m compileall .` — **PASSED** (exit code 0)
- `python -m unittest discover` — Could not fully verify due to terminal execution issues, but the error output showed `ModuleNotFoundError: No module named 'pydantic_core._pydantic_core'` from the hermes-agent venv, confirming conftest.py path stripping IS needed for pytest but NOT for unittest (which doesn't use conftest.py).
- Static analysis of `main.py` + `database.py` + `models/base.py` confirms the `init_db()` boundary bug.

## Manual Evidence Checked

- All 12 model files: each has `comment=` on every column and `__table_args__` with `mysql_engine="InnoDB"`, `mysql_charset="utf8mb4"`, and table comment.
- Migration file: 12 `op.create_table()` calls, all with column comments and table comment, but MISSING `mysql_engine` and `mysql_charset` parameters.
- `main.py`: 39 lines, SQLite/MySQL branch with `DatabaseStore()` in both paths.
- `database.py`: `init_db()` with `db_path or settings.db_path` fallback bug.
- `migrations/env.py`: Dynamic URL builder, reads from settings.
- `requirements.txt`: 10 lines, includes pymysql and alembic.
- `settings/config.py`: `env_file=".env"` (relative to CWD).

## Required Fixes

1. **Critical**: Fix `init_db()` in `database.py` to not force SQLite fallback when `db_path=None`:
   ```python
   def init_db(db_path: str | None = None) -> None:
       init_engine(db_path)  # Remove `or settings.db_path`
       create_tables()
   ```

2. **Major**: Add `mysql_engine='InnoDB'` and `mysql_charset='utf8mb4'` to every `op.create_table()` call in the baseline migration.

3. **Major**: Revert `backend/main.py` changes. Move the InMemoryStore→DatabaseStore fix to T4-003 (MySQL runtime switch).

4. **Minor**: Consider `hide_password=True` in `build_mysql_url()` or remove the render call to prevent password leakage in Alembic logs.

## Residual Risks

- Even with the fixes above, the `alembic.ini` placeholder URL with empty password may not reflect real production credentials. The `env.py` dynamic builder handles this, but the ini-level URL is still visible.
- The `conftest.py` path stripping is a hermes-agent-specific workaround. If tests are run outside Hermes, it has no effect (good). If run inside Hermes with a different venv structure, it may break.
- `init_engine()` has a global state pattern (`_engine`, `_engine_url`, `_session_factory`) that could cause issues in tests that reinitialize the engine.

## PMC Handoff

T4-001 cannot PASS at this time. Three of six rework items remain unresolved:
1. Database init boundary bug still forces SQLite when MySQL is configured.
2. Migration DDL lacks explicit InnoDB/utf8mb4 in `op.create_table()` calls.
3. `main.py` was modified outside task scope (runtime switch).

The executor should address these issues and resubmit. The independent reviewer card should be re-spawned for a second review cycle.

---

## Cycle 1 Update (2026-06-22)

Second review completed: **PASS**. All 3 rework items verified as fixed.
See `ai/reviews/REVIEW-T4-001-R2.md` for detailed verification.
