# REPORT — T4-002 Unit C3 Revision 28 Integrity Remediation

## Metadata

- Task: T4-002
- Revision: phase4-wave2-unit-c3-integrity-remediation-2026-07-01-28
- Executor: t_670af729
- Date: 2026-07-01
- Status: PASS

## Commands Executed

```bash
python -m py_compile backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py
python -m pytest backend/tests/test_migration_tool.py::TestMigrationTool::test_ac4_fk_orphan_detected \
                 backend/tests/test_migration_tool.py::TestMigrationTool::test_ac6_consistency_report \
                 backend/tests/test_migration_tool.py::TestMigrationTool::test_ac10_conflict_nonzero_exit \
                 backend/tests/test_migration_tool.py::TestMigrationTool::test_ac11_partial_rollback \
                 backend/tests/test_migration_tool.py::TestMigrationTool::test_ac12_cleanup_failure_visible \
                 -q -p no:cacheprovider
git diff --check -- backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py
```

## Results

- `py_compile`: PASSED (no syntax errors)
- pytest: **5 passed**, 0 failed, 0 skipped, 0 errors (2.59s)
- `git diff --check`: PASSED (no trailing whitespace)

## Database Identity

- Target database: `revid_test_t4_002`
- MySQL: 8.0.43 (admin URL from `REVID_TEST_MYSQL_ADMIN_URL`)

## Changes Summary

### backend/scripts/migrate_sqlite_to_mysql.py

**MigrationValidator.validate() FK orphan detection** (lines 622-639):
Changed from reading FK values from SQLite source rows to reading from MySQL target child table. Previously `src_values = {str(r[src_col]) for r in src_rows ...}` would miss orphans injected only in MySQL. Now uses `SELECT DISTINCT fk_col FROM child_table WHERE fk_col IS NOT NULL` to read actual target values.

### backend/tests/test_migration_tool.py

1. **test_ac4_fk_orphan_detected**: Wrapped orphan cleanup in `try/finally` so `engine.dispose()` and DELETE always run regardless of assertion outcome.

2. **test_ac6_consistency_report**: Added deterministic clean state at start — clears all 12 tables in FK-reversed order before migration to prevent AC4 residue contamination.

3. **test_ac10_conflict_nonzero_exit**: Added step to clear ALL existing data before inserting the conflicting row. Cleanup of the conflicting row now uses `SET FOREIGN_KEY_CHECKS=0` to avoid FK cascade errors on DELETE.

4. **test_ac12_cleanup_failure_visible**: Changed patch target from string-based `patch("test_migration_tool.cleanup_test_database", ...)` (fails when pytest loads module as `__main__`) to `patch.object(sys.modules[__name__], "cleanup_test_database", ...)` for robust dynamic resolution. Added `_recreate_test_db()` call after injected failure to restore valid database state. Removed unused `import builtins`.

5. **tearDownClass**: Updated docstring clarifying resource disposal ordering.

## Acceptance Criteria

| AC | Description | Result |
|---|---|---|
| AC4 | FK orphan detected from target child table, message includes `quotas`, FK column, `nonexistent-user` | PASS |
| AC6 | 12-table consistency report, independent of AC4 residue | PASS |
| AC10 | Non-zero exit from same-PK conflict, target value preserved | PASS |
| AC11 | Partial rollback — no partial commit on batch failure | PASS (unchanged) |
| AC12 | Cleanup failure visible, DB recreated after injected failure | PASS |

## Fingerprint Inheritance

All historical T4-002 fingerprints inherited. No fingerprint cleared.

## Unverified Items

None. All five selectors passed against real MySQL in a single ordered execution.

## Business Diff

Only allowed files modified:
- `backend/scripts/migrate_sqlite_to_mysql.py` (+15/-5 lines)
- `backend/tests/test_migration_tool.py` (+119/-60 lines)

No secret exposure. No unauthorized database access. No scope drift.

## Conclusion

`UNIT_C3_REMEDIATION_REPORT_READY_REV28` — all five Unit C3 selectors pass in a single real-MySQL execution. Revision `-28` is ready for PMC review.
