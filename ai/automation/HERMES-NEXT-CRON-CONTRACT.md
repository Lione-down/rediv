# Hermes Next Cron Contract

> Contract owner: Codex PMC
> Applicable revision: `phase4-wave2-t4-003-mysql-runtime-cutover-remediation-2026-07-09-47r1`
> Contract status: `TERMINAL - RUNTIME DIAGNOSTIC REQUIRED`

## Active Wave

| Field | Value |
|---|---|
| Queue Revision | `phase4-wave2-t4-003-mysql-runtime-cutover-remediation-2026-07-09-47r1` |
| Task ID | `T4-003` |
| Task Path | `ai/tasks/todo/TASK-T4-003.md` |
| Task SHA256 | `FAE13FDD921F5B9BE5D0F221F1A573D219F7661720163E67AB344DE703D18E25` |
| Queue Action | `NONE — terminal evidence only` |
| Coordinator Profile | `NONE - terminal runtime evidence only` |
| Executor Profile | `NONE - terminal runtime evidence only` |
| Review Profile | `NONE - not authorized in rev47r1` |
| Parallel Group | `serial-phase4-wave2-t4-003-rev47r1` |
| Attempt Policy | `terminal runtime advisory; no further automatic rework; no Reviewer/HANDOFF` |
| Previous Failure Fingerprint | `REV47_MYSQL_ENGINE_REFERENCE_AND_ACCEPTANCE_GATES_FAILED` |
| Current Failure Fingerprint | `REV47R1_EXECUTOR_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION_NO_REPORT` |
| Expected Hermes Action | `ACK_TERMINAL_VERDICT_AND_START_RUNTIME_DIAGNOSTIC` |
| Coordinator Card | `t_50707802` |
| Executor Card | `t_dfaef3d8` |
| Executor Run | `#209` |
| Missing Report | `ai/reports/REPORT-T4-003-REV47R1.md` |
| Queue SHA256 | `2B51065217089CA0874502F86258DE532D4BA0CC64BBBD6E551BA1E10D1C07AA` |
| PMC Review | `ai/reviews/REVIEW-T4-003-PMC-RUNTIME-ADVISORY-REV47R1-2026-07-09.md` |
| PMC Review SHA256 | `0C97B59E88278A6F4D17625379426A9E5836ED7A935756ADBEB824A9240F9D5F` |
| Runtime Diagnostic SLA | `next Hermes checkpoint, no later than 60 minutes` |
| Expected Diagnostic Path | `ai/reports/DIAGNOSTIC-T4-003-REV47R1-EXECUTOR-WORKER-EXIT-2026-07-09.md` |

## Authority Snapshot

Rev47 reached `REPORT_READY`, but Codex PMC rejected it for Independent Review in `ai/reviews/REVIEW-T4-003-PMC-REV47-REWORK-AND-REV47R1-AUTHORIZATION-2026-07-09.md`.

Rev47r1 was then ACKed and dispatched. Coordinator `t_50707802` completed run `#208` and created Executor `t_dfaef3d8`. Executor run `#209` blocked after `1153s` with `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION` before writing `ai/reports/REPORT-T4-003-REV47R1.md`.

PMC verdict is now `PMC_BLOCKED - RUNTIME_OWNER_DIAGNOSTIC_REQUIRED` in `ai/reviews/REVIEW-T4-003-PMC-RUNTIME-ADVISORY-REV47R1-2026-07-09.md`.

## Objective

Hermes must ACK the terminal PMC verdict for rev47r1/fingerprint `REV47R1_EXECUTOR_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION_NO_REPORT`, keep the Queue non-executable, and collect fresh runtime diagnostics for Executor `t_dfaef3d8` run `#209`.

## Exact Steps

1. Read `ai/automation/HERMES-AUTO-QUEUE.md` and confirm the top fenced block plus canonical `## Active Wave` table both mark rev47r1 as `BLOCKED - NOT EXECUTABLE`.
2. Read `ai/reviews/REVIEW-T4-003-PMC-RUNTIME-ADVISORY-REV47R1-2026-07-09.md` and verify SHA256 `0C97B59E88278A6F4D17625379426A9E5836ED7A935756ADBEB824A9240F9D5F`.
3. Update only Hermes-owned `ai/automation/HERMES-EXECUTION-STATUS.md` to confirm the terminal verdict and runtime advisory cursor for the same revision/fingerprint.
4. Set or preserve `PMC Verdict Confirmation = ACK_TERMINAL_VERDICT_AND_STOP`.
5. Set runtime advisory fields for rev47r1 with real SHA256 values, `Runtime Owner State = ACKNOWLEDGED`, and a `Runtime Diagnostic Due` timestamp no later than 60 minutes from ACK.
6. Collect fresh diagnostics for Executor `t_dfaef3d8`, run `#209`, session `20260709_220308_cac36d`.
7. Write exactly one diagnostic outcome: `READY_FOR_CONTINUATION`, `STILL_INFRA_BLOCKED`, or `NEEDS_HUMAN_DECISION`.

