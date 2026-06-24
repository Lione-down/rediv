# T4-002 PLAN — phase4-wave2-manual-rework-2026-06-24-05

## Revision
`phase4-wave2-manual-rework-2026-06-24-05`

## Objective
Rewrite `scripts/migrate_sqlite_to_mysql.py` to satisfy all 12 acceptance criteria and hard gates, eliminating the 4 known failure fingerprints from old revisions.

## Approach

### 1. Secret Validation (AC7, Hard Gate)
- **ONLY** accept `REVID_TEST_MYSQL_ADMIN_URL` from environment
- NO fallback to `.env`, `REVID_MYSQL_URL`, `REVID_DB_*`, or any other source
- If missing → print BLOCKED message → exit(1)
- Admin URL is a MySQL admin connection (can CREATE/DROP DATABASE)

### 2. Structured URL API & Database Identity (AC8, Hard Gate)
- Parse admin URL using `urllib.parse.urlparse`
- Extract host, port, user, password
- Construct test database URL using SQLAlchemy `URL.create()`:
  - `drivername="mysql+pymysql"`
  - `host=...`, `port=...`, `username=...`, `password=...`, `database="revid_test_t4_002"`
- Before EVERY CREATE/DROP: assert `database == "revid_test_t4_002"`
- Redact full URL in all logs

### 3. Alembic Upgrade Head for Schema (AC9, Hard Gate)
- Use `alembic.command.upgrade(alembic_cfg, "head")` to create all 12 tables
- NO handwritten DDL in the migration script
- The TABLE_DEFS in the old script is replaced by Alembic-driven schema creation
- The migration script ONLY handles data ETL

### 4. ETL Logic (AC1, AC2, AC3)
- SQLiteReader: read-only access to source DB, never writes
- Per-table batch insert with ON DUPLICATE KEY UPDATE for idempotency
- FK-order-aware processing (TABLE_ORDER)
- Transaction-per-batch: if any row in a batch fails, rollback entire batch
- Dry-run mode: SELECT-only, no writes, report row counts/checksums
- Execute mode: actual INSERT/UPDATE

### 5. Dry-Run Safety (AC1, Hard Gate)
- Default mode is `--dry-run`
- `--execute` flag required for any writes
- Even with `--execute`, dry-run simulation runs first internally

### 6. Source Immutability (AC5)
- Record source file size and mtime before reading
- Verify after reading — if changed, abort

### 7. Validation & Consistency Report (AC6)
- Row count comparison per table
- PK set comparison
- FK orphan detection
- Critical JSON field round-trip check
- Business integer field exact match
- Non-zero exit on any validation failure

### 8. Conflict Detection (AC10)
- Same-PK different-value → detect during validation
- Exit with non-zero code, report table name and PK
- Existing MySQL data remains untouched on failure

### 9. Partial Rollback (AC11)
- Per-batch transaction: if batch fails mid-way, rollback entire batch
- Test must create a scenario where batch #N fails, proving batch #N-1 was rolled back too

### 10. Cleanup Visibility (AC12)
- Cleanup function: DROP DATABASE revid_test_t4_002
- Cleanup failure → print visible error → exit(1)
- No silent exception swallowing

## File Changes

### Modified
- `backend/scripts/migrate_sqlite_to_mysql.py` — complete rewrite

### New
- `backend/tests/test_migration_tool.py` — comprehensive tests for all 12 AC

### Documentation
- `ai/tasks/doing/TASK-T4-002-PLAN.md` — this file
- `ai/tasks/doing/TASK-T4-002-PROGRESS.md` — execution log
- `ai/reports/REPORT-T4-002.md` — completion report

## Test Plan (12 AC)

| AC | Test Name | Method |
|----|-----------|--------|
| 1 | test_dry_run_no_mysql_changes | Dry-run on populated DB, verify MySQL unchanged |
| 2 | test_full_migration_succeeds | Execute migration on fresh test DB, verify all 12 tables |
| 3 | test_idempotency_second_run | Run execute twice, verify same row counts |
| 4 | test_fk_orphan_detected | Insert orphan FK row, verify non-zero exit with table name |
| 5 | test_source_immutability | Verify revid.db not modified during migration |
| 6 | test_consistency_report_12_tables | Verify report contains all 12 tables with matching counts |
| 7 | test_secret_missing_blocked | Unset env var, verify BLOCKED exit |
| 8 | test_structured_url_and_identity | Verify URL constructed via SQLAlchemy URL API, db name = revid_test_t4_002 |
| 9 | test_alembic_upgrade_head | Verify schema created by Alembic, no DDL in script |
| 10 | test_conflict_nonzero_exit | Same-PK different-value, verify non-zero exit, data untouched |
| 11 | test_partial_rollback | Batch failure mid-way, verify no partial commit |
| 12 | test_cleanup_failure_visible | Simulate cleanup failure, verify visible error |

## Risk Assessment
- **Low risk**: Script only operates on `revid_test_t4_002`, never on `revid_db`
- **Medium risk**: Alembic upgrade head may fail if env.py can't find models — need to ensure PYTHONPATH
- **Mitigation**: All destructive ops gated by exact database name assertion
