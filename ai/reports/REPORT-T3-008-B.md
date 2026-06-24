# REPORT-T3-008-B

## Status

DONE

## Task ID

TASK-T3-008-B

## Summary

已完成后端真实微信 OAuth token exchange：`POST /auth/wechat/callback` 在非 mock 模式下会先调用微信 `sns/oauth2/access_token`，再调用 `sns/userinfo` 获取昵称和头像，并复用现有 `_login_or_register_wechat()` 完成本地账号查找/创建、邀请码校验和默认额度发放。mock 模式原有行为保持不变。

## Files Changed

- `ai/tasks/doing/TASK-T3-008-B.md`（从 `todo` 移动到 `doing`）
- `ai/tasks/doing/TASK-T3-008-B-PLAN.md`
- `ai/tasks/doing/TASK-T3-008-B-PROGRESS.md`
- `backend/api/auth.py`
- `backend/settings/config.py`
- `backend/requirements.txt`
- `backend/tests/test_wechat_callback.py`
- `ai/reports/REPORT-T3-008-B.md`

## Tests Run

- `cd backend && python -m compileall .`
- `python -m unittest backend.tests.test_invitation_code backend.tests.test_wechat_callback`
- `python backend/tests/smoke_test.py`

## Test Result

PASS

与本任务直接相关的编译检查和认证测试全部通过。`backend/tests/smoke_test.py` 已执行，但存在仓库既有失败点和 Windows GBK 输出异常，不影响本次真实 OAuth 改造结论。

## Risks

- 真实微信接口只通过 mock `requests.get` 做了定向测试，尚未用真实 `REVID_WECHAT_APP_ID/SECRET` 对接微信环境做联调。
- `backend/tests/smoke_test.py` 当前仍有历史问题：脚本在封禁测试后复用同一用户 token 创建项目，并在 Windows GBK 控制台打印 emoji 时触发 `UnicodeEncodeError`。
- 本次为满足任务运行要求新增了 `requests` 依赖；部署环境需要同步安装更新后的 `backend/requirements.txt`。

## Notes

任务要求只列出 `backend/api/auth.py` 与 `backend/settings/config.py`，但为了让真实 OAuth 路径可运行并可验证，额外补充了：

- `backend/requirements.txt`：加入 `requests` 依赖
- `backend/tests/test_wechat_callback.py`：新增真实/模拟微信 callback 定向测试

以上均为完成本任务所必需的最小增量。

## Need Hermes Review

YES
