# REPORT-T3-008-A

## Status

DONE

## Task ID

TASK-T3-008-A

## Summary

已将前端微信登录从直接调用 mock 登录接口，改为统一的 `authorize -> callback -> token` 流程。首页登录按钮现在先请求 `/auth/wechat/authorize`，mock 模式会跳转到前端 `/auth/callback/wechat` 页面并由该页面调用 `/auth/wechat/callback` 完成换 token；真实模式则直接跳转到后端返回的微信授权地址。

## Files Changed

- `ai/tasks/doing/TASK-T3-008-A.md`（从 `todo` 移动到 `doing`）
- `ai/tasks/doing/TASK-T3-008-A-PLAN.md`
- `ai/tasks/doing/TASK-T3-008-A-PROGRESS.md`
- `frontend/src/api/auth.ts`
- `frontend/src/store/auth.ts`
- `frontend/src/views/app/Home.vue`
- `frontend/src/views/app/WechatCallback.vue`
- `ai/reports/REPORT-T3-008-A.md`

## Tests Run

- `cd frontend && npm run build`

## Test Result

PASS

## Risks

- 本次仅完成前端流程改造；真实微信 token exchange 仍依赖后续 `T3-008-B` 补齐后端 `POST /auth/wechat/callback` 的非 mock 逻辑。
- 响应式“桌面端 + 移动端”本次未做浏览器人工走查，仅完成构建验证。

## Notes

- `WechatCallback.vue` 现在会校验 `code`，并在存在本地 `state` 时执行 state 一致性校验。
- 登录失败会通过 Naive UI `Message.error` 提示，并清理本地登录态。
- 游客模式相关逻辑未改动。

## Need Hermes Review

YES
