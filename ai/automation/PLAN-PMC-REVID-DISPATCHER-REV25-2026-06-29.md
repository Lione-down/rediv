# Revid Dispatcher Role and T4-002 Revision 25 Plan

## Goal

把初始 Executor child 的创建与 contract 校验从 `revid-pm` 分离到专用 `revid-dispatcher`，并发布 T4-002 Unit C2 revision `-25`，避免完整 PM 上下文继续消耗 dispatch budget。

## Scope

1. 新增 `revid-dispatcher` 项目 SOUL 模板并部署实际 Hermes profile。
2. 让 Coordinator launcher 支持显式 assignee，默认保持 `revid-pm` 兼容性。
3. 更新 Supervisor、operating model、部署映射与项目事实源。
4. 发布继承 rev24 业务 contract 和全部 fingerprints 的 rev25 Queue/Task。
5. 验证 profile、SOUL、launcher payload、runtime tool policy 和项目文档一致性。

## Non-goals

- 不修改 T4-002 业务代码或测试。
- 不重试、恢复、删除或复用 revisions `-20` 至 `-24` 的 terminal cards。
- 不让 `revid-dispatcher` 创建 Reviewer、REWORK 或 HANDOFF。
- 不自动恢复 paused cron，不直接启动 rev25 execution chain。

## Design

- `revid-dispatcher` 只执行 `DISPATCH_ONLY`：读取一个指定 Task，创建一个指定 Executor child，read-back 校验后完成。
- `revid-pm` 保留 `REVIEW_DISPATCH_ONLY`、`HANDOFF_ONLY` 和一次 bounded REWORK 的生命周期职责。
- Supervisor 为初始执行创建 `revid-dispatcher` Coordinator；后续 lifecycle continuation 仍创建 `revid-pm` stage card。
- rev25 Dispatcher budget 为 `120s`，Executor budget 为 `1800s`；若仍 pre-dispatch timeout，停止并转 `INFRASTRUCTURE_BLOCKED`，不通过加时掩盖失败。

## Risks

- Hermes profile clone 可能继承超出职责的配置；部署后必须收窄 `platform_toolsets.cli` 和 `kanban.worker_action_policies.DISPATCH_ONLY.allowed_tools`。
- runtime 依据 card body standalone `Action` 选择 policy；launcher 与 tests 必须保证 marker 和 assignee 均正确持久化。
- 当前工作区有用户未提交修改；所有 patch 必须局限于上述治理/runtime 文件，不覆盖业务 diff。

## Acceptance Criteria

- `hermes profile show revid-dispatcher` 成功，实际 SOUL 与项目模板 UTF-8 内容一致。
- Dispatcher runtime policy 只允许 read-only file 与必要 Kanban lifecycle tools。
- launcher tests 覆盖默认 `revid-pm` 与显式 `revid-dispatcher` assignee。
- rev25 Task、Queue、CURRENT、ROADMAP、Supervisor 和 operating model 一致。
- `git diff --check`、targeted pytest 和 profile/config non-secret audit 通过。

## Rollback

在 rev25 未创建 card 前，可将 Queue 恢复为 rev24 terminal 状态并删除新建的 `revid-dispatcher` profile；不得改动历史 cards。profile 删除属于不可逆操作，执行前必须再次取得 Human Owner 确认。
