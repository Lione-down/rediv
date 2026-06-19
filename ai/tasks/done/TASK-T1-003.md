# Task: 后端邀请码注册控制

## Task ID
T1-003

## Phase
Phase 1

## Objective
完善后端邀请码注册控制逻辑，覆盖三种注册模式（open / invite_only / closed）的完整行为，补充邀请码过期校验、使用次数上限、以及注册模式切换的端到端测试。

## Scope

### 修改的文件
- `backend/controllers/store.py` — 补充 `use_invitation_code` 的过期时间比较逻辑（使用 `datetime` 对比而非字符串比较）
- `backend/api/auth.py` — 确认 `_login_or_register_wechat` 在 `open` 模式下忽略邀请码参数、在 `closed` 模式下正确拒绝
- `backend/tests/test_invitation_code.py` — 新建邀请码专项测试文件

### 不涉及的文件
- 前端代码
- 其他后端模块（admin、asset、quota ledger 已有基础实现，不在本次范围内）
- AI 协作目录文件

## Background

当前后端已有邀请码相关的模型（`InvitationCode`）、store 方法（`create_invitation_code`、`use_invitation_code`）、admin API（CRUD）和 auth 集成（`_login_or_register_wechat`）。但存在以下问题需要修复和完善：

1. `use_invitation_code` 中使用字符串比较判断过期时间（`invitation["expires_at"] < now_iso()`），而 `expires_at` 可能是 `None` 或 ISO 字符串，与 `now_iso()` 的字符串比较在某些情况下不准确。应改为 `datetime` 对象比较。
2. 缺少 `open` 模式下即使传入无效邀请码也不影响注册的逻辑验证。
3. 缺少 `closed` 模式下新用户被拒绝的测试。
4. 缺少邀请码用完、过期后的边界测试。

## Constraints
- 不修改任何业务逻辑代码（router 层不增删端点）
- 仅修复过期时间比较 bug，不引入新功能
- 测试文件必须可独立运行（使用 `TemporaryDirectory`）
- 所有修改仅涉及后端 Python 代码

## Acceptance Criteria
- [ ] `use_invitation_code` 使用 `datetime` 对象比较过期时间，不再依赖字符串比较
- [ ] `open` 模式下，无论是否传入邀请码，新用户均可正常注册
- [ ] `invite_only` 模式下，无邀请码或邀请码无效时注册被拒绝
- [ ] `closed` 模式下，新用户注册被拒绝（HTTP 403）
- [ ] 邀请码用完（`used_count >= max_uses`）后被拒绝
- [ ] 邀请码过期后被拒绝
- [ ] 新建测试文件 `backend/tests/test_invitation_code.py`，覆盖上述场景
- [ ] `cd backend && python -m compileall .` 通过
- [ ] `cd backend && python backend/tests/test_invitation_code.py` 全部通过

## Deliverables
- `backend/controllers/store.py`（修复过期时间比较）
- `backend/tests/test_invitation_code.py`（新建）

## Notes
- 当前 `DEFAULT_REGISTRATION_SETTINGS` 中 `registration_mode` 默认为 `"invite_only"`，符合产品设计
- `use_invitation_code` 在 `invite_only` 之外模式直接返回 `True`，这个行为是正确的
- 数据库持久化已就绪（T1-001），测试应使用 `DatabaseStore`
