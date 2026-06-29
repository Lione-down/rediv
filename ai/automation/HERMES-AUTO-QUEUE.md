# Hermes Automatic Queue

## 2026-06-30 Runtime Remediation Verdict

Hermes role-contract hardening is `PMC_PASS` and runtime status is `READY_FOR_CONTINUATION`: `ai/reports/REPORT-HERMES-ROLE-CONTRACT-HARDENING-2026-06-30.md` and `ai/reviews/REVIEW-T4-002-PMC-HERMES-ROLE-CONTRACT-HARDENING-PASS-2026-06-30.md`.

The current Active Wave remains `BLOCKED / NOT EXECUTABLE`. Revision `26r1` and card `t_f46c8d6e` remain terminal evidence. No replacement revision is published because `SECURITY_ROTATION_REQUIRED` is still open. After credential rotation and a fresh `ROLE_CONTRACTS_OK`, PMC may publish a new review-only revision with fresh keys, `revid-pm`, at least 180 seconds, and no Executor re-execution.

该文件是 Hermes scheduled mode 的唯一 executable authorization。

## Active Wave

| Field | Value |
|---|---|
| Revision | `phase4-wave2-unit-c2-rev26-review-dispatch-2026-06-29-26r1` |
| Status | `BLOCKED — INFRASTRUCTURE_BLOCKED / NOT EXECUTABLE` |
| Approved By | `Codex Project Master Controller` |
| Task ID | `T4-002` / `UNIT-C2` |
| Project Task File | `ai/tasks/todo/TASK-T4-002-UNIT-C2-REV26.md` |
| Action | `REVIEW_DISPATCH_ONLY` |
| Executor Profile | `N/A — revision 26 Executor t_9f24648e is complete; no repeat execution` |
| Review Profile | `revid-reviewer` |
| Dispatch Profile | `revid-pm` |
| Parallel Group | `serial-t4-002-unit-c2-rev26-review` |
| Attempt Policy | `same revision 26 / business attempt 1 lifecycle continuation; no Executor; no automatic business rework; one process retry maximum per lifecycle card; inherit all fingerprints` |
| Previous Failure Fingerprint | `all inherited T4-002 fingerprints through revision 26, including AC3_STALE_SAME_DUPLICATE_INSERT and every retained runtime fingerprint; REPORT_READY does not clear them` |
| Hard Gates | `exact standalone Action: REVIEW_DISPATCH_ONLY + fresh stage/reviewer/handoff keys + revision 26 evidence equality + independent rerun + ADR-003 disposable database only + no skip/mock MySQL substitution + secret/identity/cleanup/scope gates + HANDOFF only after Reviewer PASS` |
| Coordinator Budget | `120s; review dispatch only` |
| Reviewer Budget | `1800s` |
| Handoff Budget | `120s; handoff only` |
| Stop After | `UNIT_C2_HANDOFF_READY_REV26` |

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

*最后更新：2026-06-30；review lifecycle revision `-26r1` 已 terminal `INFRASTRUCTURE_BLOCKED` 且不可执行。当前没有 executable Queue；revision `-26` business stage 保持 REPORT_READY evidence，不得重复执行。*
