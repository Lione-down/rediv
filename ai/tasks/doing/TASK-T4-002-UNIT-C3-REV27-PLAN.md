# Task: T4-002 Unit C3 — PLAN (revision -27)

## Execution Identity

- Revision: `phase4-wave2-unit-c3-integrity-verification-2026-07-01-27`
- Unit: C3 (Disposable MySQL Conflict and Integrity Verification)
- Attempt: 1 continuation
- Executor: `revid-backend`
- Date: 2026-07-01

## Objective

Run 5 existing selectors against a disposable MySQL database to verify:
- FK orphan detection
- 12-table consistency report
- Same-PK conflict non-zero exit
- Partial rollback behavior
- Cleanup failure visibility

No business code changes. Read-only on allowed files.

## Allowed Selectors

1. `test_ac4_fk_orphan_detected` — FK orphan insertion + validation
2. `test_ac6_consistency_report` — 12-table report + validator
3. `test_ac10_conflict_nonzero_exit` — Same-PK different-value → non-zero exit
4. `test_ac11_partial_rollback` — UNIQUE violation → batch rollback
5. `test_ac12_cleanup_failure_visible` — Normal cleanup + injected failure

## Execution Order

1. `py_compile` on both business files
2. Run all 5 selectors with pytest (real MySQL, no mocks)
3. `git diff --check` on business files (expect empty)
4. Generate PLAN, PROGRESS, REPORT

## Hard Gates

- Database identity: `revid_test_t4_002` only
- Secret: `REVID_TEST_MYSQL_ADMIN_URL` from env only
- No `.env` access, no `revid_db` access
- Business files: read-only

## Risk Assessment

- AC11 recreates test DB mid-class (tearDownClass expects it); AC12 assumes DB exists
- AC12 patches `cleanup_test_database` — must not interfere with class-level tearDownClass
- AC10 inserts conflicting data into `users` table — must be cleaned up before AC11 runs
