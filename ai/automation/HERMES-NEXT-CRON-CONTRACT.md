# Hermes Next Cron Contract

> Contract owner: Codex PMC
> Applicable revision: `phase4-wave2-t4-003-mysql-runtime-cutover-remediation-continuation-2026-07-09-47r2`
> Contract status: `TERMINAL - RUNTIME OWNER STALLED`

## Active Wave

| Field | Value |
|---|---|
| Queue Revision | `phase4-wave2-t4-003-mysql-runtime-cutover-remediation-continuation-2026-07-09-47r2` |
| Task ID | `T4-003` |
| Task Path | `ai/tasks/todo/TASK-T4-003.md` |
| Task SHA256 | `A78FBB1C5E26561BEFF9118482C1F3FCE5A33612051AC6AD983396D29E0B605B` |
| Queue Action | `NONE — terminal evidence only` |
| Coordinator Profile | `revid-dispatcher` |
| Executor Profile | `revid-backend` |
| Review Profile | `NONE - not authorized in rev47r2` |
| Previous Failure Fingerprint | `REV47_MYSQL_ENGINE_REFERENCE_AND_ACCEPTANCE_GATES_FAILED; REV47R1_EXECUTOR_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION_NO_REPORT; REV47R2_EXECUTOR_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION_ACTION_MARKER_NOT_DETECTED` |
| Current Failure Fingerprint | `REV47R2_EXECUTOR_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION_ACTION_MARKER_NOT_DETECTED` |
| Expected Hermes Action | `ACK_RUNTIME_OWNER_STALLED_OR_RETURN_FRESH_REMEDIATION_DIAGNOSTIC` |
| Queue SHA256 Before Advisory | `6BED79926A30CA5CE47946F2A66242A840550B032CE181B77CE1B0283D5DD90F` |
| PMC Runtime Advisory | `ai/reviews/REVIEW-T4-003-PMC-RUNTIME-ADVISORY-REV47R2-2026-07-10.md` |
| PMC Runtime Advisory SHA256 | `C21260B304C1DB12BCE3B44C2601992D5E4DA4B6B6E58B6BA9229918FBD27E30` |
| Runtime Diagnostic | `ai/reports/DIAGNOSTIC-T4-003-REV47R2-ACTION-INJECTION-2026-07-10.md` |
| Runtime Diagnostic SHA256 | `B54D120B5680083CE1797290FA0ECF4E20669870BEBA80C5795C52E38DD83271` |
| Runtime Diagnostic Verdict | `STILL_INFRA_BLOCKED` |
| PMC Diagnostic Review | `ai/reviews/REVIEW-T4-003-PMC-RUNTIME-DIAGNOSTIC-REV47R2-2026-07-10.md` |
| PMC Diagnostic Review SHA256 | `D8B5034156A8F0CBE2C2C4884D630EEDEDA33F652ED5A2EED896DC0F2DA70A6F` |
| PMC Stalled Review | `ai/reviews/REVIEW-T4-003-PMC-RUNTIME-OWNER-STALLED-REV47R2-2026-07-10.md` |
| PMC Stalled Review SHA256 | `FDEAC65DD0141E99149567AD49EF63BB19BDD197945A0D090183A0009C5669D2` |
| Scheduled Evidence | `ai/reports/SCHEDULED-HERMES-EVENT-T4-003-REV47R2-EXECUTOR-RUNTIME-BLOCK-2026-07-10.md` |
| Scheduled Evidence SHA256 | `07BC8578A0531B437FE06505070DF672BCDB252912134B5D3AECA1236E6C179A` |
| Required Diagnostic Output | `ai/reports/DIAGNOSTIC-T4-003-REV47R2-ACTION-INJECTION-REMEDIATION-2026-07-10.md` |
| Stop After | `REV47R2_ACTION_INJECTION_REMEDIATION_DIAGNOSTIC_READY_OR_STALLED` |

## Authority Snapshot

Rev47r2 was ACKed and dispatched after the patch-base remediation gate passed. Coordinator `t_41e1a294` completed run `#210` in `25s` and atomically created Executor `t_4a0c6348`.

Executor `t_4a0c6348` blocked in run `#211` after `13s` with `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION`. Scheduled evidence says the persisted Executor card body contained standalone `Action: IMPLEMENT_AND_TEST_ONLY`, but the backend SOUL failed closed before reading the Task because that action marker was not visible in its worker instruction. `ai/reports/REPORT-T4-003-REV47R2.md` is missing.

PMC diagnostic review: `PMC_BLOCKED - RUNTIME_ACTION_INJECTION_REMEDIATION_REQUIRED`. The diagnostic verdict is `STILL_INFRA_BLOCKED`: persisted card body Action was present, but the worker-visible initial instruction omitted it. This is a Hermes runtime/action-injection incident, not business REWORK. No business continuation, Reviewer, HANDOFF, T4-004/T4-005 or PMC PASS is authorized.

PMC stalled review: `PMC_BLOCKED - RUNTIME_OWNER_STALLED / ACTION_INJECTION_REMEDIATION_DIAGNOSTIC_MISSING`. Formal review `ai/reviews/REVIEW-T4-003-PMC-RUNTIME-OWNER-STALLED-REV47R2-2026-07-10.md`, SHA256 `FDEAC65DD0141E99149567AD49EF63BB19BDD197945A0D090183A0009C5669D2`, records that the expected remediation diagnostic remained missing after multiple Hermes `:15`/`:45` checkpoints.

