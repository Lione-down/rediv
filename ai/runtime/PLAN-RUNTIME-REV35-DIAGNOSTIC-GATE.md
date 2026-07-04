# Plan: Runtime Rev35 Diagnostic Gate Deadlock

## Goal

让 deterministic reconciler 正确支持 runtime advisory 的两个阶段：

1. `ACKNOWLEDGED` 且 diagnostic 尚未生成；
2. `DIAGNOSTIC_READY` 且 diagnostic path/hash 已可验证。

## Root Cause

`validate_diagnostic()` 无条件要求 `DIAGNOSTIC_READY`，而 Supervisor 在 reconciler exit `2` 时禁止生成 diagnostic，导致 pending ACK 无法推进。

## Scope

- `ai/runtime/reconcile-hermes-execution-status.py`
- `ai/runtime/tests/test_reconcile_hermes_execution_status.py`
- 本 PLAN、PROGRESS、REPORT

## Steps

1. RED：添加 `ACKNOWLEDGED + diagnostic NONE` regression，证明当前实现返回 exit `2`。
2. GREEN：让 diagnostic-start phase 区分 pending 与 produced 状态；pending 只验证 confirmation、due 和 NONE fields。
3. 保持 `DIAGNOSTIC_READY` 的 path/hash 严格验证及 `SATISFIED` 语义。
4. 运行 targeted test、全部 runtime tests、role verifier、真实 rev35 `--check`、`git diff --check`。
5. 输出 REPORT；不修改 Hermes status、Queue、Kanban 或业务文件。
6. Diagnostic produced 后，支持 PMC 将 Queue 从 diagnostic-start 推进到 terminal-stop；`--apply` 必须原子更新 confirmation 与 reconciliation，避免第二次 gate deadlock。

## Success Criteria

- Pending ACK：首次 check exit `1`，apply 后 check exit `0`，二次 apply `NO_CHANGES`。
- Produced diagnostic：现有严格验证保持通过。
- 全部既有 fail-closed regressions 通过。
