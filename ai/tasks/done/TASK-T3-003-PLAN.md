# TASK-T3-003 Plan

## Task

- Task ID: `T3-003`
- Objective: 在 `CanvasStage.vue` 内完成画布缩放、平移和小地图导航，不修改 `canvasStore` 数据结构。

## Scope

- 允许修改：`frontend/src/components/canvas/CanvasStage.vue`
- 必须新增：`ai/reports/REPORT-T3-003.md`
- 本次执行补充文档：`ai/tasks/doing/TASK-T3-003-PROGRESS.md`
- 不修改：`ai/state/CURRENT.md`、`ai/state/ROADMAP.md`、`ai/reviews/`、后端模块、`frontend/src/store/canvas.ts` 数据结构

## Assumptions

- 优先使用当前 `leafer-ui@2.1.7` 已验证存在的 `moveWorld` / `scaleOfWorld` 能力，不额外引入插件依赖。
- 使用现有 `canvasStore.viewport` 记录运行态缩放和平移值，但不新增或变更 store 字段结构。
- 平移仅在空白区触发，避免覆盖 T3-002 的节点选中、拖拽和连线逻辑。

## Implementation Plan

1. 梳理 `CanvasStage.vue` 当前事件流，识别与节点拖拽/连线冲突的输入路径。
2. 补充画布 viewport 状态同步与屏幕坐标/世界坐标转换工具。
3. 实现滚轮缩放，限制为 `0.1x ~ 3x`，并保持以鼠标位置为中心缩放。
4. 实现中键拖拽、空格+左键拖拽和 hand 模式拖拽的空白区平移。
5. 重写小地图渲染和 viewport indicator 计算，支持点击节点居中回看。
6. 运行 `cd frontend && npm run build` 验证 TypeScript 与构建。
7. 回写进度文档与执行报告。

## Success Criteria

- 滚轮缩放在 `0.1x ~ 3x` 内工作，且缩放中心跟随鼠标位置。
- 中键拖拽、空格+左键拖拽和 hand 模式拖拽可平移画布，且不干扰节点交互。
- 小地图随节点和 viewport 实时更新，viewport indicator 位置和尺寸正确。
- 点击小地图节点后，画布可将目标节点居中显示。
- 构建通过，无新增 TS 错误。
