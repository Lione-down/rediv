# PMC Progress — Automation Runtime Deadlock Closure

## Status

`COMPLETE`

## Completed

- 已复核实际 Codex automation、项目 PMC prompt、Hermes Supervisor prompt、Queue、execution status 与 revision 31 runtime advisory。
- 已确认 Hermes cron `72a21342a164` 为 active，最近一次运行成功；问题不是 scheduler paused，而是 prompt 允许未消费 advisory 时静默。
- 已确认当前状态冲突：revision 31 已 terminal，但 execution status 仍保留 `Failure Fingerprint = NONE`、旧 APPROVED Queue wording 和 `PMC Action Required = NO`。
- 已记录本修复计划、边界与成功标准。
- 已为 PMC/Hermes 双边 prompt 与 operating model 增加 advisory ACK、实际 SHA256、60 分钟 deadline、diagnostic verdict、stalled-owner 和 reconciliation cursor。
- 已同步实际 Codex automation；实际 Hermes cron 改为读取项目 canonical prompt 的 bootstrap，原 schedule/workdir 保持不变。
- 实际 Hermes checkpoint 已把 revision 31 从静默等待推进到 `DIAGNOSTIC_READY / STILL_INFRA_BLOCKED`，生成 `ai/reports/DIAGNOSTIC-T4-010-REV31-RUNTIME-READINESS-2026-07-02.md`。
- Hermes-owned execution status 已确认 terminal verdict、stable fingerprint、真实 advisory/diagnostic SHA256、带时区 deadline 和 diagnostic path/verdict；malformed Markdown 已由 Hermes 自行修复。
- PMC 已审查 diagnostic：接受阻塞证据，驳回给 thin dispatcher 增加通用 `terminal` 的方向，要求继续使用 `kanban_create` atomic path。
- 相关 runtime contract tests：`12 passed`；全仓 `git diff --check` passed。

## Remaining Project Blocker

- Automation deadlock 已闭环。T4-010 业务执行仍为 `INFRASTRUCTURE_BLOCKED`；下一步是 Hermes runtime owner 提交 least-privilege dispatcher remediation、tests 和 fresh same-profile smoke。该 blocker 不再通过重复 `IDLE` 隐藏。
