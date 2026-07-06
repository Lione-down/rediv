# Diagnostic — T4-010 Revision 41r1 Runtime Health Evidence

> 时间：2026-07-05T11:20+08:00（UTC 2026-07-05T03:20Z）
> Revision：`phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-05-41r1`
> Fingerprint：`REV41R1_REVID_PM_SEARCH_FILES_TOOL_BOUNDARY_VIOLATION`
> 诊断结论：`STILL_INFRA_BLOCKED`

## 1. 事件概述

Revision 41r1 生命周期 Coordinator `t_08bb42c8`（`revid-pm / REVIEW_DISPATCH_ONLY`）在 Gateway dispatcher 自动认领后经历两次运行失败：

- Run #168：181 秒超时（budget 180s）
- Run #169：`ROLE_BOUNDARY_VIOLATION` — `search_files` 工具不被允许

此事件为 runtime/tool-policy incident，非业务 REWORK。

## 2. Run #168/#169 详细证据

### Run #168（timed_out）

| 字段 | 值 |
|---|---|
| Run ID | 168 |
| Profile | revid-pm |
| 状态 | timed_out |
| Outcome | timed_out |
| 开始时间 | 2026-07-05 06:18:59 UTC |
| 结束时间 | 2026-07-05 06:22:01 UTC |
| 耗时 | 181 秒 |
| Budget | 180 秒 |
| Exit code | N/A（超时 kill） |
| 终止来源 | Gateway dispatcher timeout |
| PID | 696 |
| sigkill | false |
| 错误 | `elapsed 181s > limit 180s` |

**心跳记录**：run #168 在 06:18 spawn 后，06:19/06:20/06:21 三次 heartbeat，06:22 超时。表明 worker 启动成功且在运行时存活，但在 180s 预算内未完成 REVIEW_DISPATCH_ONLY 工作流。

### Run #169（blocked）

| 字段 | 值 |
|---|---|
| Run ID | 169 |
| Profile | revid-pm |
| 状态 | blocked |
| Outcome | blocked |
| 开始时间 | 2026-07-05 06:22:01 UTC |
| 结束时间 | 2026-07-05 06:22:41 UTC |
| 耗时 | 40 秒 |
| Exit code | N/A（blocked） |
| 终止来源 | ROLE_BOUNDARY_VIOLATION |
| PID | 18136 |
| 错误 | `ROLE_BOUNDARY_VIOLATION: tool 'search_files' is not allowed for Kanban task t_08bb42c8.` |
| Kind | capability |
| Recurrences | 1 |

**事件序列**：
```
[06:18] created {assignee: revid-pm, status: ready}
[06:18] [run 168] claimed {lock: DESKTOP-C3S5J7D:12784}
[06:18] [run 168] spawned {pid: 696}
[06:19] [run 168] heartbeat
[06:20] [run 168] heartbeat
[06:21] [run 168] heartbeat
[06:22] [run 168] timed_out {pid: 696, elapsed: 181s, limit: 180s}
[06:22] [run 169] claimed {lock: DESKTOP-C3S5J7D:12784}
[06:22] [run 169] spawned {pid: 18136}
[06:22] [run 169] heartbeat
[06:22] [run 169] blocked {reason: "ROLE_BOUNDARY_VIOLATION: tool 'search_files' is not allowed for Kanban task t_08bb42c8."}
```

## 3. 卡片体与策略分析

### 卡片 t_08bb42c8 体

```
Role: Lifecycle Coordinator
Action: REVIEW_DISPATCH_ONLY
Revision: phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-05-41r1
Task: T4-010-UNIT-B-REV41
Task Path: ai/tasks/todo/TASK-T4-010-UNIT-B-REV41.md
Review Profile: revid-reviewer
Executor Evidence Card: t_d8bc9535
Report Path: ai/reports/REPORT-T4-010-UNIT-B-REV41.md
Review Output: ai/reviews/REVIEW-T4-010-UNIT-B-REV41.md
Handoff Output: ai/handoffs/HANDOFF-T4-010-UNIT-B-REV41-POST-REVIEW.md
Reviewer Idempotency Key: revid:phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-05-41r1:T4-010:review:0
Handoff Idempotency Key: revid:phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-05-41r1:T4-010:handoff:0
Stop After: Create exactly one INDEPENDENT_REVIEW_ONLY card and one dependent HANDOFF_ONLY card, verify both, then complete this Coordinator.
Idempotency Key: revid:phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-05-41r1:T4-010:review-dispatch
```

### 策略冲突根因

`hermes-revid-pm-soul.md` 第 9 行明确允许 `search_files` 用于 bounded evidence discovery：

> `search_files` 仅用于 bounded evidence discovery，不得扫描 secret、用户目录或项目外路径。

但 Kanban task `t_08bb42c8` 的 resolved tool policy 中不包含 `search_files`，导致 run #169 在尝试调用时被 `ROLE_BOUNDARY_VIOLATION` 阻止。

