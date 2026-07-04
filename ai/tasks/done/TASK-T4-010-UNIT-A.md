# Task: T4-010 Unit A — Partial Diff Static and Build Closure

## Metadata

- Task ID: `T4-010-UNIT-A`
- Planned Revision: `phase4-wave3-workspace-shell-unit-a-static-build-2026-07-04-34`
- Status: `STAGE ACCEPTED — REVISION 34 REPORT_READY VERIFIED; UNIT B AUTHORIZED`
- Executor: `revid-frontend`
- Reviewer: `revid-reviewer`
- Dependency: T4-010 revisions 31/32/33 terminal reconciliation complete
- Previous Failure Fingerprints: `REV31_DISPATCHER_TERMINAL_TOOL_NOT_ALLOWED`; `REV32_EXECUTOR_ITERATION_BUDGET_EXHAUSTED_WITH_UNCANONICAL_ARTIFACTS`; `REV33_EXECUTOR_CHILD_CONTRACT_INVALID_120S_DISPATCH_PAYLOAD`
- Current Failure Fingerprint: `NONE — revision 34 completed and stage-accepted`

## Objective

保留 revision 32 已有 partial frontend diff，只完成静态 contract、ownership、line-count、TypeScript build 与 scoped diff closure。Unit A 不执行 browser，不创建 Reviewer/HANDOFF，不扩大 UI 范围。

## Allowed Business Files

- `frontend/src/views/app/Workspace.vue`
- `frontend/src/views/app/components/workspace/WorkspaceToolRail.vue`
- `frontend/src/views/app/components/workspace/WorkspaceInspector.vue`
- `frontend/src/views/app/components/workspace/WorkspacePromptDock.vue`
- `frontend/src/views/app/components/workspace/WorkspaceStatusBar.vue`

只允许为修复实际 build/type/static contract failure 做最小改动；若 baseline 已通过，不得重写现有 partial diff。

## Allowed Artifacts

- `ai/tasks/doing/TASK-T4-010-UNIT-A-PLAN.md`
- `ai/tasks/doing/TASK-T4-010-UNIT-A-PROGRESS.md`
- `ai/reports/REPORT-T4-010-UNIT-A.md`

所有 artifact 必须使用 project-root absolute path。禁止写入 `frontend/ai/`。

## Acceptance Criteria

- 精确列出并核对 revision 32 partial diff ownership；无未知 Allowed Files 修改。
- `Workspace.vue <= 500` 行，四个局部组件各 `< 500` 行，props/emits typed。
- route `project_id`、缺失 context 禁用、generation/quota/selected-node contract 通过静态审计。
- CanvasStage、CanvasStore、router、API、backend 与 global tokens 无 diff。
- `npm run build` exit `0`。
- scoped `git diff --check` exit `0`。
- REPORT 准确声明 Unit A 未做 browser/visual acceptance。

## Stop After

`T4_010_UNIT_A_STATIC_BUILD_REPORT_READY`。等待 PMC 决定 Unit B；不得创建 Reviewer、HANDOFF 或 Queue。

## Runtime Gate

Runtime gate 已通过。Rev33 `READY_FOR_CONTINUATION` addendum、canonical execution status、duplicate/malformed-row reconciler regressions、targeted `6 passed`、全部 runtime `21 passed`、`ROLE_CONTRACTS_OK`、`STATUS_OK`、无 active card 与 rev34 exact-contract dry-run 均已由 PMC 复核。Revision 34 使用 fresh Dispatcher/Executor idempotency keys并继承 rev31/rev32/rev33 fingerprints；不得复用任何旧 card 或 key。
