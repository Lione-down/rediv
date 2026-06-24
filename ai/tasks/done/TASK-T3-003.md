# Task: 缩放 + 平移 + 小地图

## Task ID
T3-003

## Phase
Phase 3

## Objective
在 CanvasStage.vue 的 Leafer 画布上实现缩放（滚轮）、平移（中键拖拽或空白区域拖拽）以及小地图导航。

## Scope
- 修改文件：`frontend/src/components/canvas/CanvasStage.vue`
- 不涉及：后端 API、其他页面、store 数据结构扩展

## Constraints
- 基于 T3-002 已实现的节点交互继续开发
- 使用 `leafer-ui` v2.x 的缩放/平移 API 或手动实现
- 保持现有 canvas store 的数据结构不变
- 单任务 ≤ 4 小时工作量
- 只涉及 frontend 模块
- 不覆盖 T3-002 已有的选中/拖拽/连线功能

## Acceptance Criteria
- [ ] 鼠标滚轮缩放画布（以鼠标位置为中心缩放，缩放范围 0.1x ~ 3x）
- [ ] 中键拖拽或按住空格+左键拖拽实现平移
- [ ] 小地图实时显示画布可视区域（viewport indicator）
- [ ] 点击小地图中的节点可定位/居中到该节点
- [ ] `npm run build` 构建通过，无 TS 编译错误
- [ ] 不修改 `canvasStore` 的数据结构
- [ ] 缩放/平移不影响 T3-002 的节点选中、拖拽、连线功能

## Deliverables
- `frontend/src/components/canvas/CanvasStage.vue` — 缩放 + 平移 + 小地图
- `ai/reports/REPORT-T3-003.md` — 执行报告

## Notes for Codex
- T3-002 已完成节点选中/拖拽/连线，Leafer 实例已在 `initLeafer()` 中创建
- Leafer v2.x 内置 `arrow`（平移）和 `zoom`（滚轮缩放）插件，可优先考虑使用
- 如果 Leafer 插件不可用，可手动实现：
  - 缩放：监听 `wheel` 事件，调整 `leafer.zoom` 或使用 `Matrix` 变换
  - 平移：监听空白区域 `pointerDown/move/up`，调整 `leafer.x/y` 偏移
- 小地图已有 DOM 结构（`.minimap`），需要在其中叠加一个 viewport 指示器矩形
- viewport 指示器应根据当前缩放/平移状态动态计算位置和尺寸
- 注意：缩放/平移后，节点在画布上的逻辑坐标不变，只是视觉呈现变化
- 临时连线（draft connection）在缩放状态下坐标计算需要考虑缩放因子

## Codex Prompt
你是一个 Revid 项目的 Codex Executor。请执行以下任务：

### 任务背景
Revid 是一个 AI 驱动的短视频创作平台。T3-001 和 T3-002 已完成 Leafer UI 集成和节点交互（选中/拖拽/连线）。现在需要实现画布的缩放、平移和小地图导航能力。

### 具体要求
1. 修改 `frontend/src/components/canvas/CanvasStage.vue`：
   - 实现鼠标滚轮缩放：以鼠标位置为中心缩放画布，范围 0.1x ~ 3x
   - 实现平移：中键拖拽 或 空格+左键拖拽
   - 在小地图（`.minimap`）中叠加 viewport 指示器矩形
   - 点击小地图中的节点时，将画布平移到该节点居中显示
2. 确保 `cd frontend && npm run build` 通过，无 TypeScript 错误。
3. 不修改 `frontend/src/store/canvas.ts` 的数据结构。
4. 不影响 T3-002 已有的节点选中、拖拽、连线功能。

### 注意事项
- Leafer v2.x 可能有内置的 zoom/pan 插件，优先查阅文档使用
- 如果无内置插件，手动实现时注意缩放后坐标转换（屏幕坐标 ↔ 画布坐标）
- 小地图的 viewport 指示器需要响应缩放和平移状态实时更新
- 临时连线（draft connection）在缩放状态下坐标计算需考虑缩放因子
