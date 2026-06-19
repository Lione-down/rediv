# Task: 后端数据库持久化迁移

## Task ID
T1-001

## Phase
Phase 1

## Objective
将后端 `controllers/store.py` 中的 `InMemoryStore` 内存存储迁移为 SQLite 持久化存储，保留原有 API 接口不变，确保所有现有路由无需修改即可正常工作。

## Scope

### 修改的文件
- `backend/controllers/store.py` — 新增 `DatabaseStore` 类，保留 `InMemoryStore` 作为兼容 fallback
- `backend/settings/config.py` — 新增 SQLite 配置项（db_path, use_sqlite）
- `backend/main.py` — 根据配置选择使用 `DatabaseStore` 或 `InMemoryStore`
- `backend/requirements.txt` — 添加 `aiosqlite` 依赖
- `backend/.env.example` — 新增数据库配置说明

### 新增的文件
- `backend/models/base.py` — SQLAlchemy 基础模型、引擎、会话工厂
- `backend/models/user.py` — User 模型
- `backend/models/identity.py` — Identity 模型
- `backend/models/guest.py` — Guest 模型
- `backend/models/asset.py` — Asset 模型
- `backend/models/quota.py` — Quota 和 QuotaLedger 模型
- `backend/models/invitation.py` — InvitationCode 模型
- `backend/models/admin_log.py` — AdminLog 模型
- `backend/database.py` — 数据库初始化（表创建）、会话管理
- `backend/tests/test_database_store.py` — 数据库存储层单元测试

### 不涉及的文件
- `api/routers/` 下的所有路由文件（API 接口保持不变）
- `schemas/` 下的所有 Pydantic 模型（输入输出结构不变）
- `core/security.py`（JWT 逻辑不变）
- `core/agnes_provider.py`（Agnes 集成不变）

## Constraints
- 使用 SQLAlchemy 2.0 异步风格（`asyncpg` 或 `aiosqlite`），但考虑到 MVP 阶段 SQLite 足够，优先使用 `aiosqlite`
- 保留 `InMemoryStore` 类不变，通过配置开关切换（`USE_SQLITE=true` 时使用 `DatabaseStore`）
- `DatabaseStore` 必须提供与 `InMemoryStore` 完全相同的公共方法签名（接口兼容）
- 所有现有 API 路由无需任何修改
- 使用 SQLite 作为默认数据库，不引入 MySQL/PostgreSQL 依赖
- 数据库 schema 变更必须可回滚

## Acceptance Criteria
- [ ] 新建 `models/` 目录，包含所有数据表的 SQLAlchemy 模型定义
- [ ] 新建 `database.py`，包含引擎创建、会话工厂、表自动创建逻辑
- [ ] `DatabaseStore` 类实现所有 `InMemoryStore` 的公共方法，使用数据库持久化
- [ ] 配置项支持 `USE_SQLITE` 开关，默认开启
- [ ] `main.py` 根据配置初始化正确的 store 实例
- [ ] `requirements.txt` 添加 `aiosqlite>=0.20.0` 依赖
- [ ] 启动后端服务后，SQLite 数据库文件自动创建
- [ ] 所有现有 API 接口（health、auth、admin、assets）均可正常工作
- [ ] 数据在进程重启后仍然保留（非内存丢失）
- [ ] 单元测试覆盖 `DatabaseStore` 核心 CRUD 操作

## Deliverables
- `backend/models/` 目录（7 个模型文件）
- `backend/database.py`
- `backend/controllers/store.py`（新增 `DatabaseStore`）
- `backend/settings/config.py`（更新配置）
- `backend/main.py`（更新 store 初始化）
- `backend/requirements.txt`（更新依赖）
- `backend/.env.example`（更新配置说明）
- `backend/tests/test_database_store.py`（单元测试）
- 报告路径：`ai/reports/REPORT-T1-001.md`

## Codex Prompt
你是 Revid 项目的 Codex Executor。

## 任务：后端数据库持久化迁移（T1-001）

### 背景
Revid 后端目前使用 `InMemoryStore`（纯字典内存存储），进程重启后所有数据丢失。需要将数据存储迁移到 SQLite 持久化存储。

### 现有架构分析
请仔细阅读以下关键文件，理解现有数据结构和 API 接口：
1. `backend/controllers/store.py` — 当前 InMemoryStore 实现，定义了所有数据操作接口
2. `backend/settings/config.py` — 配置结构，已有 db_host/db_port/db_name 等字段但未使用
3. `backend/main.py` — FastAPI 应用入口，当前直接实例化 `InMemoryStore`
4. `backend/api/` 下的所有路由文件 — 了解 API 接口签名
5. `backend/schemas/` 下的所有 Pydantic 模型 — 了解输入输出结构

### 你需要做的事

