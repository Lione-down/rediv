# TASK-T3-002 Plan

## Task

- Task ID: `T3-002`
- Objective: 在 `CanvasStage.vue` 内完成节点选中、拖拽、连线创建交互，不修改 `canvasStore` 数据结构。

## Scope

- 允许修改：`frontend/src/components/canvas/CanvasStage.vue`
- 必须新增：`ai/reports/REPORT-T3-002.md`
- 本次执行补充文档：`ai/tasks/doing/TASK-T3-002-PROGRESS.md`
- 不修改：`ai/state/CURRENT.md`、`ai/state/ROADMAP.md`、`ai/reviews/`、后端模块、`frontend/src/store/canvas.ts` 数据结构

## Assumptions

- 使用现有 `nodes`、`connections`、`selectedNodeId` 完成交互，不新增 store 字段。
- Leafer 监听事件按本地依赖实际导出的事件字符串实现，避免依赖任务文档中的模糊命名。
- 连线创建允许直接向现有 `connections` 数组追加对象，但不改变其类型结构。

## Implementation Plan

1. 梳理 `CanvasStage.vue` 当前渲染方式和 SVG 连线层能力。
2. 为节点渲染补充可命中区域与连接锚点，并建立节点图形实例映射。
3. 实现节点选中与点击空白取消选中。
4. 实现节点拖拽中的实时位置同步，以及拖拽结束后的最终提交。
5. 实现从输出锚点到输入锚点的临时 SVG 连线与落点建线。
6. 运行 `cd frontend && npm run build` 验证 TypeScript 与构建。
7. 回写进度文档与执行报告。

## Success Criteria

- 点击节点时 `selectedNodeId` 正确更新且选中态高亮。
- 点击空白处清除选中。
- 拖拽节点时画布和 store 中坐标同步更新，拖拽结束后状态稳定。
- 从节点右侧输出锚点拖到其他节点左侧输入锚点时创建新连线。
- 构建通过，无新增 TS 错误。
