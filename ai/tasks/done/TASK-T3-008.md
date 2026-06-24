# Task: 真实微信 OAuth 接入（替换 mock）

## Task ID
T3-008

## Phase
Phase 3

## Objective
将前端微信登录从 mock 模式切换为真实微信开放平台 OAuth 流程：用户点击"微信登录"→跳转微信授权页→回调处理→获取 JWT。

## Scope
- 修改文件：`frontend/src/api/auth.ts` — 替换 mock 登录调用为真实 authorize + callback 流程
- 修改文件：`frontend/src/store/auth.ts` — 新增 `loginWithWechat()` 方法
- 修改文件：`frontend/src/views/app/Home.vue` — 登录按钮从 mock 切换为真实 OAuth 入口
- 修改文件：`frontend/src/views/app/WechatCallback.vue` — 回调页从 mock 切换为真实 token 接收
- 不涉及：后端代码修改（后端 T3-006 已完成 authorize/mock/callback 接口）

## Constraints
- 只涉及 frontend 模块，不修改 backend 代码
- 后端已有接口：`GET /auth/wechat/authorize`（返回 authorize_url + mock 标志）、`POST /auth/wechat/callback`（接收 code + invitation_code）
- 使用 Naive UI 的 Message 组件进行提示
- 单任务 ≤ 4 小时工作量

## Acceptance Criteria
- [ ] Home.vue 登录按钮点击后调用 `GET /auth/wechat/authorize`，根据返回的 `authorize_url` 跳转微信授权页
- [ ] `WechatCallback.vue` 接收微信回调的 `code` 参数，调用 `POST /auth/wechat/callback` 换取 JWT
- [ ] 登录成功后跳转到工作流页（Workspace），显示用户信息和额度
- [ ] 登录失败时显示错误提示（Naive UI Message.error）
- [ ] 游客模式仍然可用（Guest 登录不受影响）
- [ ] 前端 `npm run build` 构建通过
- [ ] 响应式验证：桌面端和移动端均正常

## Deliverables
- `frontend/src/api/auth.ts`（修改）
- `frontend/src/store/auth.ts`（修改）
- `frontend/src/views/app/Home.vue`（修改）
- `frontend/src/views/app/WechatCallback.vue`（修改）
- `ai/reports/REPORT-T3-008.md`

## Notes for Codex
- 后端接口签名参考 `backend/api/auth.py`：
  - `GET /auth/wechat/authorize?state=xxx` → `{ authorize_url: string, mock: boolean }`
  - `POST /auth/wechat/callback` body: `{ code: string, invitation_code?: string }` → `{ token, user, quota }`
- 当前前端 `loginWithMockWechat()` 直接 POST `/auth/wechat/mock`，需要替换为完整的 OAuth 跳转流程
- WechatCallback.vue 已有路由路径 `/auth/callback/wechat`，需要改造其逻辑
- 保持游客模式 `loginAsGuest()` 不变
