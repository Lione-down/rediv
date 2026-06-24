# TASK-T3-008-B Progress

## Status

DONE

## Progress Log

- 2026-06-20：已领取任务并移动到 `ai/tasks/doing/`。
- 2026-06-20：已阅读 `AGENTS.md`、`ai/state/CURRENT.md`、`ai/state/ROADMAP.md`、`xq/01_user_system.md`、`xq/08_wechat_auth_quota_plan.md`、`xq/09_technical_design.md` 与现有后端认证实现。
- 2026-06-20：已确认任务范围仅为后端真实微信 OAuth token exchange，mock 模式需保持不变。
- 2026-06-20：已在 `backend/api/auth.py` 实现真实微信 `code -> access_token -> userinfo` 拉取，并复用 `_login_or_register_wechat()` 完成本地登录/注册。
- 2026-06-20：已补充 `backend/tests/test_wechat_callback.py`，覆盖 mock 兼容、缺少微信凭证、真实模式首次登录、真实模式重复登录。
- 2026-06-20：已执行 `python -m compileall .` 与 `python -m unittest backend.tests.test_invitation_code backend.tests.test_wechat_callback`，均通过。
- 2026-06-20：已额外运行 `python backend/tests/smoke_test.py`；脚本暴露仓库既有失败点（被封禁用户后继续复用同 token 创建项目）及 GBK 控制台输出异常，不属于本任务引入。

## Remaining

- 等待 Hermes 审查。
