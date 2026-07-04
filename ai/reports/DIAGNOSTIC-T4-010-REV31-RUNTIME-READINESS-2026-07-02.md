# DIAGNOSTIC-T4-010-REV31-RUNTIME-READINESS-2026-07-02

## Verdict

`STILL_INFRA_BLOCKED`

## Summary

T4-010 revision `phase4-wave3-workspace-shell-2026-07-02-31` 因 `revid-dispatcher` 的 `DISPATCH_ONLY` worker tool policy 不包含 `terminal` 工具而 terminal blocked。本轮诊断确认：该问题为基础设施策略配置缺陷，不是业务实现问题。same-profile smoke 无法安全执行，因为相同的 tool policy 限制会阻断所有 `revid-dispatcher` 的 launcher 调用。

Stable failure fingerprint：`REV31_DISPATCHER_TERMINAL_TOOL_NOT_ALLOWED`

## Blocking Evidence

| Field | Value |
|---|---|
| Revision | `phase4-wave3-workspace-shell-2026-07-02-31` |
| Coordinator Card | `t_2e03b521` |
| Profile | `revid-dispatcher` |
| Run | `#141` |
| Duration | 92s (2026-07-02 03:49 to 03:50) |
| Exit Outcome | `blocked` |
| Error | `ROLE_BOUNDARY_VIOLATION: tool 'terminal' is not allowed for Kanban task t_2e03b521.` |
| Kind | `capability` |
| Recurrences | 1 |
| Children Created | 0 |
| Process Retry | Not applicable — policy violation, not crash/timeout |
| Gateway | UP (PID 11888) |
| Runtime Contracts | OK (`HERMES_RUNTIME_PATCH_ALREADY_APPLIED`, `ROLE_CONTRACTS_OK`) |

## Root Cause Analysis

`revid-dispatcher` profile 的 `worker_tool_policies.DISPATCH_ONLY` 的 `allowed_tools` 列表中不包含 `terminal`。但当前 dispatcher flow 需要通过 `terminal` 工具调用项目 launcher `create-hermes-coordinator.py` 来原子创建 Executor child。这构成 `ROLE_BOUNDARY_VIOLATION`。

关键区分：
- 这不是 crash、timeout 或 capacity 问题
- `max_retries=2` 不适用于此场景（process retry 仅适用于 crash/timeout）
- 这是 tool policy contract 配置缺陷

## Diagnostic Smoke Attempt

**无法执行 same-profile sustained-run/smoke。**

原因：`revid-dispatcher` 的 `DISPATCH_ONLY` policy 同样不包含 `terminal`，任何使用相同 profile 的 smoke test 都会在同一环节被 `ROLE_BOUNDARY_VIOLATION` 阻断。使用 synthetic task/card 无法绕过此 policy 限制，因为限制发生在 profile 级别的 tool allowlist，而非 card 级别。

## Required Fix

`revid-dispatcher` 的 `worker_tool_policies.DISPATCH_ONLY` 的 `allowed_tools` 需要包含 `terminal`，以便 dispatcher 能调用 launcher 脚本完成 atomic child creation。修复后需要：

1. 部署修复后的 profile 配置
2. 运行 fresh same-profile smoke 证明 dispatcher 能完成 launcher invocation 和 atomic child creation
3. 验证 unknown/out-of-scope action 仍被 fail closed
4. 由 PMC 审阅 fresh runtime health evidence 后发布 continuation revision

## PMC Resume Conditions

PMC 仅在看到 fresh runtime health evidence 且证明以下条件后，才考虑发布 continuation：

- `revid-dispatcher` 能在最小权限下完成 `DISPATCH_ONLY` launcher/atomic child creation
- 未知或越界 action 继续 fail closed
- same-profile smoke 无 `ROLE_BOUNDARY_VIOLATION`、无 timeout、无 active/stale child
- revision 31 旧 chain 已 terminal，且不存在 active worker
- continuation 继承 `REV31_DISPATCHER_TERMINAL_TOOL_NOT_ALLOWED`，不复用旧 card 或 idempotency key

## Evidence Paths

- Kanban card: `t_2e03b521` (Coordinator INFRASTRUCTURE_BLOCKED, run #141)
- Kanban runs: `hermes kanban --board revid runs t_2e03b521 --json`
- Kanban show: `hermes kanban --board revid show t_2e03b521`
- Gateway status: `hermes gateway status` (UP, PID 11888)
- Runtime contracts: `HERMES_RUNTIME_PATCH_ALREADY_APPLIED`, `ROLE_CONTRACTS_OK`
- PMC advisory: `ai/reviews/REVIEW-T4-010-PMC-RUNTIME-ADVISORY-REV31-2026-07-02.md`
- Queue: `ai/automation/HERMES-AUTO-QUEUE.md` (entry 15, revision 31)
