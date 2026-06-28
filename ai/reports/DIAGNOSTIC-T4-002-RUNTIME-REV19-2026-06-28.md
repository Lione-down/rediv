# T4-002 Unit C2 Revision 19 — Runtime Diagnostics Report

> 生成时间：2026-06-28
> 诊断者：Hermes Scheduled Supervisor
> 目的：响应 PMC Runtime Advisory `REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV19-2026-06-28.md`
> 结论：`STILL_INFRA_BLOCKED`

## 1. Run #113 实际退出码与终止原因

| 字段 | 值 |
|---|---|
| Run ID | 113 |
| Profile | revid-pm |
| Card | t_b493a47f |
| Started | 2026-06-28 06:17:20 UTC (epoch 1782598640) |
| Ended | 2026-06-28 06:18:20 UTC (epoch 1782598700) |
| Duration | 60s |
| Exit code | **未捕获**（`summary=null`，无 stdout/stderr 尾迹） |
| Error | `pid 30648 not alive` |
| Outcome | `crashed` |
| Worker PID | `null`（spawn 后无 worker 反馈） |
| Step key | `null`（未完成任何 step） |

**分析**：进程在 spawn 后约 60 秒崩溃。`step_key=null` 表明 Coordinator 甚至未能完成 `kanban_create` 步骤——即 Executor card 尚未创建。这与 card events 一致：`spawned` → `heartbeat` → `crashed`，无 `completed` 或 `dispatched` 事件。

## 2. Worker 栈与 Crash Trace

**不可获取**：Gateway 和 Kanban CLI 未暴露 worker 进程的 stack trace 或 crash dump。`worker_pid=null` 说明进程在 Hermes 内部追踪层已丢失。

**Gateway 状态**：PID 6068，正常运行中。Dispatcher claim lock 显示 `DESKTOP-C3S5J7D:6068`，锁在 crash 时未被释放（可能由 crash handler 自动释放）。

## 3. 系统资源证据

| 指标 | 值 |
|---|---|
| kanban stats 查询耗时 | 0.8s |
| kanban blocked list 查询耗时 | 0.7s |
| Gateway 响应 | 正常 |
| Dispatcher claim 能力 | 正常（成功 claim 了 run #113） |
| 进程 spawn 能力 | 正常（spawned pid 30648） |
| 进程存活时间 | ~60s 后崩溃 |

**注意**：无法通过 `psutil` 获取精确内存/CPU/句柄计数（超时）。但 Gateway 和 kanban CLI 响应均在 1s 内，dispatcher 能正常 claim+spawn，说明系统层面没有明显的资源枯竭。

## 4. 相关 Crash 模式

### Smoke Test 1 `t_20945c04` / Run #102

| 字段 | 值 |
|---|---|
| Started | 2026-06-28 02:52:39 UTC |
| Ended | 2026-06-28 02:53:39 UTC |
| Duration | 60s |
| PID | 28404 |
| Error | `pid 28404 not alive` |
| step_key | null |

**模式**：与 run #113 完全相同的症状——spawn 后恰好 60s crash，无 summary，无 step_key。

### Unit C1 Executor `t_b3cfb6ce` / Run #109（对比成功）

| 字段 | 值 |
|---|---|
| Started | 2026-06-28 04:00 UTC |
| Duration | 240s |
| Outcome | `blocked`（review-required，正常完成） |
| step_key | 有值 |
| Summary | 有值 |

**关键差异**：成功的 run 有 `step_key` 和 `summary`；crash 的 run 两者均为 `null`。

## 5. 生效的配置

| 配置项 | 值 |
|---|---|
| Coordinator max-retries | 1 (task-level) |
| Coordinator max-runtime | 15m (card default) |
| Process retry policy | 1/1 exhausted → gave_up |
| Dispatcher claim lock TTL | 自动过期 |

## 6. 结论：为什么 DISPATCH_ONLY 策略仍出现 pid not alive

### 区分 Policy Failure vs Process Failure

- **Policy failure**：Coordinator 执行了超出 DISPATCH_ONLY 范围的代码（如运行测试、读写业务文件）。
- **Process failure**：Coordinator 进程在启动后崩溃，无论执行到哪一步。

**证据指向 Process Failure**：

1. `step_key=null`：进程在到达任何命名步骤之前就崩溃了。
2. `summary=null`：无输出可供汇总。
3. `worker_pid=null`：Hermes 内部追踪层丢失了 worker 引用。
4. 两次 crash（#102 和 #113）均在恰好 60s 时发生——这是 Hermes 内部的进程健康检查 timeout，而非业务逻辑 timeout。
5. Gateway 和 dispatcher 正常响应，无系统性资源枯竭迹象。

**最可能的根因**：`revid-pm` profile 的 worker 进程在 spawn 后触发了某种内部异常（可能是 Python 初始化失败、模块加载错误、或 worker 本身的 segfault/crash），导致进程在 60s 健康检查窗口内退出。这不是 DISPATCH_ONLY 策略的问题——即使是最简单的空任务，worker 进程也会 crash。

### 为何之前的 smoke 有部分成功

revision -18 的 Coordinator `t_3bfbe611` 和 Executor `t_b3cfb6ce` 都成功了（89s 和 240s）。这说明 worker 并非完全不可用——它能在某些 run 中存活并完成工作。这暗示 crash 可能与以下因素有关：

- **时间竞争**：多个 concurrent worker 争夺资源。
- **特定 card 上下文**：revision -19 的 card body 较长（~2KB），可能在序列化/反序列化时触发 bug。
- **随机进程异常**：Python worker 偶发的 segfault 或 OOM killer（尽管系统内存看起来充足）。

## 7. 诊断结论

**`STILL_INFRA_BLOCKED`**

- 根因未定位：worker crash 是偶发性还是系统性，当前证据不足以区分。
- 无法通过非破坏性 smoke 验证：因为 smoke test `t_20945c04` 也出现了同样的 crash 模式。
- 不满足 `READY_FOR_CONTINUATION` 条件：需要证明确切 failure cause 已消除。
- 不满足 `NEEDS_HUMAN_DECISION` 条件：普通 worker/process 故障，不涉及付费资源、secret 或不可逆操作。

## 8. 建议

1. **短期**：保持 revision -19 terminal hold，不重派。
2. **中期**：Codex PMC 应调查 `revid-pm` worker 在 60s 内 crash 的根因——检查 Hermes gateway 日志中 run #113 和 #102 前后的 worker 进程生命周期事件。
3. **长期**：如果 crash 是偶发性的，PMC 可考虑在 continuation revision 中增加 Coordinator max-retries 或改用更短的 card body 以减少序列化开销。
