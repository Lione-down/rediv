# Task: 内部账号密码认证与 Admin bootstrap

## Task ID
T4-004

## Phase
Phase 4B — 认证与真实 API

## Category
Backend / Auth

## Priority
P1

## Assigned To
Backend Executor

## Objective
为个人内部使用提供账号密码登录、受 registration mode 控制的注册能力和安全的 Admin 初始化，同时保留已有微信老用户登录能力。

## Chosen Technology
FastAPI + Pydantic schemas + SQLAlchemy model/Alembic revision + bcrypt hashing + 现有 signed token 机制。

## Scope
- 允许修改：`backend/api/auth.py`、`backend/core/security.py`、`backend/schemas/auth.py`、`backend/models/user.py`、`backend/controllers/store.py` 的 Auth 方法、settings、requirements。
- 允许新增：Auth Alembic revision、`scripts/seed_admin.py`、Auth tests。
- 禁止修改：生成 API、前端、额度规则、真实 `.env`。

## Dependencies
T4-003 已审查通过。

## Implementation Requirements
1. User 增加唯一 username、可选唯一 email、nullable password_hash；微信既有账号可保持无密码。
2. password 只保存 bcrypt hash；响应和日志禁止返回 hash。
3. `POST /auth/login` 支持 username/email；`POST /auth/register` 严格遵守 open/invite_only/closed。
4. 提供无需 Admin 权限的只读 registration settings endpoint，只返回前端展示所需的 mode、wechat enabled 等非敏感字段。
5. closed 模式仍允许既有账号登录，不允许公开注册。
6. Admin seed 从 `REVID_ADMIN_USERNAME`、`REVID_ADMIN_PASSWORD` 读取；无默认 `123456`，重复执行幂等。
7. frozen 用户允许登录但生成 dependency 拒绝；banned 用户拒绝登录和鉴权。
8. logout 明确为客户端清 token；本轮不伪装成服务端 revoke。
9. 微信 OAuth 若保留 real mode，统一使用 httpx，并修正 redirect method/state 校验；无法真实验证时在报告中标为未验证，不得声称完成。

## Acceptance Criteria
- [ ] 注册三种模式、重复 username/email、弱密码、错误密码、banned/frozen 均有测试。
- [ ] Admin seed 无硬编码密码且幂等。
- [ ] Auth response、logs 和 Navicat 普通查询不暴露明文密码。
- [ ] 旧微信用户记录可继续登录，不被强制补 password。
- [ ] 所有 backend tests 通过。

## Verification Commands
```powershell
cd backend
python -m compileall .
python -m unittest discover -s tests -p "test_*auth*.py"
python -m unittest discover -s tests -p "test_*.py"
```

## Manual Acceptance
在 closed 模式用 Admin 账号登录成功、注册被拒绝；Navicat 检查 `password_hash` 非明文且 username/email 唯一索引存在。

## Deliverables
- Auth backend、migration、seed、tests。
- `ai/tasks/doing/TASK-T4-004-PLAN.md`
- `ai/tasks/doing/TASK-T4-004-PROGRESS.md`
- `ai/reports/REPORT-T4-004.md`

## Codex Prompt
按内部工具范围实现最小安全账号认证。禁止默认密码、禁止输出 secret、禁止扩展 forgot/reset password。编码前创建 PLAN/PROGRESS，完成测试与 Navicat 检查后写 REPORT。
