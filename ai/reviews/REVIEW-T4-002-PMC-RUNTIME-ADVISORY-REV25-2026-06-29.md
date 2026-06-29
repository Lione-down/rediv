# T4-002 PMC Runtime Advisory — Revision 25 Dispatcher Timeout

## Verdict

`PMC_BLOCKED — REV25 TERMINAL INFRASTRUCTURE_BLOCKED`

## Blocking Facts

- Revision: `phase4-wave2-unit-c2-ac3-stale-same-remediation-dispatcher-2026-06-29-25`
- Dispatcher: `t_cc15e296`, run `#122`, profile `revid-dispatcher`
- Runtime outcome: `timed_out` at `121s > 120s`, then `gave_up`; process retry `1/1` exhausted
- Failure fingerprint: `REV25_DISPATCHER_TIMEOUT_WITH_CHILD`
- Executor child: `t_25ac2145`, status `todo`, parent `t_cc15e296`; no run exists and the blocked parent makes it unclaimable
- Missing business evidence: rev25 PLAN, PROGRESS, REPORT, Independent REVIEW and HANDOFF are all absent
- Business files were not modified by the rev25 chain

The Dispatcher did create and link the child before timeout, but it did not complete its required read-back validation or terminal transition. The persisted child contract also diverges from the Task: it substitutes broad `-k` checks and conditional real-MySQL execution for the exact ordered commands and mandatory ADR-003 verification. The child is therefore not valid continuation evidence even apart from the blocked parent.

## Classification

This is a Hermes runtime/dispatcher incident, not a business implementation failure and not a new business REWORK. Revision `-25` is terminal. No revision `-26`, budget increase, child release or card recovery is authorized by this verdict.

## Prohibitions

- Do not redispatch revision `-25` or reuse, delete, archive, claim, promote, unblock, reparent or retry cards `t_cc15e296` or `t_25ac2145`.
- Do not use a new revision to clear `REV25_DISPATCHER_TIMEOUT_WITH_CHILD` or any inherited fingerprint.
- Do not modify business code, tests, migration files, database state or Executor artifacts under this advisory.
- Do not run destructive tests, touch `revid_db`, read `.env`, or read, print, copy or guess secrets.

## Runtime Owner Diagnostics Required

Hermes runtime owner must collect fresh evidence for run `#122`:

1. Process exit code and termination path, plus bounded stdout/stderr tail.
2. Worker stack or equivalent last-known execution point around child creation, linking and read-back validation.
3. Gateway and dispatcher logs covering claim, spawn, heartbeats, timeout and `gave_up`.
4. CPU, memory, process and capacity evidence for the run window.
5. Effective timeout and retry configuration, including why a dispatch-only worker required more than `120s` after the child was already created.
6. Evidence explaining why the persisted child body diverged from the exact Task verification contract.

An optional non-destructive same-profile sustained-run or isolated smoke may prove that `revid-dispatcher` can create, read back, validate and complete within the configured boundary. It must use an isolated board/card, inert child payload and no business database or secret.

## Expected Runtime Owner Output

Return exactly one conclusion with evidence paths:

- `READY_FOR_CONTINUATION`
- `STILL_INFRA_BLOCKED`
- `NEEDS_HUMAN_DECISION`

`NEEDS_HUMAN_DECISION` is valid only if fresh evidence introduces a product, paid-resource, secret, irreversible-operation or major contract decision.

## PMC Unblock Conditions

PMC will consider a continuation only after fresh runtime health evidence identifies or bounds the timeout path, proves reliable same-profile terminal completion, and proves exact child-contract persistence/read-back. A continuation must use fresh cards and keys while inheriting all fingerprints. Increasing the revision number alone does not satisfy these conditions.

## Human Decision

`NO` — current evidence is an infrastructure/runtime failure with no product or destructive authorization question.
