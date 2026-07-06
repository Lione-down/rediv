# Task: T4-010 Unit B Revision 41r6 — PASS Re-attestation and HANDOFF Closure

## Metadata

- Task ID: `T4-010-UNIT-B-REV41R6`
- Parent Task: `T4-010`
- Revision: `phase4-wave3-workspace-shell-unit-b-rev41-handoff-closure-2026-07-06-41r6`
- Status: `APPROVED — WAITING_FOR_HERMES_ACK`
- Action: `REVIEW_DISPATCH_ONLY`
- Coordinator: `revid-pm`
- Reviewer: `revid-reviewer`
- Previous Failure Fingerprint: `REV41R5_HANDOFF_SHA256_TOOL_POLICY_MISMATCH`
- Source REPORT: `ai/reports/REPORT-T4-010-UNIT-B-REV41.md`
- Consolidated PASS REVIEW: `ai/reviews/REVIEW-T4-010-UNIT-B-REV41.md`
- PASS Reviewer Card: `t_26fc11ff`
- Authorization: `ai/reviews/REVIEW-T4-010-PMC-REV41R5-HANDOFF-POLICY-AND-REV41R6-AUTHORIZATION-2026-07-06.md`

## Objective

在不重跑业务或 browser verification 的前提下，fresh Reviewer re-attest rev41r5 consolidated PASS evidence 未变，然后由 dependent `HANDOFF_ONLY` 使用 workspace-bounded `file_sha256` 完成 canonical HANDOFF。

## Coordinator Contract

创建且只创建：

1. 一个 fresh `revid-reviewer / INDEPENDENT_REVIEW_ONLY` child，唯一 parent 为当前 Coordinator，runtime `600s`、retry `0`。
2. 一个 fresh `revid-pm / HANDOFF_ONLY` child，唯一 parent 为新 Reviewer，runtime `900s`、retry `0`。
3. 使用本 revision fresh keys，read-back 校验后立即完成 Coordinator。

## Reviewer Re-attestation

Reviewer 只执行：

1. 读取 rev41r5 PASS Reviewer card `t_26fc11ff`、consolidated REVIEW 与 REPORT。
2. 单个 batched freshness check：确认 REVIEW/REPORT 存在且 business diff 未在 rev41r5 PASS 后改变。
3. 确认 REVIEW final verdict 为 PASS、revision 41r5、覆盖 920x900、375x812、zero-request、NButton console，并非 provisional。
4. 不覆盖 REVIEW；以 card summary 记录 `PASS_REATTESTED` 并 terminalize。

不得重跑 build/browser，不得写业务文件、REPORT、REVIEW 或 evidence。

## HANDOFF Contract

`HANDOFF_ONLY` 必须：

1. 确认 fresh parent Reviewer 为 done 且 summary 含 `PASS_REATTESTED`。
2. 读取 consolidated REVIEW，确认 final PASS 与 rev41r5 evidence scope。
3. 使用 `file_sha256` 计算 REPORT 与 REVIEW 的真实 SHA256；禁止 terminal。
4. 写 `ai/handoffs/HANDOFF-T4-010-UNIT-B-REV41-POST-REVIEW.md`，包含 rev41r6、parent Reviewer card、source PASS card、路径和 hash。
5. terminalize HANDOFF card；任何 mismatch 必须 block。

## Acceptance Criteria

1. Fresh topology、parents、runtime、retry、keys 正确。
2. Reviewer `PASS_REATTESTED` 且不改写 REVIEW。
3. HANDOFF 使用 `file_sha256`，没有 terminal/tool-policy violation。
4. Canonical HANDOFF 存在并包含真实 REPORT/REVIEW SHA256。
5. 无业务写入、browser 重跑、旧 card reuse 或 secret/destructive action。

## Stop After

`T4_010_HANDOFF_READY_REV41R6`
