# Hermes Automatic Queue

## 2026-07-01 Unit C3 Revision 30 Publication

Human Owner 批准的 bounded correction revision `phase4-wave2-unit-c3-ac4-failure-cleanup-2026-07-01-30` 已执行并进入 terminal `PMC_BLOCKED`。PMC audit 证明 FK-restoration-equivalent state 未被 regression 观察，helper 不能保证 failure path 恢复 FK checks，resource-close failures 仍被静默吞掉。Formal verdict: `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV30-BLOCKED-2026-07-01.md`。当前没有 executable authorization。

## 2026-07-01 Unit C3 Revision 29 PMC Blocked

Revision `-29` reached `REPORT_READY`, but PMC source/diff audit found that orphan deletion remains after validation/assertion inside the main `try` body; the `finally` block closes resources without deleting `q-orphan`. The new non-MySQL regression observes mocked resource closure rather than the actual deletion cleanup lifecycle/state. Formal verdict: `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV29-BLOCKED-2026-07-01.md`. The revision is terminal and there is no executable authorization.

## 2026-07-01 Unit C3 Rework and Remediation Publication

Unit C3 revision `-27` is terminal `PMC_REWORK`: `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV27-REWORK-2026-07-01.md`. Revision `-28` reached `REPORT_READY`, but PMC source audit found that AC4 orphan cleanup still does not execute when migration, validation or assertion fails. Formal verdict: `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV28-BLOCKED-2026-07-01.md`. Both revisions' cards and keys are immutable evidence and must not be reused. There is currently no executable authorization.

## 2026-06-30 Credential Rotation and 26r2 Publication（completed）

Human Owner completed the shared Agnes/APIHub credential rotation. All five profile fields are non-empty, internally matching and share a new fingerprint; `revid-pm` live probe returned `CREDENTIAL_OK`. Runtime deploy/verifier and update durability gates pass. Revision `26r2` completed and is now historical evidence.

## 2026-06-30 Update Durability Blocker

Runtime `PMC_PASS` is temporarily superseded by `ai/reviews/REVIEW-T4-002-PMC-HERMES-UPDATE-DURABILITY-BLOCKED-2026-06-30.md`. Hermes update autostashed the local runtime enforcement and a stale Desktop bundle conflict prevented clean restoration. The Active Wave remains `BLOCKED / NOT EXECUTABLE`; no Hermes schedule or replacement revision is authorized until conflict resolution, repeatable post-update deployment, fresh tests/smokes, Gateway reload, and credential rotation all pass.

Resolution: update durability is `PMC_PASS` in `ai/reviews/REVIEW-T4-002-PMC-HERMES-UPDATE-DURABILITY-PASS-2026-06-30.md`; 34 invalid/obsolete cards were archived under Human Owner authorization. The Queue remains non-executable only until shared Agnes/APIHub credential rotation is confirmed. Archive does not clear any failure fingerprint.

## 2026-06-30 Runtime Remediation Verdict

Hermes role-contract hardening is `PMC_PASS` and runtime status is `READY_FOR_CONTINUATION`: `ai/reports/REPORT-HERMES-ROLE-CONTRACT-HARDENING-2026-06-30.md` and `ai/reviews/REVIEW-T4-002-PMC-HERMES-ROLE-CONTRACT-HARDENING-PASS-2026-06-30.md`.

The current Active Wave remains `BLOCKED / NOT EXECUTABLE`. Revision `26r1` and card `t_f46c8d6e` remain terminal evidence. No replacement revision is published because `SECURITY_ROTATION_REQUIRED` is still open. After credential rotation and a fresh `ROLE_CONTRACTS_OK`, PMC may publish a new review-only revision with fresh keys, `revid-pm`, at least 180 seconds, and no Executor re-execution.

本文件当前不授权任何 executable revision。Hermes scheduled mode 不得 ACK、dispatch、retry、claim、promote、unblock、reparent 或复用 revision `-30`、revision `-29` 及任何历史 T4-002 chain。

## Active Wave

