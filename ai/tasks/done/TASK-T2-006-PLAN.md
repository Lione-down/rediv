# TASK-T2-006 Plan

## Goal

对 `Home.vue`、`Workspace.vue`、`Space.vue` 三个已迁移页面做响应式验证，修复 375px、768px、1024px 断点下的布局断裂与溢出问题，并保持桌面布局方向不变。

## Scope

- `frontend/src/views/app/Home.vue`
- `frontend/src/views/app/Workspace.vue`
- `frontend/src/views/app/Space.vue`
- 必要时允许调整：
  - `frontend/src/components/layout/AppTopBar.vue`
  - `frontend/src/components/common/PromptComposer.vue`
  - `frontend/src/components/canvas/CanvasStage.vue`

## Steps

1. 启动前端并检查三个页面在 desktop、1024px、768px、375px 下的实际表现。
2. 记录每个页面的具体 responsive 问题，只修改与断点布局、溢出、可点击性相关的样式。
3. 复查三个页面在关键断点下的结果，确认无明显横向溢出和交互遮挡。
4. 运行 `cd frontend && npm run build` 验证构建通过。
5. 更新进度文档并生成 `ai/reports/REPORT-T2-006.md`。

## Success Criteria

- Home 页面在 375px 下无横向溢出，hero、快捷入口、按钮布局可用。
- Workspace 页面在 375px 下工具栏、底部操作条、侧边面板切换可用，画布区域不被固定元素压坏。
- Space 页面在 375px 下 tab 可横向滚动，内容区单列展示，无按钮或文本截断。
- 三个页面在 768px / 1024px 下无明显布局断裂。
- `npm run build` 通过。
