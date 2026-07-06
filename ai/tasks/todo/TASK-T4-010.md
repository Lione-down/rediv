# Task: Workspace 组件拆分与目标布局

## Task Metadata

- Task ID: `T4-010`
- Revision: `phase4-wave3-workspace-shell-continuation-2026-07-03-32`
- Status: `PMC_PASS — ARCHIVED IN PLACE / 2026-07-06`
- Phase: `Phase 4C — 前端视觉与页面`
- Category: `Frontend / Workspace Shell`
- Priority: `P0`
- Executor: `revid-frontend`
- Reviewer: `revid-reviewer`
- Dependency: `T4-006` 已 PMC PASS

## Objective

在不改变 Canvas 数据、connection 或 persistence contract 的前提下，将 925 行 `Workspace.vue` 拆成职责明确的局部组件，并实现 v3 Workspace shell：76px 左侧浮动 Tool Rail、中央 Canvas、320px Inspector、底部 Prompt Dock，以及 920px 以下的可访问 drawer/触控布局。

## Design Direction

- Visual thesis: 克制的暗色创作工作台，使用 design system 的 surface 色阶、固定 radius scale 与品牌紫色，不添加装饰性渐变或另一套 token。
- Content plan: 顶部项目上下文和状态，中央 Canvas，左侧工具，右侧资产/模板/属性 Inspector，底部生成入口。
- Interaction thesis: 所有工具和主操作保持 120ms 状态反馈与 `scale(0.96)` pressed state；drawer、tabs 与 Prompt submit 必须支持键盘和 reduced motion。

## Scope

Executor 可修改：

- `frontend/src/views/app/Workspace.vue`

Executor 可新增以下 Workspace 局部组件，文件名和职责不得扩展到全局组件层：

- `frontend/src/views/app/components/workspace/WorkspaceToolRail.vue`
- `frontend/src/views/app/components/workspace/WorkspaceInspector.vue`
- `frontend/src/views/app/components/workspace/WorkspacePromptDock.vue`
- `frontend/src/views/app/components/workspace/WorkspaceStatusBar.vue`

Executor 可创建：

- `ai/tasks/doing/TASK-T4-010-REV32-PLAN.md`
- `ai/tasks/doing/TASK-T4-010-REV32-PROGRESS.md`
- `ai/reports/REPORT-T4-010-REV32.md`
- `ai/evidence/T4-010/rev32/` 下的浏览器截图与只读验收证据

以下文件只读：

- `frontend/src/components/canvas/CanvasStage.vue`
- `frontend/src/components/common/PromptComposer.vue`
- `frontend/src/components/layout/AppTopBar.vue`
- `frontend/src/router/index.ts`
- `frontend/src/store/canvas.ts`
- backend、API contract、Home、Space 与全局 design tokens

## Implementation Requirements

1. Desktop baseline 为 `1440x900`：Tool Rail 以 76px 宽 absolute/fixed overlay 浮在 Canvas 左侧，不占主 grid column，不遮挡 Canvas 关键 controls；Inspector 固定 320px；Prompt Dock 位于 Canvas 底部可操作区域。
2. `920px` 以下 Inspector 必须使用 Naive UI `NDrawer`；Tool Rail 转为底部或浮动触控布局。`375px` viewport 不得横向滚动、遮挡 Prompt action 或产生不可关闭的面板。
3. Inspector 使用 Naive UI `NTabs` 保持 Assets、Templates、Properties 三个现有语义；不得新增未批准的业务 tab。
4. Workspace 项目上下文从现有 route 的 `project_id` query 读取，例如 `/app/workspace?project_id=demo-project`；不得修改 router contract，也不得继续使用固定 `PROJECT_NAME`。缺少 query 时必须显示明确的“未选择项目”状态，并禁用依赖 project context 的操作，不能伪造 ID。
5. 保持现有 tool mode、selected node、quota、generation loading、success/error message 与 asset prepend 行为。允许通过 typed props/emits 下沉展示，不允许重写 CanvasStore 或改变 generation endpoint/payload。
6. `Workspace.vue` 最终不超过 500 行；局部组件的 props/emits 必须完整 typed，单个新文件保持在 500 行以内。
7. 只使用 `ui/design-system.md` 与现有 SCSS tokens。Surface hierarchy 使用 background-color step 与必要 shadow；交互控件 radius 保持同类一致，不新增装饰性背景。
8. 所有 tool、tab、drawer trigger/close 与 Prompt submit 可用键盘完成；focus-visible、ARIA state、localized text fit 和 `prefers-reduced-motion` 必须可验证。

## Non-goals

