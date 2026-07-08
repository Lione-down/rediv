# PMC Review: T4-002 Unit C3 Revision 43 Publication

## Verdict

`PMC_APPROVED — FRESH BOUNDED REMEDIATION QUEUE PUBLISHED`

Queue revision:

`phase4-wave2-unit-c3-shared-cleanup-lifecycle-correction-2026-07-07-43`

## Reason

Human Owner requested rapid progress on T4-002 after rev42 reached terminal `PMC_BLOCKED`. The rev42 blocker is bounded and technical: two regressions bypass the shared cleanup lifecycle, multi-failure grouping is invalid, resource-close failures remain discarded, and real AC4 does not assert recorder evidence. This does not require product, schema/API, secret, paid-resource or destructive-operation escalation.

## Authorization

PMC publishes one fresh bounded business remediation revision. It inherits all Unit C3 fingerprints through rev42 and uses fresh Dispatcher/Executor idempotency keys. It does not reuse rev42 cards, does not authorize review lifecycle, and does not clear the failure fingerprint.

## Scope

Only `backend/tests/test_migration_tool.py` is writable by the Executor. The correction is limited to `_run_cleanup_lifecycle()`, `_cleanup_orphan_and_restore_fk()`, real AC4 cleanup assertions and the Unit C3 cleanup regressions.

## Required Outcome

Rev43 must prove, with executable tests rather than hand-built exception objects, that the same cleanup lifecycle handles delete, verify, FK restore, primary body and resource close failures. A valid `ExceptionGroup` must contain exception instances, not tuples, and every failure must remain identifiable.

## Queue Decision

- Publish Task: `ai/tasks/todo/TASK-T4-002-UNIT-C3-REV43.md`
- Publish Queue: `ai/automation/HERMES-AUTO-QUEUE.md`
- Update next cron contract: `ai/automation/HERMES-NEXT-CRON-CONTRACT.md`
- Update state: `ai/state/CURRENT.md`, `ai/state/ROADMAP.md`
- Stop after: `UNIT_C3_SHARED_CLEANUP_LIFECYCLE_REPORT_READY_REV43`

## Human Decision

`NO FURTHER DECISION REQUIRED` — the Human Owner's latest instruction is sufficient authorization for a bounded remediation. PMC is not asking for product direction or destructive permission.
