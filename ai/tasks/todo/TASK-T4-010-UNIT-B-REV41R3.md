# Task: T4-010 Unit B Revision 41r3 — Exact-Parent Review Lifecycle Continuation

## Metadata

- Task ID: `T4-010-UNIT-B-REV41R3`
- Revision: `phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-05-41r3`
- Status: `TERMINAL — PMC_BLOCKED / INFRASTRUCTURE_BLOCKED`
- Action: `REVIEW_DISPATCH_ONLY`
- Coordinator: `revid-pm`
- Reviewer: `revid-reviewer`
- Business Attempt: `1` completed; no business re-execution
- Previous Failure Fingerprints: `REV41R1_REVID_PM_SEARCH_FILES_TOOL_BOUNDARY_VIOLATION`; `REV41R2_REVIEW_COORDINATOR_TIMEOUT_AND_MISSING_REVIEWER_PARENT`
- Source Report: `ai/reports/REPORT-T4-010-UNIT-B-REV41.md`
- Authorization: `ai/reviews/REVIEW-T4-010-PMC-REV41R2-RUNTIME-BLOCK-AND-REV41R3-AUTHORIZATION-2026-07-05.md`
- Terminal Advisory: `ai/reviews/REVIEW-T4-010-PMC-RUNTIME-ADVISORY-REV41R3-2026-07-05.md`
- Failure Fingerprint: `REV41R3_REVIEWER_TIMEOUT_WITHOUT_REVIEW`

## Objective

通过 fresh bounded lifecycle chain 完成 revision 41 的 Independent Review 与 Reviewer-dependent HANDOFF。不得执行或修改业务实现。

## Allowed Outputs

- `ai/reviews/REVIEW-T4-010-UNIT-B-REV41.md`
- `ai/handoffs/HANDOFF-T4-010-UNIT-B-REV41-POST-REVIEW.md`

所有业务代码、Executor artifacts、既有 evidence、CURRENT、ROADMAP、Queue 和 Hermes execution status 对 workers 只读。

## Exact Coordinator Contract

Fresh `revid-pm / REVIEW_DISPATCH_ONLY` Coordinator 必须：

1. 创建唯一 `revid-reviewer / INDEPENDENT_REVIEW_ONLY` child；`kanban_create` 必须显式传入 `parents: [当前 rev41r3 Coordinator card ID]`。
2. 创建唯一 `revid-pm / HANDOFF_ONLY` child；唯一 parent 必须是上一步 persisted Reviewer card ID。
3. 两个 child 均使用本 revision、fresh idempotency key、明确 runtime/retry，并 read-back 校验 ID、assignee、Action、Revision、parents、runtime、retry 与 key。
4. 完成 child validation 后立即完成 Coordinator；不得运行 tests、读取业务源码、等待 child 或创建其他 card。

## Reviewer Contract

独立验证 revision 41 Task/REPORT、actual diff、protected hashes、build/diff、三个 exact viewport、network/geometry/keyboard/focus/ARIA/reduced-motion、missing `project_id` zero-request 与 evidence consistency。唯一 verdict：`PASS`、`REWORK` 或 `BLOCKED`。不得修改业务代码或 Executor artifacts。

## Handoff Contract

只在 Reviewer PASS 后写 canonical HANDOFF；核对 revision、Reviewer card、review/report path 与 SHA256。非 PASS 或不一致必须 block。

## Hard Gates

- runtime deploy 与 `ROLE_CONTRACTS_OK` 通过；
- fresh Coordinator/Reviewer/HANDOFF cards 与 keys；
- rev41r1/rev41r2 cards、runs、keys 不得复用；
- Reviewer child exact parent 参数不可省略；
- 无 business write、secret、production、database 或 destructive action；
- failure 时 terminal stop，不自动发布 rev41r4 或 attempt 2。

## Acceptance Criteria

1. Coordinator 创建并验证唯一 Reviewer 与 dependent HANDOFF child。
2. Independent REVIEW 存在并包含 fresh verification 与 verdict。
3. Reviewer PASS 后才存在 canonical HANDOFF。
4. artifacts、cards、revision、hashes 与本 Task 一致。

## Stop After

`T4_010_HANDOFF_READY_REV41R3`

等待 Codex PMC 最终验收。

## Terminal Outcome

Coordinator `t_7ab33875` run #172 completed child creation. Reviewer `t_2c2f6842` run #173 timed out at 1814s and produced no Independent REVIEW; HANDOFF `t_588bd58e` remains blocked. This revision is terminal and non-executable. Final acceptance was not reached.
