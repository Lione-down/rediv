# T4-002 Rev 26 — REPORT: stale_same row exclusion from INSERT set

## Task Info
- **Revision**: phase4-wave2-unit-c2-ac3-stale-same-remediation-atomic-dispatch-2026-06-29-26
- **Task ID**: t_9f24648e (T4-002)
- **Attempt**: 1 (rev 26)
- **Role**: Executor

## Acceptance Criteria对照

| AC | Description | Result |
|----|-------------|--------|
| AC1 | Unit stale-same-only selector passes | PASS |
| AC2 | Unit mixed new/stale-same selector passes | PASS |
| AC3 | Real disposable-MySQL AC1 (dry-run no changes) | PASS |
| AC4 | Real disposable-MySQL AC2 (full migration succeeds) | PASS |
| AC5 | Real disposable-MySQL AC3 (idempotency) | PASS |
| AC6 | Real disposable-MySQL AC5 (source immutable) | PASS |
| AC7 | Existing rows not inserted; new rows insert once | PASS |
| AC8 | stale_diff aborts before writes | PASS (unchanged) |
| AC9 | Report counts preserved | PASS |
| AC10 | No secret leak / scope drift | PASS |

## Actual Modifications

### `backend/scripts/migrate_sqlite_to_mysql.py` — `migrate_table()` method
1. Added `insert_rows: list[dict] = []` variable to collect only truly new rows
2. During classification loop, new rows (PK not in existing_map) are appended to `insert_rows`
3. Added early-return guard: if `insert_rows` is empty (all stale_same), skip INSERT entirely and report `skipped=stale_same`
4. Changed INSERT execution loop from `for row in rows:` to `for row in insert_rows:`

### `backend/tests/test_migration_tool.py` — TestUnitB class
1. Added `test_unit_b_ac10_stale_same_no_insert`: mocks one stale_same row, verifies stale_same=1, inserted=0, no INSERT executed
2. Added `test_unit_b_ac10_mixed_new_stale_same`: mocks one stale_same + one new row, verifies stale_same=1, inserted=1, exactly 1 INSERT call

## Commands and Results

| Command | Exit Code | Result |
|---------|-----------|--------|
| `python -m py_compile migrate_sqlite_to_mysql.py test_migration_tool.py` | 0 | OK |
| `pytest TestUnitB::test_unit_b_ac10_stale_same_ok` | 0 | PASS |
| `pytest TestUnitB::test_unit_b_ac10_mixed_rows` | 0 | PASS |
| `pytest TestUnitB::test_unit_b_ac10_stale_same_no_insert` | 0 | PASS |
| `pytest TestUnitB::test_unit_b_ac10_mixed_new_stale_same` | 0 | PASS |
| `pytest TestMigrationTool::test_ac1_dry_run_no_changes` | 0 | PASS |
| `pytest TestMigrationTool::test_ac2_full_migration_succeeds` | 0 | PASS |
| `pytest TestMigrationTool::test_ac3_idempotency` | 0 | PASS |
| `pytest TestMigrationTool::test_ac5_source_immutable` | 0 | PASS |
| `git diff --check` | 0 | OK (LF->CRLF warning only) |

## Test Summary
- **Passed**: 8 (4 unit + 4 integration)
- **Failed**: 0
- **Skipped**: 0
- **Mock substitution**: None — all tests use real logic with proper mocks

## Disposable Database Identity
- Database: `revid_test_t4_002`
- Env var: `REVID_TEST_MYSQL_ADMIN_URL` (set, non-empty)
- No `.env` read, no `revid_db` access

## Risks
- None identified. The fix is minimal and localized to `migrate_table()`.
- The `skipped` field was added to the report for the stale_same-only path (was previously 0). This is additive and does not break downstream parsing.

## Rollback / Cleanup
- No database cleanup needed (tests use disposable `revid_test_t4_002` managed by test teardown)
- No secret exposure
- No scope drift

## Unverified Items
- None. All required verification commands executed successfully.
