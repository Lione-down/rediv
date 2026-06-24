# TASK-T4-002-PLAN.md

## Task: T4-002 — Test DDL JSON DEFAULT 修复 (wave2 rework-2026-06-23-02)

### Objective
Fix JSON column DEFAULT syntax in `_CREATE_TABLES_SQL` within `backend/tests/test_migration_tool.py` to be compatible with MySQL 8.0+ STRICT mode.

### Root Cause
MySQL 8.0.43+ STRICT mode rejects `JSON NOT NULL DEFAULT '{}'` (string literal).
Must use `JSON NOT NULL DEFAULT (json('{}'))` (JSON function call) instead.

### Changes

**File:** `backend/tests/test_migration_tool.py`

#### Part 1: `_CREATE_TABLES_SQL` DDL (lines 628, 662, 704, 737)

| Line | Current | Fix |
|------|---------|-----|
| 628 | `` `local_project_snapshot` JSON NOT NULL DEFAULT '{}' `` | `` `local_project_snapshot` JSON NOT NULL DEFAULT (json('{}')) `` |
| 662 | `` `content` JSON NOT NULL DEFAULT '{}' `` | `` `content` JSON NOT NULL DEFAULT (json('{}')) `` |
| 704 | `` `node_data` JSON NOT NULL DEFAULT '[]' `` | `` `node_data` JSON NOT NULL DEFAULT (json('[]')) `` |
| 737 | `` `detail` JSON NOT NULL DEFAULT '{}' `` | `` `detail` JSON NOT NULL DEFAULT (json('{}')) `` |

#### Part 2: `DryRunIntegrationTests._setup_test_data()` DDL (lines 380, 391, 406, 418)

| Line | Current | Fix |
|------|---------|-----|
| 380 | `JSON NOT NULL DEFAULT '{}'` | `JSON NOT NULL DEFAULT (json('{}'))` |
| 391 | `JSON NOT NULL DEFAULT '{}'` | `JSON NOT NULL DEFAULT (json('{}'))` |
| 406 | `JSON NOT NULL DEFAULT '[]'` | `JSON NOT NULL DEFAULT (json('[]'))` |
| 418 | `JSON NOT NULL DEFAULT '{}'` | `JSON NOT NULL DEFAULT (json('{}'))` |

### Verification Plan
1. `python -m compileall backend/tests/test_migration_tool.py` — syntax check
2. `cd backend && python -m unittest tests.test_migration_tool -v` — all 31 tests
3. Verify MySQL connectivity: `mysql -u root -proot123 -e "SELECT 1"`

### Scope Boundaries
- Only modify `_CREATE_TABLES_SQL` and `_setup_test_data()` JSON DEFAULT clauses
- No changes to `migrate_sqlite_to_mysql.py` (TABLE_DEFS already correct)
- No changes to Alembic migrations
- No changes to frontend or business code

### Risk Assessment
- **Low risk**: purely test DDL syntax fix
- **No data impact**: only affects test database creation
- **No secret exposure**: passwords remain masked
