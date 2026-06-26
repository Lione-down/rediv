# T4-002 PMC Runtime Advisory — Revision -10 State Conflict

## Context

- Task: T4-002 — SQLite -> MySQL data migration tool
- Queue revision: `phase4-wave2-final-attempt-continuation-2026-06-25-10`
- Execution state read: `EXECUTOR_CRASHED_PARENT_BLOCKED`
- Coordinator card: `t_b788cdb9` (blocked; run `#82` timed out at 908s > 900s limit)
- Executor card: `t_3769f8ec` (todo; run `#83` crashed after 1576s; claim rejected because parent is blocked)
- Reviewer card: `t_4014b64c` (todo; parent blocked)
- Attempt: business attempt `1` continuation; attempt `2` remains prohibited
- Process retry status: `1/2` used, but retry is structurally blocked by parent Coordinator state
- Evidence time: Hermes transition `2026-06-25T17:00:00+08:00`
- PMC advisory time: `2026-06-25 18:01:44 +08:00`

## Evidence Cursor

| Item | Value |
|---|---|
| Queue revision | `phase4-wave2-final-attempt-continuation-2026-06-25-10` |
| Execution state | `EXECUTOR_CRASHED_PARENT_BLOCKED` |
| Execution last transition | `2026-06-25T17:00:00+08:00` |
| Queue hash | `E5FD792E0D09D3601BD0C62E03AA9A69E5042FC473C5F525EF58BC99F1E4F2C7` |
| Execution status hash | `FE0BBF18AF17AF7A365CCE4FA73C974DF3EAB7C28F4AFFF15F03F67C5E6495AC` |
| Report path/hash | `PENDING` |
| Independent review path/hash | `PENDING` |
| Handoff path/hash | `PENDING` |
| Failure fingerprint | `PROCESS_RETRY_EXHAUSTED: pid not alive crash after timeout` + `T4-002-SEMANTICS: IDEMPOTENCY_COMPARISON + FALSE_POSITIVE_CONFLICT + NON_MID_BATCH_ROLLBACK + SWALLOWED_CLEANUP + MISSING_SOURCE_COVERAGE` + `T4-002-ATTEMPT1-STATIC: SECRET_BEFORE_SOURCE_VALIDATION + INEFFECTIVE_CLEANUP_PATCH_BINDING + CLEANUP_FAILURE_SWALLOWED` + `COORDINATOR_TIMEOUT_DEADLOCK: parent_timed_out blocks executor_retry` |

## Blocking Facts

Hermes ACKed revision `-10` and created a fresh continuation chain. The Coordinator dispatched the Executor and Reviewer, then timed out under the 900s process limit. The Executor continued heartbeating for a period, then crashed with `PID not alive`. Hermes reports that one Executor process retry remains, but the retry cannot be claimed because the parent Coordinator is blocked.

There is still no acceptance evidence for T4-002:

- REPORT: `PENDING`
- Independent REVIEW: `PENDING`
- HANDOFF: `PENDING`

This is a runtime / dispatcher state conflict, not a business PASS or a new product decision. PMC has no authority to unblock, claim, promote, retry, or repair Hermes cards.

## Prohibited Actions

- Do not create attempt `2`.
- Do not clear or replace inherited failure fingerprints.
- Do not reuse revision `-08` cards, reports, reviews, or handoffs.
- Do not claim, promote, unblock, retry, or manually recover any Hermes card from PMC.
- Do not publish a replacement Queue revision merely to bypass the parent-child deadlock.
- Do not modify business code, migrations, tests, Executor PLAN/PROGRESS/REPORT, Independent REVIEW, HANDOFF, or `HERMES-EXECUTION-STATUS.md` from PMC.
- Do not run unapproved destructive database tests.
- Do not read, print, copy, or persist secrets, credentials, connection URLs, tokens, or raw profiles.

## Runtime Diagnostics Required

Hermes runtime owner should provide fresh diagnostics for revision `-10`:

1. Exit code, timeout policy, stdout/stderr tail, and dispatcher decision for Coordinator run `#82`.
2. Exit code, crash reason, stdout/stderr tail, heartbeat timeline, and worker stack or supervisor trace for Executor run `#83`.
3. Gateway / dispatcher logs explaining why Executor retry is blocked by `parents_not_done`.
4. The exact retry policy for a child worker whose parent Coordinator timed out after dispatch.
5. Confirmation whether the requested 1800s Executor runtime budget was applied. If not, explain why the continuation was not split into bounded work units under the active limit.
6. Evidence that no secret, credential, raw URL, or unauthorized database operation was printed or persisted.

## Optional Non-Destructive Proof

Runtime owner may provide a same-profile sustained-run or dispatcher smoke proof that does not touch business databases and does not require secrets. The proof should show whether a child worker can be retried or completed when a parent Coordinator has already timed out, using only non-secret artifacts inside the project workspace.

The proof must not execute CREATE, DROP, TRUNCATE, DELETE, migrations, real API calls, or commands that touch project secrets.

## Expected Runtime Owner Output

Provide one of:

- `READY_FOR_CONTINUATION`: the existing revision `-10` chain can continue safely, with evidence paths and no attempt `2`.
- `STILL_INFRA_BLOCKED`: the parent-child deadlock remains unresolved, with diagnostics and the next runtime owner action.
- `NEEDS_HUMAN_DECISION`: only if the unblock requires paid resources, real secret changes, irreversible operations, or a product / architecture decision.

## PMC Unblock Conditions

PMC will not issue a replacement Queue or business rework decision from this evidence alone. A future PMC decision requires fresh runtime owner evidence that resolves the Coordinator timeout / Executor retry deadlock without clearing inherited fingerprints, or a clear terminal infrastructure block with owner and next action.

T4-002 remains incomplete until revision `-10` or an explicitly authorized continuation produces a fresh REPORT, Independent REVIEW, HANDOFF, and PMC final acceptance.

## PMC Advisory Verdict

`RUNTIME_OWNER_ADVISORY — WAITING_FOR_REV10_RUNTIME_DIAGNOSTICS`

