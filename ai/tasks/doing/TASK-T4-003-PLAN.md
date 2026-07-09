# TASK-T4-003-PLAN.md

## MySQL Runtime Cutover — Plan

**Task ID:** T4-003  
**Revision:** phase4-wave2-t4-003-mysql-runtime-cutover-2026-07-09-47  
**Date:** 2026-07-09  

### Objective
让 FastAPI 在 `REVID_USE_SQLITE=false` 时使用 MySQL `DatabaseStore` 正常启动、读写和重启恢复。

### Scope

#### 允许修改的文件
- `backend/main.py` — MySQL 分支使用 DatabaseStore，调用 init_mysql_engine + check_alembic_revision
- `backend/database.py` — 新增 init_mysql_engine() / check_alembic_revision()；SQLite 模式保留 create_tables()
- `backend/api/health.py` — 返回 dialect、连接状态、Alembic revision；不暴露密码或完整 URL
- `backend/README.md` — 更新 MySQL 启动、Alembic 迁移、切换和回滚说明
- `backend/.env.example` — 增加 MySQL 相关环境变量
- `backend/tests/test_mysql_runtime_cutover.py` — 专项测试
- `backend/tests/test_health.py` — health endpoint 测试
- `ai/tasks/doing/TASK-T4-003-PLAN.md` — 本文档
- `ai/tasks/doing/TASK-T4-003-PROGRESS.md` — 进度跟踪

#### 禁止修改
- 前端代码
- Auth 产品逻辑
- Canvas 交互
- 原始 SQLite 数据

### Implementation Steps

1. **main.py**: 将 `else` 分支从 `configure_store(InMemoryStore())` 改为初始化 MySQL engine + Alembic 校验 + `configure_store(DatabaseStore())`
2. **database.py**: 
   - 拆分 `init_db()`：仅在 SQLite 模式下调用 `create_tables()`
   - 新增 `init_mysql_engine()`：仅初始化 engine，不调用 create_all
   - 新增 `check_alembic_revision()`：读取 alembic_version 表并与 head 对比
3. **health.py**: 增强 `/health` 端点，返回 dialect、connected、alembic_current、alembic_head、alembic_match
4. **tests/**: 创建 test_mysql_runtime_cutover.py 和 test_health.py
5. **README.md**: 补充 MySQL 模式文档
6. **.env.example**: 补充 MySQL 相关变量

### Hard Gates
- 不读取 `.env` 或 `.env.*`
- MySQL 运行时不调用 `create_all()`
- Health 输出不暴露密码、完整 URL、token
- 保持 `REVID_USE_SQLITE=true` 行为不变
- 测试不污染正式数据库

### Stop Condition
完成 REPORT-T4-003.md 后停止。
