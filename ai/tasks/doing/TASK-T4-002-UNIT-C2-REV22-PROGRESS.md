# PROGRESS — T4-002 Unit C2 Revision 22

## Revision
`phase4-wave2-unit-c2-child-contract-corrected-2026-06-29-22`

## Timeline

| Time (UTC) | Step | Status | Notes |
|------------|------|--------|-------|
| 2026-06-29T05:20:00 | Task oriented | DONE | Read task spec, test file, parent handoff |
| 2026-06-29T05:20:00 | PLAN created | DONE | TASK-T4-002-UNIT-C2-REV22-PLAN.md |
| 2026-06-29T05:20:00 | PROGRESS created | DONE | This file |
| 2026-06-29T05:20:30 | Env check | DONE | pytest 9.1.1, MySQL 8.0, REVID_TEST_MYSQL_ADMIN_URL set |
| 2026-06-29T05:20:30 | Syntax validation | DONE | Both files compile cleanly |
| 2026-06-29T05:21:00 | Test AC1 | DONE | PASSED (individual run) |
| 2026-06-29T05:21:00 | Test AC2 | DONE | PASSED (individual run) |
| 2026-06-29T05:22:00 | All 4 tests batch | DONE | AC1 PASS, AC2 PASS, AC3 FAIL, AC5 PASS |
| 2026-06-29T05:23:00 | Report generation | DONE | REPORT-T4-002-UNIT-C2-REV22.md created |

## Test Results (batch run, in selector order)

| Selector | Result | Details |
|----------|--------|---------|
| test_ac1_dry_run_no_changes | PASSED | Dry-run did not write to MySQL |
| test_ac2_full_migration_succeeds | PASSED | Full migration inserted all 12 tables |
| test_ac3_idempotency | FAILED | `migrate_table` attempts INSERT for stale_same rows (identical PK), causing `Duplicate entry 'q-001' for key 'quotas.PRIMARY'`. Bug in business logic — stale_same rows are not excluded from INSERT batch. |
| test_ac5_source_immutable | PASSED | Fixture file size unchanged (error on teardown due to Windows file lock on fixture.db, unrelated to AC5) |

## Risk Assessment

- **AC3 failure root cause**: `migrate_sqlite_to_mysql.py:445` — bulk INSERT SQL includes ALL rows from source, including stale_same rows. Should filter to only `inserted` rows (PK not in existing_map).
- **Business file is read-only per task contract** — cannot fix in this revision.
- **Teardown error**: Windows file lock on `fixture.db` prevents `shutil.rmtree` — cosmetic, does not affect test results.
