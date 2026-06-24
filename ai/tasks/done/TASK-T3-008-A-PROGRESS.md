# TASK-T3-008-A Progress

## Status

DONE

## Progress Log

- 2026-06-20：已领取任务并移动到 `ai/tasks/doing/`。
- 2026-06-20：已阅读 `Agents.md`、`ai/state/CURRENT.md`、`ai/state/ROADMAP.md`、`xq/08_wechat_auth_quota_plan.md`、`xq/11_frontend_project_development.md`、`ui/design-direction.md`。
- 2026-06-20：已核对现有前端实现，确认当前仍是直接调用 `mockWechatLogin()` 的旧流程。
- 2026-06-20：已只读核对后端 auth 接口签名，确认前端需要接入 `/auth/wechat/authorize` 与 `/auth/wechat/callback`，mock 模式下 `code` 直接作为 openid 使用。
- 2026-06-20：已完成前端 authorize/callback 流程改造，新增 `getWechatAuthorize()`、`exchangeWechatCode()`、`loginWithWechat()` 与真实 callback 页逻辑。
- 2026-06-20：已执行 `cd frontend && npm run build`，构建通过。

## Remaining

- 等待 Hermes 审查。
