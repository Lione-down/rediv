# Hermes Automatic Queue

该文件是 Hermes scheduled mode 的唯一 executable authorization。

## Active Wave

| Field | Value |
|---|---|
| Revision | `phase4-wave2-unit-c2-migration-core-continuation-2026-06-28-20` |
| Status | `APPROVED` |
| Approved By | `Codex Project Master Controller` |
| Task ID | `T4-002` / `UNIT-C2` |
| Project Task File | `ai/tasks/todo/TASK-T4-002-UNIT-C2-REV20.md` |
| Action | `DISPATCH_ONLY` |
| Executor Profile | `revid-backend` |
| Review Profile | `revid-reviewer` |
| Parallel Group | `serial-t4-002-unit-c2-rev20` |
| Attempt Policy | `business attempt 1 continuation; no attempt 2; one process retry maximum; inherit all fingerprints` |
| Previous Failure Fingerprint | `all inherited T4-002 fingerprints through revision -19, including COORDINATOR_ROLE_COLLAPSE, REV18_LIFECYCLE_STAGE_GAP, REV18_PREMATURE_HANDOFF_SCOPE_DRIFT and REV19_COORDINATOR_CRASH` |
| Hard Gates | `ADR-003 disposable database only + exact DISPATCH_ONLY runtime policy + business files read-only + secret/identity/cleanup gates` |
| Coordinator Budget | `120s; dispatch only` |
| Executor Budget | `1800s` |
| Stop After | `UNIT_C2_REPORT_READY_REV20; wait for Codex PMC to approve review-dispatch continuation` |

## Revision 19 Terminal History

Coordinator `t_b493a47f` run `#113` 在 Executor dispatch 前因 `pid 30648 not alive` crash，process retry `1/1` exhausted。Executor、PLAN、PROGRESS、REPORT、Independent REVIEW 与 HANDOFF 均不存在。

Revision `-19` 不得重派、复用、claim、promote、unblock 或 retry。Fresh diagnostic 已由 PMC 审阅；后续 escalation 又因复用旧 smoke、未执行新 remediation 而在 `ai/reviews/REVIEW-T4-002-PMC-ESCALATION-REV19-2026-06-28.md` 被驳回。该历史 chain 保持 terminal；revision `-20` 使用新的 card 与 idempotency key。

## Runtime Remediation Update

PMC 已在 `ai/reviews/REVIEW-T4-002-PMC-HERMES-WORKER-FINALIZATION-FIX-PASS-2026-06-28.md` 验收 worker in-process finalization、retained-handle watcher、targeted tests 与 isolated 3+1 runtime evidence，结论为 `READY_FOR_CONTINUATION`。

PMC 已通过 `ai/reviews/REVIEW-T4-002-PMC-UNIT-C2-REV20-CONTINUATION-APPROVAL-2026-06-28.md` 发布 revision `-20`。Runtime PASS 不清零任何历史 fingerprint；Hermes 不得自行重派或复用旧 card。

## Coordinator Contract

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

## Executor Contract

Executor 必须按 Task 顺序执行：

1. `test_ac1_dry_run_no_changes`
2. `test_ac2_full_migration_succeeds`
3. `test_ac3_idempotency`
4. `test_ac5_source_immutable`

只允许创建 Unit C2 PLAN、PROGRESS、REPORT。测试必须使用 runtime `REVID_TEST_MYSQL_ADMIN_URL` 和唯一 `revid_test_t4_002`；禁止读取 `.env`、输出 credential、触碰 `revid_db` 或修改 business files。任一 secret、identity、permission、cleanup 或 test-order hard gate 失败立即 BLOCKED。

Executor 完成 REPORT 后进入 terminal review-required 并停止。不得创建 REVIEW、HANDOFF 或其他 worker。

## Review Lifecycle Gate

本 revision 不授权 Reviewer 或 HANDOFF stage。PMC 将在 `UNIT_C2_REPORT_READY_REV20` 后核对 REPORT、card、diff 和 hard gates；通过后才可发布单独的 `REVIEW_DISPATCH_ONLY` lifecycle continuation。

## Historical Chain Rules

- Unit C1 revision `-18` 与 lifecycle continuation `-18r1` 已 PMC PASS；cards `t_3bfbe611`、`t_b3cfb6ce`、`t_bd6172b7`、`t_8f3b60ff`、`t_b918a49e` 均不得复用或修改。
- `ai/handoffs/HANDOFF-T4-002-UNIT-C1-REV18.md` 继续作为 premature/non-canonical evidence 保留。
- Revision `-19` chain 已 terminal；revision `-20` 是同一 business attempt 1 的 bounded continuation，不是 attempt 2，并继承 `REV19_COORDINATOR_CRASH`。

## Human Decision

`NO`。Unit C2 边界已由既有 split decision 与 ADR-003 确定，不改变产品、schema contract 或 destructive authorization。

*最后更新：2026-06-28；revision `-19` 旧 chain terminal；revision `-20` 是唯一 APPROVED executable Queue，等待 Hermes ACK。*
