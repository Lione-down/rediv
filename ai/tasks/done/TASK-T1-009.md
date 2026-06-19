# Task: Admin 后台完善 — 项目管理 + 用户详情 + 操作日志

## Task ID
T1-009

## Phase
Phase 1

## Objective
完善 Admin 后台接口：补充项目管理列表、用户详情接口、以及 admin 操作日志记录。

## Scope

### 新增的功能
- `GET /admin/projects` — 列出所有项目（含所属用户信息）
- `GET /admin/users/{user_id}` — 获取单个用户详情（含额度、资产统计）
- 所有 admin 写操作记录到 `admin_operation_log`

### 修改的文件
- `backend/api/admin.py` — 新增路由
- `backend/controllers/store.py` — store 中新增 `list_all_projects`、`get_user_detail`、`log_admin_operation` 方法
- `backend/schemas/admin.py` — 新增 AdminOperationLog 相关 schema（如需要）
- `backend/tests/test_admin_enhancements.py` — 新增测试

### 不涉及的文件
- 前端代码
- 后端其他模块（auth、quota、assets、canvas_nodes、templates 等）

## Background
T1-008 模板系统已完成。Admin 后台已有大部分基础接口，但缺少：
1. 项目管理列表（xq/07_admin_system.md §6）
2. 用户详情接口（含额度/资产统计）
3. 操作日志记录（xq/07_admin_system.md 权限规则要求所有 admin 操作写入日志）

## Constraints
- 仅涉及后端 Python 代码
- 使用 SQLite 持久化和内存存储双实现
- 所有接口要求 admin 权限（`Depends(current_admin)`）
- 测试必须使用 `TemporaryDirectory` 隔离数据库
- 不修改任何现有业务逻辑（仅新增/增强）
- 参考现有 admin.py 的代码风格

## Acceptance Criteria
- [ ] `GET /admin/projects` 列出所有项目（含用户信息），admin 可访问
- [ ] `GET /admin/users/{user_id}` 返回用户详情（含额度余额、资产数量、项目数量）
- [ ] 所有 admin 写操作（ban、freeze、grant、disable 等）写入操作日志
- [ ] `GET /admin/logs` 可查看操作日志（按时间倒序）
- [ ] 模板数据在 SQLite 和内存模式下均可持久化
- [ ] `python -m compileall .` 通过
- [ ] 测试全部通过

## Deliverables
- `backend/api/admin.py`（增强）
- `backend/controllers/store.py`（增强）
- `backend/schemas/admin.py`（增强，如需）
- `backend/tests/test_admin_enhancements.py`（新建）

## Codex Prompt
你是 Revid 项目的 Codex Executor。

请执行以下任务：

### 步骤 1：增强 store.py

在 `InMemoryStore` 和 `DatabaseStore` 中新增以下方法：

```python
# 列出所有项目（admin 视角，不按用户过滤）
def list_all_projects(self) -> list[dict]

# 获取用户详情（含统计信息）
def get_user_detail(self, user_id: str) -> dict | None

# 记录 admin 操作日志
def log_admin_operation(self, admin_id: str, action: str, target_type: str, target_id: str, detail: str | None = None) -> dict
```

注意：
- `list_all_projects` 返回所有项目，每个项目附带 `user_id`、`user_nickname`、`node_count`（从 canvas_nodes 统计）
- `get_user_detail` 返回用户基本信息 + 额度余额 + 资产数量 + 项目数量
- `log_admin_operation` 写入 admin_logs 表（已有 AdminLog 模型）

### 步骤 2：增强 admin.py 路由

在 `backend/api/admin.py` 中新增：

```python
@router.get("/projects")
def list_all_projects(_admin=Depends(current_admin)):
    return {"items": store.list_all_projects()}

@router.get("/users/{user_id}")
def get_user_detail(user_id: str, _admin=Depends(current_admin)):
    detail = store.get_user_detail(user_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="User not found")
    return detail

@router.get("/logs")
def list_admin_logs(_admin=Depends(current_admin)):
    return {"items": store.admin_logs[-100:]}  # 最近100条
```

并在已有的写操作路由中调用 `log_admin_operation`：
- `ban_user` → action="ban"
- `freeze_generation` → action="freeze_generation"
- `grant_user_quota` → action="grant_quota"
- `disable_invitation_code` → action="disable_invitation_code"

### 步骤 3：创建测试

在 `backend/tests/test_admin_enhancements.py` 中覆盖：
1. test_list_all_projects — admin 查看所有项目
2. test_get_user_detail — 获取用户详情（含统计）
3. test_get_user_detail_not_found — 不存在的用户返回 404
4. test_admin_log_ban — ban 用户时写入操作日志
5. test_admin_log_grant — 派发额度时写入操作日志
6. test_list_admin_logs — 查看操作日志
7. test_admin_log_persistence — SQLite 持久化验证

### 步骤 4：编译和测试
- `cd backend && python -m compileall .`
- `cd backend && python tests/test_admin_enhancements.py`

### 注意事项
- 参考 `backend/api/admin.py` 现有代码风格
- 参考 `backend/tests/test_template_system.py` 的测试结构
- 不要修改任何现有业务逻辑
- AdminLog 模型已存在，直接使用
