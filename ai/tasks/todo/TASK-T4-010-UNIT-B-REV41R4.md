# Task: T4-010 Unit B Revision 41r4 — Deadline-Safe Review Lifecycle Continuation

## Metadata

- Task ID: `T4-010-UNIT-B-REV41R4`
- Parent Task: `T4-010`
- Revision: `phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-06-41r4`
- Status: `APPROVED — WAITING_FOR_HERMES_ACK`
- Action: `REVIEW_DISPATCH_ONLY`
- Coordinator: `revid-pm`
- Reviewer: `revid-reviewer`
- Business Attempt: unchanged; business re-execution forbidden
- Previous Failure Fingerprints: `REV41R1_REVID_PM_SEARCH_FILES_TOOL_BOUNDARY_VIOLATION`; `REV41R2_REVIEW_COORDINATOR_TIMEOUT_AND_MISSING_REVIEWER_PARENT`; `REV41R3_REVIEWER_TIMEOUT_WITHOUT_REVIEW`
- Source Business Task: `ai/tasks/todo/TASK-T4-010-UNIT-B-REV41.md`
- Source REPORT: `ai/reports/REPORT-T4-010-UNIT-B-REV41.md`
- Authorization: `ai/reviews/REVIEW-T4-010-PMC-REV41R3-RECOVERY-AND-REV41R4-AUTHORIZATION-2026-07-06.md`

## Objective

使用已部署的 deadline-aware Reviewer finalization contract，完成 revision 41 的 Independent Review 与 Reviewer-dependent HANDOFF。不得执行或修改业务实现。

## Allowed Outputs

- `ai/reviews/REVIEW-T4-010-UNIT-B-REV41.md`
- `ai/handoffs/HANDOFF-T4-010-UNIT-B-REV41-POST-REVIEW.md`

所有业务代码、Executor artifacts、REPORT、既有 evidence、CURRENT、ROADMAP、Queue 和 Hermes execution status 对 workers 只读。

## Coordinator Contract

Fresh `revid-pm / REVIEW_DISPATCH_ONLY` Coordinator 必须：

1. 创建且只创建一个 `revid-reviewer / INDEPENDENT_REVIEW_ONLY` child；`kanban_create` 必须显式传入 `parents: [当前 rev41r4 Coordinator card ID]`。
2. 创建且只创建一个 `revid-pm / HANDOFF_ONLY` child；唯一 parent 必须是 persisted Reviewer card ID。
3. Reviewer runtime 为 `1800s`、task retry 为 `0`；HANDOFF runtime 为 `900s`、task retry 为 `0`。
4. 两个 child 均使用本 revision 的 fresh idempotency key，并 read-back 校验 ID、assignee、Action、Revision、parents、runtime、retry 与 key。
5. 完成 child validation 后立即 terminalize Coordinator；不得等待 Reviewer、运行验证或写 REVIEW/HANDOFF。

## Reviewer Contract

Reviewer 必须：

1. 读取 source Task、REPORT、actual diff、protected hashes 与既有 browser evidence。
2. 在昂贵验证前写 provisional `BLOCKED / REVIEW_INCOMPLETE_PENDING_VERIFICATION` REVIEW。
3. 使用 batched static/build/hash checks 与 bounded viewport interactions 独立验证三个 exact viewport、network、geometry、keyboard、focus、ARIA、reduced-motion、missing `project_id` zero-request 与 evidence consistency。
4. 遵守 installed runtime 的 `600s` finalization reserve 与 `24` model API-call verification cap；进入 finalization-only mode 后不得继续 browser、terminal、process、search 或 read expansion。
5. 输出唯一最终 verdict：`PASS`、`REWORK` 或 `BLOCKED`，并显式 terminalize Reviewer card。

不得修改业务代码、Executor PLAN/PROGRESS/REPORT 或既有 evidence。

## HANDOFF Contract

`HANDOFF_ONLY` 只在 Reviewer final verdict 为 PASS 后写 canonical HANDOFF；必须核对 revision、Reviewer card、REVIEW/REPORT path 与真实 SHA256。非 PASS、provisional REVIEW 或证据不一致必须 block，不能写 HANDOFF_READY。

## Hard Gates

- project-owned runtime patch classifier 为 `APPLIED`；
- `ROLE_CONTRACTS_OK`；
- canonical/deployed Reviewer SOUL hash 一致；
- fresh Coordinator/Reviewer/HANDOFF cards 与 keys；
- Reviewer exact parent 和 HANDOFF sole parent 不可省略；
- rev41r1/rev41r2/rev41r3 cards、runs、sessions、keys 不得复用；
- 不读取或输出 secret，不访问 production database，不执行 destructive action；
- 任一 contract mismatch 必须 fail closed。

## Acceptance Criteria

1. Coordinator 创建并验证唯一 Reviewer 与 dependent HANDOFF child。
2. Independent REVIEW 存在，包含 fresh verification、最终 verdict 与明确 provisional/final 区分。
3. Reviewer PASS 后才存在 canonical HANDOFF。
4. Artifacts、cards、revision、hashes 与本 Task 一致。
5. 无业务写入、历史 card reuse、secret exposure 或越权操作。

## Stop After

`T4_010_HANDOFF_READY_REV41R4`

到达 Stop After 后停止，等待 Codex PMC 最终验收；不得启动下一 Task。
