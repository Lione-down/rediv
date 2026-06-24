# Task: 节点渲染 + 选中 + 拖拽 + 连接

## Task ID
T3-002

## Phase
Phase 3

## Objective
在 CanvasStage.vue 的 Leafer 画布上实现节点选中、拖拽移动和节点间连线创建交互。

## Scope
- 修改文件：`frontend/src/components/canvas/CanvasStage.vue`
- 不涉及：后端 API、其他页面、store 数据结构扩展（仅使用现有 nodes/connections/selectedNodeId）

## Constraints
- 基于 T3-001 已集成的 Leafer 画布继续开发
- 使用 `leafer-ui` v2.x 的事件系统（`hit: true`、`pointerDown`、`pointerMove`、`pointerUp`）
- 保持现有 canvas store 的数据结构不变
- 单任务 ≤ 4 小时工作量
- 只涉及 frontend 模块

## Acceptance Criteria
- [ ] 点击节点时高亮选中（stroke 变蓝 + selectedNodeId 更新到 store）
- [ ] 点击空白区域取消选中
- [ ] 拖拽节点时实时更新位置（Leafer 内拖拽 + store 同步）
- [ ] 拖拽结束后保存节点位置到 store（触发持久化联动）
- [ ] 从节点 A 的输出口拖拽到节点 B 的输入口创建连线（SVG 层绘制临时线）
- [ ] `npm run build` 构建通过，无 TS 编译错误
- [ ] 不修改 `canvasStore` 的数据结构

## Deliverables
- `frontend/src/components/canvas/CanvasStage.vue` — 节点交互（选中/拖拽/连线）
- `ai/reports/REPORT-T3-002.md` — 执行报告

## Notes for Codex
- T3-001 已完成 Leafer 基础渲染，`CanvasStage.vue` 中 leafer 实例已存在
- 节点 Rect 需要设置 `hit: 'rect'` 才能接收 pointer 事件
- Leafer v2.x 事件名：`pointerDown`、`pointerMove`、`pointerUp`
- 拖拽逻辑：pointerDown 记录偏移 → pointerMove 更新位置 → pointerUp 提交到 store
- 连线创建：从节点右侧拖出 SVG 临时线，到另一个节点左侧释放时创建 connection
- 现有 SVG 连线层（`.connection-layer`）保留，仅扩展交互能力
- 不要实现缩放和平移（留给 T3-003）

## Codex Prompt
你是一个 Revid 项目的 Codex Executor。请执行以下任务：

### 任务背景
Revid 是一个 AI 驱动的短视频创作平台。T3-001 已完成 Leafer UI 基础集成，画布可以渲染节点。现在需要在 Leafer 画布上实现节点交互：选中、拖拽和连线创建。

### 具体要求
1. 修改 `frontend/src/components/canvas/CanvasStage.vue`：
   - 给所有节点 Rect 设置 `hit: 'rect'` 启用命中检测
   - 实现节点选中：点击节点设置 `canvasStore.selectedNodeId`，取消点击空白区域
   - 实现节点拖拽：pointerDown 记录偏移量，pointerMove 更新节点位置，pointerUp 提交到 store
   - 实现连线创建：从节点右侧拖拽到另一节点左侧时创建 connection
   - 拖拽过程中显示临时 SVG 连线
2. 确保 `cd frontend && npm run build` 通过，无 TypeScript 错误。
3. 不要修改 `frontend/src/store/canvas.ts` 的数据结构。
4. 不要实现缩放和平移——这些留给 T3-003。

### 注意事项
- Leafer v2.x 的 `Rect` 组件支持 `hit` 属性用于命中检测
- 拖拽时使用 `leafer.armature` 或手动计算偏移
- 连线创建使用现有的 SVG connection-layer，绘制临时 bezier 曲线
- 当前 CanvasStage.vue 已有 `renderScene()` 函数负责重绘场景
