# Task: T4-010 Unit B Revision 41r5 — Remaining Browser Review Closure

## Metadata

- Task ID: `T4-010-UNIT-B-REV41R5`
- Parent Task: `T4-010`
- Revision: `phase4-wave3-workspace-shell-unit-b-rev41-browser-review-closure-2026-07-06-41r5`
- Status: `APPROVED — WAITING_FOR_HERMES_ACK`
- Action: `REVIEW_DISPATCH_ONLY`
- Coordinator: `revid-pm`
- Reviewer: `revid-reviewer`
- Business Attempt: unchanged; business re-execution forbidden
- Previous Failure Fingerprints: `REV41R1_REVID_PM_SEARCH_FILES_TOOL_BOUNDARY_VIOLATION`; `REV41R2_REVIEW_COORDINATOR_TIMEOUT_AND_MISSING_REVIEWER_PARENT`; `REV41R3_REVIEWER_TIMEOUT_WITHOUT_REVIEW`; `REV41R4_MISSING_VIEWPORT_920X900_AND_375X812_BROWSER_VERIFICATION`
- Source Business Task: `ai/tasks/todo/TASK-T4-010-UNIT-B-REV41.md`
- Source REPORT: `ai/reports/REPORT-T4-010-UNIT-B-REV41.md`
- Prior Independent REVIEW: `ai/reviews/REVIEW-T4-010-UNIT-B-REV41.md`
- Authorization: `ai/reviews/REVIEW-T4-010-PMC-REV41R4-BROWSER-CAP-AND-REV41R5-AUTHORIZATION-2026-07-06.md`

## Objective

补齐 rev41r4 明确缺失的 Independent browser verification，并将同一路径 REVIEW 覆盖为包含既有通过项与 fresh browser 结果的 consolidated final verdict。不得重复业务实现或无界重跑已通过检查。

## Allowed Outputs

- `ai/reviews/REVIEW-T4-010-UNIT-B-REV41.md`
- `ai/handoffs/HANDOFF-T4-010-UNIT-B-REV41-POST-REVIEW.md`

所有业务代码、Executor artifacts、REPORT、既有 evidence、CURRENT、ROADMAP、Queue 和 Hermes execution status 对 workers 只读。

## Coordinator Contract

Fresh `revid-pm / REVIEW_DISPATCH_ONLY` Coordinator 必须创建并 read-back 验证：

1. 一个 `revid-reviewer / INDEPENDENT_REVIEW_ONLY` child，唯一 parent 为当前 rev41r5 Coordinator；runtime `1800s`、task retry `0`。
2. 一个 `revid-pm / HANDOFF_ONLY` child，唯一 parent 为 persisted rev41r5 Reviewer；runtime `900s`、task retry `0`。
3. 两个 child 使用本 revision fresh idempotency keys；不得复用 rev41r1-r4 cards/runs/keys。
4. 完成验证后立即 terminalize Coordinator，不等待 Reviewer。

## Reviewer Scope

Reviewer 必须先写 provisional `BLOCKED / REVIEW_INCOMPLETE_PENDING_VERIFICATION`，然后仅执行：

1. 单个 batched freshness guard：确认两项 business diff 与 rev41r4 REVIEW 已通过的 static/build/hash evidence 未发生变化；不重复 full build 或逐项 hash exploration。
2. `920x900` fresh browser verification：drawer open/close screenshots、Prompt Dock hidden/restored、Escape close、console clean、no overflow。
3. `375x812` fresh browser verification：initial/open/closed screenshots、Prompt action visibility、long-text wrapping、console clean、no horizontal overflow。
4. missing `project_id` browser proof：触发 Generate 后 zero project-dependent network request，并出现 fail-closed warning。
5. 确认两个 viewport 均无 `NButton` component-resolution warning。
6. 将 REVIEW 覆盖为 consolidated final `PASS`、`REWORK` 或 `BLOCKED`；明确引用 rev41r4 已通过项与本轮 fresh checks，随后 terminalize card。

Runtime contract：最多 `48` verification API calls，或到 1200 秒 soft deadline 先触发 finalization-only mode；600 秒 finalization reserve 保持不变。禁止验证范围扩张、逐个 Tab 遍历、重复截图或无目标探索。

## HANDOFF Contract

仅当 rev41r5 consolidated final REVIEW 为 PASS 时写 canonical HANDOFF；核对 revision、Reviewer card、REVIEW/REPORT path 与真实 SHA256。非 PASS 或 provisional REVIEW 必须 block。

## Acceptance Criteria

1. Fresh Coordinator/Reviewer/HANDOFF topology、parents、runtime、retry 与 keys 全部正确。
2. REVIEW 包含两个缺失 viewport、zero-request、NButton console 的 fresh evidence。
3. REVIEW 明确 consolidated verdict，不把 rev41r4 provisional/final BLOCKED 当 PASS。
4. Reviewer PASS 后才生成 canonical HANDOFF。
5. 无业务写入、historical card reuse、secret/production/destructive action。

## Stop After

`T4_010_HANDOFF_READY_REV41R5`

到达 Stop After 后停止，等待 Codex PMC 最终验收。
