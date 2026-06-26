# T4-002 PMC Review — Continuation Approval

## Review Context

- Task: T4-002 — SQLite -> MySQL data migration tool
- Previous executable revision: `phase4-wave2-final-rework-2026-06-25-08`
- Previous non-executable hold revision: `phase4-wave2-final-attempt-blocked-2026-06-25-09`
- New Queue revision: `phase4-wave2-final-attempt-continuation-2026-06-25-10`
- Execution state read: `EXECUTOR_BLOCKED`
- Runtime diagnostic reviewed: `ai/reports/DIAGNOSTIC-T4-002-RUNTIME-OWNER-2026-06-25.md`
- Human Owner clarification time: 2026-06-25
- PMC decision time: 2026-06-25 16:00 +08:00

## Evidence Cursor

| Item | Value |
|---|---|
| Queue revision before decision | `phase4-wave2-final-attempt-blocked-2026-06-25-09` |
| Execution state | `EXECUTOR_BLOCKED` |
| Execution last transition | `2026-06-25T03:47:00+08:00` |
| Diagnostic path/hash | `ai/reports/DIAGNOSTIC-T4-002-RUNTIME-OWNER-2026-06-25.md` / `53DE5F09280AF190D13FB671E0490907192006102BF5F25956DB0F348C1E8658` |
| Independent review path/hash | `NONE` |
| Handoff path/hash | `NONE` |
| Failure fingerprint | `PROCESS_RETRY_EXHAUSTED: pid not alive crash after timeout` |

## Human Owner Clarification

Human Owner clarified that the Hermes runtime owner for this decision is the `revid-pm` profile. The 2026-06-25 12:10 diagnostic was produced by `revid-pm`, reached `READY_FOR_CONTINUATION`, and identified the 900 second runtime budget as insufficient for the remaining T4-002 workload.

This clarification supersedes the previous PMC requirement that continuation must wait for a separate `revid-backend` same-profile sustained-run proof.

## Diagnostic Assessment

The diagnostic supports a continuation under runtime-budget mitigation:

- Run `#78` remained alive and heartbeating until the 900 second timeout.
- Run `#79` crashed after the timeout retry path and produced no business failure evidence.
- No REPORT, Independent REVIEW, or HANDOFF exists, so the previous execution remains non-acceptable.
- The partial implementation is still unverified and must not be treated as complete.
- No secret leakage or out-of-scope business file modification was reported by the diagnostic.

## PMC Decision

**PMC_CONTINUATION_APPROVED — FINAL BUSINESS ATTEMPT 1 CONTINUATION**

PMC authorizes a new executable Queue revision:

- Revision: `phase4-wave2-final-attempt-continuation-2026-06-25-10`
- Business attempt ordinal: still `1`; this is a continuation, not attempt 2.
- Runtime mitigation: Hermes should use an 1800 second runtime budget for the executor if supported, or otherwise split the continuation into bounded work units that fit the active runtime limit.
- Scope remains unchanged: only T4-002 allowed files and current attempt artifacts may be written by Executor.
- All existing infrastructure and business fingerprints must be inherited.

## Required Executor Focus

1. Preserve and audit the existing partial diff in the two allowed files.
2. Fix or verify the static gaps from the final blocked PMC review:
   - missing-source must not be gated by MySQL secret setup;
   - cleanup failure injection must patch the actual callable binding;
   - cleanup/setup failures must not be swallowed by broad catches.
3. Run the real disposable MySQL verification required by ADR-003 and T4-002 acceptance criteria.
4. Create fresh revision `-10` PLAN/PROGRESS/REPORT artifacts; do not overwrite revision `-08` artifacts.
5. Stop after REPORT; Independent Reviewer must independently verify before HANDOFF.

## Restrictions Preserved

- No attempt 2.
- No reuse, manual claim, promote, unblock, or retry of current or historical cards.
- No writes outside T4-002 Allowed Files and current attempt artifacts.
- No modification to `HERMES-EXECUTION-STATUS.md` by PMC.
- No secret printing, `.env` fallback, or destructive operation outside exact database `revid_test_t4_002`.
- Reviewer PASS is not PMC PASS; T4-002 remains incomplete until PMC final acceptance.

## Hermes Next Action

Consume Queue revision `phase4-wave2-final-attempt-continuation-2026-06-25-10`, ACK it, and create a fresh Coordinator chain for T4-002 continuation. Use `revid-backend` as Executor and `revid-reviewer` as Independent Reviewer. Stop after HANDOFF_READY.
