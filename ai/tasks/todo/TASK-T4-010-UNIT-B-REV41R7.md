# Task: T4-010 Unit B Revision 41r7 — Final HANDOFF Closure

## Metadata

- Task ID: `T4-010-UNIT-B-REV41R7`
- Revision: `phase4-wave3-workspace-shell-unit-b-rev41-final-handoff-2026-07-06-41r7`
- Status: `PMC_PASS — HANDOFF_READY / TERMINAL`
- Action: `REVIEW_DISPATCH_ONLY`
- Coordinator: `revid-pm`
- Reviewer: `revid-reviewer`
- Previous Failure Fingerprint: `REV41R6_HANDOFF_SEARCH_FILES_POLICY_MISMATCH`
- REPORT: `ai/reports/REPORT-T4-010-UNIT-B-REV41.md`
- Consolidated PASS REVIEW: `ai/reviews/REVIEW-T4-010-UNIT-B-REV41.md`
- Source PASS Card: `t_26fc11ff`
- Latest PASS_REATTESTED Card: `t_39e56326`
- Authorization: `ai/reviews/REVIEW-T4-010-PMC-REV41R6-SEARCH-POLICY-AND-REV41R7-AUTHORIZATION-2026-07-06.md`

## Objective

Fresh Reviewer 只确认现有 PASS artifact 未变；dependent HANDOFF 使用 bounded `search_files`、`read_file` 与 workspace-bounded `file_sha256` 完成 canonical HANDOFF。禁止 terminal 和所有业务/browser 重跑。

## Lifecycle Contract

Coordinator 创建一个 `INDEPENDENT_REVIEW_ONLY` Reviewer（600s、retry 0）与一个 sole-parent `HANDOFF_ONLY`（900s、retry 0），使用 fresh keys并验证 topology 后完成。

Reviewer 单次 freshness check 后记录 `PASS_REATTESTED`；不得写 REVIEW、REPORT、业务或 evidence。

HANDOFF 必须：

1. 确认 parent Reviewer done/PASS_REATTESTED 与 consolidated REVIEW final PASS。
2. 仅在 card 指定路径 bounded-search/read；禁止 project 外搜索。
3. 使用 `file_sha256` 计算 REPORT/REVIEW hash；禁止 terminal。
4. 写 `ai/handoffs/HANDOFF-T4-010-UNIT-B-REV41-POST-REVIEW.md` 并 terminalize。

## Acceptance Criteria

- Fresh topology/keys/runtime/retry 正确。
- Reviewer PASS_REATTESTED，不改 artifact。
- HANDOFF 存在，包含 rev41r7、Reviewer cards、REPORT/REVIEW paths 与真实 SHA256。
- No terminal、business write、browser rerun、historical reuse 或 secret/destructive action。

## Stop After

`T4_010_HANDOFF_READY_REV41R7`
