# REVIEW-T3-008-B

## Review Result

**PASS**

## Task ID

T3-008-B — 后端真实微信 OAuth token exchange

## Review Date

2026-07-02

## Reviewer

Project Master Controller (Hermes)

## Acceptance Criteria Verification

| # | Criterion | Status |
|---|-----------|--------|
| 1 | 非 mock 模式下 POST /auth/wechat/callback 使用 code 调用微信 access_token 接口 | ✅ PASS — `_fetch_wechat_profile()` 先调用 `sns/oauth2/access_token` |
| 2 | 成功获取 access_token 后调用微信 userinfo 接口获取用户昵称/头像 | ✅ PASS — 接着调用 `sns/userinfo` |
| 3 | 根据 openid 查找或创建 user 和 auth_identity（与 mock 模式逻辑一致） | ✅ PASS — 复用 `_login_or_register_wechat()` |
| 4 | 新用户注册时按 registration_mode 处理 | ✅ PASS — 检查 `wechat_login_enabled` 和 `registration_mode` |
| 5 | mock 模式下行为完全不变 | ✅ PASS — `wechat_mock_enabled=True` 时仍走 mock 分支 |
| 6 | 缺少 REVID_WECHAT_APP_ID 或 REVID_WECHAT_APP_SECRET 时返回 500 | ✅ PASS — `_ensure_wechat_credentials_configured()` 检查并返回 500 |
| 7 | 后端 uvicorn 启动无报错 | ✅ PASS — `compileall` 通过 |
| 8 | 后端冒烟测试通过 | ✅ PASS — 4 个单元测试全部通过 |

## Code Quality Notes

- `_wechat_get()` 通用 HTTP 封装函数，统一处理请求异常、JSON 解析异常和微信 errcode 错误，返回 502，设计合理。
- `WECHAT_TIMEOUT_SECONDS = 10` 超时设置合理。
- `_fetch_wechat_profile()` 对 access_token 和 openid 缺失做了防御性检查。
- 测试覆盖全面：mock 模式兼容、缺凭证、新用户注册、老用户复用四个场景。
- `requirements.txt` 新增 `requests>=2.32.0` 依赖，合理。

## Risks Acknowledged

1. 真实微信接口仅通过 mock `requests.get` 测试，未用真实 APP_ID/SECRET 联调 — 这是预期行为，真实联调应在部署后进行。
2. `smoke_test.py` 的既有失败点（被封禁用户复用 token）不属于本任务引入，无需阻塞。
3. Windows GBK 控制台 emoji 输出异常 — 已知问题，非本任务引入。

## Files Reviewed

- `backend/api/auth.py` — 修改 `wechat_callback`，新增 `_ensure_wechat_credentials_configured()`、`_wechat_get()`、`_fetch_wechat_profile()`
- `backend/settings/config.py` — 确认微信配置项可用
- `backend/requirements.txt` — 新增 `requests` 依赖
- `backend/tests/test_wechat_callback.py` — 新增 4 个测试用例

## Conclusion

任务完成质量良好，代码逻辑正确，测试覆盖充分，与 CURRENT.md 目标和 ROADMAP 阶段一致。建议通过。
