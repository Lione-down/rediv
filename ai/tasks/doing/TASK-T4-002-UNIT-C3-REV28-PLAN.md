# PLAN — T4-002 Unit C3 Revision 28 Integrity Remediation

## Objective

Fix destination FK orphan validation and deterministic test isolation/cleanup defects so all five real-MySQL Unit C3 selectors pass in a single ordered execution.

## Defects to Fix

### 1. AC4 — Destination FK orphan not inspected (migrate_sqlite_to_mysql.py)

**Root cause:** `MigrationValidator.validate()` builds FK values from `src_rows` (SQLite source data). An orphan injected only into MySQL target has no corresponding source row, so the FK check never sees it.

**Fix:** Read FK values from MySQL target child table, compare against target parent referenced IDs.

**File:** `backend/scripts/migrate_sqlite_to_mysql.py` lines 622-639

### 2. AC4 — Cleanup not in finally block (test_migration_tool.py)

**Root cause:** Orphan cleanup runs after assertion. If assertion fails, cleanup never runs.

**Fix:** Wrap cleanup in `try/finally`.

### 3. AC6 — Shared DB state contamination

**Root cause:** AC6 runs after AC4; leftover orphan contaminates validation.

**Fix:** Clear all MySQL data before AC6 migration.

### 4. AC10 — Arrange step collides with class fixture

**Root cause:** Class fixture already has `user-001`; AC10 inserts conflicting row then migration collides.

**Fix:** Clear all data first, insert ONLY conflicting row.

### 5. AC12 — Missing DB recovery after injected failure

**Root cause:** Disposable DB not recreated after cleanup failure injection.

**Fix:** Add `_setup_test_db()` helper; call after injected failure.

### 6. SQLite handle leak

**Fix:** Ensure all engines disposed before `tearDownClass` removes temp dir.

## Allowed Files

- `backend/scripts/migrate_sqlite_to_mysql.py`
- `backend/tests/test_migration_tool.py`

## Verification Commands

```bash
python -m py_compile backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py
python -m pytest ... -q -p no:cacheprovider
git diff --check -- backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py
```

## Stop Condition

Generate PLAN, PROGRESS, REPORT. Stop at `UNIT_C3_REMEDIATION_REPORT_READY_REV28`.
