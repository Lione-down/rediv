# Task: T4-010 Unit B Revision 39 — Exact Browser Evidence Correction

## Metadata

- Task ID: `T4-010-UNIT-B-REV39`
- Revision: `phase4-wave3-workspace-shell-unit-b-browser-evidence-correction-2026-07-04-39`
- Status: `APPROVED — WAITING FOR HERMES ACK`
- Action: `DISPATCH_ONLY`
- Executor: `revid-frontend`
- Reviewer: `revid-reviewer`（本 revision 未授权）
- Dependency: revision 38 terminal ACK ✅
- Previous Failure Fingerprint: `REV38_REQUIRED_BROWSER_VIEWPORT_AND_SCREENSHOT_EVIDENCE_MISSING`

## Objective

只补齐 T4-010 Unit B 缺失的真实 browser evidence。不得修改业务代码；若真实浏览器验证发现缺陷，准确记录并以 REPORT_READY 停止，由 PMC 决定后续 bounded fix。

## Scope

### Read-only Business Files

- `frontend/src/views/app/Workspace.vue`
- `frontend/src/views/app/components/workspace/WorkspaceToolRail.vue`
- `frontend/src/views/app/components/workspace/WorkspaceInspector.vue`
- `frontend/src/views/app/components/workspace/WorkspacePromptDock.vue`
- `frontend/src/views/app/components/workspace/WorkspaceStatusBar.vue`

CanvasStage、CanvasStore、router、API、backend、Home、Space、global design tokens 和所有其他业务文件均只读。

### Allowed Artifacts

- `ai/tasks/doing/TASK-T4-010-UNIT-B-REV39-PLAN.md`
- `ai/tasks/doing/TASK-T4-010-UNIT-B-REV39-PROGRESS.md`
- `ai/reports/REPORT-T4-010-UNIT-B-REV39.md`
- `ai/evidence/T4-010/unit-b/rev39/`

所有 artifact 必须写入 project root；禁止写入 `frontend/ai/`，禁止覆盖 revision 38 的 PLAN、PROGRESS、REPORT。

## Required Evidence

对 `1440x900`、`920x900`、`375x812` 三个 viewport 分别提供：

- viewport 设置后的 `window.innerWidth`、`window.innerHeight` read-back，必须与目标值精确一致；
- 可独立查看的 full-page 或 viewport screenshot；
- `document.documentElement.scrollWidth`、`clientWidth` 和 `scrollWidth <= clientWidth` 结果；
- console error/warning 记录；
- failed network request 记录，区分预期不可用 endpoint 与非预期失败；
- Tool Rail、Inspector/drawer、Canvas、Prompt Dock 的关键 bounding boxes；
- 对应 evidence 文件路径和 SHA256。

另外必须记录：

- keyboard 操作：tabs、tools、drawer close、Prompt action；
- focus-visible、ARIA roles/states、reduced-motion；
- `920x900` drawer 开关与 Tool Rail/Canvas controls 无重叠；
- `375x812` Prompt action 可见、drawer 可关闭、长中文文本适配；
- generation/loading/success/error/quota/selected-node 状态保持；
- 无 `project_id` 时不伪造 ID、不发起依赖 project context 的操作；
- final `npm run build` 与 scoped `git diff --check`。

## Hard Gates

- Pre-execution read-only baseline SHA256:
  - `Workspace.vue`: `CC42C75E4CB22A6C5DA2827428C9561D9C1B65C024F31ED518B00C576D688437`
  - `WorkspaceToolRail.vue`: `76069E5692A7BD65F1E7177DDC54DF00BF8104FF870B7DA8EA8803D10B689C75`
  - `WorkspaceInspector.vue`: `0E286CF79A58F001B568273CA0122641FD15B72D8CB05FC66B93A08E6A460FF6`
  - `WorkspacePromptDock.vue`: `F19F28C9FBAEAE3AB6F005416B658D5CEE13EB40C83F1328AE61042717005711`
  - `WorkspaceStatusBar.vue`: `989760912D31A9754A65C8D290CA501EB04EC6EDC384001874D55AF4E3605F7F`
- 不得以 CSS source、computed-style inference 或非目标 viewport 替代三个精确 viewport 的真实 browser evidence。
- 截图和结构化结果必须来自同一次 fresh revision 39 browser session，并包含可核对的 target/actual viewport。
- 不得把 skipped、未执行或仅静态推断项目写成 PASS。
- 五个 read-only business files 的 SHA256 必须在执行前后保持一致。
- 不读取或输出 secret，不访问生产数据，不执行 destructive operation。
- 不复用 revision 38 cards、runs、idempotency keys 或 artifacts。

## Attempt Policy

一个 evidence-only attempt；runtime 最多两次 process retries；无 automatic business REWORK。发现真实 UI defect、browser 无法设置精确 viewport、证据无法写入或任何 Hard Gate 失败时，写准确 REPORT 并停止，不修改业务文件。

## Stop After

`T4_010_UNIT_B_REV39_BROWSER_EVIDENCE_REPORT_READY`

等待 PMC queue decision；不得创建 Independent REVIEW、HANDOFF、下一 revision 或其他 worker。
