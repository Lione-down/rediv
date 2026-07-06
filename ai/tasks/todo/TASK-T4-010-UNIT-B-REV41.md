# Task: T4-010 Unit B Revision 41 — Responsive Remediation and Interaction Closure

## Metadata

- Task ID: `T4-010-UNIT-B-REV41`
- Revision: `phase4-wave3-workspace-shell-unit-b-responsive-remediation-2026-07-05-41`
- Status: `PMC_PASS — REVIEW PASS / HANDOFF_READY REV41R7`
- Action: `DISPATCH_ONLY`
- Executor: `revid-frontend`
- Reviewer: `revid-reviewer`（本 revision 未授权）
- Business Attempt: `1`（T4-010 唯一 business REWORK）
- Previous Failure Fingerprint: `REV40_RESPONSIVE_DRAWER_PROMPT_OVERLAP_AND_INTERACTION_EVIDENCE_INCOMPLETE`
- Inherited Evidence Fingerprint: `REV38_REQUIRED_BROWSER_VIEWPORT_AND_SCREENSHOT_EVIDENCE_MISSING`

## Objective

最小修复 revision 40 证明的 responsive/interaction 缺陷：移动 Inspector drawer 不得遮挡 Prompt Dock 或 Prompt action；缺少 `project_id` 时必须阻止依赖项目上下文的生成操作；消除 Prompt Dock 的 `NButton` component-resolution warning。随后用真实浏览器完成 Unit B 的 exact viewport、keyboard、ARIA、reduced-motion、console/network 与 state-preservation closure。

## Allowed Business Files

- `frontend/src/views/app/Workspace.vue`
- `frontend/src/views/app/components/workspace/WorkspacePromptDock.vue`

以下文件只读，并必须保持 revision 40 SHA256：

- `frontend/src/views/app/components/workspace/WorkspaceToolRail.vue`: `76069E5692A7BD65F1E7177DDC54DF00BF8104FF870B7DA8EA8803D10B689C75`
- `frontend/src/views/app/components/workspace/WorkspaceInspector.vue`: `0E286CF79A58F001B568273CA0122641FD15B72D8CB05FC66B93A08E6A460FF6`
- `frontend/src/views/app/components/workspace/WorkspaceStatusBar.vue`: `989760912D31A9754A65C8D290CA501EB04EC6EDC384001874D55AF4E3605F7F`

CanvasStage、CanvasStore、router、API、backend、Home、Space、global design tokens 和所有其他业务文件只读。

## Allowed Artifacts

- `ai/tasks/doing/TASK-T4-010-UNIT-B-REV41-PLAN.md`
- `ai/tasks/doing/TASK-T4-010-UNIT-B-REV41-PROGRESS.md`
- `ai/reports/REPORT-T4-010-UNIT-B-REV41.md`
- `ai/evidence/T4-010/unit-b/rev41/`

不得覆盖 revision 38/39/40 artifacts，禁止写入 `frontend/ai/`。

## Implementation Requirements

1. 保持现有 Naive UI `NDrawer`、design tokens 和 component boundaries；只做解除遮挡所需的最小布局/state wiring，不另起 responsive system。
2. Drawer 打开时 Prompt Dock 不得位于其上方并阻塞 drawer content；drawer 关闭后 Prompt action 必须恢复可见、可聚焦和可操作。
3. `project_id` 缺失时，生成 action 必须显式 disabled 或在调用边界 fail-closed，并提供清晰本地提示；不得调用 image/video generation endpoint，不得伪造 ID。
4. 正确导入/注册 `NButton`，消除 `<n-button>` resolution warning；不得改为无障碍语义更弱的替代控件。
5. 保持 CanvasStore、selected node、quota、loading、success/error、asset prepend、endpoint 和 payload contract 不变。

## Required Browser Evidence

必须使用 `browser_set_viewport` 与 `browser_screenshot(full_page=False)`；禁止 JavaScript viewport override、CSS transform/scale、browser zoom、静态 inference 或非目标 viewport 替代。

