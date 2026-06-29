# TASK-T4-002-UNIT-C2-REV21 — Migration Core Continuation

## Status

`APPROVED — EXECUTABLE`

## Revision

`phase4-wave2-unit-c2-migration-core-policy-handoff-fixed-2026-06-29-21`

## Authorization

本 revision 延续 `TASK-T4-002-UNIT-C2-REV20.md` 的 Objective、Scope、Non-goals、business read-only files、Hard Gates、Verification、Acceptance Criteria 和 Stop Condition；除下列 overrides 外不得扩大范围。

## Revision 21 Overrides

- 使用全新的 Coordinator、Executor 与 idempotency keys；不得复用 rev19/rev20 chain。
- Coordinator body 必须直接包含 standalone `Action: DISPATCH_ONLY` 及 `ai/prompts/hermes-scheduled-supervisor.md` 的完整 canonical contract。
- Windows Supervisor 必须直接调用 `hermes.exe`，不得用 `hermes.cmd` 传 multiline body。
- Coordinator idempotency：`revid:phase4-wave2-unit-c2-migration-core-policy-handoff-fixed-2026-06-29-21:T4-002:coordinate`。
- Executor idempotency：`revid:phase4-wave2-unit-c2-migration-core-policy-handoff-fixed-2026-06-29-21:T4-002:execute:0`。
- Coordinator max runtime 120s；Executor max runtime 1800s；business attempt 1 continuation；no attempt 2；one process retry maximum。

## Runtime Prerequisite Evidence

`ai/reports/REPORT-HERMES-POLICY-HANDOFF-FIX-2026-06-29.md`：targeted regression 6/6 passed；positive Coordinator `t_11db1342` run `#2` 84s completed；negative cards在 spawn 前以稳定 fingerprint block。

## Security Gate

Human Owner 已于 2026-06-29 确认旧 credential 已撤销并更新四个 Revid profiles。Codex non-secret verification：四个 profile 配置均在确认后更新、credential fingerprint 一致，`revid-pm` live probe 返回 `CREDENTIAL_OK`。Security gate 已解除。

## Failure Fingerprint Inheritance

继承 rev20 及此前全部 fingerprints，并新增：

- `REV20_MISSING_ACTION_POLICY_BYPASS`
- `WINDOWS_CMD_MULTILINE_BODY_TRUNCATION`

Revision 变化不得清零 fingerprint。
