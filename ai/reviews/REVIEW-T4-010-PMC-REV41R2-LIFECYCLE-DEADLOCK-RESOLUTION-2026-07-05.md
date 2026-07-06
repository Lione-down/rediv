# PMC REVIEW — T4-010 Revision 41r2 Lifecycle Deadlock Resolution

## Verdict

`PMC_CONTINUATION_APPROVED — BOUNDED REVIEW LIFECYCLE / RUNTIME PROOF BY EXECUTION`

## Root Cause

Revision 41r1 的 Resume Condition 与 diagnostic 形成 circular gate：Queue 要求 fresh `revid-pm / REVIEW_DISPATCH_ONLY` child-creation proof 后才能授权 continuation，而 diagnostic 明确只有先获得 fresh PMC lifecycle authorization 才能安全创建对应 chain。因此即使 terminal ACK、policy remediation、targeted/full tests、role verifier 和 deployed resolver smoke 已完成，Hermes 仍无法产生解锁所需的最后一段 runtime proof。

## Evidence

- rev41r1 terminal fingerprint：`REV41R1_REVID_PM_SEARCH_FILES_TOOL_BOUNDARY_VIOLATION`。
- Hermes status 已记录同 fingerprint 的 `DIAGNOSTIC_READY`、diagnostic hash 与 `ACK_TERMINAL_VERDICT_AND_STOP`。
- Diagnostic `ai/reports/DIAGNOSTIC-T4-010-REV41R1-RUNTIME-HEALTH-2026-07-05.md` 结论为 `STILL_INFRA_BLOCKED`，唯一缺口是 fresh same-profile Reviewer/HANDOFF child-creation proof。
- Policy remediation 已通过 targeted `17 passed`、full runtime `34 passed`、`ROLE_CONTRACTS_OK` 和 `REVID_PM_POLICY_SMOKE_OK`，且 Gateway 已重新加载。
- Canonical Independent REVIEW 与 HANDOFF 尚不存在；revision 41 REPORT 保持待独立审查。
- 当前 reconciler 的三项 mismatch 仅属于旧 rev41r1 terminal status integrity，不代表 active worker 或业务失败。

## Decision

PMC 以 Human Owner 当前“尽快解决并恢复工作”的明确指令，授权一个 fresh bounded lifecycle revision `phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-05-41r2`。该 revision 既是 rev41r1 policy remediation 的 runtime proof，也是 revision 41 的正式 Independent Review continuation。

这不是 business REWORK，不修改业务代码，不清零旧 fingerprint。Hermes 只能创建一个 fresh `revid-pm / REVIEW_DISPATCH_ONLY` Coordinator；该 Coordinator 只创建一个 `revid-reviewer / INDEPENDENT_REVIEW_ONLY` child 和一个依赖 Reviewer PASS 的 `revid-pm / HANDOFF_ONLY` child，然后立即完成。

## Fail-closed Gates

- rev41r1 cards/runs/keys 全部 terminal immutable，禁止复用或操作。
- deploy、role contract、action/profile、fresh idempotency、parent dependency 或 persisted body 任一不匹配，立即 `INFRASTRUCTURE_BLOCKED`。
- Coordinator 不得运行 tests、修改业务文件或写 REVIEW/HANDOFF。
- Reviewer 独立复跑 Task 要求的 build、diff、exact viewport、network、geometry、keyboard、focus、ARIA、reduced-motion 和 missing-`project_id` zero-request verification。
- HANDOFF 只允许在 Reviewer PASS 且 revision/attempt/evidence 一致后产生。
- 任一失败都停止于当前 revision；不得自动发布 rev41r3、attempt 2 或业务 re-execution。

## Human Decision

`NO` further decision required. Human Owner 已明确要求解除当前 PMC/Hermes 停滞；本授权不改变产品、schema、secret、安全或不可逆边界。