- `1440x900`: 76px overlay Tool Rail、320px Inspector、Canvas 与 Prompt Dock 无遮挡；tabs、tools、Prompt action keyboard trace。
- `920x900`: drawer open/close keyboard trace；drawer 与 Prompt Dock/Prompt action 无遮挡；截图和 bounding boxes。
- `375x812`: drawer 可关闭，Prompt action 可见，长中文文本适配，无 horizontal overflow；截图和 bounding boxes。
- 每个 viewport 记录 target/actual read-back、PNG dimensions/path/SHA256/bytes/time、`scrollWidth <= clientWidth`、console errors/warnings、failed network requests。
- 提供 focus-visible、ARIA state、focus order 与 reduced-motion 的真实 browser evidence；不能执行的项目必须使本 revision BLOCKED，不得写 PASS。
- 无 `project_id` 的 guarded generate interaction 必须证明相关 API request 数为 `0`；有测试 project context 时只允许验证当前环境可安全执行的真实 error/loading path，不得伪造 success、使用 secret 或访问生产数据。
- 记录 quota 与 selected-node preservation；generation success 若环境没有安全、现成的非生产 endpoint，必须准确标记未验证并沿用 Unit A source-preservation evidence，不得执行未授权 external call。

## Acceptance Criteria

- 两个 Allowed Business Files 之外无业务 diff；三个 protected component hashes 不变。
- revision 40 的两处 drawer/Prompt overlap 均消失，Prompt action 在 drawer closed state 可见且可操作。
- 缺少 `project_id` 时没有 project-dependent network request；UI 给出清晰 disabled/guarded state。
- 三个 exact viewports、三张 fresh PNG、完整 console/network/overflow/geometry/keyboard/ARIA/reduced-motion evidence 齐全。
- 无 `NButton` component-resolution warning，无新增 console error。
- `npm run build` 与 scoped/full `git diff --check` exit `0`。
- PLAN、PROGRESS、REPORT 与实际 diff/evidence 一致，并显式 terminal transition。

## Attempt Policy

这是 T4-010 唯一 business REWORK attempt `1`；runtime 最多一次 process retry。任一 Acceptance Criterion 或 Hard Gate 失败时 terminal `PMC_BLOCKED`，不得发布 attempt `2` 或自动 continuation。

## Stop After

`T4_010_UNIT_B_REV41_REMEDIATION_REPORT_READY`

等待 PMC queue decision；不得创建 Independent REVIEW、HANDOFF、下一 revision 或其他 worker。

## Review Lifecycle Continuation — Revision 41r1

PMC 已审计 revision 41 REPORT、actual diff、fresh build、protected hashes 与 PNG dimensions/hashes，未发现必须在 Independent Review 前直接收口的明确失败。正式授权：`ai/reviews/REVIEW-T4-010-PMC-REV41-REVIEW-LIFECYCLE-AUTHORIZATION-2026-07-05.md`。

Queue revision `phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-05-41r1` 只允许 `revid-pm / REVIEW_DISPATCH_ONLY` 创建：

1. 一个 `revid-reviewer / INDEPENDENT_REVIEW_ONLY` card，唯一输出 `ai/reviews/REVIEW-T4-010-UNIT-B-REV41.md`；
2. 一个依赖 Reviewer 的 `revid-pm / HANDOFF_ONLY` card，仅在 Reviewer PASS 后写 `ai/handoffs/HANDOFF-T4-010-UNIT-B-REV41-POST-REVIEW.md`。

Reviewer 必须联合审查 master T4-010、Unit A REPORT、revision 41 REPORT、actual diff 与三个 exact viewport，独立复跑 build、diff、browser、network、keyboard、ARIA、focus、reduced-motion、geometry 和 missing-`project_id` zero-request guard。不得修改业务代码、Executor artifacts 或既有 evidence。Reviewer 非 PASS 时 HANDOFF 必须 block；revision 41 已使用唯一 business REWORK attempt，不授权 attempt 2。

Stop at `T4_010_HANDOFF_READY_REV41` for Codex PMC final acceptance.

Revision 41r1 is terminal with diagnostic verdict `STILL_INFRA_BLOCKED`. Human Owner subsequently directed PMC to resolve the PMC/Hermes deadlock. PMC identified the circular proof/authorization gate and published fresh bounded lifecycle Task `ai/tasks/todo/TASK-T4-010-UNIT-B-REV41R2.md`. Revision 41r2 inherits the rev41r1 fingerprint and authorizes only a fresh Reviewer/HANDOFF lifecycle; it does not authorize business re-execution or old-card reuse. Formal decision: `ai/reviews/REVIEW-T4-010-PMC-REV41R2-LIFECYCLE-DEADLOCK-RESOLUTION-2026-07-05.md`.
