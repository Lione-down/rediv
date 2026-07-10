# DIAGNOSTIC-T4-003-REV47R2-ACTION-INJECTION-2026-07-10

## 结论

`STILL_INFRA_BLOCKED`

## 诊断对象

- Queue revision: `phase4-wave2-t4-003-mysql-runtime-cutover-remediation-continuation-2026-07-09-47r2`
- Task ID: `T4-003`
- Failure fingerprint: `REV47R2_EXECUTOR_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION_ACTION_MARKER_NOT_DETECTED`
- Coordinator: `t_41e1a294`
- Coordinator run: `#210 completed in 25s`
- Executor: `t_4a0c6348`
- Executor run: `#211 blocked in 13s`
- Executor session: `20260710_003043_0a9c1b`
- Diagnostic written: `2026-07-10T00:47:04+08:00`

## 已采集证据

### 1. 持久化 Executor card body

`hermes kanban --board revid show t_4a0c6348` 证明持久化 card body 中存在 standalone action：

```text
Role: Executor
Action: IMPLEMENT_AND_TEST_ONLY
Revision: phase4-wave2-t4-003-mysql-runtime-cutover-remediation-continuation-2026-07-09-47r2
Task: T4-003
Task Path: ai/tasks/todo/TASK-T4-003.md
Stop After: T4_003_MYSQL_RUNTIME_REMEDIATION_REPORT_READY_REV47R2
```

该 card 的父级为 `t_41e1a294`，assignee 为 `revid-backend`，status 为 `blocked`。

### 2. Worker 实际收到的初始指令

Kanban worker 日志 `C:/Users/mkd/AppData/Local/hermes/kanban/boards/revid/logs/t_4a0c6348.log` 第 1 行显示实际传给 `revid-backend` 的初始 query 是：

```text
work kanban task t_4a0c6348
```

同一日志第 7-21 行显示 `revid-backend` SOUL fail-closed，原因是“当前指令缺少唯一 standalone 的 `Action: IMPLEMENT_AND_TEST_ONLY`”，并建议重新下发包含以下两行的指令：

```text
Action: IMPLEMENT_AND_TEST_ONLY
work kanban task t_4a0c6348
```

因此，本次事故不是 Executor card body 缺失 Action，而是 Gateway/worker launch instruction 没有把 card body 中的 standalone `Action: IMPLEMENT_AND_TEST_ONLY` 注入到模型可见的初始指令中。Action 在持久化 card 中被保留，但在 worker instruction 层被省略。

### 3. Backend profile agent log

`C:/Users/mkd/AppData/Local/hermes/profiles/revid-backend/logs/agent.log` 记录：

- `2026-07-10 00:30:49`：conversation turn 的 user message 为 `work kanban task t_4a0c6348`。
- `2026-07-10 00:30:55`：API call #1 完成，模型仅返回文本响应，没有任何 tool call。
- `2026-07-10 00:30:56`：CLI cleanup，session `20260710_003043_0a9c1b` 结束，消息数为 2。

这与 card log 完全一致：worker 没有进入任务读取，也没有调用 Kanban terminal transition tool。

### 4. Gateway / Dispatcher 证据

- `hermes kanban --board revid show t_41e1a294`：Coordinator `t_41e1a294` status 为 `done`，result 为 `DISPATCH_COMPLETE: child created and parent committed atomically`。
- `hermes kanban --board revid runs t_41e1a294 --json`：run `#210` outcome 为 `completed`，metadata 包含 `atomic_dispatch: true` 与 `child_id: t_4a0c6348`。
- `C:/Users/mkd/AppData/Local/hermes/kanban/boards/revid/logs/t_41e1a294.log`：Dispatcher 会话 `20260710_002942_7a579f` 读取了 `TASK-T4-003.md`，调用了 Kanban create，并输出 `DISPATCH_COMPLETE`。
- `C:/Users/mkd/AppData/Local/hermes/logs/gateway.log` 在 `2026-07-10 00:29:41` 与 `2026-07-10 00:30:42` 记录 dispatcher cycle 各 spawned 1 个 worker，未记录 crash、timeout、auto_blocked。

### 5. Process / retry / resource 证据

- `hermes kanban --board revid runs t_4a0c6348 --json`：run `#211` started_at `1783614642`，ended_at `1783614655`，duration `13s`，status/outcome 均为 `blocked`，summary 为 `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION: worker returned without calling kanban_complete or kanban_block`。
- card events 显示 run `#211` spawned PID `15296`，heartbeat 后 blocked。
- 当前 `ps -W | grep -E '15296|36108|PID'` 未发现 PID `15296` 或 Coordinator PID `36108` 仍在运行。
- `max_retries` 为 `2`，但本次失败是 SOUL fail-closed 的 capability/runtime contract 阻断；card 已记录 `recurrences: 1`，未产生第二次自动 process retry。
- Executor 没有读取 Task，没有 tool call，没有 PLAN/PROGRESS/REPORT 输出。

### 6. 未发生的动作

本轮诊断未执行以下动作：

- 未 redispatch rev47r2。
- 未创建第二个 Coordinator 或 Executor。
- 未 claim、promote、unblock、retry、reparent、delete 或 archive `t_41e1a294` / `t_4a0c6348`。
- 未创建 Reviewer、HANDOFF、T4-004、T4-005、frontend/auth/Canvas 或下一阶段 card。
- 未修改业务代码、测试、migration、Executor PLAN/PROGRESS/REPORT、Independent REVIEW 或 HANDOFF。
- 未读取 `.env` / `.env.*`，未输出 secret，未运行 destructive `revid_db` 操作。

## 根因判断

根因仍在 Hermes runtime / Gateway worker instruction construction：Kanban persisted body 中的 standalone `Action: IMPLEMENT_AND_TEST_ONLY` 没有被注入到 `revid-backend` worker 的初始 user-visible instruction。`revid-backend` SOUL 正确 fail-closed，避免在缺少 Action contract 的情况下读取 Task 或修改仓库。

## Required Fix

需要修复 Gateway/Kanban worker launch 路径，使 `IMPLEMENT_AND_TEST_ONLY` worker 的初始指令至少包含唯一 standalone：

```text
Action: IMPLEMENT_AND_TEST_ONLY
work kanban task t_4a0c6348
```

或等价地将完整持久化 card body 中的 `Action:` 行以 SOUL 可见、非嵌套、非转义、非省略的形式注入到 worker instruction。修复后必须用 fresh PMC-approved continuation revision 或 isolated same-profile smoke 证明：

1. card body 中的 Action 被保留；
2. worker 初始 instruction 中也能被 SOUL 检测为唯一 standalone Action；
3. worker 不再在任务读取前因 Action marker 缺失 fail-closed；
4. 不通过扩大业务 scope、读取 secret、手工 claim 或复用 terminal cards 来绕过 contract。

## Resume Condition

当前结论为 `STILL_INFRA_BLOCKED`。Codex PMC 需要先审查本 diagnostic。只有 PMC 发布新的 approved continuation revision，或明确授权更窄的 runtime smoke/remediation proof 后，Hermes 才能继续；本诊断本身不授权 redispatch rev47r2 或创建任何新业务/lifecycle card。
