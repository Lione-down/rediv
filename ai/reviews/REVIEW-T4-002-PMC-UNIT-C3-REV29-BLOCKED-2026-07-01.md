# REVIEW — T4-002 Unit C3 Revision 29 PMC Blocked

## Verdict

`PMC_BLOCKED`

Revision: `phase4-wave2-unit-c3-ac4-cleanup-correction-2026-07-01-29`

Stable failure fingerprint: `REV29_AC4_ORPHAN_DELETION_STILL_NOT_FAILURE_SAFE_AND_REGRESSION_NOT_BOUND`

## Evidence Reviewed

- Task: `ai/tasks/todo/TASK-T4-002-UNIT-C3-REV29.md`
- PLAN: `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV29-PLAN.md`
- PROGRESS: `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV29-PROGRESS.md`
- REPORT: `ai/reports/REPORT-T4-002-UNIT-C3-REV29.md`
- Hermes status: revision `29`, Executor `t_77c46dc4`, `REPORT_READY`
- Actual diff: `backend/tests/test_migration_tool.py`

## Findings

1. `test_ac4_fk_orphan_detected` still performs orphan deletion inside the main `try` body, after validation and the failure-producing assertion. A validation exception or assertion failure jumps directly to `finally`; that block closes reader/writer resources and disposes the engine, but never deletes `q-orphan` or restores `FOREIGN_KEY_CHECKS=1` through a failure-safe cleanup path.
2. `TestUnitC3CleanupRegression::test_ac4_cleanup_runs_when_body_fails` reproduces a separate local `try/finally` and observes only three mocked `close()` calls. It does not invoke the AC4 lifecycle/helper, does not observe the orphan deletion callable/state, and therefore cannot prove the production test cleanup path required by the Task.
3. The REPORT claims the outer `try/finally` covers deletion and that the regression proves cleanup before exception propagation. Those claims are inconsistent with the actual diff. Passing selectors only prove the normal path; they do not satisfy the required failure-path semantics.
4. Revision `-29` modified only its allowed business file and supplied the required artifacts. No secret or unauthorized database evidence was found in the reviewed files. These scope checks do not cure the failed cleanup Hard Gate.

## Acceptance Decision

- Failure-safe orphan deletion: **FAIL**
- Non-MySQL regression bound to the real cleanup lifecycle/state: **FAIL**
- Five real-MySQL normal-path selectors: **PASS as reported, insufficient for the failed Hard Gate**
- Scope and artifact ownership: **PASS**

Independent Review and HANDOFF are not authorized. Revision `-29` cards, runs, artifacts and idempotency keys are terminal evidence and must not be reused, retried, claimed, promoted, unblocked or reparented.

## Blocker and Exit Condition

The Queue attempt policy authorized one Human Owner-requested bounded correction and explicitly prohibited further automatic business rework. PMC therefore publishes no replacement revision and leaves no executable Queue.

Any future authorization must retain all prior fingerprints and require:

1. orphan deletion plus `FOREIGN_KEY_CHECKS=1` restoration in a failure-safe cleanup callable/lifecycle that runs after insert even when migration, validation, assertion or resource close fails;
2. cleanup failure visibility without swallowing the primary or cleanup failure;
3. a non-MySQL regression that invokes that same cleanup lifecycle/helper and observes deletion-equivalent state, not only mocked resource closure;
4. fresh normal-path and injected-failure verification before Independent Review.

This is a bounded implementation/evidence blocker, not a product, schema, secret or irreversible-operation decision. `Human Decision Required: NO`.
