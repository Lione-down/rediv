# Scheduled Event Report: Rev35 Deterministic Gate Failure — Exit 2

**时间**: 2026-07-04
**事件类型**: 基础设施阻塞 — 确定性门控失败
**Queue Action**: NONE — terminal evidence only

## 事件概述

Hermes Scheduled Supervisor 在当前轮执行确定性门控（deterministic gate）时，`reconcile-hermes-execution-status.py --check` 持续返回 exit 2（`STATUS_RECONCILIATION_ERROR`），原因是 rev35 运行时诊断尚未产出。门控规则要求 exit 2 时 fail closed、禁止修改 status、禁止操作 Kanban、记录准确错误并交 PMC。

## 门控证据

| 检查项 | 结果 |
|---|---|
| `--check` 第一次 | exit 2: `STATUS_RECONCILIATION_ERROR: terminal reconciliation requires DIAGNOSTIC_READY` |
| `--apply` 一次 | exit 2: `STATUS_RECONCILIATION_ERROR: terminal reconciliation requires DIAGNOSTIC_READY` |
| `--check` 第二次 | exit 2: `STATUS_RECONCILIATION_ERROR: terminal reconciliation requires DIAGNOSTIC_READY` |
| Gateway 状态 | UP (PID 12912) |
| 运行时合约 | `HERMES_RUNTIME_PATCH_ALREADY_APPLIED` + `ROLE_CONTRACTS_OK` |
| Kanban ready/running/review | 0 / 0 / 0 |
| Kanban blocked | 9 张（全部为历史 terminal evidence） |

## Rev35 运行时诊断状态

| 字段 | 值 |
|---|---|
| Runtime Owner State | `ACKNOWLEDGED` |
| Runtime Diagnostic Due | `2026-07-04T22:45:00+08:00` |
| Runtime Diagnostic Due Status | `PENDING` |
| Runtime Diagnostic Path | `NONE` |
| Runtime Diagnostic SHA256 | `NONE` |
| Runtime Diagnostic Verdict | `NONE` |
| PMC Verdict Confirmation | `ACK_TERMINAL_VERDICT_AND_START_RUNTIME_DIAGNOSTIC` |
| 诊断文件 | 不存在 |

## 门控失败原因分析

`reconcile-hermes-execution-status.py` 的 `validate_diagnostic()` 函数（第 196 行）要求 `Runtime Owner State == DIAGNOSTIC_READY` 才能继续进行终端调和。当前 rev35 的 Runtime Owner State 为 `ACKNOWLEDGED`，表示 advisory ACK 已完成但诊断尚未产出。这是预期行为 — 调和器只有在诊断产出后、状态转为 `DIAGNOSTIC_READY` 时才能确认对齐。

## Executor 证据

| 卡片 ID | `t_7200189b` |
|---|---|
| 运行 # | #156 |
| 运行时长 | 594 秒 |
| 结果 | `blocked (WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION)` |
| 原因 | worker 返回时未调用 `kanban_complete` 或 `kanban_block` |
| 进程 PID | 23044 |

## 结论

确定性门控因运行时诊断未产出而持续 exit 2。此状态符合 `ACK_TERMINAL_VERDICT_AND_START_RUNTIME_DIAGNOSTIC` 的预期流程 — 诊断尚未完成，调和器无法确认对齐。门控规则禁止修改 status 或操作 Kanban，因此本轮无法推进。

**需要 Codex PMC 决策**:
1. 确认诊断 SLA 是否已过期（due: `2026-07-04T22:45:00+08:00`）
2. 若已过期，将 Runtime Owner State 转为 `STALLED` 并输出基础设施阻塞事件
3. 若未过期，等待下一轮 scheduled checkpoint 产出诊断
4. 诊断产出后，重新运行确定性门控验证对齐

**不需要 Human Owner 决策**: 此事件为纯基础设施/运行时问题，不涉及产品方向、付费资源、密钥或不可逆操作。
