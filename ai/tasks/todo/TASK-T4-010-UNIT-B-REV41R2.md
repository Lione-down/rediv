# Task: T4-010 Unit B Revision 41r2 — Fresh Review Lifecycle Continuation

## Metadata

- Task ID: `T4-010-UNIT-B-REV41R2`
- Revision: `phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-05-41r2`
- Status: `APPROVED — WAITING_FOR_HERMES_ACK`
- Action: `REVIEW_DISPATCH_ONLY`
- Coordinator: `revid-pm`
- Reviewer: `revid-reviewer`
- Business Attempt: `1` completed; no business re-execution
- Previous Failure Fingerprint: `REV41R1_REVID_PM_SEARCH_FILES_TOOL_BOUNDARY_VIOLATION`
- Source Report: `ai/reports/REPORT-T4-010-UNIT-B-REV41.md`
- Authorization: `ai/reviews/REVIEW-T4-010-PMC-REV41R2-LIFECYCLE-DEADLOCK-RESOLUTION-2026-07-05.md`

## Objective

通过 fresh bounded `revid-pm / REVIEW_DISPATCH_ONLY` chain 验证已部署的 policy remediation，并完成 revision 41 的 Independent Review 与 Reviewer-dependent HANDOFF。该 Task 只推进 lifecycle，不执行或修改业务实现。

## Inputs

- `ai/tasks/todo/TASK-T4-010-UNIT-B-REV41.md`
- `ai/reports/REPORT-T4-010-UNIT-B-REV41.md`
- `ai/evidence/T4-010/unit-b/rev41/`
- `ai/reviews/REVIEW-T4-010-PMC-REV41-REVIEW-LIFECYCLE-AUTHORIZATION-2026-07-05.md`
- `ai/reports/DIAGNOSTIC-T4-010-REV41R1-RUNTIME-HEALTH-2026-07-05.md`

## Allowed Outputs

- `ai/reviews/REVIEW-T4-010-UNIT-B-REV41.md`
- `ai/handoffs/HANDOFF-T4-010-UNIT-B-REV41-POST-REVIEW.md`

所有业务代码、Executor PLAN/PROGRESS/REPORT、既有 evidence、CURRENT、ROADMAP、Queue 和 Hermes execution status 对本 Task workers 均只读。

## Coordinator Contract

Fresh Coordinator 必须使用 `revid-pm`、standalone `Action: REVIEW_DISPATCH_ONLY`、本 revision 与 fresh idempotency key。它只能原子创建并 read-back 验证：

1. 一个 `revid-reviewer / INDEPENDENT_REVIEW_ONLY` child；
2. 一个依赖该 Reviewer 的 `revid-pm / HANDOFF_ONLY` child。

验证 persisted ID、assignee、parent、revision、action、body、budget 和 idempotency 后立即完成。不得运行 tests、等待 child、修改文件或创建额外 card。

## Reviewer Contract

Reviewer 必须读取 master T4-010、revision 41 Task/REPORT、actual diff 与 rev41 evidence，独立验证：

- 两个 Allowed Business Files 的实际 diff 与三个 protected component hashes；
- `npm run build` 与 scoped/full `git diff --check`；
- `1440x900`、`920x900`、`375x812` exact viewport 和 fresh browser evidence；
- drawer/Prompt Dock geometry、keyboard、focus、ARIA、reduced-motion；
- console/network failure、horizontal overflow、state preservation；
- missing `project_id` 时 generation request count 为 `0`；
- REPORT、evidence 与实际行为一致，无 secret、scope drift 或 destructive action。

唯一 verdict 为 `PASS`、`REWORK` 或 `BLOCKED`。不得修改业务代码或 Executor artifacts。

## Handoff Contract

`HANDOFF_ONLY` 仅在 Reviewer PASS 后写 canonical HANDOFF，并核对 revision、Task、Reviewer card、review path/hash、REPORT path/hash 与 evidence consistency。非 PASS 或任一不一致必须 block，不得写 HANDOFF_READY。

## Hard Gates

- project-owned runtime deploy 与 `ROLE_CONTRACTS_OK` 通过；
- fresh Coordinator/Reviewer/HANDOFF cards 和 keys；
- rev41r1 historical card `t_08bb42c8` 及其 runs/keys 不得复用；
- 继承 fingerprint，不以 revision 变化清零；
- 无 business write、secret、production、database 或 destructive action；
- failure 时 terminal stop，不自动发布 rev41r3 或 attempt 2。

## Acceptance Criteria

1. Coordinator 成功创建并验证唯一 Reviewer 与 Reviewer-dependent HANDOFF child。
2. Independent REVIEW 存在且包含 fresh verification 与明确 verdict。
3. 仅在 Reviewer PASS 后存在 canonical HANDOFF。
4. lifecycle artifacts、cards、revision、attempt、hashes 与 Task contract 一致。

## Stop After

`T4_010_HANDOFF_READY_REV41R2`

等待 Codex PMC 最终验收；不得自行选择下一 Task。