## Required Runtime Diagnostics

Hermes runtime owner must collect non-secret evidence for:

- exact process exit code and whether the worker reached normal agent finalization;
- stdout/stderr tail, excluding secrets and credentials;
- worker stack or exception trace if present;
- session transcript tail sufficient to identify the last completed step, excluding secrets and credentials;
- Gateway/dispatcher log tail around claim, execution, timeout/finalization, and blocked transition;
- resource limits, timeout budget, retry policy and why no automatic process retry or REPORT completion occurred;
- file evidence for whether `ai/reports/REPORT-T4-003-REV47R1.md` was attempted, opened, or failed to write.

Optional same-profile proof is allowed only if non-destructive and isolated from business data.

## Deterministic Branch Table

| Condition | Action |
|---|---|
| Queue active revision is not rev47r1 | `STATE_CONFLICT`; do not create cards |
| Queue remains executable `APPROVED` or `DISPATCH_ONLY` | `STATE_CONFLICT`; do not create cards |
| Runtime advisory path/hash does not match PMC review | `STATE_CONFLICT`; do not create cards |
| Diagnostic can identify a safe continuation path | write diagnostic with `READY_FOR_CONTINUATION` and evidence path/hash |
| Diagnostic is incomplete or runtime remains broken | write diagnostic with `STILL_INFRA_BLOCKED` and evidence path/hash |
| Human Owner authorization is truly required | write diagnostic with `NEEDS_HUMAN_DECISION` and exact escalation reason |

## Forbidden Actions

- Do not redispatch rev47r1.
- Do not reuse, claim, promote, unblock, reparent, delete, archive or retry `t_50707802` or `t_dfaef3d8`.
- Do not create Reviewer, HANDOFF, T4-004, T4-005, frontend, auth, Canvas, or next-stage cards.
- Do not modify `HERMES-AUTO-QUEUE.md`, `CURRENT.md`, `ROADMAP.md`, Task files, ADRs, PMC reviews, Executor REPORTs, Independent REVIEWs or HANDOFFs from Hermes.
- Do not modify business code, tests, migrations or database data.
- Do not read `.env` or `.env.*`.
- Do not print, hash, persist, copy or infer credentials, API keys, tokens, certificates or private keys.
- Do not run destructive operations against `revid_db`, including `DROP`, `TRUNCATE`, `DELETE`, downgrade, reset or destructive cleanup.
- Do not claim `REPORT_READY`, `PMC_PASS`, business REWORK, final acceptance, or next Queue authorization.

## Completion Evidence

Hermes execution status must record:

- `Runtime Advisory Revision = phase4-wave2-t4-003-mysql-runtime-cutover-remediation-2026-07-09-47r1`
- `Runtime Advisory Fingerprint = REV47R1_EXECUTOR_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION_NO_REPORT`
- `Runtime Advisory Path = ai/reviews/REVIEW-T4-003-PMC-RUNTIME-ADVISORY-REV47R1-2026-07-09.md`
- `Runtime Advisory SHA256 = 0C97B59E88278A6F4D17625379426A9E5836ED7A935756ADBEB824A9240F9D5F`
- `Runtime Owner State = ACKNOWLEDGED | DIAGNOSTIC_READY | STALLED`
- `Runtime Diagnostic Due = <ISO-8601 timestamp with timezone, no later than 60 minutes from ACK>`
- `Runtime Diagnostic Path = <diagnostic path or NONE>`
- `Runtime Diagnostic SHA256 = <real SHA256 or NONE before diagnostic exists>`
- `Runtime Diagnostic Verdict = READY_FOR_CONTINUATION | STILL_INFRA_BLOCKED | NEEDS_HUMAN_DECISION | NONE`
- `PMC Verdict Confirmation = ACK_TERMINAL_VERDICT_AND_STOP`
- `PMC Action Required = NO` after ACK if waiting for due, or `YES / RUNTIME_ADVISORY` only when diagnostic is ready for PMC.

## Stop Condition

Stop after runtime advisory ACK plus diagnostic publication or explicit `STALLED`. No business execution, review, handoff, final acceptance, or next Queue selection is authorized.