- 不修改 CanvasStage pointer、zoom、node、connection 或 persistence 逻辑。
- 不实现新的 Canvas/project/API protocol，不接入文本生成，不改变 image/video request contract。
- 不修改 router、PromptComposer、AppTopBar、Home、Space、backend 或全局 design system。
- 不引入新的 UI library、global store、shared abstraction 或 unrelated refactor。

## Required Verification

```powershell
Set-Location frontend
npm run build
Set-Location ..
git diff --check -- frontend/src/views/app/Workspace.vue frontend/src/views/app/components/workspace
```

Executor 还必须在真实浏览器中验证 `/app/workspace?project_id=pmc-t4-010`：

- `1440x900`: 默认 Workspace、Inspector tab 切换、Prompt submit/loading 或当前真实 error state。
- `920x900`: Inspector drawer 打开/关闭、Tool Rail 与 Canvas controls 不重叠。
- `375x812`: Tool Rail、Prompt Dock、drawer、长中文文本、focus 顺序，无 horizontal overflow。
- 每个 viewport 记录截图、console error、failed network request 与 `scrollWidth <= clientWidth` 结果；不得用 build 代替 browser verification。

## Acceptance Criteria

- [ ] `npm run build` exit `0`，`git diff --check` exit `0`。
- [ ] `Workspace.vue <= 500` 行，所有新增组件均 `< 500` 行且 props/emits typed。
- [ ] 1440x900 的 76px Tool Rail、320px Inspector、Canvas 与 Prompt Dock 几何关系符合 Task，Tool Rail 不占主 grid column。
- [ ] 920px 与 375px 使用可关闭、可键盘操作的 `NDrawer`，无遮挡和 horizontal overflow。
- [ ] route query project context 取代固定 demo project；缺少 ID 时不伪造项目或发起依赖 project context 的操作。
- [ ] 现有 generation/loading/success/error/quota/selected-node 行为保持，CanvasStage、CanvasStore 与 API contract 无 diff。
- [ ] Tabs、tools、drawer 与 Prompt action 的 keyboard、focus-visible、ARIA 和 reduced-motion 验证有截图或浏览器证据。
- [ ] 实际 diff 只包含 Allowed Files、REV32 PLAN/PROGRESS/REPORT 与指定 evidence 目录。

## Hard Gates

- ACK 前运行 project-owned runtime deploy 与 `ROLE_CONTRACTS_OK` verifier。
- 未知 ownership 修改若触及 Allowed Files，立即 `BLOCKED`；任何无关用户或治理修改只记录并保护，不得覆盖。
- 禁止修改业务 contract、降低 browser verification、用静态截图替代真实交互或把 console/network error 省略出 REPORT。
- REPORT 必须准确区分 build、browser interaction、visual screenshot、network 与未验证项。

## Attempt Policy

- 本 revision 为 T4-010 initial business attempt `0`。
- 每张 card `max_retries=2` 表示 initial process run 加最多一次 process retry；process retry 不等于 business REWORK。
- REPORT_READY 后停止，由 PMC 决定 Independent Review continuation、REWORK、BLOCKED 或 PASS；Executor 不得创建 Reviewer、HANDOFF 或下一 Task。

## Stop Condition

完成 REV32 PLAN、PROGRESS、Allowed Files、browser evidence 与 REPORT 后，在 `T4_010_WORKSPACE_SHELL_REPORT_READY_REV32` 停止。

## Runtime Continuation — Revision 32

PMC 已独立复核 synthetic parent `t_0f9c7dac` / child `t_413f6846`：真实 `revid-dispatcher / DISPATCH_ONLY` run `#144` 直接使用 `kanban_create`，未调用 `terminal`，只创建一个正确关联的 child，并在预算内正常完成；旧 revision 31 card `t_2e03b521` 未被修改。UTF-8-safe verifier exit `0`，19 tests 通过。因此授权 fresh continuation `phase4-wave3-workspace-shell-continuation-2026-07-03-32`，继承 fingerprint `REV31_DISPATCHER_TERMINAL_TOOL_NOT_ALLOWED`，business attempt 仍为 `0`。旧 rev31 card/run/key 保持 terminal evidence，不得删除、重试或复用。正式审查：`ai/reviews/REVIEW-T4-010-PMC-RUNTIME-CONTINUATION-AUTHORIZATION-REV32-2026-07-03.md`。

该 continuation 已在 Executor 阶段 terminal：card `t_6837871b` 的 run `#147` 耗尽 90/90 iteration，retry run `#148` 随后 `gave_up`。Canonical REPORT 缺失、指定 evidence 目录为空，且 retry 将 PLAN/PROGRESS 写入越界的 `frontend/ai/`。这不是 business REWORK，也不是 `REPORT_READY`。Stable fingerprint 为 `REV32_EXECUTOR_ITERATION_BUDGET_EXHAUSTED_WITH_UNCANONICAL_ARTIFACTS`；revision 32 不得重派、retry、claim、promote、unblock、复用或进入 Reviewer/HANDOFF。正式 advisory：`ai/reviews/REVIEW-T4-010-PMC-RUNTIME-ADVISORY-REV32-2026-07-03.md`。

