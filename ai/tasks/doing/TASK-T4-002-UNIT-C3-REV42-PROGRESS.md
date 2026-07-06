# PROGRESS — T4-002 Unit C3 Revision 42: Failure-Safe Cleanup Lifecycle Remediation

## Status: COMPLETE — STOPPED AT UNIT_C3_FAILURE_LIFECYCLE_REPORT_READY_REV42

### Completed

- [x] Oriented on task specification, CURRENT.md, and existing codebase
- [x] Read `_cleanup_orphan_and_restore_fk` helper (line 393)
- [x] Read `test_ac4_cleanup_runs_when_body_fails` (line 1074)
- [x] Read `test_ac4_fk_orphan_detected` (line 643) — real AC4 selector
- [x] Created PLAN document
- [x] Implemented `_run_cleanup_lifecycle()` unified lifecycle with recorder support
- [x] Refactored `_cleanup_orphan_and_restore_fk()` as backward-compatible wrapper
- [x] Updated `test_ac4_cleanup_runs_when_body_fails` with ordered event assertions
- [x] Created `test_cleanup_lifecycle_restores_fk_when_delete_fails`
- [x] Created `test_cleanup_lifecycle_preserves_primary_close_and_restore_failures`
- [x] Updated real AC4 `test_ac4_fk_orphan_detected` to pass recorder
- [x] py_compile: PASS (exit 0)
- [x] Non-MySQL regressions: 3/3 PASS (0.27s)
- [x] Real-MySQL selectors: 5/5 PASS (3.01s)
- [x] git diff --check: PASS (no trailing whitespace)
- [x] REPORT document created

## Notes

- Unified `_run_cleanup_lifecycle()` records ordered events: fk_disable → delete → verify → fk_restore
- FK restore always attempted regardless of delete/verify failure
- ExceptionGroup used for multi-failure aggregation; RuntimeError for single failure
- Real AC4 now passes recorder to observe ordered events alongside non-MySQL regressions
- No MySQL connection needed for non-MySQL tests (uses `sqlite:///:memory:`)
- All 8 verification commands pass: 3 non-MySQL + 5 real-MySQL selectors
