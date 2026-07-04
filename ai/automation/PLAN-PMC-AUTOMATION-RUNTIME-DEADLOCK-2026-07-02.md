# PMC Plan — Automation Runtime Deadlock Closure

## Objective

修复 Codex PMC 与 Hermes Scheduled Supervisor 在 runtime advisory 阶段形成的静默死锁：PMC 已写 advisory 后持续 `IDLE`，Hermes 未 ACK、未输出 diagnostic，却持续 `[SILENT]`。

## Confirmed Cause

- PMC prompt 只禁止重复 advisory，没有把“advisory 未被 runtime owner ACK”定义为持续待处理状态。
- Hermes prompt 允许 diagnostics-only 模式在“没有新的 runtime 证据”时直接 `[SILENT]`，没有强制首次 ACK、diagnostic deadline 或 stalled-owner transition。
- `HERMES-EXECUTION-STATUS.md` 可同时出现 terminal runtime block、`Failure Fingerprint = NONE`、旧 Queue authorization 和 `PMC Action Required = NO`，但双方没有 fail-closed consistency gate。

## Scope

- 修订 `ai/prompts/revid-codex-pmc-advisor.md`。
- 修订 `ai/prompts/hermes-scheduled-supervisor.md`。
- 修订 `ai/automation/REVID-MULTI-AGENT-OPERATING-MODEL.md`。
- 同步实际 Codex automation 与 Hermes cron prompt。
- 更新 `pitfalls.md`、本计划对应 PROGRESS 和 automation memory。

## Non-goals

- 不修改业务代码、frontend、backend、migration、tests 或数据库。
- 不创建、claim、promote、unblock、retry 或复用任何 Hermes card。
- 不修改 profile、Gateway、Kanban state 或 secret。
- 不把普通 runtime incident 自动升级为需要 Human Owner 作产品决策。

## Protocol Change

1. Runtime advisory 新增可比较的 handoff cursor：revision、fingerprint、path/hash、owner ACK、diagnostic path/hash、deadline。
2. Hermes 首次看到未 ACK advisory 时必须写 ACK/准确 fingerprint/reconciliation 状态；即使暂时没有修复证据，也必须在同轮或下一 scheduled checkpoint 输出一次 `STILL_INFRA_BLOCKED` diagnostic。
3. `PMC Reconciliation Required = YES`、advisory 未 ACK、diagnostic overdue 或 execution status 与 terminal verdict 不一致时，PMC 不得返回 `IDLE`。
4. Hermes 不得在 advisory 未 ACK 或 diagnostic overdue 时返回 `[SILENT]`。
5. 同一 fingerprint 已 ACK 且 diagnostic 已提交后，双方恢复 cursor-based 静默，避免新一轮通知循环。
6. 连续两个 Hermes checkpoints 仍未 ACK/提交 diagnostic 时，PMC 记录一次 `RUNTIME_OWNER_STALLED` 事件；相同 stalled fingerprint 只记录一次。

## Success Criteria

- 两侧 prompt 与 operating model 使用同一字段、deadline 和 terminal semantics。
- 实际 Codex automation prompt 包含 advisory ACK/overdue gate。
- 实际 Hermes cron prompt 包含 mandatory ACK/diagnostic gate。
- 不改变 schedule、workdir、model、delivery 或角色权限。
- `git diff --check` 通过；关键 marker 可由只读检查命中。

