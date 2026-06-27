# T4-002 Coordinator Lifecycle Stages Plan

## Objective

补齐 thin-dispatcher 修复后暴露的 REPORT_READY → Independent Review → HANDOFF 生命周期断链，同时保持所有 Coordinator stage 短生命周期且由 runtime exact tool policy 约束。

## Root Cause

Revision `-18` Queue 正确要求初始 `DISPATCH_ONLY` 只创建一个 Executor 并立即完成；但 operating model 仍要求 `revid-pm` 在 REPORT_READY 后创建 Reviewer、Reviewer PASS 后创建 HANDOFF。当前没有第二、第三个 `revid-pm` stage card 的授权与 action contract，因此 Supervisor 无权直接创建 Reviewer，已完成的初始 Coordinator 也不会重新进入。

Coordinator card `t_3bfbe611` body 中“Executor + Reviewer”与 canonical Queue 冲突；实际 Coordinator 按 Queue 正确只创建 Executor。Executor `t_b3cfb6ce` 随后越权提前创建 `HANDOFF-T4-002-UNIT-C1-REV18.md`，该文件发生在 Independent Review 前，不能作为 canonical HANDOFF。

## Design

1. `DISPATCH_ONLY`：创建一个 Executor child并立即完成。
2. `REVIEW_DISPATCH_ONLY`：读取 REPORT 与 Executor card，创建一个 `revid-reviewer` Reviewer card；同时创建一个依赖 Reviewer 的 `revid-pm` `HANDOFF_ONLY` card，然后立即完成。
3. `HANDOFF_ONLY`：Reviewer 完成后启动；仅当 REVIEW verdict 为 PASS 时写 `HANDOFF-T4-002-UNIT-C1-REV18-POST-REVIEW.md` 并完成，否则 BLOCKED。

每个 stage 使用独立 idempotency key，不复用、claim、promote 或 unblock 旧 card。

## Runtime Scope

- `hermes_cli/kanban_db.py`：从 card body 的 standalone `Action:` 字段选择对应 profile policy。
- `revid-pm/config.yaml`：增加 `REVIEW_DISPATCH_ONLY` 和 `HANDOFF_ONLY` exact allowlist。
- `revid-pm/SOUL.md`：定义三个 stage contract。
- Regression tests：验证三种 action 选择、未知 action 不误套 policy、HANDOFF 保留 write_file 但无 terminal。

## Project Scope

- 创建 PMC lifecycle-gap review。
- 更新 revision `-18` Task，允许 canonical post-review HANDOFF addendum。
- 发布同一 business revision `-18` 的 review-dispatch Queue stage，不创建 business attempt 2。
- 更新 CURRENT、ROADMAP、parent Task。

## Non-goals

- 不直接创建 Reviewer/HANDOFF business card；由 Hermes Supervisor 消费 Queue 后创建 `revid-pm` stage coordinator。
- 不修改业务代码、migration、tests 或数据库。
- 不把 premature Executor HANDOFF 当作 final evidence，也不删除该文件。
- 不跳过 Independent Review 或让 PMC 直接验收。

## Success Criteria

1. Card body standalone `Action: REVIEW_DISPATCH_ONLY` 获得只读 + Kanban create/link/lifecycle tools，无 terminal/file-write/browser/cron/skills。
2. `Action: HANDOFF_ONLY` 获得 read_file/write_file + Kanban lifecycle tools，无 terminal/test/build tools。
3. `Action: DISPATCH_ONLY` 行为保持不变。
4. HANDOFF/unknown action 不误用 DISPATCH_ONLY policy。
5. Regression tests、compile、schema probes 和 `git diff --check` 通过。
6. Queue stage 明确 Reviewer 与 dependent Handoff coordinator 的 idempotency、parent 和 stop conditions。