| Field | Value |
|---|---|
| Revision | `phase4-wave2-unit-c3-ac4-failure-cleanup-2026-07-01-30` |
| Status | `BLOCKED / NOT EXECUTABLE — PMC_BLOCKED` |
| Approved By | `Codex Project Master Controller` |
| Task ID | `T4-002` / `UNIT-C3` |
| Project Task File | `ai/tasks/todo/TASK-T4-002-UNIT-C3-REV30.md` |
| Action | `NONE — terminal evidence only` |
| Executor Profile | `revid-backend` |
| Review Profile | `revid-reviewer` |
| Dispatch Profile | `revid-dispatcher` |
| Parallel Group | `serial-t4-002-unit-c3-rev30` |
| Attempt Policy | `Human Owner explicitly authorized one bounded correction after rev29 PMC_BLOCKED; no further automatic business rework; initial run plus at most one process retry per card; inherit all fingerprints` |
| Previous Failure Fingerprint | `all inherited T4-002 fingerprints through revision 29, including UNIT_C3_REV27_DESTINATION_FK_AND_TEST_ISOLATION_FAILURE, REV28_AC4_CLEANUP_NOT_FAILURE_SAFE and REV29_AC4_ORPHAN_DELETION_STILL_NOT_FAILURE_SAFE_AND_REGRESSION_NOT_BOUND; revision/card/runtime changes do not clear history` |
| Hard Gates | `pre-ACK project-owned runtime deploy + ROLE_CONTRACTS_OK + exact standalone Action: DISPATCH_ONLY + atomic Dispatcher child contract + only backend/tests/test_migration_tool.py writable + real AC4 and regression use the same cleanup lifecycle + injected failure proves deletion-equivalent and FK-restoration-equivalent state + cleanup failure visible + ADR-003 disposable database only + exact five real-MySQL selectors + no skip/mock substitution + secret/identity/cleanup/scope gates` |
| Coordinator Budget | `120s; dispatch only` |
| Executor Budget | `1800s` |
| Reviewer Budget | `N/A — separate lifecycle continuation required after REPORT_READY` |
| Stop After | `UNIT_C3_AC4_FAILURE_CLEANUP_REPORT_READY_REV30` |

## Revision 30 Bound AC4 Failure Cleanup Authorization

Revision `-29` is terminal evidence and must not be reused. Before ACK or card creation, Supervisor must run:

```text
python ai/runtime/deploy-hermes-runtime-contracts.py --apply
python ai/runtime/verify-hermes-role-contracts.py
```

Then create exactly one fresh `revid-dispatcher` card through the project launcher:

```text
D:/works/codexWorks/project_revid/backend/.venv/Scripts/python.exe \
  ai/runtime/create-hermes-coordinator.py \
  --action "DISPATCH_ONLY" \
  --revision "phase4-wave2-unit-c3-ac4-failure-cleanup-2026-07-01-30" \
  --task-id "T4-002" \
  --task-path "ai/tasks/todo/TASK-T4-002-UNIT-C3-REV30.md" \
  --executor-profile "revid-backend" \
  --coordinator-profile "revid-dispatcher" \
  --title "T4-002: Dispatcher - Unit C3 revision 30 bound AC4 failure cleanup" \
  --idempotency-key "revid:phase4-wave2-unit-c3-ac4-failure-cleanup-2026-07-01-30:T4-002:dispatch" \
  --max-runtime "120" \
  --workspace "dir:D:/works/codexWorks/project_revid"
```

The Dispatcher atomically creates exactly one `revid-backend` `IMPLEMENT_AND_TEST_ONLY` child with idempotency `revid:phase4-wave2-unit-c3-ac4-failure-cleanup-2026-07-01-30:T4-002:execute:0`, max runtime `1800s`, `max_retries=2`, and the exact revision `-30` Task contract. It validates persisted parent/profile/revision/body/runtime/retry/idempotency and completes immediately.

Executor may modify only `backend/tests/test_migration_tool.py` and create only the revision `-30` PLAN、PROGRESS、REPORT. The real AC4 test and non-MySQL regression must call the same cleanup lifecycle; the injected failure must prove deletion-equivalent state, FK restoration and visible cleanup failure semantics. After the five real-MySQL selectors, stop at `UNIT_C3_AC4_FAILURE_CLEANUP_REPORT_READY_REV30`.

Any deploy/verifier/Action/profile/evidence/database/cleanup/security mismatch is `BLOCKED` without fallback. Do not reuse revision `-27`/`-28`/`-29` cards or keys, modify `backend/scripts/migrate_sqlite_to_mysql.py`, create Reviewer/HANDOFF, or dispatch another revision.

## Revision 29 AC4 Cleanup Correction Authorization（terminal PMC_BLOCKED, not executable）

Dispatcher `t_6e210cce` and Executor `t_77c46dc4` completed the authorized execution stage. The REPORT's six passing commands do not satisfy the failure-path cleanup Hard Gate. Do not ACK again, dispatch, retry, claim, promote, unblock, reparent, create Reviewer/HANDOFF or reuse revision `-29` cards/keys. The original authorization below is retained only as historical contract evidence.

