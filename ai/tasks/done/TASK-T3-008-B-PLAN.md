# TASK-T3-008-B Plan

## Task ID

TASK-T3-008-B

## Goal

在 `wechat_mock_enabled=False` 时实现真实微信 OAuth 的 `code -> access_token -> userinfo -> 本地登录/注册` 闭环，同时保持 mock 模式现有行为不变。

## Scope

- 修改 `backend/api/auth.py`
- 修改 `backend/settings/config.py`
- 必要时补充后端依赖与定向测试，确保真实 OAuth 路径可运行可验证
- 生成 `ai/reports/REPORT-T3-008-B.md`

## Implementation Steps

1. 阅读 `xq/01_user_system.md`、`xq/08_wechat_auth_quota_plan.md`、`xq/09_technical_design.md` 与现有 `backend/api/auth.py`，确认真实微信回调流程与注册规则。
2. 在 `backend/api/auth.py` 中补充最小辅助函数：校验微信配置、调用 `sns/oauth2/access_token`、调用 `sns/userinfo`、统一处理微信接口错误与网络异常。
3. 复用 `_login_or_register_wechat(profile, invitation_code)` 完成用户查找/注册，确保 mock 模式逻辑完全不变。
4. 补充后端定向测试，覆盖缺少微信凭证、真实模式成功登录、真实模式重复登录、mock 模式兼容。
5. 运行 `python -m compileall .` 与相关测试命令，生成 REPORT 和记进度文档。

## Success Criteria

- 非 mock 模式下 `/auth/wechat/callback` 会先换取 `access_token/openid`，再拉取用户信息。
- 缺失 `REVID_WECHAT_APP_ID` 或 `REVID_WECHAT_APP_SECRET` 时返回明确 500。
- 新用户注册、邀请码校验、默认额度发放与现有 `_login_or_register_wechat` 保持一致。
- `wechat_mock_enabled=True` 时 callback 现有 mock 登录链路不变。
- 后端编译检查与定向测试通过。
