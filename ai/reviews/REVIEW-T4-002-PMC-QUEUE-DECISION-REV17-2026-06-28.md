# T4-002 PMC Queue Decision — Revision -17

## Verdict

`PMC_BLOCKED — EXECUTION_ROUTE_REASSESSMENT_REQUIRED`

PMC 选择方案 3：先重评 T4-002 的 Hermes execution route。当前不发布 revision `-18`，不重复派发 revision `-17`，也不把 Coordinator budget 单独提高后再次尝试。

## Decision Basis

- Revision `-17` 已是只运行两个既有 integration tests、且不允许修改业务文件的 bounded work unit。
- Coordinator `t_3e1f6a06` 在 Executor 创建前于 120s timeout，因此没有证据表明失败由测试数量、MySQL 操作或业务实现复杂度造成。
- Revision `-16` 的 Coordinator 已在同一 pre-dispatch 阶段于 300s timeout。仅把 budget 提高到 300s 会重复已有失败条件，不能视为修复。
- Revision `-17` 没有 PLAN、PROGRESS、REPORT、Independent REVIEW 或 HANDOFF，不能创建 business REWORK。

## Option Disposition

| Option | Decision | Reason |
|---|---|---|
| 1. 继续拆分 revision -17 | `NOT AUTHORIZED NOW` | 失败发生在 Executor dispatch 前；没有证据证明业务 scope 是 root cause |
| 2. Coordinator budget 提高到至少 300s | `NOT AUTHORIZED ALONE` | Revision -16 已在 300s pre-dispatch timeout；必须先证明新的 runtime mechanism 有效 |
| 3. 重新评估 T4-002 技术路线 | `SELECTED — EXECUTION ROUTE ONLY` | T4-002 的业务目标、ADR-003 和已通过的 Unit A/B 保持有效；只重评 Hermes dispatch/runtime 路径 |

## Hermes Runtime Owner Action

Hermes runtime owner 应停止请求新的 business Queue revision，并针对 revision `-16`/`-17` 的共同 pre-dispatch failure point 提交 fresh diagnostic。至少包含：

1. `t_3e1f6a06` run `#101` 与 `t_aeaefef4` run `#100` 的 exit code、非敏感 stdout/stderr 尾部和 timeout source；
2. timeout 时 Coordinator 的最后完成步骤：Queue parse、Task read、idempotency lookup、profile resolution 或 Executor creation；
3. Gateway、dispatcher、`revid-pm` profile runtime、capacity/resource limit 与实际 budget 配置；
4. 没有 hidden/parallel Executor、Reviewer 或 HANDOFF chain 的证明；
5. 一个不读取 secret、不访问数据库、不修改业务文件的 same-profile sustained-run/smoke，证明 proposed dispatch path 可持续超过旧 failure point；
6. 结论 `READY_FOR_CONTINUATION`、`STILL_INFRA_BLOCKED` 或符合最高级别升级条件的 `NEEDS_HUMAN_DECISION`，并附 evidence path。

建议输出路径：`ai/reports/DIAGNOSTIC-T4-002-RUNTIME-OWNER-REV17-2026-06-28.md`。该 diagnostic 属于 runtime owner evidence，不得创建或推进 T4-002 business card。

## Conditional Continuation Design

只有收到 `READY_FOR_CONTINUATION` 与 fresh runtime health proof 后，PMC 才考虑新的 revision：

- Unit C1a：只验证 `test_ac8_structured_url_and_identity`；
- Unit C1b：只验证 `test_ac9_alembic_creates_schema`；
- Coordinator budget 必须由 diagnostic 证明，而不是默认取 300s；
- 所有历史 failure fingerprints 必须继承；
- ADR-003 的 secret、database identity 与 destructive-operation hard gates 保持不变。

以上是后续设计边界，不是当前 executable authorization。

## State and Ownership

- Queue：`NONE — INFRASTRUCTURE_BLOCKED`。
- Human Decision Required：`NO`。
- PMC 不修改 `HERMES-EXECUTION-STATUS.md`、Hermes Kanban、业务代码、tests、migration、Executor artifacts、Independent REVIEW 或 HANDOFF。
- Hermes Supervisor 应在下一次合法状态更新中 ACK 本 Queue decision，并将 PMC action 从重复请求 split/budget 改为 runtime diagnostic collection。
