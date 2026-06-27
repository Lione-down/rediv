# Hermes Automatic Queue

该文件是 Hermes scheduled mode 的唯一 executable authorization。

## Active Wave

| Field | Value |
|---|---|
| Revision | `phase4-wave2-unit-c1-rev18-review-dispatch-2026-06-28-18r1` |
| Business Revision | `phase4-wave2-unit-c1-runtime-enforced-2026-06-28-18` |
| Status | `APPROVED` |
| Approved By | `Codex Project Master Controller` |
| Task ID | `T4-002` / `UNIT-C1` |
| Project Task File | `ai/tasks/todo/TASK-T4-002-UNIT-C1-REV18.md` |
| Action | `REVIEW_DISPATCH_ONLY` |
| Executor Profile | `revid-pm` (lifecycle stage coordinator only) |
| Review Profile | `revid-reviewer` |
| Parallel Group | `serial-t4-002-unit-c1-rev18-review` |
| Attempt Policy | `same business revision and attempt 1 continuation; no business retry; inherit all fingerprints` |
| Previous Failure Fingerprint | `all inherited T4-002 fingerprints through revision -18, including COORDINATOR_ROLE_COLLAPSE and REV18_LIFECYCLE_STAGE_GAP` |
| Hard Gates | `REPORT-T4-002-UNIT-C1-REV18 exists + Executor t_b3cfb6ce terminal review-required + exact action-specific runtime policy` |
| Coordinator Budget | `120s; dispatch only` |
| Reviewer Budget | `600s` |
| Handoff Budget | `120s` |
| Stop After | `UNIT_C1_HANDOFF_READY_REV18 from POST-REVIEW handoff; wait for Codex PMC final acceptance` |

## Stage Coordinator Contract

Hermes Supervisor 只创建一个新的 `revid-pm` stage coordinator，card body 必须包含独立一行：

```text
Action: REVIEW_DISPATCH_ONLY
```

Stage coordinator 必须验证 Executor `t_b3cfb6ce` 与 `ai/reports/REPORT-T4-002-UNIT-C1-REV18.md`，然后创建且只创建：

1. Reviewer card：assignee `revid-reviewer`，idempotency `revid:phase4-wave2-unit-c1-runtime-enforced-2026-06-28-18:T4-002:review:0`，要求独立复跑 Task verification 并写 `ai/reviews/REVIEW-T4-002-UNIT-C1-REV18.md`。
2. Handoff stage card：assignee `revid-pm`，parent/dependency 为上述 Reviewer，idempotency `revid:phase4-wave2-unit-c1-runtime-enforced-2026-06-28-18:T4-002:handoff-post-review:0`，body 包含独立一行 `Action: HANDOFF_ONLY`。

完成真实 card ID、assignee、parent/dependency 与 revision 校验后立即完成 stage coordinator。禁止运行 tests、写 REVIEW/HANDOFF、等待 Reviewer、复用旧 card 或修改 business files。

## Reviewer Contract

Reviewer 必须独立读取 Task、REPORT 和实际 diff，复跑两项指定真实 MySQL tests，区分真实验证与静态声明，并写 `ai/reviews/REVIEW-T4-002-UNIT-C1-REV18.md`。不得接受 Executor 提前创建的 HANDOFF 作为验收证据。

## Handoff Stage Contract

`HANDOFF_ONLY` 只允许读取 Task、REPORT、Independent REVIEW 和相关 cards。仅当 Reviewer verdict 为 PASS 时写 `ai/handoffs/HANDOFF-T4-002-UNIT-C1-REV18-POST-REVIEW.md` 并完成；其他 verdict 必须 block。禁止运行 tests、修改 REVIEW 或 business files。

## Historical Chain Rules

- 初始 rev18 Coordinator `t_3bfbe611` 已按 `DISPATCH_ONLY` 正确完成；不得复用。
- Executor `t_b3cfb6ce` 已完成业务验证并处于 review-required；不得 claim、promote、unblock 或 retry。
- `ai/handoffs/HANDOFF-T4-002-UNIT-C1-REV18.md` 是 premature/non-canonical evidence。
- 本 Queue 是 lifecycle continuation，不是第二条 business execution chain，也不清零任何 failure fingerprint。

## Human Decision

`NO`。这是 operating-model lifecycle 缺口的 bounded correction。

*最后更新：2026-06-28 04:26 +08:00；等待 Hermes ACK review-dispatch continuation stage。*
