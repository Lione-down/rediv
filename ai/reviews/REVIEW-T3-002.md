# REVIEW-T3-002

## Task
T3-002 — 节点渲染 + 选中 + 拖拽 + 连接

## Report
REPORT-T3-002.md

## Status
**PASS**

## Review

### 验收标准检查

| # | 标准 | 结果 |
|---|------|------|
| 1 | 点击节点时高亮选中（stroke 变蓝 + selectedNodeId 更新到 store） | ✅ `handleNodePointerDown` 调用 `setSelectedNode(nodeId)`，`nodeStrokeColor` 根据 `selectedNodeId` 返回 `--accent-select` 颜色，strokeWidth 在渲染时设为 2 |
| 2 | 点击空白区域取消选中 | ✅ `handleStagePointerDown` 检测非交互目标后调用 `setSelectedNode(null)`，`isInteractiveTarget` 用 WeakSet 过滤 |
| 3 | 拖拽节点时实时更新位置（Leafer 内拖拽 + store 同步） | ✅ `handleWindowPointerMove` 中 `dragState` 分支直接修改 `node.x/node.y` 并调用 `updateNodeVisualPosition` 同步 Leafer 实例 |
| 4 | 拖拽结束后保存节点位置到 store（触发持久化联动） | ✅ `handleWindowPointerUp` 中 `dragState` 分支置 null 并调 `updateNodeVisualPosition`，由于 `node` 引用的是 store 数组内对象，修改即直接写入 store |
| 5 | 从节点 A 的输出口拖拽到节点 B 的输入口创建连线（SVG 层绘制临时线） | ✅ `handleOutputPointerDown` 创建 `draftConnection`，`handleWindowPointerMove` 更新终点坐标，`finalizeDraftConnection` 检测目标节点并 push 到 `canvasStore.connections`；SVG `.draft` 路径通过 `temporaryConnectionPath` computed 驱动 |
| 6 | `npm run build` 构建通过，无 TS 编译错误 | ✅ 实际执行 `npm run build` 成功，479ms，无错误 |
| 7 | 不修改 `canvasStore` 的数据结构 | ✅ 仅使用现有 `nodes`、`connections`、`selectedNodeId`，未新增字段 |

### 代码质量

- **事件系统**：正确使用 Leafer v2.x 的 `pointer.down` 事件，通过 `WeakSet` 管理交互目标，避免事件冒泡冲突
- **窗口级监听**：拖拽/连线创建期间绑定 `window` 的 `pointermove/pointerup/pointercancel`，防止鼠标移出画布区域导致状态丢失；组件卸载时正确解绑
- **指针隔离**：通过 `pointerId` 匹配确保多指针场景下不会串扰
- **连线防重**：`connectionExists` 检查已有连接，避免重复创建
- **临时连线**：SVG 层的 `draft` 路径通过 computed 属性驱动，自动响应式更新
- **资源清理**：`onBeforeUnmount` 中正确销毁 leafer 实例、断开 resize observer、解绑窗口事件
- **坐标计算**：`nodeInputAnchor` / `nodeOutputAnchor` / `buildConnectionPath` 封装清晰，贝塞尔曲线控制点距离 110px 合理

### 已知限制（预期，留给后续任务）

- 缩放和平移未实现（T3-003 范围）
- 节点输入口点击无拖拽创建连线（仅输出口支持），符合任务要求
- 拖拽过程中节点位置直接修改 store 数组内对象引用，虽然有效但绕过了 Vue 响应式追踪；当前场景因 `sceneSignature` computed 驱动全量重绘所以可行
- 未做浏览器内人工交互回归（Report 中已声明）

---
*Reviewer: PM (Hermes)*
*Date: 2026-06-28*
