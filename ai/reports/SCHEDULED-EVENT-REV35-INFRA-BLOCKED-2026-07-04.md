# 【Hermes 执行事件】

事件：
T4-010 Unit B revision 35 Executor 运行时故障 → INFRASTRUCTURE_BLOCKED

队列版本：
phase4-wave3-workspace-shell-unit-b-browser-2026-07-04-35 (rev 35)

任务：
T4-010-UNIT-B

上一状态：
EXECUTOR_RUNNING (Coordinator `t_34e9113b` DISPATCH_SUCCESS, Executor `t_7200189b` run #156 运行中)

新状态：
INFRASTRUCTURE_BLOCKED

Coordinator：
`t_34e9113b` — run #155 completed, DISPATCH_COMPLETE, atomic dispatch 成功创建 Executor 子卡

Executor：
`t_7200189b` — run #156 blocked, 运行 594 秒后退出，无 kanban_complete/kanban_block 调用

Reviewer：
未授权（Unit B 仅授权 IMPLEMENT_AND_TEST_ONLY，停止于 REPORT_READY）

Attempt：
0

Failure Fingerprint：
REV31_DISPATCHER_TERMINAL_TOOL_NOT_ALLOWED; REV32_EXECUTOR_ITERATION_BUDGET_EXHAUSTED_WITH_UNCANONICAL_ARTIFACTS; REV33_EXECUTOR_CHILD_CONTRACT_INVALID_120S_DISPATCH_PAYLOAD; REV35_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION

证据路径：
Kanban card `t_7200189b` run #156 summary: "WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION: worker returned without calling kanban_complete or kanban_block"
Kanban card `t_34e9113b` run #155 summary: "DISPATCH_COMPLETE: child created and parent committed atomically"

需要 PMC 决策：YES
原因：
1. rev35 Executor 运行时故障（`WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION`），属 runtime/process 故障 → INFRASTRUCTURE_BLOCKED，不得创建业务 REWORK 或新 revision
2. rev34 Unit A 已 stage-accept（REPORT_READY，8/8 AC 通过），等待 PMC 最终验收
3. 同一 `revid-frontend` profile 连续出现多次 terminal transition 失败（rev31/rev32/rev35），PMC 需评估是否需要统一 remediation
4. 确定性 gate（reconcile-hermes-execution-status.py）返回 exit 2（STATUS_RECONCILIATION_ERROR），因当前 Queue 为 executable DISPATCH_ONLY 而非 terminal，属预期行为
