# Task: 工作流页基础布局迁移（Workspace.vue）

## Task ID
T2-002

## Phase
Phase 2

## Objective
将 `Workspace.vue` 的基础布局与 `ui/design-direction.md` 的 app shell 规范对齐：顶栏 52px、左侧工具栏 56px、右侧面板 320px、画布占满剩余空间，并确保响应式折叠正确。

## Scope
- 修改的文件范围：
  - `frontend/src/views/app/Workspace.vue`（主体布局对齐）
  - `frontend/src/components/canvas/CanvasStage.vue`（如需微调尺寸/工具栏定位）
- 不涉及的文件范围：
  - 后端代码
  - Home.vue / Space.vue / Admin 页面
  - 画布节点交互逻辑（拖拽、连接、选中）— 那是 Phase 3 的工作

## Constraints
- 技术栈：Vue 3 + TypeScript + SCSS + CSS variables（OKLCH tokens）
- 严格遵循 `ui/design-direction.md` 的布局规范：
  - 顶栏高度：52px
  - 左侧工具栏宽度：56px，最多 5 个主工具
  - 右侧面板宽度：320px，最小 280px，最大 360px
  - 画布区域永远占据剩余最大空间
- 不引入 Tailwind 或 CSS-in-JS
- 不修改后端 API
- 不改变现有路由结构
- 响应式验证：桌面端 + 375px 移动端

## Acceptance Criteria
- [ ] Workspace.vue 使用 grid/flex 实现 app shell 布局：顶栏 + 左侧工具栏 + 画布 + 右侧面板
- [ ] 左侧工具栏宽度 56px，包含 5 个工具按钮（select/hand/text/image/generate），每个按钮 40px 命中区域，使用 `--accent-select` 浅背景表示 active 状态
- [ ] 右侧面板宽度 320px，包含 Tabs（Assets/Templates/Properties）和节点属性区域
- [ ] 画布区域占满剩余空间，背景使用 `--bg-canvas` + 极淡点阵网格
- [ ] 按钮动效符合设计方向（hover 120ms, active scale(0.96)）
- [ ] 移动端（≤920px）右侧面板折叠、工具栏变为底部
- [ ] `npm run build` 构建通过无报错
- [ ] 不修改任何后端文件或 API 路由

## Deliverables
- `frontend/src/views/app/Workspace.vue` — 迁移后的工作流页组件
- `frontend/src/components/canvas/CanvasStage.vue` — 如有布局微调
- `ai/reports/REPORT-T2-002.md` — 完成报告
- 自测截图或构建输出

## Codex Prompt
请执行以下任务：

1. 仔细阅读 `ui/design-direction.md` 第 6 节（布局原则），理解 app shell 的尺寸规范。
2. 阅读现有的 `frontend/src/views/app/Workspace.vue`，了解当前实现状态。
3. 阅读 `frontend/src/components/canvas/CanvasStage.vue`，了解画布组件的当前布局。
4. 重构 Workspace.vue 的基础布局：
   - 顶栏（AppTopBar）高度 52px
   - 左侧工具栏（56px 宽，5 个工具按钮：select/hand/text/image/generate）
   - 中央画布区域（CanvasStage，占满剩余空间）
   - 右侧面板（320px 宽，包含 Assets/Templates/Properties tabs 和节点属性）
5. 确保使用 design-direction.md 中定义的 CSS variables（OKLCH 色彩系统）。
6. 确保按钮动效符合规范（hover 120ms, active scale(0.96)）。
7. 确保响应式：桌面端多列布局，移动端（≤920px）右侧面板隐藏、工具栏底部化。
8. 运行 `npm run build` 验证构建通过。
9. 创建完成报告 `ai/reports/REPORT-T2-002.md`。

注意：
- 这是 Phase 2 的第二个任务，目标是让工作流页的基础布局达到设计规范级别。
- 不要改动画布节点的交互逻辑（拖拽、连接、缩放），那是 Phase 3 的任务。
- 重点在于布局结构的正确性和视觉规范的一致性。
