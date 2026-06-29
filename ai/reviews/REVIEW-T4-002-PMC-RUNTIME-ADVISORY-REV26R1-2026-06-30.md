# T4-002 PMC Runtime Advisory — Revision 26r1 Review Dispatch

## Verdict

`PMC_BLOCKED — REV26R1 TERMINAL INFRASTRUCTURE_BLOCKED`

## Blocking Facts

- Queue revision: `phase4-wave2-unit-c2-rev26-review-dispatch-2026-06-29-26r1`
- Coordinator: `t_f46c8d6e`, profile `revid-pm`, run `#126`
- Runtime outcome: `timed_out` at `121s > 120s`, process retry `1/1` exhausted, then `gave_up`
- Failure fingerprint: `REV26R1_REVIEW_ACTION_CONTRACT_MISROUTED_AND_TIMEOUT`
- Persisted contract mismatch: the authorized Queue action was `REVIEW_DISPATCH_ONLY`, but the created card persisted `Action: DISPATCH_ONLY`, an Executor-oriented stop condition and the wrong lifecycle contract
- Missing evidence: no Reviewer card, Independent REVIEW, HANDOFF card or canonical post-review HANDOFF exists
- Revision `-26` business REPORT and business diff remain evidence inputs only; business execution must not repeat

Run timing evidence shows provider latency contributed to the wall-clock timeout, but it does not explain or excuse the action conversion. The successful historical revision `-18r1` proves the intended review-dispatch topology is viable when the correct contract is persisted. The primary blocker is therefore action/profile contract routing, with timeout behavior as a secondary runtime symptom.

## Fresh Evidence Assessment

The new role-contract-hardening work correctly identifies the missing canonical action registry and has begun an action-aware launcher and Supervisor routing update. It is not continuation evidence yet:

- progress is explicitly `IN_PROGRESS`;
- regression matrix, runtime child-contract enforcement and retry persistence are incomplete;
- profile deployment and boundary verification are incomplete;
- targeted/full tests and isolated action smokes are incomplete;
- no runtime REPORT or `READY_FOR_CONTINUATION` conclusion exists.

PMC therefore does not approve a continuation revision, budget increase or bounded lifecycle split in this run.

## Classification

This is a Hermes runtime/dispatcher incident, not a business implementation defect and not business REWORK. Revision `-26r1` is terminal and must not be reused. Queue/CURRENT/ROADMAP must no longer describe it as waiting for ACK or executable.

## Prohibitions

- Do not redispatch revision `-26r1` or reuse, retry, claim, promote, unblock, reparent, delete or archive card `t_f46c8d6e`.
- Do not reuse its idempotency key or clear inherited fingerprints with a new revision.
- Do not repeat revision `-26` Executor work or modify business code, tests, migration files, REPORT, Independent REVIEW or HANDOFF under this advisory.
- Do not modify `HERMES-EXECUTION-STATUS.md` from the PMC side.
- Do not run unauthorized destructive tests, touch a business database, read `.env`, or read, print, copy or guess secrets.

## Runtime Owner Diagnostics Required

Hermes runtime owner must provide fresh evidence covering:

1. Run `#126` exit code, bounded stdout/stderr tail and last worker stack/execution point.
2. Gateway/dispatcher logs for claim, spawn, provider calls, timeout, retry exhaustion and `gave_up`.
3. Effective Coordinator timeout/retry/capacity/resource configuration and the basis for any budget change.
4. A machine-verifiable mapping from Queue `REVIEW_DISPATCH_ONLY` to profile `revid-pm`, persisted card action, allowed tools and allowed child actions.
5. Regression proof that Queue action cannot be rewritten to `DISPATCH_ONLY`, and that missing/unknown/mismatched actions fail before spawn.
6. Persisted read-back proof for Reviewer and dependent `HANDOFF_ONLY` fields, including action, assignee, parent, revision, idempotency, max runtime and max retries.
7. Fresh profile-boundary verification without exposing credential values.

Optional same-profile smokes must be isolated and non-destructive. They should prove both successful `REVIEW_DISPATCH_ONLY` topology creation and negative cross-role rejection. They must not use the Revid business database, historical cards or secrets.

## Expected Runtime Owner Output

Return exactly one conclusion with evidence paths:

- `READY_FOR_CONTINUATION`
- `STILL_INFRA_BLOCKED`
- `NEEDS_HUMAN_DECISION`

`NEEDS_HUMAN_DECISION` is valid only if fresh evidence introduces a product, paid-resource, secret, irreversible-operation or major contract decision.

## PMC Unblock Conditions

PMC will consider a fresh lifecycle continuation only after the action-aware launcher, runtime policies and profile deployment are complete; targeted/full tests pass; isolated positive and negative smokes prove the persisted topology; and a runtime REPORT concludes `READY_FOR_CONTINUATION` with evidence paths. Any continuation must use fresh cards and keys while inheriting `REV26R1_REVIEW_ACTION_CONTRACT_MISROUTED_AND_TIMEOUT` and all earlier fingerprints.

## Human Decision

`NO` — current evidence is an infrastructure/runtime failure with no product, secret, paid-resource or destructive authorization question.

