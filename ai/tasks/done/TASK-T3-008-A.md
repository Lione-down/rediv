# Task: 前端微信 OAuth 流程改造（兼容 mock 模式）

## Task ID
T3-008-A

## Phase
Phase 3

## Objective
将前端微信登录从直接 mock 登录切换到 authorize → callback 流程。在 `wechat_mock_enabled=True` 的前提下，前端可以完成完整的 authorize 跳转 + callback 换 token 链路。

## Scope
- 新建文件：`frontend/src/views/app/WechatCallback.vue`（该路由已存在但页面缺失）
- 修改文件：`frontend/src/api/auth.ts` — 新增 `getWechatAuthorize()` 和 `exchangeWechatCode()` 函数
- 修改文件：`frontend/src/store/auth.ts` — 新增 `loginWithWechat()` 方法（调用 authorize + callback）
- 修改文件：`frontend/src/views/app/Home.vue` — 登录按钮从 `handleMockLogin` 改为触发 `loginWithWechat`
- 不涉及：后端代码修改

## Backend API Reference
- `GET /auth/wechat/authorize?state=xxx` → `{ authorize_url: string, mock: boolean }`
  - mock 模式下 `authorize_url` 为 `/auth/wechat/mock?state=xxx`
  - 非 mock 模式下为微信开放平台真实授权 URL
- `POST /auth/wechat/callback` body: `{ code: string, invitation_code?: string }` → `{ token, user, quotas }`
  - mock 模式下 `code` 被当作 openid 直接使用
  - 非 mock 模式下当前返回 501（由 T3-008-B 补充）

## Constraints
- 只涉及 frontend 模块，不修改 backend 代码
- 必须兼容 mock 模式（`wechat_mock_enabled=True` 是默认配置）
- 使用 Naive UI 的 Message 组件进行提示
- 单任务 ≤ 4 小时工作量
- 不涉及后端

## Acceptance Criteria
- [ ] `WechatCallback.vue` 存在并能从 URL query 中读取 `code` 参数
- [ ] `WechatCallback.vue` 调用 `POST /auth/wechat/callback` 换取 JWT
- [ ] `api/auth.ts` 有 `getWechatAuthorize()` 函数，调用 `GET /auth/wechat/authorize`
- [ ] `api/auth.ts` 有 `exchangeWechatCode(code, invitation_code?)` 函数
- [ ] `store/auth.ts` 有 `loginWithWechat()` 方法，先调用 authorize 再处理回调
- [ ] `Home.vue` 登录按钮触发 `loginWithWechat()` 而非 `loginWithMockWechat()`
- [ ] 登录成功后跳转到 `/app/workspace`，显示用户信息和额度
- [ ] 登录失败时显示错误提示（Naive UI Message.error）
- [ ] 游客模式 `loginAsGuest()` 仍然可用且不受影响
- [ ] 前端 `npm run build` 构建通过
- [ ] 响应式验证：桌面端和移动端均正常

## Deliverables
- `frontend/src/api/auth.ts`（新增 authorize/exchange 函数）
- `frontend/src/store/auth.ts`（新增 `loginWithWechat()`）
- `frontend/src/views/app/Home.vue`（修改登录按钮行为）
- `frontend/src/views/app/WechatCallback.vue`（新建回调页）
- `ai/reports/REPORT-T3-008-A.md`

## Notes for Codex
- `WechatCallback.vue` 需要通过 `window.location.search` 或 Vue Router 的 `useRoute()` 获取 `code` 参数
- mock 模式下，authorize 返回的 `authorize_url` 是相对路径 `/auth/wechat/mock?state=xxx`，不是完整 URL。需要特殊处理：直接跳转前端路由而非浏览器跳转
- 如果 `mock: true`，前端应模拟 authorize 流程：直接调用 callback 接口并传入 state/code
- 如果 `mock: false`，前端应执行真实的浏览器跳转（`window.location.href = authorize_url`）
- Home.vue 中当前按钮文字是"微信 mock 登录"，应改为"微信登录"
- 保持现有 `createGuestSession()` 和游客模式完全不变
