# T4-002 PMC Review — Unit C2 Revision 22 Rework Required

## Review Context

- Task: `T4-002 / UNIT-C2`
- Revision: `phase4-wave2-unit-c2-child-contract-corrected-2026-06-29-22`
- Execution state read: `REPORT_READY`
- Coordinator: `t_971a76d5`, run `#118`, done
- Executor: `t_4f178d0c`, run `#119`, done
- REPORT: `ai/reports/REPORT-T4-002-UNIT-C2-REV22.md`
- REPORT SHA256: `21BE9C59CB4B559A1BF9CCBB93FBDD3B84DF1AF1D9C6C3CAB4D0D10A7E053261`
- Independent REVIEW: missing by explicit rev22 authorization
- HANDOFF: missing by explicit rev22 authorization
- PMC decision time: `2026-06-29 09:41 +08:00`

## Authorization and Evidence Closure

Revision `-22` was a read-only business verification revision. It authorized exactly four real MySQL selectors and stopped at `UNIT_C2_REPORT_READY_REV22`; it explicitly prohibited business-file changes, Reviewer creation and HANDOFF creation.

The authorized chain completed correctly. The REPORT is sufficient to reject the revision because an Acceptance Criterion demonstrably failed; Independent REVIEW and HANDOFF are required for final PASS, not to prove that a recorded failing selector did not pass.

## Findings

| Check | Result |
|---|---|
| AC1 dry-run no changes | PASS |
| AC2 full migration | PASS |
| AC3 second-run idempotency | **FAIL** |
| AC5 source immutability | PASS |
| Business files changed by rev22 | No |
| Secret exposed | No evidence |
| Rev22 REVIEW/HANDOFF | Not authorized; absent |

The AC3 failure is reproducible business behavior: `migrate_table()` classifies identical existing rows as `stale_same`, but its write loop still iterates over all source `rows`. The second migration therefore attempts to INSERT an existing primary key and raises MySQL error `1062`.

## PMC Verdict

`PMC_REWORK`

Revision `-22` is terminal evidence and must not be redispatched, retried, unblocked or reused. The defect is bounded, belongs to the existing T4-002 idempotency requirement and does not require Human Owner decision.

PMC approves revision `-23` as a new scope-bearing remediation revision. It is not rev22 attempt 2: rev22 was verification-only and prohibited the code change now required. Revision `-23` must use fresh cards and idempotency keys while inheriting all historical fingerprints.

## Failure Fingerprint

`AC3_STALE_SAME_DUPLICATE_INSERT`

## Required Remediation

1. Exclude existing identical `stale_same` rows from the INSERT execution set.
2. Preserve same-PK different-value fail-closed behavior and reporting semantics.
3. Prove the fix with targeted unit coverage and real disposable-MySQL AC3 verification.
4. Keep all database operations inside ADR-003 database `revid_test_t4_002`.

## Hermes Next Action

Consume only revision `phase4-wave2-unit-c2-ac3-stale-same-remediation-2026-06-29-23` after it appears as the sole APPROVED Queue. Do not dispatch revision `-22` again.

## Human Decision

`NO` — this is a bounded implementation defect under the existing Task and ADR-003 authorization.
