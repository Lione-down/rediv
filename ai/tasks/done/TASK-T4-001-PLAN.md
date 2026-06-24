# T4-001 PLAN: MySQL 8 引擎、模型备注与 Alembic baseline

## Objective
让现有 SQLAlchemy 模型能在本地 MySQL 8.0 上通过 Alembic 创建带完整备注的 schema。

## Issues Found

### Issue 1: Migration `server_default` vs Model `default` mismatch
The migration uses `server_default=sa.text('0')` etc. for some columns but the models use Python-side `default=0`. For MySQL, we need `server_default` on ALL columns that have defaults, so the DB enforces them.

**Fix**: Ensure migration has `server_default` for every column with a model default.

### Issue 2: `main.py` InMemoryStore bug
When `use_sqlite=False`, main.py configures `InMemoryStore()` instead of `DatabaseStore()`. This is a known bug from the codebase audit.

**Fix**: Change to `configure_store(DatabaseStore())` when not using SQLite.

### Issue 3: Missing `conftest.py` for pytest
Tests are run as standalone scripts. Need a conftest to set up pytest mode properly.

### Issue 4: alembic.ini URL placeholder
The ini file uses `${REVID_DB_USER}` syntax which requires shell expansion. Should use a proper env-var reference that Alembic understands.

## Steps

1. Verify model ↔ migration column parity (done — all 12 tables match)
2. Fix migration `server_default` for all defaulted columns
3. Fix `main.py` InMemoryStore → DatabaseStore bug  
4. Fix `alembic.ini` URL to not leak credentials
5. Create `conftest.py` for pytest compatibility
6. Test: `alembic upgrade head` on SQLite (dry-run)
7. Test: SQLite tests still pass
8. Verify MySQL connectivity (if password available)

## Scope Boundaries
- Only modify: `backend/models/**`, `backend/settings/config.py`, `backend/requirements.txt`, `backend/database.py`, `backend/main.py`, `backend/alembic.ini`, `backend/migrations/**`
- No business router changes
- No frontend changes
- No real .env access
