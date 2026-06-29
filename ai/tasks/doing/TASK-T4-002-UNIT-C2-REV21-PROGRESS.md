# PROGRESS — T4-002 Unit C2 Revision 21

## Revision
`phase4-wave2-unit-c2-migration-core-policy-handoff-fixed-2026-06-29-21`

## Attempt
0

## Timeline

| Step | Status | Time | Notes |
|------|--------|------|-------|
| 1. Environment Check | DONE | — | `REVID_TEST_MYSQL_ADMIN_URL` SET, Python 3.13.2 |
| 2. Syntax Validation | DONE | — | Both files compile OK |
| 3. Run 4 AC Tests | DONE | 4.05s | 3 passed, 1 failed, 1 error |
| 4. Diff Verification | DONE | — | No business file changes |
| 5. Report Generation | DONE | — | See REPORT-T4-002-UNIT-C2-REV21.md |

## Test Results

| Test | Result | Notes |
|------|--------|-------|
| test_ac1_dry_run_no_changes | PASS | Dry-run did not change users count |
| test_ac2_full_migration_succeeds | PASS | 12 tables migrated with correct counts |
| test_ac3_idempotency | FAIL | IntegrityError: Duplicate entry 'q-001' for key 'quotas.PRIMARY' |
| test_ac5_source_immutable | ERROR | Test body passed; teardown failed: Windows file lock on fixture.db |

## Known Issues

### ac3: existing_map not populated from ac2 data
When running all 4 tests as a class, ac3's `migrate_table` does `SELECT * FROM quotas` but the `existing_map` does not contain rows inserted by ac2. This causes an INSERT instead of SKIP, resulting in `IntegrityError: Duplicate entry 'q-001'`. When ac3 runs in isolation, it fails with `AssertionError: 0 != 2` (empty DB, migration adds data). This is a pre-existing test ordering / transaction visibility issue.

### ac5: Windows file lock in teardown
`shutil.rmtree` fails with `PermissionError [WinError 32]` because the SQLite connection in `SQLiteReader` has not fully released the `.db` file handle before teardown attempts to delete the temp directory.