Before ACK or card creation, Supervisor must run:

```text
python ai/runtime/deploy-hermes-runtime-contracts.py --apply
python ai/runtime/verify-hermes-role-contracts.py
```

Then create exactly one fresh `revid-dispatcher` card through the project launcher:

```text
D:/works/codexWorks/project_revid/backend/.venv/Scripts/python.exe \
  ai/runtime/create-hermes-coordinator.py \
  --action "DISPATCH_ONLY" \
  --revision "phase4-wave2-unit-c3-ac4-cleanup-correction-2026-07-01-29" \
  --task-id "T4-002" \
  --task-path "ai/tasks/todo/TASK-T4-002-UNIT-C3-REV29.md" \
  --executor-profile "revid-backend" \
  --coordinator-profile "revid-dispatcher" \
  --title "T4-002: Dispatcher - Unit C3 revision 29 AC4 cleanup correction" \
  --idempotency-key "revid:phase4-wave2-unit-c3-ac4-cleanup-correction-2026-07-01-29:T4-002:dispatch" \
  --max-runtime "120" \
  --workspace "dir:D:/works/codexWorks/project_revid"
```

The Dispatcher atomically creates exactly one `revid-backend` `IMPLEMENT_AND_TEST_ONLY` child with idempotency `revid:phase4-wave2-unit-c3-ac4-cleanup-correction-2026-07-01-29:T4-002:execute:0`, max runtime `1800s`, and the exact revision `-29` Task contract. It validates persisted parent/profile/revision/body/runtime/idempotency and completes immediately.

Executor may modify only `backend/tests/test_migration_tool.py` and create only the revision `-29` PLAN、PROGRESS、REPORT. It must run the non-MySQL failure-path cleanup regression before the five real-MySQL selectors and stop at `UNIT_C3_AC4_CLEANUP_REPORT_READY_REV29`.

Any deploy/verifier/Action/profile/evidence/database/cleanup/security mismatch is `BLOCKED` without fallback. Do not reuse revision `-27`/`-28` cards or keys, modify `backend/scripts/migrate_sqlite_to_mysql.py`, create Reviewer/HANDOFF, or dispatch another revision.

Publication verification: exactly one Active Wave has `Status = APPROVED — WAITING_FOR_HERMES_ACK`; Task/revision/action/profile/idempotency/retry/Stop After markers match; revision `-29` REPORT、Independent REVIEW 与 HANDOFF 尚不存在；launcher `--dry-run` produced the exact Dispatcher body and created no card.

## Revision 28 Unit C3 Remediation Authorization（terminal PMC_BLOCKED, not executable）

Dispatcher `t_d11673a6` and Executor `t_670af729` completed the authorized business stage. The REPORT's five passing selectors do not satisfy final evidence requirements because AC4 cleanup remains outside an outer failure-safe `try/finally`. Do not ACK again, dispatch, retry, claim, promote, unblock, reparent, create Reviewer/HANDOFF or reuse revision `-28` cards/keys. The original authorization below is retained only as historical contract evidence.

Before ACK or card creation, Supervisor must run:

```text
python ai/runtime/deploy-hermes-runtime-contracts.py --apply
python ai/runtime/verify-hermes-role-contracts.py
```

Then create exactly one `revid-dispatcher` card through the project launcher:

```text
D:/works/codexWorks/project_revid/backend/.venv/Scripts/python.exe \
  ai/runtime/create-hermes-coordinator.py \
  --action "DISPATCH_ONLY" \
  --revision "phase4-wave2-unit-c3-integrity-remediation-2026-07-01-28" \
  --task-id "T4-002" \
  --task-path "ai/tasks/todo/TASK-T4-002-UNIT-C3-REV28.md" \
  --executor-profile "revid-backend" \
  --coordinator-profile "revid-dispatcher" \
  --title "T4-002: Dispatcher - Unit C3 revision 28 integrity remediation" \
  --idempotency-key "revid:phase4-wave2-unit-c3-integrity-remediation-2026-07-01-28:T4-002:dispatch" \
  --max-runtime "120" \
  --workspace "dir:D:/works/codexWorks/project_revid"
```

