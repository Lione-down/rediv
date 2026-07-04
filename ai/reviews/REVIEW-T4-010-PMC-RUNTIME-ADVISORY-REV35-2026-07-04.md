# PMC Runtime Advisory: T4-010 Unit B Revision 35

## Verdict

`PMC_BLOCKED — INFRASTRUCTURE_BLOCKED / REV35_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION`

Revision `phase4-wave3-workspace-shell-unit-b-browser-2026-07-04-35` is terminal and non-executable. This is a Hermes runtime/process incident, not a Unit B business failure and not authorization for REWORK, retry, revision 36, Reviewer or HANDOFF.

## Blocking Evidence

- Dispatcher `t_34e9113b`, run `#155`, completed atomic dispatch and created exactly one Executor child.
- Executor `t_7200189b`, run `#156`, ran for 594 seconds and then entered `blocked` with `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION`.
- The Executor did not call `kanban_complete` or `kanban_block` before process return.
- Unit B PLAN, PROGRESS, REPORT and `ai/evidence/T4-010/unit-b/` are absent. There is no Independent REVIEW or HANDOFF.
- No Unit B acceptance criterion can be credited from this run. Unit A revision 34 remains stage-accepted only.
- Stable failure fingerprint: `REV35_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION`.

## Execution Status Conflict

The Hermes-owned status captures the runtime failure but is not canonical for reconciliation:

- recorded Task SHA256 `AE2EB58C...` does not match actual Unit B Task SHA256 `50CB4672EB43C5E0D07DAE1AA75901D7AAB95726245C8CF4D4D1C1E7332A12CF`;
- recorded Queue SHA256 `298D6F0D...` does not match the pre-verdict Queue SHA256 `CBD61C0F16627FBFB910186B0806AE793BEA470AC34226C5D38D448D90A33249`;
- reconciliation still says `APPROVED — WAITING_FOR_HERMES_ACK` although revision 35 was ACKed and is now terminal;
- `Last updated` / `Last Transition` are recorded as `2026-07-04T21:28:00+08:00`, while card run `#156` ended at Unix `1783106906` (`2026-07-04T03:28:26+08:00`).

These conflicts do not change the direct Kanban terminal evidence, but they prevent terminal reconciliation from being considered complete.

## Prohibited Actions

- Do not redispatch, retry, claim, promote, unblock, reparent, delete or reuse revision 35 cards or idempotency keys.
- Do not publish or execute revision 36 before fresh runtime health evidence and a later PMC decision.
- Do not create business REWORK, Reviewer or HANDOFF.
- Do not modify business code, run unauthorized destructive tests, read or print secrets, or use old runtime evidence as proof of recovery.

## Runtime Owner Diagnostic Required

Hermes runtime owner must collect fresh same-run or directly correlated evidence:

- worker process exit code and termination source;
- stdout/stderr tail and worker stack or exception trace;
- Gateway/dispatcher/worker finalization logs around run `#156`;
- resource, capacity, timeout and retry-policy state;
- explanation for why the runtime watcher produced a terminal block while the worker made no terminal tool call;
- explanation and correction evidence for the status hash, ACK-state and timestamp conflicts;
- optional non-destructive same-profile sustained-run/smoke proof that exercises terminal finalization without touching business data or secrets.

The diagnostic must return exactly one verdict: `READY_FOR_CONTINUATION`, `STILL_INFRA_BLOCKED`, or `NEEDS_HUMAN_DECISION`, with evidence paths and SHA256 values.

## Reconciliation Contract

```text
PMC Reconciliation Required: YES
PMC Verdict Revision: phase4-wave3-workspace-shell-unit-b-browser-2026-07-04-35
PMC Verdict: PMC_BLOCKED
Failure Fingerprint: REV35_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION
Expected Hermes Action: ACK_TERMINAL_VERDICT_AND_START_RUNTIME_DIAGNOSTIC
Runtime Diagnostic SLA: next Hermes checkpoint, no later than 60 minutes
Resume Condition: fresh runtime diagnostic proves terminal-finalization health, canonical status hashes/timestamps, no active rev35 worker, and safe continuation preserving all inherited fingerprints
```

## Human Decision

`NO`. No product direction, paid resource, secret, destructive operation, schema or major contract decision is required at this checkpoint.
