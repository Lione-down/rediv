# Task: T4-010 Unit B Revision 40 — Exact Tool Browser Evidence

## Metadata

- Task ID: `T4-010-UNIT-B-REV40`
- Revision: `phase4-wave3-workspace-shell-unit-b-exact-browser-evidence-2026-07-05-40`
- Status: `PMC_REWORK — TERMINAL / NOT EXECUTABLE`
- Action: `DISPATCH_ONLY`
- Executor: `revid-frontend`
- Reviewer: `revid-reviewer`（本 revision 未授权）
- Previous Failure Fingerprint: `REV38_REQUIRED_BROWSER_VIEWPORT_AND_SCREENSHOT_EVIDENCE_MISSING`（revision 39 重复；automatic retry 已熔断）

## Objective

使用已部署的 first-class browser evidence tools，为 T4-010 Unit B 生成三个精确 viewport 的真实截图和结构化证据。不得修改业务代码；发现 UI defect 时准确报告并停止。

## Scope

### Read-only Business Files

- `frontend/src/views/app/Workspace.vue`
- `frontend/src/views/app/components/workspace/WorkspaceToolRail.vue`
- `frontend/src/views/app/components/workspace/WorkspaceInspector.vue`
- `frontend/src/views/app/components/workspace/WorkspacePromptDock.vue`
- `frontend/src/views/app/components/workspace/WorkspaceStatusBar.vue`

CanvasStage、CanvasStore、router、API、backend、Home、Space、global design tokens 和所有其他业务文件均只读。

### Allowed Artifacts

- `ai/tasks/doing/TASK-T4-010-UNIT-B-REV40-PLAN.md`
- `ai/tasks/doing/TASK-T4-010-UNIT-B-REV40-PROGRESS.md`
- `ai/reports/REPORT-T4-010-UNIT-B-REV40.md`
- `ai/evidence/T4-010/unit-b/rev40/`

所有 artifact 必须写入 project root；禁止覆盖 revision 38/39 artifacts，禁止写入 `frontend/ai/`。

## Mandatory Tool Contract

- 必须使用 `browser_set_viewport(width, height)` 设置 viewport，并以该工具返回值及页面 read-back 验证 `window.innerWidth/innerHeight`。
- 必须使用 `browser_screenshot(full_page=False)` 生成真实 PNG，再复制到 revision 40 evidence 目录并记录 SHA256、PNG width/height 与文件大小。
- 禁止 JavaScript viewport override、`Object.defineProperty`、CSS transform/scale、browser zoom、静态 source/computed-style inference 或非目标 viewport 替代。
- 五分钟 preflight：先完成一个 `375x812` exact read-back 与 PNG。工具不可见、调用失败、尺寸不一致或 PNG 无效时立即写 BLOCKED REPORT 并停止，不得 fallback。

## Required Evidence

对 `1440x900`、`920x900`、`375x812` 分别提供：

- target/actual viewport 精确一致的 read-back；
- 真实 viewport screenshot，PNG dimensions 必须与 target 一致；
- `document.documentElement.scrollWidth`、`clientWidth` 和 `scrollWidth <= clientWidth`；
- console error/warning 和 failed network request 记录；
- Tool Rail、Inspector/drawer、Canvas、Prompt Dock bounding boxes；
- evidence 文件路径、SHA256、byte size 与采集时间。

还必须记录 keyboard/focus-visible/ARIA/reduced-motion、920 drawer overlap、375 Prompt/drawer/长中文文本、generation/loading/success/error/quota/selected-node state preservation，以及无 `project_id` 时不伪造 ID、不触发依赖 project context 的操作。

## Hard Gates

- Pre/post SHA256 必须保持：
  - `Workspace.vue`: `CC42C75E4CB22A6C5DA2827428C9561D9C1B65C024F31ED518B00C576D688437`
  - `WorkspaceToolRail.vue`: `76069E5692A7BD65F1E7177DDC54DF00BF8104FF870B7DA8EA8803D10B689C75`
  - `WorkspaceInspector.vue`: `0E286CF79A58F001B568273CA0122641FD15B72D8CB05FC66B93A08E6A460FF6`
  - `WorkspacePromptDock.vue`: `F19F28C9FBAEAE3AB6F005416B658D5CEE13EB40C83F1328AE61042717005711`
  - `WorkspaceStatusBar.vue`: `989760912D31A9754A65C8D290CA501EB04EC6EDC384001874D55AF4E3605F7F`
- 三个 exact viewport、三张真实 PNG 和逐 viewport structured evidence 缺一即失败。
- 不得把 skipped、模拟、静态推断或未执行项目写成 PASS。
- 必须运行 final `npm run build`、scoped `git diff --check` 并显式 terminal transition。
- 不读取或输出 secret，不访问生产数据，不执行 destructive operation。
- 不复用 revision 38/39 cards、runs、keys、sessions 或 artifacts。

## Attempt Policy

一个 exact-tool evidence attempt；runtime 最多一次 process retry；无 automatic business REWORK。相同 evidence fingerprint 再现时直接 `PMC_BLOCKED`，不发布下一 revision。

## Stop After

`T4_010_UNIT_B_REV40_EXACT_BROWSER_EVIDENCE_REPORT_READY`

等待 PMC queue decision；不得创建 Independent REVIEW、HANDOFF、下一 revision 或其他 worker。

## PMC Closure

Revision 40 已完成 exact viewport/PNG evidence，但 `920x900` 与 `375x812` 均存在 drawer/Prompt Dock 遮挡，且 keyboard、reduced-motion、state interaction 与 network evidence 不完整。Terminal verdict：`PMC_REWORK`；fingerprint：`REV40_RESPONSIVE_DRAWER_PROMPT_OVERLAP_AND_INTERACTION_EVIDENCE_INCOMPLETE`。正式审查：`ai/reviews/REVIEW-T4-010-PMC-REV40-REWORK-AND-REV41-AUTHORIZATION-2026-07-05.md`。本 revision 不得进入 Reviewer/HANDOFF 或复用。
