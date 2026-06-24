# Coordinator Card: T4-002 Recovery Dispatch (Revision -07)

## Metadata

| Field | Value |
|-------|-------|
| **Card ID** | `t_recovery_07_20260624` |
| **Task ID** | T4-002 |
| **Queue Revision** | `phase4-wave2-recovery-dispatch-2026-06-24-07` |
| **Executor Profile** | `revid-backend` |
| **Reviewer Profile** | `revid-reviewer` |
| **Created At** | 2026-06-24T23:30:00+08:00 |
| **Status** | `COORDINATOR_ACTIVE` |
| **Idempotency Key** | `revid:phase4-wave2-recovery-dispatch-2026-06-24-07:T4-002:coordinate` |

## Recovery Dispatch Authorization

- **Approved By**: Codex Project Master Controller
- **Approval Reference**: `ai/reviews/REVIEW-T4-002-PMC-RECOVERY-DISPATCH-2026-06-24.md`
- **Human User Directive**: Explicit push decision to avoid infinite wait loop between Codex PMC and Hermes

## Execution Chain Requirements

1. **NEW Chain Only**: Must create entirely new Coordinator/Executor/Reviewer chain
2. **No Legacy Reuse**: Cannot reuse cards `t_d626b42d`, `t_4a89bb5e`, `t_f53b3c08`, `t_68c68e4e`
3. **Partial Diff Audit**: Must audit existing partial implementations before proceeding
4. **Checkpoint-Based**: Evidence must be written at each bounded checkpoint
5. **Infrastructure Retry**: One automatic infrastructure retry allowed; if same `pid not alive` occurs twice, mark BLOCKED

## Pre-Execution Checks

### Queue Validation
- [x] Queue revision `-07` is APPROVED
- [x] Task file path valid: `ai/tasks/todo/TASK-T4-002.md`
- [x] Assigned profile: `revid-backend`
- [x] Action: RECOVERY DISPATCH

### Task Validation
- [x] Task ID: T4-002 (SQLite → MySQL Migration Tool)
- [x] Phase: Phase 4A — MySQL 主数据库
- [x] Priority: P0
- [x] Dependencies: T4-001 completed

### File Diff Audit
- [x] `backend/scripts/migrate_sqlite_to_mysql.py`: 437 insertions, 409 deletions (partial implementation exists)
- [x] `backend/tests/test_migration_tool.py`: 681 insertions, 1048 deletions (partial implementation exists)
- [x] These diffs must be preserved and audited, not overwritten

### Security Gates
- [ ] `REVID_TEST_MYSQL_ADMIN_URL` presence check (required for MySQL operations)
- [ ] Database identity assertion: must be exactly `revid_test_t4_002`
- [ ] No credential fallbacks permitted
- [ ] CLI defaults to dry-run; `--execute` flag required for writes

## Checkpoints

| Checkpoint | Description | Status |
|------------|-------------|--------|
| **A** | Missing-secret failure & cleanup visibility | PENDING |
| **B** | Same-PK conflict & real partial rollback | PENDING |
| **C** | Alembic, database identity, 12-table integration | PENDING |
| **D** | Generate revision `-07` REPORT, enter Independent Review | PENDING |

## Runtime Constraints

- **Max Infrastructure Retries**: 1 (for `pid not alive` crashes)
- **Consecutive Crash Limit**: 2 identical crashes → BLOCKED
- **Runtime Limit**: Standard Hermes timeout
- **No Parallel Execution**: T4-002 is serial group

## Next Steps

1. Create Executor card for `revid-backend` (attempt 1)
2. Executor audits partial diffs
3. Executor implements migration tool with checkpoint evidence
4. Executor generates REPORT
5. Reviewer performs independent verification
6. If PASS: Generate HANDOFF for Codex PMC
7. If REWORK: One automatic rework allowed
8. If BLOCKED: Document failure fingerprint and stop

## Notes

- Previous revision `-05` had 2 infrastructure crashes (runs #72, #73)
- Previous coordinator `t_f53b3c08` and executor `t_68c68e4e` are exhausted
- This is a clean slate with new idempotency key
- Partial implementation exists and must be audited, not discarded
