# Task: 前端基础联调（登录 → 用户信息 → 资产列表 → 额度展示）

## Task ID
T2-005

## Phase
Phase 2

## Objective
将 Home.vue 与前端 stores（auth + assets）接入真实后端 API，打通「登录 → 获取用户信息 → 加载资产列表 → 展示额度」的端到端数据流，验证前后端对接可行性。

## Scope
- 修改的文件范围：
  - `frontend/src/views/app/Home.vue`（登录入口 + 登录后状态展示）
  - `frontend/src/App.vue`（可选：在根组件初始化时尝试加载用户信息）
  - `frontend/src/api/request.ts`（如需要调整 baseURL 或错误处理）
- 不涉及的文件范围：后端代码、Admin 页面、Workspace、Space、组件库

## Constraints
- 使用 Vue 3 + TypeScript + SCSS + Composition API + `<script setup>`
- 后端 API 地址以 `frontend/.env` 或 `request.ts` 中配置的 baseURL 为准
- 登录失败时展示友好错误提示（不 crash）
- 单模块任务：仅 Home 页面 + 登录流程，不涉及 Admin 或其他页面
- 响应式设计：保持与 Home.vue 现有布局一致

## Acceptance Criteria
- [ ] 点击 Home 页面「微信登录」按钮后调用 `POST /auth/wechat/mock`，成功后 token 存入 localStorage 且 user 信息写入 store
- [ ] 登录后 Home 页面展示用户昵称、角色、当前额度（text/image/video）
- [ ] 自动调用 `GET /assets` 加载资产列表并在页面展示（至少展示前 3 条）
- [ ] 登录失败（网络错误 / 401 / 403）时显示错误提示
- [ ] `npm run build` 构建通过
- [ ] 后端服务运行在默认端口时，可完整走通登录 → 获取用户信息 → 加载资产 → 展示额度的数据流

## Deliverables
- `frontend/src/views/app/Home.vue` — 完善后的首页（含登录 + 用户信息 + 资产列表 + 额度展示）
- `ai/tasks/todo/TASK-T2-005.md` — 本任务文件
- `ai/reports/REPORT-T2-005.md` — 完成报告

## Codex Prompt
请执行以下任务：

1. 读取 `ai/state/CURRENT.md`、`ai/state/ROADMAP.md`、`xq/progress.md` 了解项目上下文
2. 读取 `frontend/src/views/app/Home.vue` 了解现有首页实现
3. 读取 `frontend/src/store/auth.ts` 和 `frontend/src/store/assets.ts` 了解 store 结构
4. 读取 `frontend/src/api/auth.ts` 和 `frontend/src/api/assets.ts` 了解 API 封装
5. 读取 `frontend/src/api/request.ts` 了解请求层配置

然后修改 Home.vue：

### 登录流程
- 未登录时展示「微信登录」按钮
- 点击后调用 `authStore.loginWithMockWechat()`
- 登录成功后自动调用 `authStore.loadCurrentUser()`

### 用户信息展示
- 登录后展示用户昵称、角色、额度（text/image/video）
- 额度展示使用与 design-direction.md 一致的 OKLCH 配色卡片

### 资产列表展示
- 调用 `assetStore.loadAssets()` 加载真实资产数据
- 在页面展示资产列表（至少前 3 条）
- 每条展示：类型、名称、来源、状态

### 错误处理
- 登录失败：toast 或内联提示
- 资产加载失败：显示空状态或重试按钮

完成后执行 `cd frontend && npm run build` 验证构建通过，然后生成完成报告。
