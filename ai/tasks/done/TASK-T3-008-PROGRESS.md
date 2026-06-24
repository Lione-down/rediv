# TASK-T3-008 Progress

## Status

BLOCKED

## Checklist

- [x] 从 `todo` 领取 `TASK-T3-008` 到 `doing`
- [x] 阅读 `AGENTS.md`、`CURRENT.md`、`ROADMAP.md` 和任务文档
- [x] 阅读相关 `xq/` 认证设计文档
- [x] 核对前端 auth 实现与后端认证接口
- [x] 识别任务阻塞并停止业务代码修改
- [x] 生成 `REPORT-T3-008`
- [ ] 修改前端业务代码
- [ ] 运行 `npm run build`

## Notes

- 当前后端 `backend/api/auth.py` 中，`POST /auth/wechat/callback` 在 `wechat_mock_enabled=false` 时直接返回 `501 Real Wechat token exchange is not configured yet`，无法支撑“真实 OAuth 接入”验收。
- 当前后端默认 `wechat_redirect_uri` 为 `http://localhost:8000/auth/wechat/callback`，与前端任务要求使用的 `/auth/callback/wechat` 回调页不一致。
- `GET /auth/wechat/authorize` 在 mock 模式下返回 `/auth/wechat/mock?state=...`，但后端现有 mock 登录接口为 `POST /auth/wechat/mock`，并不是可直接跳转的前端授权页。
- 基于以上冲突，本轮不改动前端业务代码，等待 Hermes 重新规划或补齐后端契约。
