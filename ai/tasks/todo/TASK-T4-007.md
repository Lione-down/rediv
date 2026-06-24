# Task: 登录/注册入口与路由鉴权

## Task ID
T4-007

## Phase
Phase 4C — 前端视觉与页面

## Category
Frontend / Auth

## Priority
P1

## Assigned To
Frontend Executor

## Objective
实现符合 v3 暗色设计的账号登录入口、受 registration mode 控制的注册入口，并统一路由鉴权与 session 恢复。

## Chosen Technology and Components
- Vue 3 `<script setup lang="ts">`、Pinia、Vue Router、现有 Axios request wrapper。
- Naive UI：`NForm`、`NFormItem`、`NInput`、`NButton`、`NDivider`、`NAlert`、`NSpin`。
- 页面按用户域放在 `frontend/src/views/user/`，局部组件放 `views/user/components/`。

## Scope
- 允许新增：`views/user/Login.vue`、`Register.vue` 及用户域局部组件。
- 允许修改：`router/index.ts`、`store/auth.ts`、`api/auth.ts`、`types/auth.ts`、微信 callback 页面。
- 禁止修改：backend、Home/Space/Workspace、全局 design tokens。

## Dependencies
T4-004、T4-006 已审查通过。

## Implementation Requirements
1. 登录支持 username/email + password，loading、失败和重复提交状态明确。
2. 启动时 token 存在则恢复 `/me`；失效 token 清理并回到 login。
3. registration mode 为 closed 时不显示注册链接，直接访问 `/register` 显示关闭说明而不是空白页。
4. 微信入口只在 backend settings 表示 enabled 时显示；保留 callback state 校验。
5. Router meta 统一 `requiresAuth`/`requiresAdmin`，避免未加载 user 时误判 Admin。
6. redirect query 只能回到站内路径，禁止开放重定向。
7. 密码、token 不写 console，不进入 URL。

## Acceptance Criteria
- [ ] 登录成功、错误密码、closed 注册、token 失效、Admin/普通用户守卫均通过。
- [ ] 刷新受保护页面可恢复 session，不发生闪回首页。
- [ ] 微信和游客入口根据 settings 正确显示。
- [ ] `npm run build` 通过。
- [ ] 1440×900 和 375px 浏览器检查通过。

## Verification Commands
```powershell
cd frontend
npm run build
```

## Manual Acceptance
用真实本地 Admin 账号完成登录、刷新、登出；closed 模式验证注册入口；记录桌面和移动截图路径。

## Deliverables
- Auth views/store/API/router/types。
- `ai/tasks/doing/TASK-T4-007-PLAN.md`
- `ai/tasks/doing/TASK-T4-007-PROGRESS.md`
- `ai/reports/REPORT-T4-007.md`

## Codex Prompt
遵循用户域目录规范和 design system。只实现前端 Auth，不修改 backend。编码前创建 PLAN/PROGRESS；真实本地登录和浏览器响应式验证完成后写 REPORT。

