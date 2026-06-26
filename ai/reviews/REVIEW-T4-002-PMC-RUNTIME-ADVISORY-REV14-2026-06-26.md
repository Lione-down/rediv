# T4-002 PMC Runtime Advisory - Revision -14 Unit B Timeout

## Context

- Task: T4-002 - SQLite -> MySQL data migration tool
- Queue revision: `phase4-wave2-unit-b-unit-tests-2026-06-26-14`
- Execution state read: `INFRASTRUCTURE_BLOCKED`
- Coordinator card: `t_bbbf72bd` (blocked; run `#93` timed out at 302s > 300s; retry `1/1` exhausted)
- Executor card: `t_7275328d` (blocked; runs `#94` and `#95` timed out at 847s/848s > 800s; gave up after 2 consecutive failures)
- Reviewer card: `PENDING` / missing
- Handoff card: `NONE` / missing
- Attempt: business attempt `1` continuation, Unit B only
- Evidence time: Hermes status update `2026-06-27 05:15 UTC`
- PMC advisory time: `2026-06-26`

## Evidence Cursor

| Item | Value |
|---|---|
| Queue revision | `phase4-wave2-unit-b-unit-tests-2026-06-26-14` |
| Execution state | `INFRASTRUCTURE_BLOCKED` |
| Execution last transition | `2026-06-27 05:15 UTC` |
| Queue hash | `2ED6157A201ECC56173D619E4A972BA6A3FB6C069915426CF3BDFA2B770E5F7D` |
| Execution status hash | `A799E2E80D7A33D84296E7DB4915E30C23D6F41FAF516C11FF1225956047D822` |
| Report path/hash | `ai/reports/REPORT-T4-002-UNIT-B.md` / `03394834A2561C42E017A1404DE44F93ECBCDD6AFEA987A0B1CD49EFE9708475` |
| Independent review path/hash | `MISSING` |
| Handoff path/hash | `MISSING` |
| Failure fingerprint | `T4-002-UNIT-A-PMC-REWORK: all 3 defects corrected (rev -13); all inherited fingerprints carried forward + COORDINATOR_TIMEOUT: 302s > 300s + EXECUTOR_TIMEOUT: 847s/848s > 800s x 2` |

## Blocking Facts

Revision `-14` was the only approved executable Queue for Unit B. Its scope was intentionally bounded to mock-based same-PK conflict and partial rollback unit-test semantics, with no MySQL, no secrets, no `.env` access, no destructive operations, and no Unit C work.

Hermes status now reports a runtime/process failure chain:

- Coordinator `t_bbbf72bd` exceeded the 300s dispatch budget and exhausted its retry.
- Executor `t_7275328d` exceeded the 800s Unit B runtime budget twice and gave up.
- `REPORT-T4-002-UNIT-B.md` exists, but Hermes status says the Executor card did not complete.
- Independent REVIEW and HANDOFF are missing, so there is no reviewable completion chain for PMC final acceptance.

This is a Hermes runtime / process / dispatcher incident. It is not a business REWORK condition and does not justify attempt `2`, scope expansion, Unit C dispatch, or Human Owner escalation.

## Prohibited Actions

- Do not publish a redispatch or continuation Queue for T4-002 from this evidence alone.
- Do not create attempt `2`.
- Do not clear, replace, or hide inherited failure fingerprints.
- Do not reuse, claim, promote, unblock, or retry revision `-14` or older cards.
- Do not modify business code, migrations, tests, Executor PLAN/PROGRESS/REPORT, Independent REVIEW, HANDOFF, or `HERMES-EXECUTION-STATUS.md` from PMC.
- Do not run unapproved destructive database tests.
- Do not read, print, copy, or persist secrets, credentials, connection URLs, tokens, or raw profiles.
- Do not treat `REPORT-T4-002-UNIT-B.md` as final completion evidence without a completed Executor card, Independent REVIEW, and HANDOFF.

## Runtime Diagnostics Required

Hermes runtime owner should provide fresh diagnostics for revision `-14`:

1. Exit code, timeout policy, stdout/stderr tail, and dispatcher decision for Coordinator run `#93`.
2. Exit code, stdout/stderr tail, last meaningful log lines, and process state for Executor runs `#94` and `#95`.
3. Worker stack or command trace showing what the Executor was doing near the 800s budget boundary.
4. Gateway / dispatcher logs showing why no Independent Reviewer card and no HANDOFF were produced.
5. Confirmation whether `REPORT-T4-002-UNIT-B.md` was written by a completed Executor process or by a process later marked failed.
6. Evidence for runtime resource limits, timeout configuration, profile capacity, queue lock/idempotency checks, and retry policy decisions.
7. Explanation for why mock-only Unit B exceeded 800s despite requiring no MySQL, no secret, no `.env`, and no destructive operations.
8. Evidence that no secret, credential, raw URL, or unauthorized database operation was printed or persisted.

## Optional Non-Destructive Proof

Runtime owner may provide a same-profile sustained-run or smoke proof that does not touch business databases and does not require secrets. The proof should show a fresh short-lived Coordinator and Backend Executor completing a mock-only workload inside the configured budgets, with logs and card IDs attached.

The proof must not execute CREATE, DROP, TRUNCATE, DELETE, migrations, real API calls, or commands that touch project secrets.

## Expected Runtime Owner Output

Provide one of:

- `READY_FOR_CONTINUATION`: runtime health is proven with fresh evidence paths, and PMC can consider a bounded continuation without attempt `2`.
- `STILL_INFRA_BLOCKED`: timeout/runtime behavior remains unresolved, with diagnostics and next runtime owner action.
- `NEEDS_HUMAN_DECISION`: only if the unblock requires paid resources, real secret changes, irreversible operations, or a product / architecture decision.

## PMC Unblock Conditions

PMC will not issue another executable T4-002 Queue from this evidence cursor. A future continuation requires fresh runtime health evidence explaining the revision `-14` Coordinator and Executor timeouts, plus a clear basis that a bounded Unit B continuation can complete without reusing old cards or clearing fingerprints.

Any future continuation must preserve all inherited business and infrastructure fingerprints, must remain Unit B only unless PMC creates a separate approved revision, and must still produce a completed Executor chain, Independent REVIEW, HANDOFF, and PMC final acceptance before Unit C can be considered.

## PMC Advisory Verdict

`RUNTIME_OWNER_ADVISORY_REV14 - WAITING_FOR_RUNTIME_TIMEOUT_DIAGNOSTICS`

