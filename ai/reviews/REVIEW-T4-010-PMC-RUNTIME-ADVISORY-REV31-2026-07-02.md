# REVIEW-T4-010-PMC-RUNTIME-ADVISORY-REV31

## Verdict

`INFRASTRUCTURE_BLOCKED`

T4-010 revision `phase4-wave3-workspace-shell-2026-07-02-31` 在 Executor 创建前因 Hermes dispatcher tool policy 阻塞。该事件不是业务实现失败，不得转为 `PMC_REWORK`，也不授权新的 Queue revision。

Stable failure fingerprint：

`REV31_DISPATCHER_TERMINAL_TOOL_NOT_ALLOWED`

## Blocking Evidence

- Revision：`phase4-wave3-workspace-shell-2026-07-02-31`
- Coordinator card：`t_2e03b521`
- Profile：`revid-dispatcher`
- Run：`#141`
- Runtime result：`ROLE_BOUNDARY_VIOLATION: tool 'terminal' is not allowed for Kanban task t_2e03b521`
- Reported cause：`DISPATCH_ONLY` 的 `revid-dispatcher` `worker_tool_policies` 不包含 `terminal`，但当前 dispatcher flow 尝试通过该工具调用 `create-hermes-coordinator.py`。
- Executor card：不存在。
- Executor PLAN / PROGRESS / REPORT：不存在。
- Independent REVIEW：不存在。
- HANDOFF：不存在。

项目 Task、frontend Allowed Files 和业务验收标准尚未被执行。本 advisory 不对 T4-010 业务实现作质量判断。

## Prohibited Actions

- 不重派 revision 31，不复用 card `t_2e03b521` 或其 idempotency key。
- 不 claim、promote、unblock、reparent 或人工 retry 该 card。
- 不用新的 Queue revision 清零或绕过本 failure fingerprint。
- 不修改 T4-010 业务代码、tests、migration、frontend artifact 或 Executor 文档。
- 不运行未授权 destructive tests，不访问业务数据库。
- 不读取、打印、复制或猜测任何 secret。

## Runtime Owner Diagnostics Required

Hermes runtime owner 应在 same-profile、非业务环境中收集并保存以下 fresh evidence：

1. run `#141` 的退出码、stdout/stderr 尾部和 worker stack。
2. Gateway/dispatcher 对 card `t_2e03b521` 的 claim、policy resolution、tool invocation 与 terminal transition 日志。
3. `DISPATCH_ONLY` 对 `revid-dispatcher` 的实际 action-to-tool policy，以及 launcher invocation 所需 capability 与当前 allowlist 的差异。
4. 资源限制、timeout、`max_retries` 和“不触发旧 card retry”的决策依据。
5. 对修复方案的 fail-closed regression：未知 action 仍被拒绝，`DISPATCH_ONLY` 只能创建一个符合 contract 的 Executor child，不能获得业务实现或测试权限。

可选进行一个非破坏性的 same-profile sustained-run/smoke。smoke 必须使用 synthetic task/card，不读取 secret、不触碰业务数据库、不修改本项目业务文件，并证明 dispatcher 能完成 launcher/atomic child creation 所需动作后立即退出。

## Expected Runtime Owner Output

Runtime owner 必须输出以下三者之一，并附 fresh evidence 路径：

- `READY_FOR_CONTINUATION`
- `STILL_INFRA_BLOCKED`
- `NEEDS_HUMAN_DECISION`

普通 policy、launcher、Gateway、dispatcher 或 process 修复不需要 Human Owner 决策。只有涉及新的 secret、付费资源、不可逆操作或重大长期 contract 变化时，才可使用 `NEEDS_HUMAN_DECISION`。

## PMC Resume Condition

PMC 仅在看到 fresh runtime health evidence，且证据同时证明以下条件后，才考虑发布 fresh bounded continuation revision：

- `revid-dispatcher` 能在最小权限下完成 `DISPATCH_ONLY` launcher/atomic child creation；
- 未知或越界 action 继续 fail closed；
- same-profile smoke 无 `ROLE_BOUNDARY_VIOLATION`、无 timeout、无 active/stale child；
- revision 31 旧 chain 已 terminal，且不存在 active worker；
- continuation 继承 `REV31_DISPATCHER_TERMINAL_TOOL_NOT_ALLOWED`，不复用旧 card 或 idempotency key。

在上述条件满足前，Queue 不得重派，T4-010 保持 `INFRASTRUCTURE_BLOCKED`。

## Reconciliation Signal

```text
PMC Reconciliation Required: YES
PMC Verdict Revision: phase4-wave3-workspace-shell-2026-07-02-31
PMC Verdict: PMC_BLOCKED
Failure Fingerprint: REV31_DISPATCHER_TERMINAL_TOOL_NOT_ALLOWED
Remediation Authorized: NO
Expected Hermes Action: ACK_TERMINAL_VERDICT_AND_START_RUNTIME_DIAGNOSTIC
Runtime Diagnostic SLA: next Hermes checkpoint, no later than 60 minutes
Resume Condition: fresh same-profile runtime health evidence satisfying this advisory
```
