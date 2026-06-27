# T4-002 revision -18 lifecycle gap — PMC review

## Verdict

`PMC_CONTINUATION_APPROVED — REVIEW_DISPATCH_ONLY`

这不是 business REWORK，也不创建 attempt 2。Unit C1 Executor 已完成并产生 REPORT，但 execution chain 缺少 Independent Reviewer。

## Findings

1. Canonical revision -18 Queue 要求初始 `DISPATCH_ONLY` Coordinator 只创建一个 Executor，并明确禁止创建 Reviewer。`t_3bfbe611` 按该合同完成，不属于遗漏。
2. Coordinator card body 中“Dispatch Executor + Reviewer”与 Queue 冲突；Hermes 后续分析错误地把该非 canonical 文案当成合同。
3. Operating model 要求 REPORT_READY 后由 `revid-pm` 创建 Reviewer，但 revision -18 未授权第二个 Coordinator stage，造成 lifecycle 断链。
4. Executor `t_b3cfb6ce` 产生的 `ai/handoffs/HANDOFF-T4-002-UNIT-C1-REV18.md` 发生在 Independent Review 前，且超出 Executor Allowed Files；该文件仅作历史证据，不是 canonical HANDOFF。

## Authorized correction

发布同一 business revision 的 `REVIEW_DISPATCH_ONLY` continuation stage。该 stage 由 Hermes Supervisor 创建一个新的短生命周期 `revid-pm` Coordinator；Coordinator 只创建：

- 一个 `revid-reviewer` Reviewer card；
- 一个依赖 Reviewer 的 `revid-pm` `HANDOFF_ONLY` card。

只有 Reviewer PASS 后，`HANDOFF_ONLY` 才能写入 `ai/handoffs/HANDOFF-T4-002-UNIT-C1-REV18-POST-REVIEW.md`。不允许 PMC 或 Supervisor 直接创建 Reviewer/HANDOFF business card，不复用或解锁旧 card。

## Acceptance gate

Independent Reviewer 必须复跑 Task 中两项真实 MySQL tests、核对 REPORT 与实际 diff/cleanup/secret 边界，并写 `ai/reviews/REVIEW-T4-002-UNIT-C1-REV18.md`。在 post-review HANDOFF 出现前，PMC 不执行最终验收。