The Dispatcher atomically creates exactly one `revid-backend` `IMPLEMENT_AND_TEST_ONLY` child with idempotency `revid:phase4-wave2-unit-c3-integrity-remediation-2026-07-01-28:T4-002:execute:0`, validates persisted parent/profile/revision/body/runtime, and completes immediately. It must not run tests, access the database, write artifacts, wait for the Executor, reuse any old card/key or create Reviewer/HANDOFF.

Executor follows the exact revision 28 Task, modifies only the two Allowed business files, runs the required targeted checks and five real-MySQL selectors, writes only revision 28 PLAN/PROGRESS/REPORT and stops at `UNIT_C3_REMEDIATION_REPORT_READY_REV28`. Any deploy/verifier/Action/profile/evidence/database/cleanup/security mismatch blocks without fallback.

## Revision 27 Unit C3 Verification（terminal PMC_REWORK, not executable）

Dispatcher `t_ff560e29` and Executor `t_d97dcb15` completed the authorized read-only stage. The five selectors returned `1 PASS / 4 FAIL / 1 ERROR`; formal verdict and stable fingerprint are recorded in `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV27-REWORK-2026-07-01.md`. Do not ACK, dispatch, retry, claim, promote, unblock, reparent, delete or reuse revision `-27` cards/keys. Do not create its Independent Reviewer or HANDOFF.

## Revision 26r2 Review Lifecycle Authorization（completed, not executable）

Coordinator `t_ec30ad12`, Reviewer `t_bcbc25b7` and HANDOFF `t_c481b6ad` completed. Codex PMC verdict is `PMC_PASS` in `ai/reviews/REVIEW-T4-002-PMC-UNIT-C2-REV26-PASS-2026-07-01.md`. The former authorization below is retained only as historical contract evidence and must not be ACKed or executed again.

## Revision 26r1 Review Lifecycle Authorization（terminal, not executable）

Coordinator `t_f46c8d6e` run `#126` persisted `Action: DISPATCH_ONLY` instead of the authorized `REVIEW_DISPATCH_ONLY`, then timed out at `121s > 120s`, exhausted process retry `1/1` and created no Reviewer/HANDOFF child. Revision `-26r1` is terminal `INFRASTRUCTURE_BLOCKED`; do not ACK again, redispatch, retry, claim, promote, unblock, reparent, delete, archive or reuse its card/key.

Formal PMC verdict: `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV26R1-2026-06-30.md`. The authorization below is retained as historical contract evidence only and must not be executed. No replacement revision is approved until fresh role-contract tests, profile deployment, isolated smokes and a runtime owner `READY_FOR_CONTINUATION` report satisfy the advisory.

Revision `-26` business execution reached `REPORT_READY`. Dispatcher `t_c14aa473` and Executor `t_9f24648e` are evidence inputs only and must not be retried, claimed, promoted, unblocked, reparented or reused.

PMC inspected the Task, REPORT and actual Allowed Files diff in `ai/reviews/REVIEW-T4-002-PMC-UNIT-C2-REV26-REVIEW-LIFECYCLE-2026-06-29.md`. The implementation is eligible for Independent Review; this is not PMC PASS.

Hermes Supervisor must ACK this exact Queue revision, then create exactly one fresh `revid-pm` stage card with:

- standalone `Action: REVIEW_DISPATCH_ONLY`;
- revision `phase4-wave2-unit-c2-rev26-review-dispatch-2026-06-29-26r1`;
- Task path `ai/tasks/todo/TASK-T4-002-UNIT-C2-REV26.md`;
- Executor evidence card `t_9f24648e` and REPORT `ai/reports/REPORT-T4-002-UNIT-C2-REV26.md`;
- idempotency `revid:phase4-wave2-unit-c2-rev26-review-dispatch-2026-06-29-26r1:T4-002:review-dispatch`;
- max runtime `120s`, at most one process retry.

The stage reads only the named evidence and creates exactly:

1. One `revid-reviewer` card with idempotency `revid:phase4-wave2-unit-c2-rev26-review-dispatch-2026-06-29-26r1:T4-002:review:0`, max runtime `1800s`, and the review contract in the Task.
2. One dependent `revid-pm` card with standalone `Action: HANDOFF_ONLY`, idempotency `revid:phase4-wave2-unit-c2-rev26-review-dispatch-2026-06-29-26r1:T4-002:handoff:0`, max runtime `120s`, and the Reviewer as its parent dependency.

After persisted ID, assignee, parent, revision, body and idempotency checks, the review-dispatch stage completes immediately. It must not run tests, write REVIEW/HANDOFF, modify business or Executor files, wait for workers, or create any additional card.

