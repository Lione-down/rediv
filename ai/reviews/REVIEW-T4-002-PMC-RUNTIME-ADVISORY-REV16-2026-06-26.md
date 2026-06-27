# T4-002 PMC Runtime Advisory — Unit C Revision -16

## Verdict

`PMC_RUNTIME_ADVISORY — REV16_COORDINATOR_RETRY_EXHAUSTED`

This is not a business REWORK and not a final acceptance review. Unit C revision `phase4-wave2-unit-c-mysql-integration-2026-06-26-16` has no Executor REPORT, Independent REVIEW, or HANDOFF, so there is no business evidence for Codex PMC to accept or reject.

## Blocking Facts

| Field | Value |
|---|---|
| Task | `T4-002` |
| Queue Revision | `phase4-wave2-unit-c-mysql-integration-2026-06-26-16` |
| Execution State Read | `COORDINATOR_RETRY_EXHAUSTED_REV16` |
| Coordinator Card | `t_aeaefef4` |
| Run | `#100` |
| Failure | timed out at 300s; process retry consumed `1/1`; no Executor dispatched |
| Executor | missing |
| Independent REVIEW | missing |
| HANDOFF | missing |
| Evidence Paths | `ai/automation/HERMES-EXECUTION-STATUS.md`, `ai/automation/HERMES-AUTO-QUEUE.md`, Kanban card `t_aeaefef4` run `#100` |

Failure fingerprint read from execution status:

```text
REV16_COORDINATOR_TIMEOUT: t_aeaefef4 timed out at 300s (run #100)
REV16_COORDINATOR_RETRY_EXHAUSTED: process retry consumed (1/1), gave_up with failures=1, effective_limit=1
```

## Prohibitions

- Do not create a new Coordinator for the same revision `-16`.
- Do not reuse, claim, promote, unblock, or retry card `t_aeaefef4`.
- Do not dispatch Unit D/E, T4-003, T4-010, or any task outside Unit C.
- Do not modify business code, migrations, tests, frontend, backend, Executor PLAN/PROGRESS/REPORT, Independent REVIEW, HANDOFF, Hermes Kanban state, or `HERMES-EXECUTION-STATUS.md` from Codex PMC.
- Do not read, print, copy, infer, or persist `REVID_TEST_MYSQL_ADMIN_URL` or any secret.
- Do not run destructive tests from PMC. ADR-003 destructive authority remains limited to the Executor runtime and only for disposable database `revid_test_t4_002`.

## Runtime Owner Diagnostics Required

Hermes runtime owner should collect fresh diagnostics for revision `-16`, card `t_aeaefef4`, run `#100`:

- Coordinator process exit code and timeout classification.
- Tail of stdout/stderr sufficient to identify where dispatch time was spent, without secrets.
- Worker stack or trace if available.
- Gateway and dispatcher logs around `2026-06-26 18:13 UTC` to `2026-06-26 19:00 UTC`.
- Resource limits and actual runtime budget applied to the Coordinator.
- Retry decision evidence showing why process retry was consumed and why no Executor was dispatched.
- Whether the dispatch payload, task body, queue parsing, profile capacity, or idempotency lookup caused the 300s timeout.
- Confirmation that no hidden Executor, Reviewer, or HANDOFF exists for revision `-16`.

Optional non-destructive proof:

- A same-profile `revid-pm` sustained-run or smoke dispatch using a tiny no-secret, no-database, no-business-code workload.
- A parser/idempotency smoke check against the current Queue document that does not create cards or touch databases.

## Expected Runtime Owner Output

Return exactly one operational conclusion with evidence paths:

- `READY_FOR_CONTINUATION`: runtime is healthy and can consume a smaller Codex-approved continuation revision.
- `STILL_INFRA_BLOCKED`: runtime remains unable to dispatch Unit C; include the blocking subsystem and next owner action.
- `NEEDS_HUMAN_DECISION`: only if the blocker requires paid resources, secrets, external account authorization, destructive authorization beyond ADR-003, or a product/contract decision.

## PMC Unblock Conditions

Codex PMC will not clear this failure fingerprint by changing revision alone. PMC will consider a new bounded Unit C split or continuation only after fresh runtime health evidence shows:

1. `t_aeaefef4` is terminal and no parallel revision `-16` chain is active.
2. The Coordinator timeout root cause is understood enough to avoid repeating the same dispatch failure.
3. The next proposed work unit is smaller, independently verifiable, and still respects ADR-003.
4. Any inherited failure fingerprints are carried forward in the next Queue.

Until then, Unit C remains infrastructure/runtime blocked, and there is no Human Owner decision required.
