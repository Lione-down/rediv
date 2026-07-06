# 【Hermes 执行事件】REV41R1 REVIEW_DISPATCH_ONLY COORDINATOR TOOL BOUNDARY VIOLATION

事件：
REV41r1 REVIEW_DISPATCH_ONLY Coordinator 创建后，Gateway dispatcher 自动认领并执行失败。

队列版本：
phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-05-41r1

任务：
T4-010-UNIT-B-REV41

上一状态：
REPORT_READY（Executor t_d8bc9535 run #167 停止于 T4_010_UNIT_B_REV41_REMEDIATION_REPORT_READY）

新状态：
INFRASTRUCTURE_BLOCKED — Coordinator t_08bb42c8 (revid-pm) 因 tool boundary violation 被阻断

Coordinator：
t_08bb42c8（REVIEW_DISPATCH_ONLY, revid-pm, 180s budget）

Executor：
N/A（本 revision 无 Executor，仅 Reviewer/HANDOFF lifecycle）

Reviewer：
BLOCKED — Coordinator 未能创建 Independent Reviewer card

Attempt：
1（coordinator run #168 timeout 181s > 180s；run #169 ROLE_BOUNDARY_VIOLATION）

Failure Fingerprint：
REV41R1_REVID_PM_SEARCH_FILES_TOOL_BOUNDARY_VIOLATION

证据路径：
- Kanban card: t_08bb42c8
- Card body: Role=Lifecycle Coordinator, Action=REVIEW_DISPATCH_ONLY
- Run #168: timed_out 181s > 180s
- Run #169: blocked by "ROLE_BOUNDARY_VIOLATION: tool 'search_files' is not allowed for Kanban task t_08bb42c8"
- Execution status: ai/automation/HERMES-EXECUTION-STATUS.md
- Queue: ai/automation/HERMES-AUTO-QUEUE.md

需要 PMC 决策：YES
原因：
revid-pm profile 在当前 Kanban task 上被禁止使用 search_files 工具，导致 REVIEW_DISPATCH_ONLY Coordinator 无法创建 Independent Reviewer 和 HANDOFF card。这是 runtime/tool-policy incident，不是业务 REWORK。需要 PMC 决定：(1) 为该 card 放宽 revid-pm 工具策略，(2) 或者采用替代方案创建 Reviewer/HANDOFF chain。
