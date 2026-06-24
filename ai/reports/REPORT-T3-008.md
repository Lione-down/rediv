# REPORT-T3-008

## Status

BLOCKED

## Task ID

TASK-T3-008

## Summary

已领取并分析 `T3-008`，但发现任务文档与现有后端实现存在直接冲突：真实微信 OAuth 所需的后端 callback token exchange 尚未实现，且默认回调地址与前端回调页路由不一致，因此前端单独改造无法完成验收。

## Files Changed

- `ai/tasks/doing/TASK-T3-008.md`（从 `todo` 移动到 `doing`）
- `ai/tasks/doing/TASK-T3-008-PLAN.md`
- `ai/tasks/doing/TASK-T3-008-PROGRESS.md`
- `ai/reports/REPORT-T3-008.md`

## Tests Run

- None

## Test Result

NOT RUN

## Risks

- 若继续按当前任务只修改前端，会导致登录入口跳转后无法完成真实 OAuth callback 换 token。
- 若前端自行猜测 mock 跳转规则，会偏离现有后端接口约定，增加后续联调返工风险。

## Notes

- 阻塞依据 1：`backend/api/auth.py` 中 `POST /auth/wechat/callback` 在非 mock 模式下返回 `501 Not Implemented`。
- 阻塞依据 2：`backend/settings/config.py` 与 `backend/.env.example` 默认 `REVID_WECHAT_REDIRECT_URI=http://localhost:8000/auth/wechat/callback`，与前端路由 `/auth/callback/wechat` 不一致。
- 阻塞依据 3：`GET /auth/wechat/authorize` 在 mock 模式下返回 `/auth/wechat/mock?state=...`，但现有 mock 接口是 `POST`，不是用户可直接访问的授权页。
- 建议 Hermes 二选一后再继续：
  1. 明确本任务只做“前端 authorize/callback 流程改造并继续兼容 mock provider”，并补充 mock 跳转契约。
  2. 先新增后端真实 WeChat token exchange 与统一回调契约，再重新下发前端任务。

## Need Hermes Review

YES
