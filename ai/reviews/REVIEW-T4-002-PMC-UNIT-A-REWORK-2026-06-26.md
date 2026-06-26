# T4-002 PMC Review — Unit A Rework Required

## Review Context

- Task: T4-002 — SQLite -> MySQL data migration tool
- Queue revision reviewed: `phase4-wave2-unit-a-static-fixes-coordinator-budget-2026-06-26-12`
- Execution state read: `HANDOFF_READY`
- Coordinator card: `t_8283dcb8`
- Executor card: `t_5f026ccc`
- Reviewer card: `t_34896d9c`
- REPORT: `ai/reports/REPORT-T4-002-UNIT-A.md`
- Independent REVIEW: `ai/reviews/REVIEW-T4-002-UNIT-A-INDEPENDENT.md`
- HANDOFF: `ai/handoffs/HANDOFF-T4-002-UNIT-A.md`
- PMC decision time: `2026-06-26 04:18 +08:00`

## Evidence Cursor

| Item | Value |
|---|---|
| Queue revision | `phase4-wave2-unit-a-static-fixes-coordinator-budget-2026-06-26-12` |
| Execution state | `HANDOFF_READY` |
| Execution last transition | `2026-06-26T03:29:00+08:00` |
| Report hash | `E99BE0D18FCBFBF814FFE11FA4FF44222AA3C51531E63C35CF29091AA6413433` |
| Review hash | `522552B505A0203EB95BB98BDB6E7C368DD8E54DF92EBE30B27F4BF598AF73F5` |
| Handoff hash | `B25D63146DDA08443EFB7855AE7EFD061C48D9AE36EB79CA01FF084A083B7BA5` |
| Previous failure fingerprint | `PROCESS_RETRY_EXHAUSTED + COORDINATOR_PRE_DISPATCH_TIMEOUT + T4-002-SEMANTICS + T4-002-ATTEMPT1-STATIC` |

## Authorization

Revision `-12` was authorized for Unit A only, with allowed business files:

- `backend/scripts/migrate_sqlite_to_mysql.py`
- `backend/tests/test_migration_tool.py`

No Unit B, MySQL integration, secret use, destructive database operation, or attempt 2 was authorized.

## Fresh PMC Verification

PMC ran fresh read-only / non-database checks:

| Check | Result | Evidence |
|---|---|---|
| `python -m py_compile backend\scripts\migrate_sqlite_to_mysql.py backend\tests\test_migration_tool.py` | PASS | Both files compile |
| `git diff --check -- backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py` | PASS | Exit 0; Windows CRLF warning only |
| Missing source before secret gate | FAIL | `cd backend; python scripts\migrate_sqlite_to_mysql.py --dry-run --source ...__missing_source_for_pmc__.db` returned `BLOCKED: REVID_TEST_MYSQL_ADMIN_URL is not set` before reporting missing source |
| Cleanup `OperationalError` propagation | PASS | Mocked `create_engine`; `cleanup_test_database()` re-raised `OperationalError` |
| Cleanup test patch target | FAIL | `backend/tests/test_migration_tool.py` imports `cleanup_test_database` directly, but AC12 patch targets `scripts.migrate_sqlite_to_mysql.cleanup_test_database`; the assertion then calls the already-imported local binding, so the fake callable is not exercised |

## Blocking Findings

### P0 — Missing-source validation is still gated behind the MySQL secret

Unit A was required to ensure missing-source validation does not depend on `REVID_TEST_MYSQL_ADMIN_URL`. Current `main()` still calls `get_admin_url()` and builds the target URL before checking `args.source`:

- `backend/scripts/migrate_sqlite_to_mysql.py`: `main()` validates secret around lines 776-778.
- Source existence is checked only later around lines 797-801.

This preserves the exact Unit A defect: a missing source file returns a secret/env BLOCKED message instead of a visible missing-source non-zero result.

### P0 — Cleanup failure injection test patches the wrong callable binding

`backend/tests/test_migration_tool.py` imports `cleanup_test_database` directly at module load time, but `test_ac12_cleanup_failure_visible` patches `scripts.migrate_sqlite_to_mysql.cleanup_test_database` and then calls the already-imported local `cleanup_test_database`. That does not prove the injected cleanup failure propagates through the callable used by the test.

This preserves the Unit A defect: AC12's failure-injection proof can be a false positive or can exercise the wrong object.

### P1 — REPORT / Independent REVIEW do not match the actual allowed-file diff

The REPORT and Independent REVIEW both claim only `backend/scripts/migrate_sqlite_to_mysql.py` was modified. Fresh `git diff --name-only` shows `backend/tests/test_migration_tool.py` is also modified in the working tree. That test-file diff may be inherited partial work, but Unit A was explicitly required to audit both allowed files and report the state accurately.

## PMC Verdict

`PMC_REWORK`

Unit A is not accepted. Do not dispatch Unit B.

The issue is fixable within Unit A scope and does not require Human Owner decision, secret access, MySQL access, destructive operation, or attempt 2. PMC approves a narrow Unit A correction revision only for:

1. Moving missing-source / source stat validation before MySQL secret or target URL validation where safe.
2. Correcting the AC12 cleanup failure injection to patch and assert the actual callable binding used by the test.
3. Updating Unit A REPORT / Independent REVIEW / HANDOFF to accurately cover both allowed files and the targeted non-MySQL checks.

## Failure Fingerprint

`T4-002-UNIT-A-PMC-REWORK: MISSING_SOURCE_STILL_SECRET_GATED + CLEANUP_PATCH_WRONG_BINDING + UNIT_A_EVIDENCE_MISMATCH`

## Hermes Next Action

Consume only the new PMC-approved Unit A correction Queue revision after it is published. Do not run Unit B, do not reuse old cards, do not read `.env`, do not use database credentials, and do not perform CREATE/DROP/TRUNCATE/DELETE or migration writes.

