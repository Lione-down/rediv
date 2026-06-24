# TASK-T4-002 PROGRESS — Revision -07 (Attempt 0)

**Revision:** `phase4-wave2-recovery-dispatch-2026-06-24-07`  
**Executor:** revid-backend, Attempt 0  
**Date:** 2026-06-24

## Progress Log

### Checkpoint A — Completed
- [x] Fixed `_get_admin_url()` to raise AssertionError instead of SkipTest
- [x] Fixed `tearDownClass` to re-raise exceptions (AC12)
- [x] Fixed AC4 FK orphan test with real assertion on `nonexistent-user`

### Checkpoint B — Completed
- [x] Fixed `migrate_table()` to detect same-PK conflicts BEFORE writes (AC10)
- [x] Removed ON DUPLICATE KEY UPDATE — now uses SELECT-before-INSERT
- [x] Added stale_diff check in CLI `main()` for non-zero exit
- [x] Rewrote AC10 test to verify non-zero exit + data NOT overwritten
- [x] Rewrote AC11 test with real UNIQUE constraint violation mid-batch

### Checkpoint C — In Progress
- [ ] Running all 12 AC tests against real MySQL

### Checkpoint D — Pending
- [ ] Generate REPORT
