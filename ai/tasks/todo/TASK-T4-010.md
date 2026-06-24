# Task: Workspace 组件拆分与目标布局

## Task ID
T4-010

## Phase
Phase 4C — 前端视觉与页面

## Category
Frontend / Workspace Shell

## Priority
P0

## Assigned To
Frontend Executor

## Objective
在不实现新 Canvas 数据协议的前提下，将 Workspace 重构为 v3 指定布局并拆分 900+ 行单文件。

## Chosen Technology and Components
- Vue 3 local components + Pinia。
- Naive UI `NDrawer` 用于移动端右侧面板、`NTabs` 用于 Inspector、`NButton/NTooltip` 用于工具栏。
- lucide-vue-next 图标；CSS transition/Anime.js 仅用于必要状态动效。

## Scope
- 允许修改：`frontend/src/views/app/Workspace.vue`、PromptComposer、AppTopBar 的 Workspace 适配。
- 允许新增：`views/app/components/workspace/WorkspaceToolRail.vue`、`WorkspaceInspector.vue`、`WorkspacePromptDock.vue`、`WorkspaceStatusBar.vue` 等局部组件。
- 禁止修改：CanvasStage 核心 pointer/connection 逻辑、backend、Home、Space。

## Dependencies
T4-006 已审查通过。

## Implementation Requirements
1. 桌面布局：左侧 76px 半透明浮动工具栏、中央 canvas、右侧 320px inspector、底部 Prompt Dock。
2. 工具栏 absolute overlay，不占主 grid column；不遮挡关键 Canvas controls。
3. 920px 以下 inspector 使用 drawer，工具栏转为适合触控的底部/浮动布局。
4. project ID 必须来自 route，不再依赖固定 demo project。
5. Workspace.vue 控制在 500 行以内；局部组件 props/emits 类型完整。
6. 保持现有生成状态和错误提示行为，不在本任务重写 CanvasStore。

## Acceptance Criteria
- [ ] 1440×900 精确满足 v3 尺寸；920px/375px 无遮挡或横向滚动。
- [ ] Tool、Inspector tab、Prompt submit 和 drawer 均可键盘操作。
- [ ] `npm run build` 通过。
- [ ] Workspace.vue 不超过 500 行。
- [ ] 未改变 Canvas connection/persistence 协议。

## Verification Commands
```powershell
cd frontend
npm run build
```

## Manual Acceptance
真实浏览器检查 1440×900、920px、375px，分别记录默认、右侧面板打开、Prompt 提交中截图。

## Deliverables
- Workspace shell 与局部组件。
- `ai/tasks/doing/TASK-T4-010-PLAN.md`
- `ai/tasks/doing/TASK-T4-010-PROGRESS.md`
- `ai/reports/REPORT-T4-010.md`

## Codex Prompt
只负责 Workspace shell 和组件拆分，不碰 Canvas 核心逻辑。编码前创建 PLAN/PROGRESS，严格按 v3 尺寸完成真实浏览器验证并写 REPORT。

