# T4-002 PMC Review — Unit A Coordinator Timeout Decision

## Review Context

- Task: T4-002 — SQLite -> MySQL data migration tool
- Failed Unit A revision: `phase4-wave2-unit-a-static-fixes-2026-06-25-11`
- New Queue revision: `phase4-wave2-unit-a-static-fixes-coordinator-budget-2026-06-26-12`
- Execution state read: `COORDINATOR_TIMED_OUT`
- Coordinator card: `t_083a9aab` (blocked; run `#84` timed out at 121s > 120s)
- Executor card: `PENDING` (never created)
- Reviewer card: `PENDING` (never created)
- PMC decision time: `2026-06-26 01:37:49 +08:00`

## Evidence Cursor

| Item | Value |
|---|---|
| Queue revision before decision | `phase4-wave2-unit-a-static-fixes-2026-06-25-11` |
| Execution state | `COORDINATOR_TIMED_OUT` |
| Execution last transition | `2026-06-26T00:00:00+08:00` |
| Execution status hash | `DA75F56C3DAD458C72D75C079D20A3502896E09F5EEC138AE68A2FF41A6AA5B0` |
| Timeout event hash | `74680987EDBA5644143A563367844A8982656AC8939314BCA121BC1BE154ED92` |
| Report path/hash | `PENDING` |
| Independent review path/hash | `PENDING` |
| Handoff path/hash | `PENDING` |
| Failure fingerprint | `PROCESS_RETRY_EXHAUSTED: coordinator timed out before dispatch` + `COORDINATOR_PRE_DISPATCH_TIMEOUT` + inherited T4-002 fingerprints |

## Assessment

Revision `-11` failed before any backend work started. No Executor, Reviewer, PLAN, PROGRESS, REPORT, REVIEW, or HANDOFF exists.

This is not a backend implementation failure. It is a Hermes runtime / dispatch failure: the Coordinator exceeded the requested 120s dispatch budget by one second and did not create child cards.

Because the failure occurred at the dispatch boundary, PMC will allow exactly one controlled Unit A redispatch with a larger Coordinator dispatch budget. This is not a new business attempt and not attempt `2`.

## PMC Decision

**PMC_INFRA_CONTINUATION_APPROVED — UNIT A REDISPATCH WITH COORDINATOR BUDGET MITIGATION**

PMC approves a new executable Queue revision:

- Revision: `phase4-wave2-unit-a-static-fixes-coordinator-budget-2026-06-26-12`
- Business attempt ordinal: still `1`
- Scope: Unit A static fixes only
- Coordinator budget: up to `300s`
- Coordinator lifecycle: dispatch Executor and Reviewer, then transition to `done`; do not monitor Executor heartbeats until timeout.
- Executor budget: Unit A remains bounded, target `800s`.

## Hard Stop

If revision `-12` Coordinator does not create Executor and Reviewer child cards within the Coordinator budget, or if it times out before dispatch again, PMC will mark T4-002 infrastructure blocked and will not publish another executable business Queue until Hermes runtime owner provides a dispatcher fix or a non-business smoke proof showing reliable ACK -> dispatch -> done behavior.

No Human Owner decision is required for this ordinary runtime failure.

## Restrictions Preserved

- No attempt `2`.
- No clearing inherited failure fingerprints.
- No reuse, claim, promote, unblock, or retry of revision `-11`, `-10`, `-08`, or older cards.
- No MySQL, secret, `.env`, CREATE, DROP, TRUNCATE, DELETE, or migration write in Unit A.
- No automatic Unit B execution.
- No modification to `HERMES-EXECUTION-STATUS.md` by PMC.

## Required Unit A Evidence

Revision `-12` must produce:

- `ai/tasks/doing/TASK-T4-002-UNIT-A-PLAN.md`
- `ai/tasks/doing/TASK-T4-002-UNIT-A-PROGRESS.md`
- `ai/reports/REPORT-T4-002-UNIT-A.md`
- `ai/reviews/REVIEW-T4-002-UNIT-A.md`
- `ai/handoffs/HANDOFF-T4-002-UNIT-A.md`

Unit A remains static fixes only and must report AST parse, `git diff --check`, targeted non-MySQL checks when available, and explicit confirmation that no database credential or destructive operation was used.

## PMC Verdict

`PMC_INFRA_CONTINUATION_APPROVED_UNIT_A_REV12`

## Hermes Next Action

Consume Queue revision `phase4-wave2-unit-a-static-fixes-coordinator-budget-2026-06-26-12`, create a fresh Coordinator with the updated dispatch budget, dispatch Unit A Executor and Reviewer, transition Coordinator to done, and stop after Unit A HANDOFF_READY for Codex PMC review.

