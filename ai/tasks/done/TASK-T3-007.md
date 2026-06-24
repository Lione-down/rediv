# Task: 任务状态 + 失败提示 + 额度提示

## Task ID
T3-007

## Phase
Phase 3

## Objective
在前端增加 Agnes 生成任务的状态反馈机制：任务进行中状态展示、失败时用户友好提示、额度不足时的预警提示。

## Scope
- 修改文件：`frontend/src/components/canvas/CanvasStage.vue` — 节点运行中状态视觉反馈
- 修改文件：`frontend/src/views/app/Workspace.vue` — 生成按钮状态、失败提示区域
- 修改文件：`frontend/src/store/canvas.ts` — 节点状态管理增强
- 不涉及：后端代码修改（后端 T3-004~T3-006 已完成）

## Constraints
- 只涉及 frontend 模块，不修改 backend 代码
- 使用 Naive UI 的 Message / Notification 组件进行提示
- 节点状态流转：idle → running → success / warning
- 额度提示复用 useAuthStore 中的 quotas 数据
- 单任务 ≤ 4 小时工作量

## Acceptance Criteria
- [ ] 点击生成按钮后，对应画布节点显示"运行中"状态（边框变色 + loading 动画）
- [ ] 生成成功后，节点边框变为成功色（绿色），显示"已完成"标识
- [ ] 生成失败时，节点边框变为失败色（红色），弹出 Naive UI Message 错误提示
- [ ] 额度不足时，在生成按钮旁显示黄色警告标签
- [ ] 前端 `npm run build` 构建通过
- [ ] 响应式验证：桌面端和移动端均正常

## Deliverables
- `frontend/src/components/canvas/CanvasStage.vue`（修改）
- `frontend/src/views/app/Workspace.vue`（修改）
- `frontend/src/store/canvas.ts`（修改）
- `ai/reports/REPORT-T3-007.md`

## Codex Prompt
你是一个 Revid 项目的 Codex Executor。请执行以下任务：

### 任务背景
Revid 是一个 AI 驱动的短视频创作平台。T3-004~T3-006 已完成 Agnes 文本、图片、视频的生成接入。现在需要在前端增加任务状态反馈，让用户知道生成任务的执行情况。

### 当前前端状态
1. `frontend/src/store/canvas.ts` — CanvasNode 类型已有 `status?: 'idle' | 'selected' | 'running' | 'success' | 'warning'`
2. `frontend/src/components/canvas/CanvasStage.vue` — 节点渲染已有 `nodeStrokeColor` 函数，支持 running 状态的橙色边框
3. `frontend/src/views/app/Workspace.vue` — 工作流页有生成按钮，但目前没有状态反馈
4. `frontend/src/store/auth.ts` — 已有 quotas 数据（text, image, video）

### 实现要求

#### 1. CanvasStage.vue — 节点运行状态视觉反馈
- 节点处于 running 状态时：
  - 边框变为橙色（#F7B955 或 design tokens 中的 warning 色）
  - 节点标题旁显示 spinning loader 图标（使用 lucide-vue-next 的 Loader2 图标）
  - 添加轻微的 pulse 动画效果
- 节点处于 success 状态时：
  - 边框变为绿色（#2EC58D）
  - 节点标题旁显示 checkmark 图标（CheckCircle2）
- 节点处于 warning 状态时：
  - 边框变为红色（#F05D6C）
  - 节点标题旁显示 alert-circle 图标（AlertCircle）

#### 2. Workspace.vue — 生成按钮状态管理
- 点击生成按钮后：
  - 按钮进入 loading 状态（禁用 + spinner）
  - 调用 `canvasStore.setNodeStatus(nodeId, 'running')`
- 生成成功：
  - 按钮恢复可用
  - 调用 `canvasStore.setNodeStatus(nodeId, 'success')`
  - 显示成功提示（Naive UI Message.success）
- 生成失败：
  - 按钮恢复可用
  - 调用 `canvasStore.setNodeStatus(nodeId, 'warning')`
  - 显示错误提示（Naive UI Message.error）
- 额度不足时：
  - 在生成按钮旁显示黄色警告标签："额度不足"
  - 阻止生成请求发送

#### 3. canvas.ts store 增强
- 确保 `setNodeStatus(nodeId, status)` 方法可用
- 确保节点状态变更能触发视图更新（Vue reactivity）

### 注意事项
- 参考 `ui/design-direction.md` 中的颜色 tokens
- 使用 Naive UI 的 `n-message-provider` 和 `n-button` loading 属性
- 动画效果使用 CSS transition/animation，不要引入额外库
- 保持代码简洁，不要过度设计