## Exact Steps

1. Read `ai/automation/HERMES-AUTO-QUEUE.md` and confirm the canonical Active Wave for revision `phase4-wave2-t4-003-mysql-runtime-cutover-remediation-continuation-2026-07-09-47r2` is terminal/non-executable with `Action = NONE — terminal evidence only`.
2. Verify PMC diagnostic review path `ai/reviews/REVIEW-T4-003-PMC-RUNTIME-DIAGNOSTIC-REV47R2-2026-07-10.md` has SHA256 `D8B5034156A8F0CBE2C2C4884D630EEDEDA33F652ED5A2EED896DC0F2DA70A6F`.
3. Verify PMC stalled review path `ai/reviews/REVIEW-T4-003-PMC-RUNTIME-OWNER-STALLED-REV47R2-2026-07-10.md` has SHA256 `FDEAC65DD0141E99149567AD49EF63BB19BDD197945A0D090183A0009C5669D2`.
4. Do not redispatch rev47r2 or mutate historical rev47r2 cards. Remediate only the Hermes runtime / Gateway worker launch path responsible for initial instruction construction.
5. Prove with fresh non-secret evidence that `IMPLEMENT_AND_TEST_ONLY` workers receive exactly one standalone, SOUL-visible Action marker in their initial instruction.
6. Write exactly one fresh diagnostic outcome to `ai/reports/DIAGNOSTIC-T4-003-REV47R2-ACTION-INJECTION-REMEDIATION-2026-07-10.md`: `READY_FOR_CONTINUATION`, `STILL_INFRA_BLOCKED`, or `NEEDS_HUMAN_DECISION`; if this cannot be done safely, mark the same revision/fingerprint `STALLED` with exact missing evidence and next owner/action.
7. Keep the Queue non-executable until Codex PMC reviews the fresh remediation diagnostic.

## Required Diagnostic Evidence

- persisted Executor card body and exact worker instruction payload visible to `revid-backend`, with secrets excluded;
- proof that the worker-visible initial instruction includes exactly one standalone `Action: IMPLEMENT_AND_TEST_ONLY` line, or a precise reason it still does not;
- stdout/stderr tail, worker stack or exception trace if present;
- Gateway/dispatcher log tail around child promotion, claim, instruction construction, execution, finalization and blocked transition;
- exact process exit code and whether the worker reached normal agent finalization;
- resource limits, timeout budget, retry policy and why no automatic process retry or REPORT completion occurred;
- evidence that no duplicate rev47r2 Executor, Reviewer, HANDOFF, T4-004/T4-005 or business continuation was created.

## Forbidden Actions

- Do not redispatch rev47r2.
- Do not create a second Coordinator or Executor for rev47r2.
- Do not reuse, claim, promote, unblock, retry, reparent, delete or archive `t_41e1a294`, `t_4a0c6348`, rev47r1 cards `t_50707802` / `t_dfaef3d8`, or rev47 cards `t_2f055673` / `t_cef284e1`.
- Do not create Reviewer, HANDOFF, T4-004, T4-005, frontend, auth, Canvas or next-stage cards.
- Do not modify business code, tests, migrations, Executor PLAN/PROGRESS/REPORT, Independent REVIEW, HANDOFF, PMC-owned facts, database data, `.env`, or secrets.
- Do not read `.env` or `.env.*`.
- Do not print, hash, persist, copy or infer credentials, API keys, tokens, certificates or private keys.
- Do not run destructive operations against `revid_db`, including `DROP`, `TRUNCATE`, `DELETE`, downgrade, reset or destructive cleanup.
- Do not claim `PMC_PASS`, final acceptance, Independent Review readiness, HANDOFF readiness or business `REPORT_READY`.

## Completion Evidence

Hermes execution status must contain:

```text
Runtime Advisory Revision: phase4-wave2-t4-003-mysql-runtime-cutover-remediation-continuation-2026-07-09-47r2
Runtime Advisory Fingerprint: REV47R2_EXECUTOR_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION_ACTION_MARKER_NOT_DETECTED
Runtime Advisory Path: ai/reviews/REVIEW-T4-003-PMC-RUNTIME-ADVISORY-REV47R2-2026-07-10.md
Runtime Advisory SHA256: C21260B304C1DB12BCE3B44C2601992D5E4DA4B6B6E58B6BA9229918FBD27E30
Runtime Owner State: DIAGNOSTIC_READY | STALLED
Runtime Diagnostic Due: SATISFIED or <ISO-8601 timestamp no later than 60 minutes after renewed ACK>
Runtime Diagnostic Path: ai/reports/DIAGNOSTIC-T4-003-REV47R2-ACTION-INJECTION-REMEDIATION-2026-07-10.md or NONE
Runtime Diagnostic SHA256: <real SHA256 or NONE while runtime remediation is pending>
PMC Verdict Confirmation: ACK_TERMINAL_VERDICT_AND_STOP
PMC Stalled Review: ai/reviews/REVIEW-T4-003-PMC-RUNTIME-OWNER-STALLED-REV47R2-2026-07-10.md
PMC Stalled Review SHA256: FDEAC65DD0141E99149567AD49EF63BB19BDD197945A0D090183A0009C5669D2
```

## Stop Condition

Stop after the fresh remediation diagnostic is written or runtime owner records `STALLED`. Codex PMC must review fresh remediation evidence before any continuation revision can be considered.
