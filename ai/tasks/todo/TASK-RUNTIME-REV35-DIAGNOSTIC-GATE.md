# Task: Runtime Rev35 Diagnostic Gate Deadlock

## Metadata

- Task ID: `RUNTIME-REV35-DIAGNOSTIC-GATE`
- Status: `IMPLEMENTED AND VERIFIED — AWAITING HERMES STATUS APPLY AND FRESH DIAGNOSTIC`
- Owner: Hermes runtime owner
- Related Revision: `phase4-wave3-workspace-shell-unit-b-browser-2026-07-04-35`
- Failure Fingerprint: `REV35_DIAGNOSTIC_GATE_REQUIRES_ITS_OWN_OUTPUT`

## Objective

修复 deterministic reconciler 在 runtime advisory 的 `ACKNOWLEDGED → DIAGNOSTIC_READY` 中间态形成的自锁，使 Hermes 能先 canonicalize pending ACK，再进入 diagnostics-only 收集并提交 fresh diagnostic。

## Allowed Files

- `ai/runtime/reconcile-hermes-execution-status.py`
- `ai/runtime/tests/test_reconcile_hermes_execution_status.py`
- 本 Task 对应的 runtime owner PLAN、PROGRESS、REPORT

## Non-goals

- 不修改 frontend、backend、业务测试、Task T4-010 Scope 或 Acceptance Criteria。
- 不修改 `HERMES-EXECUTION-STATUS.md` 以伪造通过结果。
- 不创建、retry、claim、promote、unblock、reparent、删除或复用任何 Kanban card。
- 不发布 revision 36，不清零 rev31/rev32/rev33/rev35 failure fingerprints。
- 不读取、打印、复制或猜测 secret，不触碰业务数据库。

## Acceptance Criteria

1. 新 regression 使用 `Runtime Owner State = ACKNOWLEDGED`、diagnostic path/hash/verdict 为 `NONE`、diagnostic-start confirmation，当前代码下 RED。
2. `--check` 对结构合法但 canonical fields stale 的 pending ACK 返回 `STATUS_MISMATCH`（exit `1`），而不是 exit `2`。
3. 单次 `--apply` 只 canonicalize Task/Queue hash、Action、pending reconciliation status；保留 owner state `ACKNOWLEDGED`、diagnostic `NONE` 与 due status `PENDING`。
4. 随后 `--check` 返回 `STATUS_OK`，第二次 `--apply` 返回 `NO_CHANGES` 且文件 hash 稳定。
5. 现有 `DIAGNOSTIC_READY` fixture 继续严格验证真实 diagnostic path/SHA256，并把 due status 设为 `SATISFIED`。
6. malformed table、duplicate canonical field、fingerprint mismatch、missing diagnostic file/hash regressions继续 fail closed。
7. targeted test file、全部 `ai/runtime/tests`、`python ai/runtime/verify-hermes-role-contracts.py` 与 `git diff --check` 通过。

## Stop After

输出 runtime owner REPORT 和 fresh rev35 diagnostic evidence，然后停止。不得发布 continuation Queue；由 Codex PMC 单独验收并决定下一步。
