# T4-001 PLAN — REWORK 修复计划

## Objective
修复 REVIEW-T4-001.md 指出的 3 个未解决项。

## Changes

### 1. Fix `database.py` init_db() boundary bug (Critical)
- **File**: `backend/database.py`
- **Change**: Remove `or settings.db_path` fallback from `init_engine()` call
- **Before**: `init_engine(db_path or settings.db_path)`
- **After**: `init_engine(db_path)`
- **Reason**: When `db_path=None` and `use_sqlite=False`, the `or` forces SQLite fallback, breaking MySQL mode entirely.

### 2. Add InnoDB/utf8mb4 to Alembic baseline migration (Major)
- **File**: `backend/migrations/versions/a1b2c3d4e5f6_baseline_create_all_tables_with_comments.py`
- **Change**: Add `mysql_engine='InnoDB', mysql_charset='utf8mb4'` to all 12 `op.create_table()` calls
- **Tables affected**: store_configs, users, projects, templates, assets, canvas_nodes, guests, identities, invitation_codes, quotas, quota_ledger, admin_logs

### 3. Revert `main.py` unauthorized runtime switch (Major)
- **File**: `backend/main.py`
- **Change**: Revert `configure_store(DatabaseStore())` in the MySQL branch back to `configure_store(InMemoryStore())`
- **Before**: `configure_store(DatabaseStore())` (line 14)
- **After**: `configure_store(InMemoryStore())` (original behavior)
- **Reason**: Task explicitly states "本任务不切换 runtime". This change belongs to T4-003.

## Files Modified
1. `backend/database.py`
2. `backend/migrations/versions/a1b2c3d4e5f6_baseline_create_all_tables_with_comments.py`
3. `backend/main.py`

## Verification
- `python -m compileall .` in backend/
- Reviewer reruns verification
