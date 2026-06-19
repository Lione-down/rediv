# TASK-T2-002 Plan

## Task ID

TASK-T2-002

## Objective

将 `frontend/src/views/app/Workspace.vue` 调整为符合 `ui/design-direction.md` 的 app shell，并按需微调 `frontend/src/components/canvas/CanvasStage.vue`，确保桌面端与移动端布局都满足任务验收标准。

## Scope

- `frontend/src/views/app/Workspace.vue`
- `frontend/src/components/canvas/CanvasStage.vue`
- `ai/reports/REPORT-T2-002.md`
- `ai/tasks/doing/TASK-T2-002-PROGRESS.md`

## Constraints

- 只做当前任务要求的前端布局迁移。
- 不改后端代码、API 路由、其他页面和画布交互逻辑。
- 保持 Vue 3 + TypeScript + SCSS + CSS variables 现有风格。

## Implementation Steps

1. 重构 `Workspace.vue`，建立顶栏 + 左工具栏 + 中央画布 + 右侧面板的 app shell。
2. 将工具栏职责从 `CanvasStage.vue` 移回 `Workspace.vue`，保留画布渲染与节点展示职责。
3. 补齐右侧 Tabs、节点属性区、额度与资产摘要，并完成移动端底部工具栏与抽屉式面板。
4. 调整 `CanvasStage.vue` 的尺寸占位、背景网格和移动端表现，确保画布持续占据剩余空间。
5. 运行 `cd frontend && npm run build` 完成构建验证，并更新进度文档与报告。

## Success Criteria

- 桌面端满足 52px 顶栏、56px 左工具栏、320px 右侧面板、中央画布自适应。
- 移动端在 `<=920px` 时切到底部工具栏，并折叠右侧面板。
- 构建通过，无新增任务范围外修改。
