# PMC REVIEW — T4-010 Revision 41r2 Runtime Block and Revision 41r3 Authorization

## Verdict

`PMC_BLOCKED — INFRASTRUCTURE / FRESH BOUNDED REV41R3 AUTHORIZED`

## Evidence

- rev41r2 Coordinator `t_c2180c46` run #170 timed out at 182s；唯一 retry run #171 timed out at 181s；children remained empty。
- run #171 三次 Reviewer `kanban_create` payload 均遗漏 `parents`，runtime validator 正确返回 `REVIEW_DISPATCH_CHILD_CONTRACT_INVALID`。
- stable fingerprint：`REV41R2_REVIEW_COORDINATOR_TIMEOUT_AND_MISSING_REVIEWER_PARENT`。
- launcher import-path defect 已修复并由 regression test 覆盖；role-contract suite 共 19 tests passed，deployed `revid-pm` SOUL 与 template 一致，`ROLE_CONTRACTS_OK`。
- revision 41 REPORT、业务 diff 与 evidence 未变化；Independent REVIEW 与 HANDOFF 仍不存在。

## Decision

Revision 41r2 terminal，不得 retry、claim、promote、unblock、reparent、删除或复用 `t_c2180c46`、run #170/#171 与 keys。

发布唯一 fresh lifecycle revision `phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-05-41r3`。它不是 business REWORK，不修改业务代码；只允许 fresh `revid-pm / REVIEW_DISPATCH_ONLY` Coordinator 创建一个 Reviewer child 与一个依赖 Reviewer 的 HANDOFF child。Reviewer create 必须显式使用 `parents: [当前 rev41r3 Coordinator card ID]`。Coordinator budget 为 300s，任一 mismatch fail-closed。

Human Decision Required: `NO`。Human Owner 已明确要求立即解决 runtime blocker 并推进既有任务。