Hermes runtime diagnostic verdict 为 `STILL_INFRA_BLOCKED`。PMC 审阅后确认它没有提供 project-root artifact handling、bounded same-profile execution viability 或足够 runtime log/stack 证据，因此不发布 revision 33，也不调整 Executor budget。Revision 32 继续 terminal/non-executable；只有 fresh remediation evidence 满足 Queue resume condition 后才重新考虑 continuation。正式审查：`ai/reviews/REVIEW-T4-010-PMC-RUNTIME-DIAGNOSTIC-REV32-2026-07-03.md`。

Hermes terminal reconciliation 的重复回退已通过 project-owned deterministic reconciler 根治：Queue/Task hash、terminal Action、Queue Status、diagnostic 与 confirmation 现在按 pending/acknowledged 两阶段原子校验，`DIAGNOSTIC_READY` 后 due 保留为已满足历史 SLA，不再每轮刷新。当前同 revision/fingerprint reconciliation complete，Queue 继续 terminal/non-executable；这不改变 `STILL_INFRA_BLOCKED` verdict，也不构成 continuation 授权。历史 closure：`ai/reviews/REVIEW-T4-010-PMC-REV32-TERMINAL-RECONCILIATION-CLOSED-2026-07-03.md`；regression review：`ai/reviews/REVIEW-T4-010-PMC-REV32-EXECUTION-STATUS-REGRESSION-2026-07-03.md`；root fix：`ai/runtime/PLAN-PROGRESS-HERMES-STATUS-RECONCILIATION-2026-07-03.md`。

## Runtime Block — Revision 31

Coordinator `t_2e03b521` run `#141` 在创建 Executor 前因 `ROLE_BOUNDARY_VIOLATION` terminal。Stable fingerprint：`REV31_DISPATCHER_TERMINAL_TOOL_NOT_ALLOWED`。本 revision 不得重派、retry 或复用；在 fresh same-profile runtime health evidence 获 PMC 审阅前，不授权 continuation。正式 advisory：`ai/reviews/REVIEW-T4-010-PMC-RUNTIME-ADVISORY-REV31-2026-07-02.md`。

2026-07-03 fresh diagnostic 正确定位 direct `kanban_create` least-privilege 方向，但没有提交已实现 source remediation、regression、deploy/verifier 或实际 same-profile smoke。PMC 已驳回其 `READY_FOR_CONTINUATION` 结论；revision 31 继续 terminal/non-executable。正式审查：`ai/reviews/REVIEW-T4-010-PMC-RUNTIME-DIAGNOSTIC-REV31-2026-07-03.md`。

随后提交的 runtime source/tests 仍未解阻：PMC fresh rerun 确认 19 tests 通过，但 deploy/verifier exit `1`，真实 same-profile smoke 缺失，受限 worker 如何无 `terminal` 执行 Python launcher 也未被证明。execution status 改写 fingerprint、使用非 canonical owner state/action type 并要求 PMC 删除 terminal card，构成 `STATE_CONFLICT`。正式审查：`ai/reviews/REVIEW-T4-010-PMC-RUNTIME-FIX-VERIFICATION-REV31-2026-07-03.md`。

## Bounded Continuation Split（planned, blocked）

PMC 已把剩余工作拆为两个独立 gate：`TASK-T4-010-UNIT-A.md` 只收口 revision 32 partial diff 的 ownership、static contract、line counts、build 与 scoped diff；`TASK-T4-010-UNIT-B.md` 仅在 Unit A PMC acceptance 后执行三 viewport browser/interaction/visual evidence 与直接缺陷修复。两者继承 rev31/rev32 fingerprints，均禁止 `frontend/ai/`，且当前都不构成 executable Queue。

Fresh default Supervisor paused smoke 已 `STATUS_OK / NO_MUTATION`，launcher runtime tests 与 deploy verifier通过，Revid cron 已恢复。但 `revid-frontend` profile 的 bounded smoke 未解阻：前两次分别扩大为业务审计和 mandatory project preflight；canonical/deployed SOUL 增加 `RUNTIME-SMOKE-` fast path 并通过 `ROLE_CONTRACTS_OK` 后，第三次 session `20260703_165209_783f5c` 在 15.7 秒内安全退出，却只有 assistant `...`、零 tool calls、零 evidence。三种路径均失败，已 hard-stop；在 runtime owner 解释 no-tool-call root cause 并提供 fresh same-profile evidence 前，不发布 Unit A revision 33。
