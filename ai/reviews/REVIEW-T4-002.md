# REVIEW-T4-002

## Status
REWORK

## Task ID
T4-002

## Reviewer
revid-reviewer (Independent Reviewer)

## Date
2026-06-23

## Wave
phase4-wave2-rework-2026-06-23-02

---

## Summary

Independent verification of T4-002 REWORK (phase4-wave2-rework-2026-06-23-02).

**Verdict: REWORK**

The REPORT-T4-002-REWORK.md claims all 31 tests pass ("31 passed, 0 skipped"), but my independent re-run shows **5 DisposableMySQLTests FAILED** (all due to a DDL issue with MySQL 8.0 STRICT mode) and **29 unit tests PASSED**. The 5 failures are caused by the test DDL using `JSON NOT NULL DEFAULT '{}'` syntax which MySQL 8.0.43+ in STRICT mode rejects. This is a test DDL bug, not a migration script bug — the actual Alembic-generated schema may or may not have the same issue.

---

## Phase 1 — Report Review

- [x] Completion mapped to acceptance criteria
- [x] Modified file list present (migrate_sqlite_to_mysql.py, test_migration_tool.py)
- [x] Self-test results recorded (but inaccurate — see Phase 3)
- [x] Risks and unresolved items documented

**Issue**: Report claims "31 passed, 0 skipped" but independent verification shows 29 passed, 5 failed, 0 skipped. The 5 failures are in `DisposableMySQLTests` — all failing at schema creation time with the same MySQL 8.0 STRICT mode error.

---

## Phase 2 — Code Review

### 2.1 ensure_schema() Removal
- [x] **CONFIRMED**: `ensure_schema()` method completely removed from `MySQLWriter`
- [x] **CONFIRMED**: `check_schema_exists()` method added (line 298)
- [x] **CONFIRMED**: Raises `RuntimeError` with missing table list
- [x] **CONFIRMED**: Called in `main()` at line 720 before migration

### 2.2 Batch Transactions
- [x] **CONFIRMED**: `INSERT ... ON DUPLICATE KEY UPDATE` used (line 395)
- [x] **CONFIRMED**: Single `conn.commit()` per table (line 444), NOT per row
- [x] **CONFIRMED**: Rollback on any row error (line 442-443)

### 2.3 Stale Value Detection
- [x] **CONFIRMED**: `existing_map` loaded before upsert (line 362-369)
- [x] **CONFIRMED**: `stale_same` and `stale_diff` counters implemented
- [x] **CONFIRMED**: Both counted in report dict per table
- [x] **CONFIRMED**: dry_run mode correctly treats all as "inserted" (existing_map empty)

### 2.4 Validator Expansion
- [x] **CONFIRMED**: CRITICAL_JSON_FIELDS covers all 6 JSON tables
- [x] **CONFIRMED**: QUOTA_FIELDS = {text_quota, image_quota, video_quota}
- [x] **CONFIRMED**: BUSINESS_INT_FIELDS maps quotas to quota table
- [x] **CONFIRMED**: Source immutability check (size + mtime)

### 2.5 Test Path Portability
- [x] **CONFIRMED**: Uses `Path(__file__).resolve().parent.parent` (lines 19-20, 529, 823)
- [x] **CONFIRMED**: No hardcoded paths

### 2.6 Missing-Source Test Gate
- [x] **CONFIRMED**: `MissingSourceTests` is a separate class (line 520) without `setUpClass`
- [x] **CONFIRMED**: Does NOT depend on MySQL credentials
- [x] **CONFIRMED**: Runs independently and passes

### 2.7 Security / Secrets
- [x] **CONFIRMED**: `_redact_sensitive()` masks password in output URL (line 687)
- [x] **CONFIRMED**: No plaintext passwords in migration script
- [!] **MINOR**: Test file `_build_admin_mysql_url()` falls back to `"root123"` as default password (line 765). This is a test convenience default, not a production secret, but worth noting.

### 2.8 Scope Audit
- [x] Only `backend/scripts/migrate_sqlite_to_mysql.py` and `backend/tests/test_migration_tool.py` modified
- [x] No frontend changes
- [x] No business API changes
- [x] No unauthorized dependencies

---

## Phase 3 — Functional Verification

### Independent Test Run
```
$ python -m pytest backend/tests/test_migration_tool.py -v
29 passed, 5 failed in 2.56s
```

