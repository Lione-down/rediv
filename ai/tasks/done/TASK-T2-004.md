# Task: Admin 后台布局完善 + Dashboard 迁移

## Task ID
T2-004

## Phase
Phase 2

## Objective
将 `frontend/src/views/admin/` 下的 Admin 后台从现有基础骨架迁移为与 `ui/design-direction.md` 设计方向一致的完整管理后台：完善 AdminLayout 侧边栏样式、Dashboard 数据展示，并补齐 Users/Invitations/Quotas/Assets 四个子页面的基础布局骨架。

## Scope
- 修改的文件范围：
  - `frontend/src/views/admin/AdminLayout.vue`
  - `frontend/src/views/admin/Dashboard.vue`
  - `frontend/src/views/admin/Users.vue`
  - `frontend/src/views/admin/Invitations.vue`
  - `frontend/src/views/admin/Quotas.vue`
  - `frontend/src/views/admin/Assets.vue`
  - `frontend/src/views/admin/Tasks.vue`（如有）
- 不涉及的文件范围：后端代码、其他前端页面、组件库

## Constraints
- 使用 Vue 3 + TypeScript + SCSS + Composition API + `<script setup>`
- 使用 `ui/design-direction.md` 定义的 OKLCH 色彩系统（浅色主题）
- 不引入新的外部依赖
- 单模块任务：仅 Admin 后台，不涉及 App 端页面
- 数据层使用 mock 数据或 store 中的值，真实 API 联调按后续阶段进行
- 侧边栏导航使用已有的 `RouterLink`，不修改路由配置

## Acceptance Criteria
- [ ] AdminLayout 侧边栏样式符合 design-direction.md：使用 `--bg-panel`、`--border-subtle`、`--text-primary` 等 tokens，240px 宽度，导航项 hover/active 状态清晰
- [ ] Dashboard 页面展示数据指标卡片（注册用户数、今日任务数、排队任务数、系统状态），使用 OKLCH 配色和卡片布局
- [ ] Users/Invitations/Quotas/Assets 四个子页面均具有与 Dashboard 一致的视觉风格和布局骨架
- [ ] 所有页面使用 `AdminLayout` 作为外层布局组件
- [ ] `npm run build` 构建通过
- [ ] 响应式验证：桌面端正常显示，≤760px 侧边栏可折叠或横向滚动

## Deliverables
- `frontend/src/views/admin/AdminLayout.vue` — 完善后的管理后台布局
- `frontend/src/views/admin/Dashboard.vue` — Dashboard 数据展示
- `frontend/src/views/admin/Users.vue` — 用户管理页面骨架
- `frontend/src/views/admin/Invitations.vue` — 邀请码管理页面骨架
- `frontend/src/views/admin/Quotas.vue` — 额度管理页面骨架
- `frontend/src/views/admin/Assets.vue` — 资产管理页面骨架
- `frontend/src/views/admin/Tasks.vue` — 任务管理页面骨架（如有）
- `ai/tasks/doing/TASK-T2-004-PLAN.md` — 开发计划
- `ai/tasks/doing/TASK-T2-004-PROGRESS.md` — 进度记录
- `ai/reports/REPORT-T2-004.md` — 完成报告

## Codex Prompt
请执行以下任务：

1. 读取 `ai/state/CURRENT.md`、`ai/state/ROADMAP.md`、`xq/progress.md` 了解项目上下文
2. 读取 `ui/design-direction.md` 了解设计规范（色彩系统、布局原则、组件风格、响应式断点）
3. 读取现有 `frontend/src/views/admin/AdminLayout.vue` 和 `frontend/src/views/admin/Dashboard.vue` 了解当前实现
4. 读取 `frontend/src/views/admin/Users.vue`、`Invitations.vue`、`Quotas.vue`、`Assets.vue` 了解当前骨架

然后完善 Admin 后台页面：

### AdminLayout 改进
- 侧边栏使用 `--bg-panel` 背景、`--border-subtle` 右边框
- 导航项使用 `--text-secondary` 默认颜色，hover 使用 `--text-primary`，active 使用 `--accent-select` 浅色背景 + 深色图标
- 每个导航项使用 lucide-vue-next 图标（与现有保持一致）
- 添加 hover 过渡动画（120ms）
- 添加 active 状态 `scale(0.96)` 反馈
- 响应式：≤760px 时侧边栏变为顶部横向滚动导航

### Dashboard 改进
- 数据指标卡片使用 `--bg-panel` 背景、`--border-subtle` 边框、`--radius-lg` 圆角
- 卡片布局：4 列 grid，≤1040px 变为 2 列，≤760px 变为 1 列
- 每个卡片展示 label（`--text-muted` 13px）+ value（`--text-primary` 28px）
- 添加页面标题和简要说明
- 接入 `useAuthStore` 获取管理员信息展示

### 子页面骨架
- Users：用户列表表格骨架（表头 + 3 行 mock 数据），展示昵称、角色、状态、注册时间
- Invitations：邀请码列表骨架（卡片形式），展示码值、状态、创建时间、使用次数
- Quotas：额度管理骨架，展示额度类型表格 + 派发操作区域
- Assets：资产列表骨架，展示资产类型 + 名称 + 来源 + 状态
- Tasks：任务管理骨架（如有），展示任务类型 + 状态 + 进度

### 样式要求
- 使用 design-direction.md 的 OKLCH tokens（浅色主题）
- 卡片 hover 效果：`translateY(-2px)` + border-color 变化
- 按钮 active 效果：`scale(0.96)`
- 页面整体淡入动画（opacity 0→1, translateY 16→0, 420ms）
- 遵守 `prefers-reduced-motion`

完成后执行 `cd frontend && npm run build` 验证构建通过，然后生成完成报告。
