# Task: 额度系统完善 — 用户额度流水查询 + 额度端到端测试

## Task ID
T1-004

## Phase
Phase 1

## Objective
完善额度系统的可观测性：新增用户维度额度流水查询接口，补充额度系统端到端测试覆盖默认发放、Admin 派发、流水记录的完整链路。

## Scope

### 修改的文件
- `backend/api/admin.py` — 新增 `GET /admin/users/{user_id}/quotas/ledger` 接口，支持按用户查询额度流水
- `backend/tests/test_quota_flow.py` — 新建额度系统端到端测试文件

### 不涉及的文件
- 前端代码
- 后端其他模块（auth、asset、invitation 等不改动）
- AI 协作目录文件

## Background

当前后端已有完整的额度基础设施：
- `InMemoryStore` 和 `DatabaseStore` 均实现了 `grant_default_quotas()` 和 `grant_quota()`
- 注册时自动发放默认额度（`auth.py` 第 34 行）
- Admin 手动派发额度（`admin.py` 第 105-111 行）
- `QuotaLedger` 模型记录所有额度变更
- Admin API 提供 `GET /admin/quota-ledger` 查询**全局**额度流水

**缺失能力**：
1. 没有按用户查询额度流水的接口（只有全局列表）
2. 没有额度系统的端到端测试

## Constraints
- 不修改任何现有业务逻辑（仅新增接口和测试）
- 测试文件必须可独立运行（使用 `TemporaryDirectory`）
- 所有修改仅涉及后端 Python 代码
- 新增接口必须要求 Admin 权限

## Acceptance Criteria
- [ ] 新增 `GET /admin/users/{user_id}/quotas/ledger` 接口，返回指定用户的额度流水列表（按创建时间倒序）
- [ ] 接口仅在 Admin 权限下可用（`Depends(current_admin)`）
- [ ] 用户不存在时返回 404
- [ ] 新建测试文件 `backend/tests/test_quota_flow.py`
- [ ] 测试覆盖：默认额度发放 → 验证 Quota 表 + Ledger 表
- [ ] 测试覆盖：Admin 手动派发 → 验证 Quota 表 + Ledger 表
- [ ] 测试覆盖：额度流水查询接口返回正确的流水记录
- [ ] `cd backend && python -m compileall .` 通过
- [ ] `cd backend && python -m pytest backend/tests/test_quota_flow.py` 全部通过（如无 pytest 则用 unittest）

## Deliverables
- `backend/api/admin.py`（新增接口）
- `backend/tests/test_quota_flow.py`（新建）

## Codex Prompt
你是 Revid 项目的 Codex Executor。

请执行以下任务：

### 任务：额度系统完善 — 用户额度流水查询 + 额度端到端测试

#### 步骤 1：新增用户额度流水查询接口

在 `backend/api/admin.py` 中，在 `get_user_quotas` 和 `grant_user_quota` 之间新增接口：

```python
@router.get("/users/{user_id}/quotas/ledger")
def get_user_quota_ledger(user_id: str, _admin=Depends(current_admin)):
    """按用户查询额度流水记录（按创建时间倒序）"""
    if user_id not in store.quotas:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user_ledger = [record for record in store.quota_ledger if record["user_id"] == user_id]
    user_ledger.sort(key=lambda r: r.get("created_at", ""), reverse=True)
    return {"user_id": user_id, "ledger": user_ledger}
```

注意：
- 放在 `get_user_quotas` 之后、`grant_user_quota` 之前
- 使用 `current_admin` 保护
- 返回按 `created_at` 倒序排列的流水列表

#### 步骤 2：新建额度系统端到端测试

创建 `backend/tests/test_quota_flow.py`，使用 `unittest.TestCase`，继承自一个可设置 `TemporaryDirectory` 基类的测试类。

测试场景：

1. **test_default_grant_on_registration** — 模拟用户注册流程：
   - 创建用户（`store.create_user()`）
   - 调用 `store.grant_default_quotas(user_id)`
   - 验证 `store.quotas[user_id]` 中 text=100, image=20, video=3
   - 验证 `store.quota_ledger` 中有 3 条记录，reason 均为 `default_grant`

2. **test_admin_grant** — Admin 手动派发额度：
   - 创建用户
   - 调用 `store.grant_quota(user_id, "text", 50, "admin_grant", "admin-id")`
   - 验证 quotas 中 text 增加了 50
   - 验证 ledger 中有新增记录，reason=`admin_grant`, admin_id=`admin-id`

3. **test_quota_ledger_query** — 额度流水查询：
   - 创建用户，发放默认额度，再 Admin 派发
   - 过滤出该用户的 ledger 记录
   - 验证总数 = 默认 3 条 + admin 1 条 = 4 条
   - 验证按 created_at 倒序

4. **test_multiple_admin_grants** — 多次 Admin 派发累加正确：
   - 同一用户对同一 quota_type 多次 grant
   - 验证最终余额 = 初始 + 各次之和

5. **test_ledger_filter_by_user** — 多用户场景下 ledger 隔离：
   - 创建两个用户
   - 各自发放额度
   - 验证过滤 user_id 后各自 ledger 互不干扰

#### 步骤 3：编译和测试
- `cd backend && python -m compileall .`
- `cd backend && python -m pytest tests/test_quota_flow.py -v`（或 unittest）

#### 注意事项
- 测试必须使用 `TemporaryDirectory` 隔离数据库
- 参考 `backend/tests/test_invitation_code.py` 的测试结构
- 参考 `backend/tests/test_database_store.py` 的数据库设置
- 不要修改任何现有代码，只新增接口和测试