The Reviewer independently runs the Task's four unit selectors and four real disposable-MySQL selectors, audits REPORT/diff/test semantics and writes only `ai/reviews/REVIEW-T4-002-UNIT-C2-REV26.md`. It must distinguish mocked unit tests from real MySQL verification, prove cleanup and database identity, inspect stale-same/stale-diff/rollback/report-field semantics, and return exactly PASS, REWORK or BLOCKED.

The `HANDOFF_ONLY` stage writes only `ai/handoffs/HANDOFF-T4-002-UNIT-C2-REV26-POST-REVIEW.md`, and only after Reviewer PASS plus revision/attempt/card/evidence consistency checks. Any non-PASS verdict or evidence mismatch blocks the stage without HANDOFF_READY.

No Unit C3, Units D-E, T4-003, T4-010, business re-execution, code change or new revision is authorized. Stop at `UNIT_C2_HANDOFF_READY_REV26` for Codex PMC final acceptance.

Historical publication verification: at publication time exactly one Active Wave had `Status = APPROVED`; Queue/Task/revision/action/profile/idempotency/Stop After markers were consistent; expected Independent REVIEW and canonical HANDOFF were absent before execution; `git diff --check` passed.

## Revision 26 Atomic Dispatch Authorization（historical, REPORT_READY, not executable）

Revision `-25` remains terminal infrastructure evidence. Dispatcher `t_cc15e296` and child `t_25ac2145` must not be retried, claimed, promoted, unblocked, reparented, deleted, archived or reused.

PMC accepted the future-chain runtime remediation in `ai/reviews/REVIEW-T4-002-PMC-HERMES-ATOMIC-DISPATCH-FIX-PASS-2026-06-29.md` and authorized this continuation in `ai/reviews/REVIEW-T4-002-PMC-UNIT-C2-REV26-CONTINUATION-APPROVAL-2026-06-29.md`.

Hermes Supervisor must ACK this exact Queue revision before creating any card. It then creates exactly one fresh `revid-dispatcher` card through:

```text
D:/works/codexWorks/project_revid/backend/.venv/Scripts/python.exe \
  ai/runtime/create-hermes-coordinator.py \
  --revision "phase4-wave2-unit-c2-ac3-stale-same-remediation-atomic-dispatch-2026-06-29-26" \
  --task-id "T4-002" \
  --task-path "ai/tasks/todo/TASK-T4-002-UNIT-C2-REV26.md" \
  --executor-profile "revid-backend" \
  --coordinator-profile "revid-dispatcher" \
  --title "T4-002: Dispatcher - Unit C2 revision 26 AC3 remediation (atomic)" \
  --idempotency-key "revid:phase4-wave2-unit-c2-ac3-stale-same-remediation-atomic-dispatch-2026-06-29-26:T4-002:dispatch" \
  --max-runtime "120" \
  --workspace "dir:D:/works/codexWorks/project_revid"
```

No direct `hermes kanban create`, old card reuse, alternate idempotency key, shell-composed body or fallback launcher is authorized. Launcher non-zero exit or persisted-body mismatch means `INFRASTRUCTURE_BLOCKED` without creating another card.

The Dispatcher reads only `ai/tasks/todo/TASK-T4-002-UNIT-C2-REV26.md` and creates exactly one `revid-backend` child with its current card as the only parent, idempotency `revid:phase4-wave2-unit-c2-ac3-stale-same-remediation-atomic-dispatch-2026-06-29-26:T4-002:execute:0`, max runtime `1800s` and at most one process retry.

The installed runtime must atomically commit child create/link, Dispatcher completion and child promotion. The Dispatcher must exit after the durable terminal transition without a follow-up model call. Any timeout, contract mismatch, duplicate/extra child, non-atomic topology or unexpected state is `INFRASTRUCTURE_BLOCKED`; no automatic revision `-27`, budget increase or alternate chain is authorized.

The Executor may modify only the two business files and create only the three rev26 artifacts listed in the Task. It must run the Task's exact verification in order and stop after REPORT_READY. Reviewer and HANDOFF creation are forbidden until a new PMC lifecycle decision.

Publication verification: launcher `--dry-run` returned the exact standalone `Action: DISPATCH_ONLY`, revision, Task path, profile, fresh idempotency key, `120s` budget and `--max-retries 1`; no card was created. Queue/Task consistency and `git diff --check` passed before this final Queue write.

## Revision 25 Dedicated Dispatcher History（terminal, not executable）

