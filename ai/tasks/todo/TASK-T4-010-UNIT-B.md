# Task: T4-010 Unit B — Browser and Interaction Closure

## Metadata

- Task ID: `T4-010-UNIT-B`
- Planned Revision: `phase4-wave3-workspace-shell-unit-b-browser-continuation-2026-07-04-38`
- Status: `PMC_BLOCKED — REV38 REQUIRED BROWSER EVIDENCE MISSING / NOT EXECUTABLE`
- Executor: `revid-frontend`
- Reviewer: `revid-reviewer`
- Dependencies: T4-010 Unit A stage acceptance ✅; frontend bounded runtime readiness ✅
- Inherited Failure Fingerprints: `REV31_DISPATCHER_TERMINAL_TOOL_NOT_ALLOWED`; `REV32_EXECUTOR_ITERATION_BUDGET_EXHAUSTED_WITH_UNCANONICAL_ARTIFACTS`; `REV33_EXECUTOR_CHILD_CONTRACT_INVALID_120S_DISPATCH_PAYLOAD`; `REV35_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION`

## Objective

在 Unit A 静态/build closure 基础上，仅完成真实浏览器、responsive、keyboard、ARIA、console/network 与视觉 evidence；只修复由这些验证直接发现的 T4-010 Allowed Files 缺陷。

## Allowed Business Files

- `frontend/src/views/app/Workspace.vue`
- `frontend/src/views/app/components/workspace/WorkspaceToolRail.vue`
- `frontend/src/views/app/components/workspace/WorkspaceInspector.vue`
- `frontend/src/views/app/components/workspace/WorkspacePromptDock.vue`
- `frontend/src/views/app/components/workspace/WorkspaceStatusBar.vue`

CanvasStage、CanvasStore、router、API、backend、Home、Space 和 global design tokens 只读。

## Allowed Artifacts

- `ai/tasks/doing/TASK-T4-010-UNIT-B-PLAN.md`
- `ai/tasks/doing/TASK-T4-010-UNIT-B-PROGRESS.md`
- `ai/reports/REPORT-T4-010-UNIT-B.md`
- `ai/evidence/T4-010/unit-b/`

所有 artifact 必须使用 project-root absolute path。禁止写入 `frontend/ai/`。

## Acceptance Criteria

- `1440x900`：76px overlay Tool Rail、320px Inspector、Canvas 与 Prompt Dock 几何关系通过。
- `920x900`：Inspector drawer、Tool Rail/Canvas controls 无重叠。
- `375x812`：无 horizontal overflow，Prompt action 可见，drawer 可关闭，长中文文本适配。
- Tabs、tools、drawer、Prompt action 支持 keyboard、focus-visible、ARIA 与 reduced motion。
- 记录每个 viewport screenshot、`scrollWidth <= clientWidth`、console errors 与 failed network requests。
- generation/loading/success/error/quota/selected-node 行为保持；缺少 `project_id` 时不伪造 ID 或发起依赖 context 操作。
- final build 与 scoped `git diff --check` 通过。

## Stop After

`T4_010_UNIT_B_BROWSER_REPORT_READY`。等待 PMC 决定 Independent Review continuation；不得自行创建 Reviewer/HANDOFF。

## Runtime Gate

Runtime gate 已通过。Revision 34 的 fresh Dispatcher/Frontend chain 在授权 budget 内完成，并在 project root 写出 canonical PLAN、PROGRESS、REPORT；Unit A fresh build 与 diff checks 由 PMC 复核通过。Revision 35 必须使用 fresh cards 与 idempotency keys并继承 rev31/rev32/rev33 fingerprints，不得复用历史 chain。

Revision 35 已使用 fresh Dispatcher `t_34e9113b` 创建 Executor `t_7200189b`，但 Executor run `#156` 在 594 秒后以 `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION` terminal blocked。Unit B PLAN、PROGRESS、REPORT 与 evidence 均缺失。该 revision 不得 retry、复用、进入 Reviewer/HANDOFF 或产生 revision 36；解阻需先满足 `ai/reviews/REVIEW-T4-010-PMC-RUNTIME-ADVISORY-REV35-2026-07-04.md` 的 fresh runtime diagnostic 与 reconciliation 条件。

Fresh diagnostic verdict 为 `STILL_INFRA_BLOCKED`：runtime 未捕获 exit code、stdout/stderr、stack 或 exception，也没有 fresh same-profile terminal smoke。PMC 已在 `ai/reviews/REVIEW-T4-010-PMC-RUNTIME-DIAGNOSTIC-REV35-2026-07-04.md` 驳回 continuation。未来只有 fresh runtime remediation 同时补齐 process evidence capture 和 explicit terminal-transition smoke，才允许重新评估 Unit B。

2026-07-04 fresh root-cause audit 已从 rev35 worker log 取得 stdout/stderr traceback：Windows background process byte `0xB4` 触发 strict UTF-8 `_readerthread` decode failure，随后 agent plain-text clean exit 0。当前 runtime baseline 的 `errors="replace"` remediation 已通过 direct invalid-byte smoke、full runtime `26 passed` 与 `ROLE_CONTRACTS_OK`。唯一 executable Queue 现为 runtime revision 37；只有该 fresh `revid-frontend` card 显式 terminal PASS 后，PMC 才发布新的 Unit B continuation。Revision 35 与其 cards/keys 继续 terminal immutable。

Revision 37 已通过：Dispatcher `t_95b6b112` 与 Executor `t_9f86c667` 均 terminal done，invalid-byte process exit `0`、U+FFFD replacement 生效、无 reader-thread crash，Executor 显式返回 `READY_FOR_CONTINUATION_RUNTIME_ONLY`。PMC 因此发布 revision 38；必须使用 fresh cards/keys，并继续继承 rev31/rev32/rev33/rev35 fingerprints。

Revision 38 已到达 `REPORT_READY`，但 REPORT 仅披露实际 browser viewport `1264x625`，没有完成 Task 要求的精确 `1440x900`、`920x900`、`375x812` 三 viewport 真实验证；`ai/evidence/T4-010/unit-b/` 目录及 screenshots、逐 viewport console/network/overflow artifacts 均不存在。Fresh PMC build 与 scoped diff check 通过，但不能替代 browser evidence。该 revision 以 fingerprint `REV38_REQUIRED_BROWSER_VIEWPORT_AND_SCREENSHOT_EVIDENCE_MISSING` terminal `PMC_BLOCKED`，不得进入 Reviewer/HANDOFF 或复用 cards/keys。Attempt Policy 禁止 automatic business REWORK；只有 fresh PMC authorization 才能发布 bounded evidence correction。正式审查：`ai/reviews/REVIEW-T4-010-PMC-UNIT-B-REV38-BLOCKED-2026-07-04.md`。