**根因**：canonical SOUL 允许 `search_files`，但实际部署的 Kanban task 策略未包含该工具——policy deployment gap。

## 4. Gateway 与基础设施状态

| 字段 | 值 |
|---|---|
| Gateway 状态 | UP |
| Gateway PID | 2308（已重启） |
| 旧 Gateway PID | 12784（run #168/#169 期间） |
| Kanban 统计 | 0 ready / 0 running / 0 review / 13 blocked / 38 done |
| 活跃 worker | 无 |
| Runtime contracts | `HERMES_RUNTIME_PATCH_ALREADY_APPLIED` + `ROLE_CONTRACTS_OK` |

## 5. Policy Remediation 状态

PMC 已部署 `search_files` 到 `revid-pm / REVIEW_DISPATCH_ONLY` 策略：

- 审核文件：`ai/reviews/REVIEW-T4-010-PMC-REV41R1-REVID-PM-POLICY-REMEDIATION-2026-07-05.md`
- SHA256：`E56F4D48AB60B5457D9F36C1C8DC84FB5890CF70191C34C11D5641D57DDE576C`
- 验证结果：
  - Targeted tests：17 passed
  - Full runtime suite：34 passed
  - Role verifier：`ROLE_CONTRACTS_OK`
  - Deployed resolver smoke：`REVID_PM_POLICY_SMOKE_OK`
- Gateway 干净重启 PID 2308

**关键限制**：政策修复已部署，但旧 card `t_08bb42c8` 及其 runs #168/#169 保持 terminal 不可复用。Resume Condition 要求 fresh diagnostic 证明完整的 `REVIEW_DISPATCH_ONLY` 策略可以安全创建 Reviewer/HANDOFF child。

## 6. 诊断结论

### 已完成的证据收集

1. ✅ Run #168/#169 exit codes、终止来源、stdout/stderr 尾部——来自 `hermes kanban --board revid runs t_08bb42c8 --json`
2. ✅ 卡片体、精确 action/profile、已解析的工具策略及拒绝 `search_files` 的策略来源——来自 `hermes kanban --board revid show t_08bb42c8` + `hermes-revid-pm-soul.md`
3. ✅ Gateway/dispatcher 日志围绕两次运行——来自 Kanban events 序列
4. ✅ `REVIEW_DISPATCH_ONLY` 最小工具验证——policy remediation review 确认 9 tools resolved，含恰好一个 `search_files`

### 缺失证据

5. ❌ 同 profile bounded smoke（fresh `revid-pm / REVIEW_DISPATCH_ONLY` worker 创建 Reviewer + HANDOFF child）——需要 PMC 授权新的 lifecycle continuation revision 后才能安全执行。Hermes 不应在未获授权的情况下创建新 card 或尝试 smoke。

### 结论：`STILL_INFRA_BLOCKED`

Policy remediation 已部署，但旧 chain `t_08bb42c8` 不可复用。需要 Codex PMC 发布 fresh lifecycle continuation revision（使用 fresh key/card），Hermes ACK 后由 `revid-pm` 在新 card 上执行 bounded smoke 验证 `search_files` 修复后的完整 Reviewer/HANDOFF child-creation 能力。

在 fresh continuation revision 发布前，无法完成 Resume Condition 要求的 `READY_FOR_CONTINUATION` 证明。

## 7. 证据路径

| 证据 | 路径 | SHA256 |
|---|---|---|
| Runtime Advisory | `ai/reviews/REVIEW-T4-010-PMC-RUNTIME-ADVISORY-REV41R1-2026-07-05.md` | `ACF0A40E57B33508F1E3873A32D8244C8462962E9E1BC30948C503A50D52F161` |
| Policy Remediation | `ai/reviews/REVIEW-T4-010-PMC-REV41R1-REVID-PM-POLICY-REMEDIATION-2026-07-05.md` | `E56F4D48AB60B5457D9F36C1C8DC84FB5890CF70191C34C11D5641D57DDE576C` |
| Queue (HERMES-AUTO-QUEUE.md) | `ai/automation/HERMES-AUTO-QUEUE.md` | `C49B8061DE41913A6B3BBEDBDF05FAF12E484AD79CD95601ACB13C47504870D0` |
| Execution Status | `ai/automation/HERMES-EXECUTION-STATUS.md` | `EAF994338C030ECCB0D920474E6AC6A984C94B17C793A5E6A62B93AD14746442` |
| Coordinator Card | `t_08bb42c8` (blocked, revid-pm, REVIEW_DISPATCH_ONLY) | — |
| Run #168 | timed_out @ 181s > 180s | — |
| Run #169 | blocked ROLE_BOUNDARY_VIOLATION | — |

## 8. 诊断 SHA256

本 diagnostic 文件的 SHA256：待写入文件后计算。
