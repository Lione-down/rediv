# Task: MySQL runtime 切换与 Navicat 验收

## Task ID
T4-003

## Phase
Phase 4A — MySQL 主数据库

## Category
Backend / Integration

## Priority
P0

## Assigned To
Backend Executor

## Objective
让 FastAPI 在 `REVID_USE_SQLITE=false` 时使用 MySQL `DatabaseStore` 正常启动、读写和重启恢复，并完成 Navicat 验收。

## Chosen Technology
FastAPI lifespan/startup + SQLAlchemy engine/session + existing `DatabaseStore`。

## Scope
- 允许修改：`backend/main.py`、`backend/database.py`、`backend/models/base.py`、`backend/controllers/store.py` 中仅与 engine/session 适配直接相关的代码、`backend/api/health.py`、配置说明和专项测试。
- 禁止修改：前端、Auth 产品逻辑、Canvas 交互、原始 SQLite 数据。

## Dependencies
T4-002 已审查通过且迁移一致性报告通过。

## Implementation Requirements
1. 修复 false 分支使用 `InMemoryStore` 的错误；MySQL 和 SQLite 都使用 `DatabaseStore`。
2. startup 只检查 schema revision，不用 `create_all()` 静默修改生产 schema。
3. 增加数据库 health 结果：dialect、连接状态、Alembic revision；不得返回 host password 或完整 URL。
4. MySQL integration tests 使用独立测试数据库或 transaction rollback，不污染用户正式数据。
5. 保持 `REVID_USE_SQLITE=true` 的现有测试路径。
6. 更新 README：启动、Alembic、迁移、切换和回滚命令。

## Acceptance Criteria
- [ ] MySQL 模式服务启动成功，`/health` 显示数据库 ready。
- [ ] API 创建用户/项目/节点/资产后可在 Navicat 查看。
- [ ] 重启 backend 后上述数据仍可通过 API 读取。
- [ ] SQLite 全量 tests 和 MySQL integration tests 均通过。
- [ ] 改回 `REVID_USE_SQLITE=true` 可回滚运行。
- [ ] MySQL 连接失败时启动错误包含可操作信息且不回退到内存存储。

## Verification Commands
```powershell
cd backend
python -m unittest discover -s tests -p "test_*.py"
$env:REVID_USE_SQLITE='false'
python -c "import main"
```

## Manual Acceptance
在 Navicat 中新增/刷新/重启验证数据；报告记录数据库名、revision、表数和测试记录 ID，不记录密码。

## Deliverables
- Runtime 适配、health、tests、README。
- `ai/tasks/doing/TASK-T4-003-PLAN.md`
- `ai/tasks/doing/TASK-T4-003-PROGRESS.md`
- `ai/reports/REPORT-T4-003.md`

## Codex Prompt
只完成 MySQL runtime cutover 和验证。任何 schema 差异必须新增 Alembic revision，不得在 startup 中 create_all 修补。编码前维护 PLAN/PROGRESS，完成 Navicat 和重启持久化验收后写 REPORT。

