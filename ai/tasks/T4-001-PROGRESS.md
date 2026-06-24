# T4-001 PROGRESS — REWORK 执行日志

## 2026-06-22 — REFIX Cycle

### Step 1: Fix database.py init_db() boundary bug
- **File**: `backend/database.py` line 12
- **Before**: `init_engine(db_path or settings.db_path)`
- **After**: `init_engine(db_path)`
- **Status**: DONE

### Step 2: Add mysql_engine/mysql_charset to baseline migration
- **File**: `backend/migrations/versions/a1b2c3d4e5f6_baseline_create_all_tables_with_comments.py`
- **Change**: Added `mysql_engine='InnoDB', mysql_charset='utf8mb4'` to all 12 `op.create_table()` calls
- **Status**: DONE

### Step 3: Revert main.py unauthorized runtime switch
- **File**: `backend/main.py` line 14
- **Before**: `configure_store(DatabaseStore())`
- **After**: `configure_store(InMemoryStore())`
- **Status**: DONE

### Compilation check
- **Command**: `python -m compileall .` in backend/
- **Status**: PENDING (after all edits)