Revision `-24` is terminal infrastructure evidence. Coordinator `t_53630896` and run `#121` must not be retried, unblocked, deleted, archived or reused.

Revision `-25` is now terminal infrastructure evidence. Dispatcher `t_cc15e296` run `#122` timed out at `121s > 120s`, exhausted process retry `1/1` and `gave_up`. It created child `t_25ac2145`, but did not complete required read-back validation; the child remains `todo` with no run and cannot continue through its blocked parent. Rev25 PLAN, PROGRESS, REPORT, Independent REVIEW and HANDOFF are absent.

Formal verdict: `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV25-2026-06-29.md`. This Queue entry is historical and non-executable. Do not retry, claim, promote, unblock, reparent, delete or reuse either card. At that incident checkpoint no revision `-26` or budget increase was authorized; this statement is superseded only by the fresh revision `-26` authorization above. The original revision `-25` authorization below is retained only as incident evidence and must not be executed.

Subsequent runtime remediation is accepted in `ai/reviews/REVIEW-T4-002-PMC-HERMES-ATOMIC-DISPATCH-FIX-PASS-2026-06-29.md`: future `DISPATCH_ONLY` child creation, parent completion and child promotion commit atomically, and the agent loop exits after the durable terminal transition. This does not reactivate revision `-25` and does not make this Queue executable. A continuation requires a fresh PMC revision, Task and keys.

Supervisor creates exactly one fresh `revid-dispatcher` card through the project launcher using `--coordinator-profile "revid-dispatcher"`, idempotency `revid:phase4-wave2-unit-c2-ac3-stale-same-remediation-dispatcher-2026-06-29-25:T4-002:dispatch` and max runtime `120`.

The Dispatcher reads only `ai/tasks/todo/TASK-T4-002-UNIT-C2-REV25.md`, creates and read-back validates exactly one `revid-backend` child, then completes immediately. It must not run tests, inspect broad project state, write files, wait for Executor or perform Reviewer/HANDOFF lifecycle work.

The Executor child uses idempotency `revid:phase4-wave2-unit-c2-ac3-stale-same-remediation-dispatcher-2026-06-29-25:T4-002:execute:0` and max runtime `1800s`. Any Dispatcher timeout or contract mismatch returns `INFRASTRUCTURE_BLOCKED`; no automatic rev26 or budget increase is authorized.

## Revision 24 Transport-Fixed Authorization

Revision `-23` is terminal infrastructure evidence. Coordinator `t_1dea37a2` and run `#120` must not be deleted, archived, retried, unblocked or reused. Raw cron tool-call evidence shows the Supervisor explicitly passed `--body "@...REV23.md"` after an unsafe Bash→PowerShell command failed; the active cause is not CLI truncation of a complete body.

Formal runtime verdict: `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV23-2026-06-29.md`.

Supervisor must create the rev24 Coordinator only with:

```text
D:/works/codexWorks/project_revid/backend/.venv/Scripts/python.exe \
  ai/runtime/create-hermes-coordinator.py \
  --revision "phase4-wave2-unit-c2-ac3-stale-same-remediation-transport-fixed-2026-06-29-24" \
  --task-id "T4-002" \
  --task-path "ai/tasks/todo/TASK-T4-002-UNIT-C2-REV24.md" \
  --executor-profile "revid-backend" \
  --title "T4-002: Coordinator — Unit C2 revision 24 AC3 remediation" \
  --idempotency-key "revid:phase4-wave2-unit-c2-ac3-stale-same-remediation-transport-fixed-2026-06-29-24:T4-002:coordinate" \
  --max-runtime "120" \
  --workspace "dir:D:/works/codexWorks/project_revid"
```

No direct `hermes kanban create`, nested PowerShell, shell multiline `--body`, or task-reference-only fallback is authorized. Launcher non-zero exit or persisted-body mismatch means `INFRASTRUCTURE_BLOCKED` without creating another card/key.

The Coordinator may create exactly one `revid-backend` child with idempotency `revid:phase4-wave2-unit-c2-ac3-stale-same-remediation-transport-fixed-2026-06-29-24:T4-002:execute:0`, max runtime `1800s`, and the exact rev24 Task contract.

## Revision 23 AC3 Remediation History（terminal, not executable）

Revision `-22` completed its authorized verification and is terminal `PMC_REWORK`: AC1/AC2/AC5 passed, AC3 failed with fingerprint `AC3_STALE_SAME_DUPLICATE_INSERT`. Formal closure: `ai/reviews/REVIEW-T4-002-PMC-UNIT-C2-REV22-REWORK-2026-06-29.md`.

