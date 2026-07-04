# Rev33 Dispatcher Contract and Reconciliation Fix

## Plan

### Goal

修复 rev33 暴露的两个 Hermes runtime contract 缺口：Dispatcher parent 必须携带完整、可 read-back 的 Executor child contract；deterministic reconciler 必须正确处理 runtime advisory 从 diagnostic start 到 terminal stop 的两阶段确认。

### Scope

- `ai/runtime/create-hermes-coordinator.py`
- `backend/tests/test_create_hermes_coordinator.py`
- `ai/runtime/reconcile-hermes-execution-status.py`
- `ai/runtime/tests/test_reconcile_hermes_execution_status.py`

### Non-goals

- 不修改业务代码、frontend、backend contract 或数据库。
- 不重派 rev33，不创建、claim、promote、unblock、reparent 或修改任何 Kanban card。
- 不发布 rev34，不把 runtime remediation 当作业务验收。

### Implementation

1. 为 `DISPATCH_ONLY` launcher 增加必填 Executor child idempotency、runtime 和 Stop After 参数，并写入/校验 Dispatcher body。
2. 增加 regression tests，证明缺少 child contract 时 fail-closed，完整 contract 在 dry-run 与 persisted body 中保持精确。
3. 将 reconciler 建模为 diagnostic-start 与 terminal-stop 两个受控阶段；start 阶段只规范化 ACK/diagnostic 字段，不谎报 reconciliation complete；stop 阶段完成 canonical terminal closure。
4. 增加 rev33-style fixtures，覆盖 `ACK_TERMINAL_VERDICT_AND_START_RUNTIME_DIAGNOSTIC`、真实 diagnostic hash、幂等 apply 和非法 confirmation fail-closed。
5. 运行 targeted tests、runtime deploy/verifier tests、role-contract verifier 与 `git diff --check`。

### Acceptance Criteria

- 新增 regression 在旧逻辑下可复现缺口，修复后通过。
- Dispatcher body 唯一包含 `Executor Idempotency Key`、`Executor Max Runtime`、`Executor Stop After`，且缺失/非法值拒绝创建。
- Reconciler 对 rev33 diagnostic-start 状态不再 exit `2`，同时不提前写 `ACK_TERMINAL_VERDICT_AND_STOP — COMPLETE`。
- STOP 阶段仍保持现有 terminal closure 与幂等性。
- 不产生 Kanban 或业务文件变更。

## Progress

- [x] 读取事实源、rev33 card/status/diagnostic 与 automation memory。
- [x] 复现 reconciler exit `2`：`pending Queue expected action is not terminal stop confirmation`。
- [x] 源码确认 Dispatcher body 缺少 Executor child contract fields。
- [x] 建立 baseline：launcher + reconciler tests `22 passed`。
- [x] 添加 regression tests并确认 RED：2 tests failed，分别复现缺失 child contract 与 reconciler exit 2。
- [x] 实施两个核心最小修复；targeted launcher/reconciler tests `24 passed`。
- [x] 真实只读检查：rev33 reconciler 从 exit 2 变为 `STATUS_MISMATCH` exit 1；dry-run 输出精确 child contract 且未创建 card。
- [x] 用户批准扩大 runtime-only 文件范围；Supervisor prompt、第二套 runtime launcher tests、deploy verifier 与 role verifier 已同步。
- [x] Final combined launcher/runtime tests：`40 passed`。
- [x] 完整 `ai/runtime/tests`：`19 passed`。
- [x] Launcher deploy verifier：四项检查通过，backend regression `21 passed`，最终 exit `0`。
- [x] Role-contract verifier：`ROLE_CONTRACTS_OK`。
- [x] Scheduled Supervisor 最近一轮状态 `ok`；board 为 `0 ready / 0 running / 0 review`；real reconciler 为 `STATUS_OK`。
- [x] `git diff --check` 通过，仅有既有 CRLF warning。
- [x] 进度与计划一致；runtime 修复完成。Rev33 仍是 terminal evidence，不自动发布 rev34。