#### 1. 创建数据模型层（`backend/models/`）
基于 `InMemoryStore` 中的数据字典结构，创建以下 SQLAlchemy 2.0 模型：
- `models/base.py` — Base 基类、引擎（SQLite）、会话工厂（get_session）、init_engine、create_tables
- `models/user.py` — User 表（id, nickname, avatar_url, role, status, generation_status, created_at, updated_at, last_login_at）
- `models/identity.py` — Identity 表（id, user_id, provider, provider_user_id, unionid, raw_profile JSON, created_at, updated_at）
- `models/guest.py` — Guest 表（id, session_id, local_project_snapshot JSON, created_at, expires_at, converted_user_id）
- `models/asset.py` — Asset 表（id, user_id, project_id, canvas_node_id, type, url, content_text, source, source_model, source_task_id, status, created_at, updated_at）
- `models/quota.py` — Quota 表（id, user_id, text_quota, image_quota, video_quota）+ QuotaLedger 表（id, user_id, quota_type, change_amount, reason, related_task_id, admin_id, created_at）
- `models/invitation.py` — InvitationCode 表（id, code, status, max_uses, used_count, expires_at, quota_package_id, created_by_admin_id, created_at）
- `models/admin_log.py` — AdminLog 表（id, admin_id, action, target_type, target_id, detail JSON, created_at）

注意：
- 所有表使用 `uuid4` 作为主键（字符串类型）
- 时间字段使用 `DateTime(timezone=True)`
- JSON 字段使用 `JSON` 类型或 `String` 类型
- 设置适当的外键约束和索引

#### 2. 创建数据库初始化模块（`backend/database.py`）
- `init_db()` 函数：创建引擎、调用 Base.metadata.create_all()
- `get_session()` 异步会话工厂
- `get_db_session()` FastAPI 依赖注入函数（yield session, 确保关闭）

#### 3. 创建 DatabaseStore 类（修改 `backend/controllers/store.py`）
- 保留现有 `InMemoryStore` 类完全不变
- 新增 `DatabaseStore` 类，实现与 `InMemoryStore` 相同的公共方法签名
- 所有方法使用 SQLAlchemy 异步查询
- 公共方法列表（必须与 InMemoryStore 一致）：
  - `create_user(nickname, avatar_url, role)` → dict
  - `get_user(user_id)` → dict | None
  - `bind_identity(user_id, provider, provider_user_id, unionid, raw_profile)` → dict
  - `find_identity(provider, provider_user_id)` → dict | None
  - `touch_login(user_id)` → None
  - `create_guest()` → dict
  - `create_invitation_code(code, max_uses, expires_at, quota_package_id, admin_id)` → dict
  - `use_invitation_code(code)` → bool
  - `grant_default_quotas(user_id)` → None
  - `grant_quota(user_id, quota_type, amount, reason, admin_id)` → dict
  - `create_asset(user_id, asset_type, url, content_text)` → dict

注意：
- 返回的 dict 格式必须与 InMemoryStore 完全一致（字段名、类型相同）
- 需要处理异步到同步的转换（可使用 `to_thread` 或同步 SQLAlchemy）
- 推荐使用同步 SQLAlchemy（sqlite3 本身轻量，同步足够）

#### 4. 更新配置（`backend/settings/config.py`）
- 新增 `use_sqlite: bool = True` 配置项
- 新增 `db_path: str = "revid.db"` 配置项
- 修改 `get_settings()` 函数以加载新配置

#### 5. 更新应用入口（`backend/main.py`）
- 根据 `settings.use_sqlite` 选择实例化 `DatabaseStore` 或 `InMemoryStore`
- 如果启用 SQLite，调用 `init_db()` 初始化数据库
- 保持 `_agnes` 和 `get_agnes()` 不变

#### 6. 更新依赖（`backend/requirements.txt`）
- 添加 `aiosqlite>=0.20.0`
- 添加 `sqlalchemy>=2.0.0`

#### 7. 更新 .env.example
- 新增 `REVID_USE_SQLITE=true`
- 新增 `REVID_DB_PATH=revid.db`

#### 8. 编写单元测试（`backend/tests/test_database_store.py`）
测试以下场景：
- 创建用户并查询
- 绑定身份并查找
- 创建访客并查询
- 创建邀请码并使用
- 额度发放和查询
- 资产创建和列表
- 数据持久化（重启后可恢复）

### 重要提醒
1. **不要修改任何 `api/routers/` 下的路由文件** — API 接口必须保持不变
2. **不要修改任何 `schemas/` 下的 Pydantic 模型**
3. **不要修改 `core/security.py`**
4. **保留 `InMemoryStore` 类不变** — 仅新增 `DatabaseStore`
5. **确保所有现有 API 无需修改即可工作**
6. **代码风格与现有代码保持一致**（PEP 8，类型注解）
7. **先阅读现有代码再动手** — 理解每个方法的输入输出格式

### 完成标准
- 所有测试通过
- 后端可正常启动
- 所有 API 接口可正常调用
- 数据持久化验证通过（重启后数据不丢失）
