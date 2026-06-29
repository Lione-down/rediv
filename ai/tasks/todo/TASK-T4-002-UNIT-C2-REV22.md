# TASK-T4-002-UNIT-C2-REV22 — Migration Core Child-Contract Correction

## Status

`PMC_REWORK — TERMINAL EVIDENCE, NOT EXECUTABLE`

## Revision

`phase4-wave2-unit-c2-child-contract-corrected-2026-06-29-22`

## Authorization

本 revision 继承 `TASK-T4-002-UNIT-C2-REV21.md` 及其引用的 rev20 Objective、Scope、Non-goals、Hard Gates、Verification、Acceptance Criteria 与 fingerprint。Revision `-21` Coordinator 正确完成 policy handoff，但 child payload 与 Task 冲突，因此旧 chain terminal，不得复用。

## Rev21 Terminal Evidence

- Coordinator `t_14b8871f` run `#115` 在 54s 完成 exact `DISPATCH_ONLY`，证明 policy handoff fix 生效。
- Child `t_689f993e` 错写 `Do NOT run tests`，且 persisted max runtime 未固定为 1800s；run `#116` 在 47s 被回收，随后 run `#117` 以 `COORDINATOR_CHILD_CONTRACT_INVALID` block。
- 该 chain 不得 unblock、retry 或复用；未形成可验收的 Unit C2 evidence。

## Exact Executor Contract

Coordinator 必须创建且只创建一个 `revid-backend` child，持久化参数必须精确满足：

- Parent：当前 rev22 Coordinator。
- Max runtime：`1800s`。
- Process retry：最多自动一次。`kanban_create` worker tool 不暴露 per-card `max_retries`，因此 persisted `NULL` 使用 board default effective limit `2`（首次失败后最多重试一次）。
- Idempotency：`revid:phase4-wave2-unit-c2-child-contract-corrected-2026-06-29-22:T4-002:execute:0`。
- Body 必须明确：业务文件 read-only；必须实际运行以下四个 selectors；允许创建 rev22 PLAN/PROGRESS/REPORT；禁止 Reviewer/HANDOFF。

Selectors，顺序固定：

1. `TestMigrationTool::test_ac1_dry_run_no_changes`
2. `TestMigrationTool::test_ac2_full_migration_succeeds`
3. `TestMigrationTool::test_ac3_idempotency`
4. `TestMigrationTool::test_ac5_source_immutable`

允许创建：

- `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV22-PLAN.md`
- `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV22-PROGRESS.md`
- `ai/reports/REPORT-T4-002-UNIT-C2-REV22.md`

## Coordinator Contract

Coordinator max runtime `120s`、max retries `1`。创建 child 后必须验证 body、assignee、parent、revision、max runtime，以及 effective process retry 不超过一次；任一不符必须 block child 和自身，不得声称成功。

## Failure Fingerprint Inheritance

继承全部历史 fingerprints，并新增 `REV21_COORDINATOR_CHILD_CONTRACT_INVALID`。

## PMC Closure

- Executor `t_4f178d0c` completed all four authorized selectors: AC1/AC2/AC5 passed; AC3 failed.
- Stable business failure fingerprint: `AC3_STALE_SAME_DUPLICATE_INSERT`.
- PMC verdict: `ai/reviews/REVIEW-T4-002-PMC-UNIT-C2-REV22-REWORK-2026-06-29.md`.
- Revision `-22` is terminal and must not be redispatched, retried, unblocked or reused.
- Remediation is authorized only through revision `-23` with fresh cards and idempotency keys.
