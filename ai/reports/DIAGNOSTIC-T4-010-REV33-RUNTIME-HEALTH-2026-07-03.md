# DIAGNOSTIC-T4-010-REV33-RUNTIME-HEALTH-2026-07-03

## Verdict

`STILL_INFRA_BLOCKED`

## Evidence

### 1. Dispatcher Card `t_24283338` — Healthy

- Status: `done`
- Assignee: `revid-dispatcher`
- Run #149: completed in 114s with `DISPATCH_COMPLETE`
- Body shows correct Action: `DISPATCH_ONLY`
- Stop After: `Create exactly one Executor child, link it to this Coordinator, then complete this Coordinator.`
- Idempotency Key: `revid:phase4-wave3-workspace-shell-unit-a-static-build-2026-07-03-33:T4-010-UNIT-A:dispatch`
- Child created: `t_6e1e84d0`
- Atomic dispatch: `True`
- Parent committed atomically after child creation

### 2. Executor Card `t_6e1e84d0` — Contract Invalid

- Status: `blocked`
- Assignee: `revid-frontend`
- Parents: `t_24283338`
- Runs: #150 (timed_out, 121s > 120s), #151 (timed_out, 121s > 120s)
- Gave up after 2 consecutive timeouts

**Persisted body reveals three critical contract violations:**

| Expected (Queue rev33) | Actual (Card `t_6e1e84d0`) |
|---|---|
| Max runtime: `1800s` | Limit: `120s` |
| Idempotency: `*:execute:0` | Idempotency: `*:dispatch` |
| Stop After: `T4_010_UNIT_A_STATIC_BUILD_REPORT_READY` | Stop After: Dispatcher's "Create exactly one Executor child..." |

These three violations confirm the advisory's fingerprint: `REV33_EXECUTOR_CHILD_CONTRACT_INVALID_120S_DISPATCH_PAYLOAD`.

### 3. Root Cause Analysis

The dispatcher `t_24283338` created the Executor child `t_6e1e84d0` but failed to transform the Dispatcher contract into the Executor contract:

- The child inherited the **Dispatcher's Stop After** text verbatim (which instructs creating an Executor child — nonsensical for an Executor)
- The child inherited the **Dispatcher's idempotency key** (`:dispatch` suffix instead of `:execute:0`)
- The child inherited the **120s budget** (Coordinator budget) instead of the authorized **1800s** (Executor budget)

This indicates a bug in the dispatcher's child-creation logic: it copies the parent card's body fields without applying the required transformation for the Executor child contract.

### 4. Gateway Status

- Gateway PID 12912: running
- Runtime contracts: `HERMES_RUNTIME_PATCH_ALREADY_APPLIED`, `ROLE_CONTRACTS_OK`

### 5. Kanban Board State

- 8 blocked cards, 28 done, 0 ready/running/review
- No active workers consuming cards

## Required Fix

The dispatcher (`revid-dispatcher`) must transform the Executor child's contract before creation:

1. Change `Action` from `DISPATCH_ONLY` to `IMPLEMENT_AND_TEST_ONLY`
2. Set `max-runtime` to the Executor budget (1800s)
3. Generate a fresh idempotency key with `:execute:0` suffix
4. Replace `Stop After` with the Task's report-ready marker
5. Validate the persisted child body matches the transformed contract before completing

## Conclusion

The rev33 execution chain is terminal due to a dispatcher child-contract transformation bug. This is an infrastructure/runtime issue, not a business REWORK. The diagnostic confirms the advisory's fingerprint and provides direct evidence from the Kanban card body showing the three contract violations.

No `READY_FOR_CONTINUATION` can be declared until the dispatcher child-creation logic is fixed and proven with a fresh same-profile smoke.
