# T4-002 Rev20 Supervisor → Worker Policy Handoff Fix Plan

## Goal

修复 Hermes Scheduled Supervisor 创建 Coordinator card 时遗漏 standalone action marker，且 runtime 在 marker 缺失或未知时退化为 unrestricted tools 的缺陷。

## Scope

- 固化 Scheduled Supervisor Coordinator body contract。
- 对配置了 `worker_tool_policies` 的 profile 实施 spawn 前 fail-closed。
- 增加 missing/unknown/reference-only regression tests。
- 运行 targeted tests、fresh isolated smoke，并记录真实 card/run/log evidence。
- 验证通过后发布全新的 T4-002 Unit C2 continuation revision；不复用 rev20 chain。

## Non-goals

- 不修改 Revid 业务代码、migration 或 business tests。
- 不复用、重试或解除 `t_1617a921`。
- 不提高 Coordinator runtime budget。

## Success Criteria

1. Supervisor 生成的 body 直接包含 `Action: DISPATCH_ONLY`、revision、Task path、Executor profile、Stop After、idempotency key。
2. 已配置 policies 时，缺失 marker 返回 `MISSING_WORKER_ACTION_MARKER`，未知 marker 返回 `UNKNOWN_WORKER_ACTION_MARKER`，且 worker subprocess 不启动。
3. reference-only body regression fail-closed；合法 action 仍获得 exact allowlist。
4. Targeted tests 全通过。
5. Fresh smoke 使用与 Scheduled Supervisor 相同 body contract，只创建一个 inert child，Coordinator 在 120 秒内 terminal。
6. 新 Queue revision 继承 rev20 与历史 failure fingerprints，并使用新 idempotency key。

## Risks

- Hermes 安装仓库已有未提交 runtime 修复；补丁必须保留现有差异。
- fail-closed 只作用于明确配置 `worker_tool_policies` 的 profile，避免影响普通 Executor/Reviewer。
- smoke 必须使用 isolated board/workspace，不触碰业务数据库或 secret。
