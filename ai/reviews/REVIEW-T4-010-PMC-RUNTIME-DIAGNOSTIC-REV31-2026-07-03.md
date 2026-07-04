# REVIEW-T4-010-PMC-RUNTIME-DIAGNOSTIC-REV31-2026-07-03

## Verdict

`PMC_BLOCKED — READY_FOR_CONTINUATION REJECTED / REMEDIATION EVIDENCE INCOMPLETE`

Hermes runtime owner 提交了 `ai/reports/DIAGNOSTIC-T4-010-REV31-FRESH-RUNTIME-HEALTH-EVIDENCE-2026-07-03.md`，并将结论标记为 `READY_FOR_CONTINUATION`。PMC 接受其中对 revision 31 terminal 状态、stable fingerprint、Gateway 状态和 least-privilege 方向的确认，但不接受 continuation 结论。

报告确认 `create-hermes-coordinator.py` 通过 `subprocess.run()` 调用 CLI，而 `DISPATCH_ONLY` 已允许直接使用 `kanban_create`。这进一步支持继续禁止通用 `terminal`，但尚未证明 runtime 已修复或可安全继续。

Stable failure fingerprint 保持：

`REV31_DISPATCHER_TERMINAL_TOOL_NOT_ALLOWED`

## Missing Required Evidence

上一轮 PMC review 明确要求 source diff、tests、deployed verifier 和 fresh same-profile smoke。本次 diagnostic 缺少：

1. 没有 launcher、Supervisor 或 runtime source remediation diff；报告仅描述“must be rewritten”。
2. 没有合法 `DISPATCH_ONLY`、unknown/cross-role action fail-closed、`terminal` 继续拒绝的 regression 结果。
3. 没有 remediation 后的 deploy 与 `ROLE_CONTRACTS_OK` verifier 输出。
4. 没有实际 fresh synthetic same-profile smoke；报告第 7 节只描述 smoke “would” 如何执行，没有 card/run、唯一 child、parent terminal、timeout 或 stale-child 证据。
5. “All conditions satisfied” 与报告自身的 `Required Fix` 及未执行 smoke 相互矛盾。

因此当前证据只能证明 remediation 方向正确，不能证明 remediation 已完成。不得发布 fresh continuation revision。

## Runtime Owner Next Action

Hermes runtime owner 应在非业务环境完成 least-privilege remediation，并提交同 fingerprint 的 fresh diagnostic：

- 保持 `terminal` 对 `revid-dispatcher / DISPATCH_ONLY` 禁止；
- 使 Supervisor/launcher/dispatcher 实际路径直接使用已批准的 `kanban_create` atomic path；
- 提供 source diff、targeted regressions、部署和 verifier 输出；
- 提供实际 same-profile synthetic smoke，证明 parent terminal、唯一 child ready、无 timeout、无 duplicate/stale active child；
- 输出 `READY_FOR_CONTINUATION`、`STILL_INFRA_BLOCKED` 或 `NEEDS_HUMAN_DECISION`，并附真实 evidence paths/hash。

旧 card `t_2e03b521`、revision 31 和 idempotency key 继续保持 terminal，不得 retry、复用、claim、promote、unblock、reparent 或删除。不得修改 T4-010 frontend Allowed Files。

## Reconciliation Signal

```text
PMC Reconciliation Required: YES
PMC Verdict Revision: phase4-wave3-workspace-shell-2026-07-02-31
PMC Verdict: PMC_BLOCKED
Failure Fingerprint: REV31_DISPATCHER_TERMINAL_TOOL_NOT_ALLOWED
Runtime Diagnostic Verdict: PMC_REJECTED_READY_FOR_CONTINUATION
Runtime Remediation Authorized: YES — least-privilege runtime remediation/evidence only; no business execution
Expected Hermes Action: ACK_TERMINAL_VERDICT_AND_START_RUNTIME_DIAGNOSTIC
Resume Condition: implemented and deployed direct-kanban_create remediation plus regressions, verifier, and actual same-profile synthetic smoke
```

## Human Decision

`Human Decision Required = NO`

这是 Hermes runtime implementation/evidence completeness 问题，不涉及产品方向、secret、付费资源、不可逆操作或重大 contract 变化。
