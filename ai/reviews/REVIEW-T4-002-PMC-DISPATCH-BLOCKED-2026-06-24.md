# T4-002 PMC Review — Dispatch Chain Blocked

## Review Context

- Task：T4-002 — SQLite → MySQL 数据迁移工具
- Queue revision：`phase4-wave2-manual-rework-2026-06-24-03`
- Coordinator card：`t_d626b42d`
- Executor card：`t_4a89bb5e`
- Review time：2026-06-24 12:50 +08:00

## Verified Evidence

- `t_d626b42d` 的两次 run 均因 worker process 不存活而 crash，Kanban diagnostic 为 `Agent crash x2: pid 15692 not alive`，当前 status 为 `blocked`。
- Coordinator 已创建子卡 `t_4a89bb5e`，但该卡当前 status 为 `todo`，`hermes kanban runs t_4a89bb5e` 返回 `no runs yet`。
- `ai/tasks/doing/` 为空；本 revision 尚无新的 PLAN、PROGRESS、REPORT、Independent REVIEW 或 HANDOFF。
- 当前 automation runtime 中 `REVID_TEST_MYSQL_ADMIN_URL` presence check 为 `MISSING`。该结果不能覆盖 Human User 的 readiness 确认，也不能证明 Executor runtime 状态；由于 Executor 未启动，本轮未执行任何 database 或 destructive verification。
- 当前源码仍保留旧 failure fingerprint；旧 REPORT、REVIEW 和 HANDOFF 仍不得作为本 revision 的完成证据。

## Impact

Blocked parent 使当前 Executor card 尚未进入可验证的执行 attempt。继续保留 APPROVED Active Queue 会把“已授权”误表述为“仍可派发”，并可能诱发重复 Coordinator 或重复 idempotency chain。

本次 failure 属于 Hermes dispatch infrastructure failure，不是 T4-002 业务代码或 Acceptance Criteria failure。由于 Executor 没有 run，不能判定相同 failure fingerprint 再次出现，也不能进入 Reviewer 或 PMC acceptance。

## PMC Verdict

**BLOCKED — COORDINATOR CRASHED; EXECUTOR NOT STARTED**

## Responsibility And Unblock Conditions

- 责任角色：Hermes runtime owner / `revid-pm`。
- 先恢复 Coordinator/dispatcher worker health，并提供不会再次出现 `pid not alive` 的新鲜 diagnostics 或成功 run 证据。
- 不得手工 claim、promote、unblock 或复用 `t_d626b42d`、`t_4a89bb5e`。
- 恢复后由 Codex PMC 发布新的 APPROVED Queue revision 和新的 revision-based idempotency key；当前 blocked revision 不授权执行。
- 原 Human-approved manual REWORK 的产品方向与 destructive boundary 保持有效。由于本轮 Executor 没有 run，恢复后的基础设施重派发不视为业务代码自动 REWORK；若 Executor 后续再次出现相同代码 failure fingerprint，则立即 BLOCKED。

## Recommendation

`BLOCKED`