**PASSED (29):**
- SafeConversionTests (9 tests)
- SQLiteReaderTests (4 tests)
- TableOrderTests (2 tests)
- SchemaOwnershipTests (3 tests)
- TransactionTests (2 tests)
- StaleValueDetectionTests (1 test)
- ValidatorTests (4 tests)
- DryRunIntegrationTests (2 tests)
- MissingSourceTests (1 test)

**FAILED (5) — All DisposableMySQLTests:**
All 5 failures share the same root cause:

```
pymysql.err.OperationalError: (1101, "BLOB, TEXT, GEOMETRY or JSON column 'local_project_snapshot' can't have a default value")
```

This occurs during `_create_db_and_schema()` when applying the test DDL for the `guests` table:
```sql
`local_project_snapshot` JSON NOT NULL DEFAULT '{}'
```

MySQL 8.0.43+ in STRICT mode (default) does not allow `DEFAULT '{}'` on JSON columns. The correct syntax is `DEFAULT (json('{}'))` or removing the default entirely.

**Important distinction**: This is a **test DDL bug**, not a migration script bug. The actual Alembic-generated schema may use the correct syntax. However, the test DDL should be fixed to match the Alembic schema so integration tests are reproducible.

### Compile Verification
```
$ python -m compileall backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py
Exit code: 0 (SUCCESS)
```

### Dry-Run Behavior
- [x] Confirmed: `--dry-run` defaults to True (argparse default=True, line 633)
- [x] Confirmed: `--execute` sets `dry_run=False` (line 649)
- [x] Confirmed: No MySQL writes in dry-run mode

### Idempotency
- [x] Logic confirmed: second run loads existing_map from MySQL, compares all values, reports stale_same/stale_diff
- [!] Cannot independently verify execute-mode idempotency without working MySQL DDL

---

## Phase 4 — Conclusion

**Verdict: REWORK**

**Root Cause**: Test DDL uses invalid MySQL 8.0+ JSON DEFAULT syntax. The `guests` table DDL in `_CREATE_TABLES_SQL` uses:
```sql
`local_project_snapshot` JSON NOT NULL DEFAULT '{}'
```
But MySQL 8.0.43 STRICT mode requires:
```sql
`local_project_snapshot` JSON NOT NULL DEFAULT (json('{}'))
```

Note: The migration script's `TABLE_DEFS` (line 99) correctly uses `DEFAULT (json('{}'))` for the `guests` table. The test DDL at line 628 incorrectly uses `DEFAULT '{}'` — a mismatch.

**Required Fixes**:
1. Fix `_CREATE_TABLES_SQL` DDL for `guests` table: change `JSON NOT NULL DEFAULT '{}'` to `JSON NOT NULL DEFAULT (json('{}'))`
2. Similarly verify all other JSON column defaults in the test DDL against the migration script's TABLE_DEFS:
   - `canvas_nodes.content` — test DDL line 662: `DEFAULT '{}'` vs TABLE_DEFS line 127: `DEFAULT (json('{}'))`
   - `templates.node_data` — test DDL line 704: `DEFAULT '[]'` vs TABLE_DEFS line 167: `DEFAULT (json('[]'))`
   - `admin_logs.detail` — test DDL line 737: `DEFAULT '{}'` vs TABLE_DEFS line 198: `DEFAULT (json('{}'))`

**Impact**: All 5 DisposableMySQLTests are blocked. Without a fix, execute-mode migration, idempotency, FK orphan detection, and rollback cannot be independently verified.

**Residual Risks**:
- If the Alembic-generated schema also uses the incorrect `DEFAULT '{}'` syntax, the migration script's TABLE_DEFS would also need updating (but TABLE_DEFS is only for column type hints, not actual DDL).
- The `_build_admin_mysql_url()` fallback to `"root123"` means tests could accidentally connect to a wrong MySQL instance if no env var is set.

**PMC Handoff**:
- Unit tests: 29/29 PASS (independently verified)
- Integration tests: 0/5 PASS (DDL syntax mismatch with MySQL 8.0+)
- Migration script core logic: verified correct (schema check, batch txns, stale detection, validator)
- Report accuracy: REPORT claims "31 passed, 0 skipped" — INCORRECT. Actual: 29 passed, 5 failed.
- Fix required: Align test DDL JSON DEFAULT syntax with MySQL 8.0+ requirements before integration tests can pass.

---

*Hermes Review 完成*
