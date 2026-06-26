# T4-002 PMC Runtime Owner Advisory

## Context

- Task: T4-002 — SQLite -> MySQL data migration tool
- Blocked revision: `phase4-wave2-final-rework-2026-06-25-08`
- Current Queue revision: `phase4-wave2-final-attempt-blocked-2026-06-25-09`
- Execution state read: `EXECUTOR_BLOCKED`
- Coordinator card: `t_fba90f6a` (done)
- Executor card: `t_8ee01149` (blocked)
- Reviewer card: `t_e0024944` (todo, obsolete while blocked)
- Attempt: business attempt `1` (final; future continuation must remain attempt 1)
- Failure fingerprint: `PROCESS_RETRY_EXHAUSTED: pid not alive crash after timeout`
- Evidence time: Hermes transition `2026-06-25T03:47:00+08:00`

## Blocking Facts

Executor run `#78` timed out after the 900 second limit. The single process retry, run `#79`, then crashed with `pid not alive`. Hermes marked the Executor card blocked after retry exhaustion.

The revision has PLAN and PROGRESS only:

- PLAN: `ai/tasks/doing/TASK-T4-002-PLAN-phase4-wave2-final-rework-2026-06-25-08.md`
- PROGRESS: `ai/tasks/doing/TASK-T4-002-PROGRESS-phase4-wave2-final-rework-2026-06-25-08.md`
- REPORT: `NONE`
- Independent REVIEW: `NONE`
- HANDOFF: `NONE`

The PROGRESS file claims checkpoints A/B/C were completed, but it still lists real MySQL 13 tests and REPORT generation as pending. Without REPORT, independent REVIEW, and HANDOFF, PMC has no acceptance evidence.

## Prohibited Actions

- Do not redispatch T4-002 from the current blocked Queue revision.
- Do not create attempt 2.
- Do not reuse old Coordinator, Executor, Reviewer, REPORT, REVIEW, or HANDOFF evidence.
- Do not claim, promote, unblock, retry, or manually recover any current or historical Hermes card.
- Do not modify business code, migrations, tests, Executor PLAN/PROGRESS/REPORT, Independent REVIEW, HANDOFF, or `HERMES-EXECUTION-STATUS.md` from PMC.
- Do not run unapproved destructive database tests.
- Do not read, print, copy, or persist secrets, credentials, connection URLs, tokens, or raw profiles.

## Runtime Diagnostics Required

Hermes runtime owner or `revid-pm` should provide fresh diagnostics for the same profile and execution environment:

- Exit code and termination reason for run `#78`.
- Tail of stdout/stderr for run `#78`, with secrets redacted.
- Exit code and termination reason for run `#79`.
- Tail of stdout/stderr for run `#79`, with secrets redacted.
- Worker stack trace or process supervisor trace for the `pid not alive` crash.
- Gateway and dispatcher logs covering `2026-06-25 03:22` through `03:47 +08:00`.
- Resource limits observed during the runs, including timeout, iteration budget, memory, process lifetime, and retry policy.
- Explanation of why run `#78` was treated as timeout and why run `#79` was treated as crash rather than business failure.
- Current same-profile runtime health evidence from `revid-backend`, not a different profile.

## Optional Non-Destructive Proof

Runtime owner may run a same-profile sustained-run or smoke proof that does not touch business databases and does not require secrets. Acceptable proof should show that the same worker profile can stay alive long enough to complete a bounded command and write a small non-secret artifact.

The smoke proof must not execute CREATE, DROP, TRUNCATE, DELETE, migration writes, real API calls, or any command that touches project secrets.

## Expected Runtime Owner Output

Provide one of:

- `READY_FOR_CONTINUATION`: runtime is healthy enough for a continuation revision, with evidence paths.
- `STILL_INFRA_BLOCKED`: runtime remains unhealthy, with diagnostics and next owner action.
- `NEEDS_HUMAN_DECISION`: only if the unblock requires paid resources, real secret changes, irreversible operations, or a product/architecture decision.

The output must include evidence paths inside the project workspace. Do not include secret values.

## PMC Unblock Conditions

PMC will consider a continuation revision only after fresh runtime health evidence exists for the same profile and the repeated `PROCESS_RETRY_EXHAUSTED` fingerprint is explained or mitigated.

A future continuation must:

- Preserve business attempt ordinal `1`.
- Inherit all infrastructure and business failure fingerprints.
- Keep T4-002 scope and acceptance criteria unchanged unless a separate PMC decision changes them.
- Require a new REPORT, Independent REVIEW, and HANDOFF before PMC acceptance.
- Start from an audit of the current partial diff in the two allowed files.

New revision IDs, card IDs, or idempotency keys must not be used to clear the old failure fingerprint.

## PMC Advisory Verdict

`RUNTIME_OWNER_ADVISORY — WAITING_FOR_FRESH_SAME_PROFILE_DIAGNOSTICS`
