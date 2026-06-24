# TASK-T3-008 Plan

## Goal

将首页微信登录链路从直接 mock 登录切换到 authorize + callback 模式，并在不改后端的前提下接入前端回调页与 JWT 落库。

## Scope

- 读取并核对 `CURRENT`、任务文档、认证设计文档与现有前后端实现
- 如接口契约与实现一致，则修改：
  - `frontend/src/api/auth.ts`
  - `frontend/src/store/auth.ts`
  - `frontend/src/views/app/Home.vue`
  - `frontend/src/views/app/WechatCallback.vue`
- 生成 `ai/reports/REPORT-T3-008.md`

## Implementation Steps

1. 阅读当前任务、`xq/01_user_system.md`、`xq/08_wechat_auth_quota_plan.md`、`xq/11_frontend_project_development.md` 与现有前后端认证实现，确认接口契约。
2. 核对 `GET /auth/wechat/authorize`、`POST /auth/wechat/callback` 与前端回调路由是否可以形成完整闭环。
3. 如果闭环成立，则按最小改动接入 authorize 跳转、callback 换 token、登录成功跳转与错误提示。
4. 运行 `npm run build` 与必要检查，更新进度和报告。
5. 如果闭环不成立或文档冲突，则停止业务代码修改，生成 `BLOCKED` 报告并同步进度。

## Success Criteria

- 首页点击微信登录后走 `GET /auth/wechat/authorize`
- 回调页能读取 `code` 并调用 `POST /auth/wechat/callback`
- 登录成功后写入 JWT 并跳转 `Workspace`
- 游客模式保持不变
- 若接口闭环不存在，则明确产出阻塞结论和阻塞原因
