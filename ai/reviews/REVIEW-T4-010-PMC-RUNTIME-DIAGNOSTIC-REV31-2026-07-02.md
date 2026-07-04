# REVIEW-T4-010-PMC-RUNTIME-DIAGNOSTIC-REV31

## Verdict

`PMC_BLOCKED — DIAGNOSTIC_ACCEPTED / REMEDIATION_DIRECTION_REJECTED`

Hermes runtime owner 已提交 `ai/reports/DIAGNOSTIC-T4-010-REV31-RUNTIME-READINESS-2026-07-02.md`，结论 `STILL_INFRA_BLOCKED`。该报告足以证明 revision 31 未进入 Executor、failure fingerprint 稳定、旧 card 不应 retry；runtime advisory handoff 已从静默等待推进到可审计 diagnostic。

报告提出“给 `revid-dispatcher` 的 `DISPATCH_ONLY` policy 增加通用 `terminal`”不获批准。项目 canonical role contract 明确规定：

- `ai/prompts/hermes-revid-dispatcher-soul.md` 只允许 `read_file` 与 `kanban_*` lifecycle tools，并明确禁止 `terminal`。
- `ai/runtime/verify-hermes-role-contracts.py` 将同一 exact allowlist 作为部署 verifier。
- `DISPATCH_ONLY` 的原子 parent/child transition 由 `kanban_create` runtime path 提供，不要求 Worker 调用 Supervisor launcher。

因此当前证据只证明 Worker 试图越界调用 `terminal`，不能证明 tool policy 应扩大。扩大权限会破坏 thin-dispatcher 与 fail-closed boundary。

## Required Runtime Remediation Evidence

Hermes runtime owner 下一步必须在非业务环境定位 Worker 为什么偏离 `kanban_create` contract，并提交：

1. card body、SOUL/action policy 和 worker log 的一致性分析，不输出 secret。
2. 最小修复，使 `DISPATCH_ONLY` 只通过已批准的 `kanban_create` atomic path 创建唯一 Executor child；`terminal` 继续不可见。
3. regression：合法 `DISPATCH_ONLY` 成功；unknown/cross-role action fail closed；任何 `terminal` 调用继续返回 `ROLE_BOUNDARY_VIOLATION`。
4. fresh synthetic same-profile smoke，证明 parent done、唯一 child ready、无 timeout、无 stale/active child。
5. source diff、tests、smoke 和 deployed verifier evidence，结论只能为 `READY_FOR_CONTINUATION` 或 `STILL_INFRA_BLOCKED`。

在该证据满足前，不发布 T4-010 continuation revision，不复用 revision 31 card/key，不修改 T4-010 frontend Allowed Files。

## Execution Status Quality Gate

当前 `HERMES-EXECUTION-STATUS.md` 已写 diagnostic path/verdict，但存在 malformed Markdown row、缺失实际 SHA256 和超出 60 分钟语义的 due timestamp。Hermes 需按 canonical Supervisor prompt 自行修正；PMC 不修改 Hermes-owned status。

## Reconciliation Signal

```text
PMC Reconciliation Required: YES
PMC Verdict Revision: phase4-wave3-workspace-shell-2026-07-02-31
PMC Verdict: PMC_BLOCKED
Failure Fingerprint: REV31_DISPATCHER_TERMINAL_TOOL_NOT_ALLOWED
Runtime Diagnostic Verdict: STILL_INFRA_BLOCKED
Runtime Remediation Authorized: NO — evidence direction must be corrected first
Expected Hermes Action: ACK_TERMINAL_VERDICT_AND_STOP
Resume Condition: fresh least-privilege runtime evidence using kanban_create atomic dispatch with terminal still forbidden
```

## Human Decision

`Human Decision Required = NO`

这是 runtime/action-policy 实现问题，不涉及产品方向、secret、付费资源、不可逆操作或重大业务 contract。

