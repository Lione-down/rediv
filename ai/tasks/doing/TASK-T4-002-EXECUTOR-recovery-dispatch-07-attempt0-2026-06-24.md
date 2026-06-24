# Executor Card: T4-002 Recovery Dispatch - Attempt 0

## Metadata

| Field | Value |
|-------|-------|
| **Card ID** | `t_executor_recovery_07_attempt0` |
| **Task ID** | T4-002 |
| **Queue Revision** | `phase4-wave2-recovery-dispatch-2026-06-24-07` |
| **Profile** | `revid-backend` |
| **Attempt** | 0 |
| **Coordinator Card** | `t_recovery_07_20260624` |
| **Created At** | 2026-06-24T23:35:00+08:00 |
| **Status** | `EXECUTOR_ACTIVE` |
| **Idempotency Key** | `revid:phase4-wave2-recovery-dispatch-2026-06-24-07:T4-002:execute:0` |

## Pre-Execution Audit

### Partial Diff Assessment

**`backend/scripts/migrate_sqlite_to_mysql.py`**:
- Existing: 437 insertions, 409 deletions vs original
- Contains: Complete migration tool implementation with:
  - 12-table FK-order-aware migration
  - Alembic schema setup
  - SQLite reader and MySQL writer classes
  - Migration validator with 12-table consistency checks
  - Cleanup functionality
  - CLI with dry-run/execute modes
  - Security gates (structured URL API, database identity assertion)
- Status: **PRESERVE AND AUDIT** - Implementation appears complete

**`backend/tests/test_migration_tool.py`**:
- Existing: 681 insertions, 1048 deletions vs original
- Contains: Comprehensive test suite covering:
  - AC1: Dry-run no changes
  - AC2: Full migration success
  - AC3: Idempotency
  - AC4: FK orphan detection
  - AC5: Source immutability
  - AC6: Consistency report
  - AC7: Secret missing blocks
  - AC8: Structured URL and identity
  - AC9: Alembic schema creation
  - AC10: Same-PK conflict
  - AC11: Partial rollback
  - AC12: Cleanup failure visibility
- Status: **PRESERVE AND AUDIT** - Test coverage appears comprehensive

### Environment Validation

- [x] `REVID_TEST_MYSQL_ADMIN_URL` is SET
- [x] Database identity: `revid_test_t4_002`
- [x] No credential fallbacks present in code
- [x] CLI defaults to dry-run

## Execution Plan

### Phase 1: Infrastructure Verification (Checkpoint A)
1. Verify MySQL connectivity
2. Test database creation/drop with identity assertion
3. Verify Alembic schema creation works
4. Document evidence

### Phase 2: Migration Tool Validation (Checkpoint B)
1. Run dry-run on existing fixture data
2. Verify no MySQL writes occur
3. Test execute mode with proper cleanup
4. Verify idempotency (second run)
5. Document evidence

### Phase 3: Integration Testing (Checkpoint C)
1. Run full test suite
2. Verify all 12 acceptance criteria pass
3. Test error handling (FK orphan, same-PK conflict)
4. Test cleanup failure visibility
5. Document evidence

### Phase 4: Report Generation (Checkpoint D)
1. Generate comprehensive REPORT
2. Include all checkpoint evidence
3. Document any failures or risks
4. Prepare for Independent Review

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Infrastructure crash (pid not alive) | Medium | High | Single retry allowed; if repeats → BLOCKED |
| Alembic schema mismatch | Low | Medium | Verify 12 tables exist post-upgrade |
| Test data inconsistency | Low | Medium | Use standardized fixture generator |
| Cleanup failure | Low | Low | Error visible and raised, not swallowed |

## Success Criteria

- [ ] All 12 acceptance criteria verified
- [ ] Dry-run produces no MySQL changes
- [ ] Execute mode completes successfully
- [ ] Idempotency confirmed (second run = same counts)
- [ ] Error cases handled properly (FK orphan, PK conflict)
- [ ] Cleanup works and failure is visible
- [ ] No source database modification
- [ ] All tests pass
- [ ] REPORT generated with checkpoint evidence

## Notes

- This is a CLEAN SLATE execution - no legacy state from previous attempts
- Partial implementations must be audited, not overwritten
- If infrastructure crashes occur, only ONE retry is permitted
- Same failure fingerprint → immediate BLOCKED
- No parallel execution - serial with coordinator