Revision `-23` originally authorized one fresh `revid-pm` Coordinator and one `revid-backend` child with the following contract; the authorization is now terminal historical evidence and must not be executed:

- Parent: current rev23 Coordinator.
- Max runtime: `1800s`.
- Idempotency: `revid:phase4-wave2-unit-c2-ac3-stale-same-remediation-2026-06-29-23:T4-002:execute:0`.
- Allowed business files: `backend/scripts/migrate_sqlite_to_mysql.py`, `backend/tests/test_migration_tool.py`.
- Required outcome: bounded fix, targeted unit evidence and real disposable-MySQL AC1/AC2/AC3/AC5 results.
- Persisted body must explicitly say business files are writable only within the bounded rev23 scope, list the three allowed Executor artifacts, require the Task verification commands and forbid Reviewer/HANDOFF.

Coordinator idempotency: `revid:phase4-wave2-unit-c2-ac3-stale-same-remediation-2026-06-29-23:T4-002:coordinate`.

Coordinator must read the child back and verify assignee, parent, revision, body, idempotency and max runtime before completion. A mismatch is `COORDINATOR_CHILD_CONTRACT_INVALID`; block rather than execute or report success.

Revision `-22` cards `t_971a76d5` and `t_4f178d0c` are terminal evidence. Do not redispatch, retry, claim, promote, unblock or reuse them.

## Revision 22 Child Contract Correction

Revision `-21` Coordinator `t_14b8871f` 已证明 exact policy handoff 修复生效，但 child `t_689f993e` body 错误禁止 required tests，persisted runtime 也未固定为 1800s。该 child run `#116` 已回收并以 `COORDINATOR_CHILD_CONTRACT_INVALID` block；rev21 chain terminal，不得复用。

Revision `-22` 使用 `ai/tasks/todo/TASK-T4-002-UNIT-C2-REV22.md` 的 exact child payload contract 与全新 idempotency keys。Coordinator 必须在完成前复核 child persisted body/runtime/retry/parent；不允许仅凭预期值写成功 summary。

## Revision 21 Publication

Supervisor body contract、runtime fail-closed 与 Windows multiline transport 已修复。Targeted regression `6 passed`；isolated positive Coordinator `t_11db1342` run `#2` 在 84s 内只创建 child `t_0896a51e` 并完成；missing-marker negative runs 在 0s、`worker_pid=null` 下 fail-closed。正式证据：`ai/reports/REPORT-HERMES-POLICY-HANDOFF-FIX-2026-06-29.md`。

Revision `-21` 曾发布并执行，现已 terminal。Human Owner 于 2026-06-29 确认旧 credential 已撤销并完成四个 Revid profiles 更新；Codex 以不读取 secret 的方式确认四个配置均在本轮更新且 credential fingerprint 一致，`revid-pm` live probe 返回 `CREDENTIAL_OK`。

## Revision 20 Terminal Evidence

Coordinator `t_1617a921` run `#114` 在 Executor dispatch 前 121s timeout，process retry `1/1` exhausted。Children 为空；Unit C2 PLAN、PROGRESS、REPORT、Independent REVIEW 与 HANDOFF 均不存在。

直接证据证明 Supervisor 创建的 card body 只有 Task path 引用，缺少 standalone `Action: DISPATCH_ONLY`。Hermes runtime 的 `_resolve_worker_allowed_tools()` 只解析 card body，不读取引用文件，因此未选择 exact policy；worker log 随后执行 `git status`、`hermes profile list`、`ls` 等 allowlist 外工具。

Revision `-20` 不得重派、复用、claim、promote、unblock 或 retry。本 Queue 不授权 revision `-21`。

正式 verdict：`ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV20-2026-06-28.md`。

## Revision 19 Terminal History

Coordinator `t_b493a47f` run `#113` 在 Executor dispatch 前因 `pid 30648 not alive` crash，process retry `1/1` exhausted。Executor、PLAN、PROGRESS、REPORT、Independent REVIEW 与 HANDOFF 均不存在。

Revision `-19` 不得重派、复用、claim、promote、unblock 或 retry。Fresh diagnostic 已由 PMC 审阅；后续 escalation 又因复用旧 smoke、未执行新 remediation 而在 `ai/reviews/REVIEW-T4-002-PMC-ESCALATION-REV19-2026-06-28.md` 被驳回。该历史 chain 保持 terminal；revision `-20` 使用新的 card 与 idempotency key。

