# SCHEDULED EVENT REPORT — Rev41r1 Reconciler Exit 2 + Overdue Diagnostic

> 时间：2026-07-05T10:52+08:00（UTC 2026-07-05T02:52Z）
> 事件类型：基础设施阻塞 — 确定性门控失败 + Runtime Diagnostic 逾期
> 状态：交 Codex PMC 处理

## 事件概述

本轮 scheduled checkpoint 执行确定性门控（`reconcile-hermes-execution-status.py --check`）时，脚本返回 exit 2（`STATUS_RECONCILIATION_ERROR`），错误信息为 "reconciler only accepts terminal non-executable Queue action"。根据门控规则，exit 2 时禁止修改 status 文件、禁止操作 Kanban，须记录准确错误并交 PMC。

## 门控证据

- **命令**：`python ai/runtime/reconcile-hermes-execution-status.py --check`
- **退出码**：2（`STATUS_RECONCILIATION_ERROR`）
- **错误信息**：`reconciler only accepts terminal non-executable Queue action`
- **根因**：Queue Active Wave 的 `Action` 字段值为 `NONE — terminal runtime evidence only`，与 reconciler 常量 `TERMINAL_ACTION = "NONE — terminal evidence only"` 不一致；同时执行状态文件中 Active Queue 的 `Action` 字段为 `DISPATCH_ONLY`，与 Queue 实际值严重不符。

## Queue 与执行状态不一致详情

| 对比项 | Queue 实际值 | 执行状态文件值 | 差异 |
|---|---|---|---|
| Action | `NONE — terminal runtime evidence only` | `DISPATCH_ONLY` | 严重不一致 |
| Status | `PMC_BLOCKED — NOT EXECUTABLE / AWAITING RUNTIME DIAGNOSTIC` | （Active Queue 部分无 Status 字段） | 缺失 |
| Revision | `phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-05-41r1` | `phase4-wave3-workspace-shell-unit-b-responsive-remediation-2026-07-05-41` | 不一致 |

## Runtime Diagnostic 逾期

- **Queue Runtime Diagnostic SLA**：`2026-07-05T10:02:59+08:00`
- **当前时间**：~`2026-07-05T10:52+08:00`
- **逾期时长**：约 49 分钟
- **Runtime Advisory SHA256**：`ACF0A40E57B33508F1E3873A32D8244C8462962E9E1BC30948C503A50D52F161`
- **Advisory 路径**：`ai/reviews/REVIEW-T4-010-PMC-RUNTIME-ADVISORY-REV41R1-2026-07-05.md`
- **执行状态文件**：无 Rev41r1 Runtime Advisory 段

## Kanban 证据

- **Coordinator 卡 t_08bb42c8**：status=blocked，assignee=revid-pm
  - run #168：timed out @ 181s > 180s limit
  - run #169：blocked by `ROLE_BOUNDARY_VIOLATION: tool 'search_files' is not allowed for Kanban task t_08bb42c8`
- **Gateway**：UP，PID 12784
- **Kanban 统计**：0 ready / 0 running / 0 review / 13 blocked / 38 done
- **Runtime contracts**：`HERMES_RUNTIME_PATCH_ALREADY_APPLIED` + `ROLE_CONTRACTS_OK`

## 门控规则约束

根据 `hermes-scheduled-supervisor.md` Step 0 确定性门控规则：

> exit `2 / STATUS_RECONCILIATION_ERROR`：不得修改 status、不得操作 Kanban，记录准确错误并交 PMC。

因此本轮：
1. **禁止**修改 `HERMES-EXECUTION-STATUS.md`
2. **禁止**操作 Kanban（不创建/不修改/不 claim 任何 card）
3. **禁止**创建临时 verifier 替代 reconciler
4. **必须**记录准确错误并交 PMC

## 需要 PMC 决策的事项

1. **Queue Action 字段修复**：Active Wave 的 `Action` 应为 `NONE — terminal evidence only` 还是 reconciler 应支持 `NONE — terminal runtime evidence only`？
2. **执行状态文件修复**：Active Queue 部分的 `Action`、`Revision`、`Task ID` 等字段需要与 Queue 对齐。
3. **Runtime Diagnostic 逾期处理**：诊断 SLA 已过期 49 分钟，需决定是刷新 due、转 STALLED、还是由 PMC 直接发布 fresh continuation。
4. **revid-pm tool policy 修正**：`search_files` 不在当前 `REVIEW_DISPATCH_ONLY` 策略白名单中，需决定是否扩大 revid-pm 的工具权限或采用替代方案。

## 结论

当前状态为基础设施阻塞，需 Codex PMC 介入修复 Queue/Status 结构不一致问题后方可继续。本轮不创建任何 card、不修改任何状态文件。
