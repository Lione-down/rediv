# Task: 后端真实微信 OAuth token exchange

## Task ID
T3-008-B

## Phase
Phase 3

## Objective
实现后端真实的微信 OAuth code → access_token → user profile 流程，替换当前返回 501 的占位逻辑。

## Scope
- 修改文件：`backend/api/auth.py` — `wechat_callback` 在非 mock 模式下实现真实的微信 token exchange
- 修改文件：`backend/settings/config.py` — 确保微信 AppID/AppSecret 配置项可用
- 不涉及：前端代码（T3-008-A 已完成）
- 不涉及：数据库 schema 变更（auth_identity 等表已由 T3-008 之前的任务创建）

## Constraints
- 只涉及 backend 模块，不修改 frontend 代码
- 必须保持 mock 模式正常工作（`wechat_mock_enabled=True` 时的现有行为不变）
- 使用 `requests` 库调用微信开放平台 API（`https://api.weixin.qq.com/sns/oauth2/access_token`）
- 微信授权码换取 access_token 的流程：
  1. `GET https://api.weixin.qq.com/sns/oauth2/access_token?appid=APPID&secret=SECRET&code=CODE&grant_type=authorization_code`
  2. 从返回的 `access_token` + `openid` 调用用户信息接口
  3. `GET https://api.weixin.qq.com/sns/userinfo?access_token=ACCESS_TOKEN&openid=OPENID&lang=zh_CN`
- 新用户注册逻辑需与 mock 模式保持一致（创建 user → auth_identity → 发放默认额度）
- 单任务 ≤ 4 小时工作量
- 不涉及数据库 schema 变更

## Acceptance Criteria
- [ ] 非 mock 模式下，`POST /auth/wechat/callback` 使用 `code` 调用微信 access_token 接口
- [ ] 成功获取 access_token 后，调用微信 userinfo 接口获取用户昵称/头像
- [ ] 根据 openid 查找或创建 user 和 auth_identity（与 mock 模式逻辑一致）
- [ ] 新用户注册时按 registration_mode 处理（open/invite_only/closed）
- [ ] mock 模式下行为完全不变（`wechat_mock_enabled=True` 时仍走原有逻辑）
- [ ] 缺少 `REVID_WECHAT_APP_ID` 或 `REVID_WECHAT_APP_SECRET` 时返回 500 并给出明确错误信息
- [ ] 后端 `uvicorn` 启动无报错
- [ ] 后端冒烟测试通过（mock 模式 + 非 mock 模式均不崩溃）

## Deliverables
- `backend/api/auth.py`（修改 `wechat_callback` 函数）
- `backend/settings/config.py`（确认微信配置项）
- `ai/reports/REPORT-T3-008-B.md`

## Notes for Codex
- 当前 `wechat_callback` 在非 mock 模式下直接返回 501：
  ```python
  raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Real Wechat token exchange is not configured yet")
  ```
- 需要替换为真实的微信 OAuth 流程。参考微信开放平台文档：
  - 授权码换取 access_token：`GET https://api.weixin.qq.com/sns/oauth2/access_token`
  - 获取用户信息：`GET https://api.weixin.qq.com/sns/userinfo`
- 后端已有的 `_login_or_register_wechat(profile, invitation_code)` 函数可以复用，只需将 profile 来源从 mock 数据改为微信 API 返回
- 配置项在 `backend/settings/config.py` 中：`wechat_app_id`、`wechat_app_secret`、`wechat_mock_enabled`
- 如果环境变量未配置微信凭证，应返回明确的 500 错误，而不是静默失败
