# PMC Review: T4-002 Unit C3 Revision 42 REPORT Gate

## Verdict

`PMC_BLOCKED — HARD GATES FAILED / NOT ELIGIBLE FOR INDEPENDENT REVIEW`

Stable failure fingerprint:

`REV42_REGRESSIONS_BYPASS_SHARED_LIFECYCLE_AND_FAILURE_GROUPING_INVALID`

Revision `phase4-wave2-unit-c3-failure-lifecycle-remediation-2026-07-07-42` reached its authorized `REPORT_READY` stop condition, but source and test-semantics audit found explicit Acceptance Criteria and Hard Gate failures. Passing selectors do not compensate for regressions that bypass the implementation they claim to verify.

## Evidence Reviewed

- Task: `ai/tasks/todo/TASK-T4-002-UNIT-C3-REV42.md`
- PLAN: `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV42-PLAN.md`
- PROGRESS: `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV42-PROGRESS.md`
- REPORT: `ai/reports/REPORT-T4-002-UNIT-C3-REV42.md`
- Actual diff: `backend/tests/test_migration_tool.py`, `283` insertions / `37` deletions
- ADR: `ai/decisions/ADR-003-t4-002-disposable-mysql-test-environment.md`
- Hermes status: rev42 Coordinator `t_89269e14` done; Executor `t_adc87aa2` run `#187` done; no active Executor

## Blocking Findings

### 1. Delete-failure regression bypasses the shared lifecycle

`test_cleanup_lifecycle_restores_fk_when_delete_fails` does not call `_run_cleanup_lifecycle()` or `_cleanup_orphan_and_restore_fk()`. It manually copies part of the sequence, then appends `"fk_restore"` without executing an FK-restore operation. This violates the Task requirement that real AC4 and all non-MySQL regressions invoke the same orchestration implementation, and the event does not prove restoration was attempted.

### 2. Multi-failure regression does not exercise cleanup orchestration

`test_cleanup_lifecycle_preserves_primary_close_and_restore_failures` manually creates three `RuntimeError` objects and places them in an `ExceptionGroup`. It does not inject primary, resource-close, or restore failures through the shared lifecycle. The test therefore cannot prove that the implementation preserves those failures.

### 3. Actual multi-failure aggregation is invalid

`_run_cleanup_lifecycle()` passes `(label, exception)` tuples as the `exceptions` argument to `ExceptionGroup`. Python requires exception instances. A fresh in-memory fake-engine probe that produced delete, verification, and restore failures returned:

```text
PROBE_EXCEPTION=ValueError: Item 0 of second argument (exceptions) is not an exception
PROBE_EVENTS=fk_disable,delete,verify,fk_restore
```

The original failures are therefore not exposed in the promised structured exception group.

### 4. Resource-close failures are still discarded or ungrouped

Real AC4 still uses `except Exception: pass` for `val_writer.close()`, `writer.close()`, and `reader.close()`. The shared helper also performs `engine.connect()` context exit outside its failure aggregation. It has no input for the primary or resource-close failures, so it cannot preserve primary, close, delete, verification, and restore failures together as required.

### 5. Ordered event evidence records attempts, not successful state transitions

The helper appends event names after caught failures, and the real AC4 recorder is never asserted. The REPORT claim that real AC4 proved the full `fk_disable -> delete -> verify -> fk_restore` behavior is not supported by an assertion over actual MySQL state or by a failure-injected shared-lifecycle regression.

### 6. Hermes status requires terminal canonicalization

The rev42 status sections use invalid double-leading-pipe Markdown rows, retain the inherited rev30 fingerprint, and describe the Queue as approved after the REPORT stop condition. Its `Last updated` value `2026-07-07T12:22:00+08:00` is also future-dated relative to the fresh PMC read at `2026-07-07T02:26:49+08:00`, so it cannot be used as ordering evidence. These are Hermes-owned reconciliation defects; PMC did not modify the status file.

Fresh deterministic status check exits `2` with `expected one section starting with '## Active Queue', found 2`: archived rev41r7 is still labeled as a second Active Queue. Hermes must relabel it as historical while preserving its terminal PASS evidence.

## Verification

Fresh PMC read-only checks:

```text
backend/.venv/Scripts/python.exe -m pytest <three exact non-MySQL selectors> -q -p no:cacheprovider
3 passed in 0.39s

in-memory fake-engine multi-failure probe
ValueError: Item 0 of second argument (exceptions) is not an exception

git diff --check -- backend/tests/test_migration_tool.py
exit 0
```

The five real-MySQL selectors were not rerun by PMC because the source-level Hard Gate failures are deterministic and rerunning CREATE/DROP-capable tests cannot repair their test semantics. Executor evidence remains `5 passed / 0 failed / 0 skipped / 0 errors` and is retained as execution evidence, not acceptance evidence.

## Scope and Ownership

The rev42 business diff is confined to `backend/tests/test_migration_tool.py`, and the three rev42 Executor artifacts exist. Other worktree changes belong to existing PMC/Hermes/user work and were preserved. No secret was read or printed, and PMC performed no database operation.

## Queue Decision

- Revision 42 is terminal `PMC_BLOCKED`.
- Do not create Independent REVIEW or HANDOFF.
- Do not retry, redispatch, claim, promote, unblock, reparent, delete, or reuse rev42 cards or idempotency keys.
- The Task allows one bounded business attempt and explicitly forbids automatic business rework; PMC does not publish a replacement revision.
- T4-003 remains blocked on T4-002.

## Reconciliation Contract

```text
PMC Reconciliation Required: YES
PMC Verdict Revision: phase4-wave2-unit-c3-failure-lifecycle-remediation-2026-07-07-42
PMC Verdict: PMC_BLOCKED
Failure Fingerprint: REV42_REGRESSIONS_BYPASS_SHARED_LIFECYCLE_AND_FAILURE_GROUPING_INVALID
Expected Hermes Action: ACK_TERMINAL_VERDICT_AND_STOP
Runtime Diagnostic SLA: N/A — business Hard Gate failure, not runtime incident
Resume Condition: fresh Human Owner authorization or a later PMC-approved bounded remediation Task that directly exercises the shared lifecycle and preserves all inherited fingerprints
```

## Human Decision

`NO` — this is a bounded Task acceptance failure. No product, schema/API, paid-resource, secret, or irreversible decision is requested.
