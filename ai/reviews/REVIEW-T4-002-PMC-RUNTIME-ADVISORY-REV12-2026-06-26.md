# T4-002 PMC Runtime Advisory - Revision -12 Coordinator Pre-Dispatch Timeout

## Context

- Task: T4-002 - SQLite -> MySQL data migration tool
- Queue revision: `phase4-wave2-unit-a-static-fixes-coordinator-budget-2026-06-26-12`
- Execution state read: `INFRASTRUCTURE_BLOCKED`
- Coordinator card: `t_4ce6da95` (blocked; run `#85` timed out at 301s > 300s)
- Executor card: `ABSENT` (Coordinator never dispatched)
- Reviewer card: `ABSENT` (Coordinator never dispatched)
- Attempt: business attempt `1` continuation, Unit A static fixes
- Process retry status: `1/1 exhausted`
- Evidence time: Hermes transition `2026-06-26T01:53:48+08:00`
- PMC advisory time: `2026-06-26`

## Evidence Cursor

| Item | Value |
|---|---|
| Queue revision | `phase4-wave2-unit-a-static-fixes-coordinator-budget-2026-06-26-12` |
| Execution state | `INFRASTRUCTURE_BLOCKED` |
| Execution last transition | `2026-06-26T01:53:48+08:00` |
| Queue hash | `FB10AA4CC5BCFD03FE9CB786268CCCB1808ADC8D1FA3E3DC225B53204F98C57E` |
| Execution status hash | `FA9BF5CC6D6816B5C2DABC6E7191320E10FAF6BE3A2CE199824ED795F3E85291` |
| Report path/hash | `PENDING` |
| Independent review path/hash | `PENDING` |
| Handoff path/hash | `PENDING` |
| Failure fingerprint | `PROCESS_RETRY_EXHAUSTED: coordinator timed out before dispatch` + `COORDINATOR_TIMEOUT_DEADLOCK: parent_timed_out blocks executor_retry` + `COORDINATOR_PRE_DISPATCH_TIMEOUT: no executor/reviewer created` + inherited `T4-002-SEMANTICS` + inherited `T4-002-ATTEMPT1-STATIC` |

## Blocking Facts

Revision `-12` was explicitly approved as the only controlled redispatch after revision `-11` timed out before dispatch. The mitigation raised the Coordinator dispatch budget from 120s to 300s and required the Coordinator to dispatch child cards, transition done, and stop before Unit A business work.

Hermes ACKed revision `-12` and created Coordinator `t_4ce6da95`, but the Coordinator timed out at 301s and exhausted its only process retry. No Executor or Reviewer child cards were created.

There is still no Unit A acceptance evidence:

- PLAN: not produced by revision `-12`
- PROGRESS: not produced by revision `-12`
- REPORT: `PENDING`
- Independent REVIEW: `PENDING`
- HANDOFF: `PENDING`

This repeats the revision `-11` pre-dispatch timeout fingerprint. It is a Hermes runtime / dispatcher incident, not a backend implementation failure and not a business REWORK condition.

## Prohibited Actions

- Do not publish another executable business Queue for T4-002 from this evidence.
- Do not create attempt `2`.
- Do not clear, replace, or hide inherited failure fingerprints.
- Do not reuse, claim, promote, unblock, or retry revision `-12`, `-11`, `-10`, `-08`, or older cards.
- Do not modify business code, migrations, tests, Executor PLAN/PROGRESS/REPORT, Independent REVIEW, HANDOFF, or `HERMES-EXECUTION-STATUS.md` from PMC.
- Do not run unapproved destructive database tests.
- Do not read, print, copy, or persist secrets, credentials, connection URLs, tokens, or raw profiles.

## Runtime Diagnostics Required

Hermes runtime owner should provide fresh diagnostics for revision `-12`:

1. Exit code, timeout policy, stdout/stderr tail, and dispatcher decision for Coordinator run `#85`.
2. Worker stack, command line shape, and last meaningful log line before the 300s timeout.
3. Gateway / dispatcher logs showing why no Executor or Reviewer child cards were created.
4. Confirmation whether the Coordinator followed the short-lived dispatch lifecycle requested by Queue revision `-12`.
5. Explanation for why the pre-dispatch step still exceeded 300s when Unit A required no MySQL, no secret, and no destructive operation.
6. Resource and capacity evidence at claim time: profile availability, process slot, queue lock, idempotency lookup, and retry policy decision.
7. Evidence that no secret, credential, raw URL, or unauthorized database operation was printed or persisted.

## Optional Non-Destructive Proof

Runtime owner may provide a same-profile smoke proof that does not touch business databases and does not require secrets. The proof should show a fresh ACK -> Coordinator claim -> child Executor card creation -> Coordinator done transition within the configured dispatch budget.

The proof must not execute CREATE, DROP, TRUNCATE, DELETE, migrations, real API calls, or commands that touch project secrets.

## Expected Runtime Owner Output

Provide one of:

- `READY_FOR_CONTINUATION`: dispatcher health is proven with fresh evidence paths, and PMC can consider a continuation without attempt `2`.
- `STILL_INFRA_BLOCKED`: pre-dispatch timeout remains unresolved, with diagnostics and next runtime owner action.
- `NEEDS_HUMAN_DECISION`: only if the unblock requires paid resources, real secret changes, irreversible operations, or a product / architecture decision.

## PMC Unblock Conditions

PMC will not issue another executable T4-002 business Queue until fresh runtime owner evidence proves the dispatcher can create child Executor/Reviewer cards and finish the Coordinator lifecycle inside budget.

A future continuation must preserve all inherited business and infrastructure fingerprints, must not reuse old cards, and must still produce fresh Unit A PLAN, PROGRESS, REPORT, Independent REVIEW, HANDOFF, and PMC final acceptance before Units B-E can be considered.

## PMC Advisory Verdict

`RUNTIME_OWNER_ADVISORY_REV12 - WAITING_FOR_DISPATCHER_HEALTH_EVIDENCE`

