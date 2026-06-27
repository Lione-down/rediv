# T4-002 PMC Runtime Remediation Guidance

## Purpose

本指导供 Hermes runtime owner 修复 `revid-pm` Coordinator role collapse。它不是 T4-002 executable Queue authorization，不允许创建 revision `-18` 或任何 T4-002 business card。

## Confirmed Failure Mode

问题不是已证明的“dispatch 固定需要 577s”。Direct Kanban evidence 显示 `t_1a9f1d32` run `#96` 虽名为 Coordinator，却执行了以下 Executor 工作：

- 运行两个 `py_compile`；
- 运行 `TestUnitB` 7 tests；
- 创建 PLAN、PROGRESS、REPORT；
- 创建 Reviewer card。

这叫 role collapse。Coordinator 的 prompt/tool boundary 没有把“协调”与“实现/验证”隔离，导致 LLM 在完成 child dispatch 前执行整段业务任务。

## Target Behavior: Thin Dispatcher

`revid-pm` 的 Coordinator mode 只能执行以下步骤：

1. 读取 Queue revision 和精确 Task path。
2. 校验 revision、Task ID、profile、idempotency key、旧 chain terminal 状态。
3. 构造一个 Executor child payload。
4. 调用一次 Kanban create/link 操作创建 Executor child。
5. 校验返回的真实 card ID、assignee、parent、revision 和 idempotency key。
6. 写入简短 summary，然后立即完成 Coordinator card。

Coordinator mode 禁止：

- 运行 `python`、`pytest`、build、migration 或任何业务验证；
- 创建或修改 PLAN、PROGRESS、REPORT、REVIEW、HANDOFF；
- 修改业务文件；
- 等待或监控 Executor；
- 读取 secret、`.env` 或访问数据库；
- 在本轮同时承担 Executor 或 Reviewer 身份。

如果准备执行任何禁止动作，Coordinator 必须立即输出 `ROLE_BOUNDARY_VIOLATION` 并停止，不得继续推理。

## Runtime Owner Fix Sequence

### 1. Correct State Reporting

Hermes Supervisor 在下一次合法状态更新中应：

- 使用 execution state machine 已定义的 `INFRASTRUCTURE_BLOCKED`；
- 将 revision `-17` 标为 terminal/not executable；
- 将 Queue Entry 标为 `NONE`，不得继续写 `APPROVED`；
- 保留全部历史 failure fingerprints；
- `PMC Action Type` 使用 `RUNTIME_ADVISORY` 或 `QUEUE_DECISION`，不得自行声明 PMC continuation 已批准。

### 2. Separate Coordinator Mode From Executor Mode

在 Hermes runtime/profile 配置中为 `revid-pm` 增加明确的 Coordinator mode gate：

- 输入必须包含 `Role: Coordinator` 和 `Action: DISPATCH_ONLY`；
- tool allowlist 只允许 Queue/Task read、Kanban lookup/create/link/show/complete，以及非敏感日志；
- shell、Python、test runner、file write 和 database tools 在该 mode 下禁用；
- completion validator 检测到 PLAN/PROGRESS/REPORT、test command 或 business-file write 时拒绝完成并标记 role violation；
- child assignee 必须来自 Queue 的 `Executor Profile`，不得由 Coordinator 自己执行。

不要仅靠自然语言提示约束。Prompt、tool allowlist 和 completion validator 三层必须同时存在。

### 3. Add Step-Level Timing

Coordinator worker 必须记录以下非敏感 monotonic timings：

```text
worker_started
queue_read_completed
task_read_completed
idempotency_lookup_completed
profile_validation_completed
child_payload_built
child_create_returned
child_verified
coordinator_completed
```

每一步记录 elapsed milliseconds、outcome 和非敏感 error class。不得记录 body 中的 secret 或环境变量值。

### 4. Run Isolated Runtime Smoke

在独立 diagnostic board/workspace 中执行，不得使用 `revid` business board，不得使用 T4-002 revision/idempotency key：

- 使用同一个 `revid-pm` profile 和相同 Coordinator mode；
- synthetic Queue/Task 只含无敏感信息的固定文本；
- child 指向 disposable diagnostic worker，不运行业务代码；
- 连续完成至少 3 次 dispatch-only runs；
- 每次只创建一个预期 child，Coordinator 不运行 tests、不写 project artifacts；
- 清楚记录每一步 timing、总耗时、child ID、parent link 和 completion outcome。

不得通过复用旧 card、修改 T4-002 Kanban 状态或创建 rev18 来做 smoke。

### 5. Derive Budget From Evidence

先修复 role boundary，再根据 smoke 数据设 budget：

```text
recommended_budget = ceil(max(successful_dispatch_elapsed) * 1.5)
```

同时设置合理的上限；如果 dispatch-only 仍超过 300s，应继续定位最慢步骤，而不是直接把 900s 当成默认答案。Budget 必须覆盖 dispatch-only，不覆盖 Executor tests 或 artifact generation。

## Required Evidence Package

Hermes runtime owner 应提交一份新的报告，至少包含：

1. 修改的 runtime/profile/config 文件路径和 hash，不复制 secret。
2. Coordinator mode 的 prompt boundary、tool allowlist 和 completion validator 摘要。
3. 三次 fresh diagnostic smoke 的 card/run IDs 与逐步 timings。
4. 每次 run 的 child topology：一个 Coordinator、一个 diagnostic child，无 Reviewer/HANDOFF/business artifacts。
5. role-violation negative test：尝试请求 `pytest` 或 REPORT write 时被拒绝。
6. 依据实测数据计算的 recommended budget。
7. 最终 verdict：`READY_FOR_CONTINUATION` 或 `STILL_INFRA_BLOCKED`。

建议路径：

`ai/reports/DIAGNOSTIC-T4-002-THIN-DISPATCHER-REMEDIATION-2026-06-28.md`

## PMC Re-enable Gate

只有以下条件全部满足，PMC 才考虑 revision `-18`：

- Hermes status 与 Queue/state machine 一致；
- Coordinator mode 不再运行 Executor 工作；
- 三次 dispatch-only smoke 全部成功且 topology 正确；
- negative test 证明 tool boundary 有效；
- Coordinator budget 由 fresh timing 数据计算；
- 没有 hidden T4-002 chain，历史 fingerprints 完整继承。

## Human Decision

`NO`。这是 Hermes runtime owner 可自行修复的技术问题。
