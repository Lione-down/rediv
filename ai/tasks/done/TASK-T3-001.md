# Task: Leafer UI 集成（CanvasStage.vue）

## Task ID
T3-001

## Phase
Phase 3

## Objective
在 CanvasStage.vue 中集成 Leafer UI 作为画布渲染引擎，替代当前的 DOM 节点方案，实现基础的无限画布能力。

## Scope
- 新增文件：`frontend/package.json`（添加 leafer-ui 依赖）
- 修改文件：`frontend/src/components/canvas/CanvasStage.vue`
- 不涉及：后端 API、其他页面、store 数据结构（仅做前端集成验证）

## Constraints
- 使用 `leafer-ui` + `leafer-view` 作为画布渲染引擎
- 保持现有 canvas store 的数据结构不变（nodes、connections、selectedNodeId 等）
- 不实现节点拖拽、连接、缩放等交互——这些留给 T3-002
- 单任务 ≤ 4 小时工作量
- 只涉及 frontend 模块

## Acceptance Criteria
- [ ] `npm install leafer-ui leafer-view` 安装成功，package.json 中包含依赖
- [ ] CanvasStage.vue 使用 LeaferView 创建画布容器，替代原有 DOM-based 节点渲染
- [ ] 画布背景色使用 `--bg-canvas` token，尺寸占满画布区域
- [ ] 至少渲染 1 个 demo 节点（矩形 + 文字），验证 Leafer UI 正常工作
- [ ] `npm run build` 构建通过，无 TS 编译错误
- [ ] 保留原有 canvas store 数据，不修改 store 结构

## Deliverables
- `frontend/package.json` — 新增 leafer-ui 依赖
- `frontend/src/components/canvas/CanvasStage.vue` — 集成 Leafer UI 画布
- `ai/reports/REPORT-T3-001.md` — 执行报告

## Codex Prompt
你是一个 Revid 项目的 Codex Executor。请执行以下任务：

### 任务背景
Revid 是一个 AI 驱动的短视频创作平台。当前画布使用 DOM 元素渲染节点，需要迁移到 Leafer UI 以获得更好的性能和交互能力。这是 Phase 3 的第一步。

### 具体要求
1. 在 `frontend/package.json` 中添加 `leafer-ui` 和 `leafer-view` 依赖（使用最新版本）。
2. 修改 `frontend/src/components/canvas/CanvasStage.vue`：
   - 引入 `Leafer`, `Rect`, `Text` 从 `leafer-ui`
   - 引入 `LeaferView` 从 `leafer-view`
   - 创建一个 LeaferView 实例作为画布容器，填充整个 `.canvas-surface` 区域
   - 画布背景色使用 CSS variable `var(--bg-canvas)` 或对应的 oklch 值
   - 添加至少 1 个 demo Rect 节点（白色背景，圆角，带阴影）和 1 个 Text 节点（显示"Hello Revid"）
   - 保留现有的 `<template>` 中除画布内容外的结构（如 minimap 区域可以暂时保留空壳）
3. 确保 `cd frontend && npm run build` 通过，无 TypeScript 错误。
4. 不要修改 `frontend/src/store/canvas.ts` 的数据结构。
5. 不要实现节点拖拽、缩放、平移等交互——这些留给后续任务。

### 注意事项
- Leafer UI 是基于 Konva/EaselJS 思想的现代画布库，适合做节点编辑器的底层渲染
- 当前 CanvasStage.vue 已有基本的节点数据和连接线的 SVG 渲染，集成时可以先保留 minimap 区域的结构
- 构建命令：`cd frontend && npm run build`
- 项目使用 Vue 3 + TypeScript + Vite
