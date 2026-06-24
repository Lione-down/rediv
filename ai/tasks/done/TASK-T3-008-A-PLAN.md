# TASK-T3-008-A Plan

## Task ID

TASK-T3-008-A

## Goal

将前端微信登录从直接调用 mock 登录接口，改为 `authorize -> callback -> token` 的统一流程，并继续兼容默认 `wechat_mock_enabled=True` 的后端模式。

## Scope

- 修改 `frontend/src/api/auth.ts`
- 修改 `frontend/src/store/auth.ts`
- 修改 `frontend/src/views/app/Home.vue`
- 修改 `frontend/src/views/app/WechatCallback.vue`
- 生成 `ai/reports/REPORT-T3-008-A.md`

## Implementation Steps

1. 为 auth API 增加 `getWechatAuthorize()` 和 `exchangeWechatCode()`，对齐后端 `/auth/wechat/authorize` 与 `/auth/wechat/callback`。
2. 在 auth store 中新增 `loginWithWechat()`，统一发起 authorize 流程；mock 模式跳转到前端 callback 路由，真实模式跳转到后端返回的微信授权 URL。
3. 改造 `WechatCallback.vue`，读取 query 中的 `code/state/invitation_code`，调用 callback 接口换 token，并在成功/失败时给出 Naive UI Message 反馈。
4. 调整 `Home.vue` 登录按钮，改为触发 `loginWithWechat()`，保留游客模式和现有页面结构。
5. 运行 `frontend` 构建验证，并记录结果到 REPORT。

## Success Criteria

- 首页点击“微信登录”后走 authorize 流程，不再直接调用 `/auth/wechat/mock`。
- mock 模式下能通过前端 callback 页完成登录并进入 `/app/workspace`。
- callback 页缺少 `code` 或换 token 失败时能显示错误提示。
- `npm run build` 通过。