## Runtime Remediation Update

PMC 已在 `ai/reviews/REVIEW-T4-002-PMC-HERMES-WORKER-FINALIZATION-FIX-PASS-2026-06-28.md` 验收 worker in-process finalization、retained-handle watcher、targeted tests 与 isolated 3+1 runtime evidence，结论为 `READY_FOR_CONTINUATION`。

PMC 已通过 `ai/reviews/REVIEW-T4-002-PMC-UNIT-C2-REV20-CONTINUATION-APPROVAL-2026-06-28.md` 发布 revision `-20`。Runtime PASS 不清零任何历史 fingerprint；Hermes 不得自行重派或复用旧 card。

Revision `-20` 暴露了新的 Supervisor → worker-policy handoff defect：runtime remediation 修复了 terminal finalization，但未覆盖 Supervisor 丢失 action marker 后的 unrestricted fallback。下一 revision 的前置条件是 Supervisor body contract 修复、missing/unknown action fail-closed regression、fresh scheduled-path smoke、execution status reconciliation 和 credential rotation confirmation。

## Historical Revision 20 Coordinator Contract（not executable）

Hermes Supervisor 只创建一个新的 `revid-pm` Coordinator，card body 必须包含独立一行：

```text
Action: DISPATCH_ONLY
```

Coordinator 必须读取精确 Task 文件，创建且只创建一个 `revid-backend` Executor child：

- Assignee：`revid-backend`
- Idempotency：`revid:phase4-wave2-unit-c2-migration-core-continuation-2026-06-28-20:T4-002:execute:0`
- Parent：本 Coordinator card
- Max runtime：1800s
- Scope：只执行 Task 指定的 four selectors，业务文件 read-only

完成真实 card ID、assignee、parent 与 revision 校验后立即完成 Coordinator。禁止运行 tests、访问 database、写 artifact、创建 Reviewer/HANDOFF、等待 Executor、复用旧 card 或修改 business files。

## Historical Revision 20 Executor Contract（not executable）

Executor 必须按 Task 顺序执行：

1. `test_ac1_dry_run_no_changes`
2. `test_ac2_full_migration_succeeds`
3. `test_ac3_idempotency`
4. `test_ac5_source_immutable`

只允许创建 Unit C2 PLAN、PROGRESS、REPORT。测试必须使用 runtime `REVID_TEST_MYSQL_ADMIN_URL` 和唯一 `revid_test_t4_002`；禁止读取 `.env`、输出 credential、触碰 `revid_db` 或修改 business files。任一 secret、identity、permission、cleanup 或 test-order hard gate 失败立即 BLOCKED。

Executor 完成 REPORT 后进入 terminal review-required 并停止。不得创建 REVIEW、HANDOFF 或其他 worker。

## Historical Review Lifecycle Gate

原 contract 约定在 `UNIT_C2_REPORT_READY_REV20` 后由 PMC 核对 REPORT，再决定是否发布 `REVIEW_DISPATCH_ONLY` lifecycle continuation。Revision `-20` 未到达该状态且已 terminal，本段仅作历史记录，不构成执行授权。

## Historical Chain Rules

- Unit C1 revision `-18` 与 lifecycle continuation `-18r1` 已 PMC PASS；cards `t_3bfbe611`、`t_b3cfb6ce`、`t_bd6172b7`、`t_8f3b60ff`、`t_b918a49e` 均不得复用或修改。
- `ai/handoffs/HANDOFF-T4-002-UNIT-C1-REV18.md` 继续作为 premature/non-canonical evidence 保留。
- Revision `-19` chain 已 terminal；revision `-20` 是同一 business attempt 1 的 bounded continuation，不是 attempt 2，并继承 `REV19_COORDINATOR_CRASH`。

## Human Decision

Runtime 路线决策为 `NO`：不需要改变产品、schema contract 或 destructive authorization。安全事项为 `YES`：诊断 transcript 中出现的 credential 必须由 Human Owner 轮换并确认旧值失效。

*最后更新：2026-07-01；Unit C3 revision `-30` 已 `PMC_BLOCKED`，fingerprint `REV30_FK_RESTORATION_UNPROVEN_AND_CLEANUP_FAILURES_NOT_PRESERVED`。当前没有 executable Queue；revisions `-27`/`-28`/`-29`/`-30` cards、keys 与 artifacts 仅作 terminal evidence，不得重复执行或进入 Review lifecycle。*
