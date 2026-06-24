# Task: MySQL 8 引擎、模型备注与 Alembic baseline

## Task ID
T4-001

## Phase
Phase 4A — MySQL 主数据库

## Category
Backend / Database

## Priority
P0

## Assigned To
Backend Executor

## Objective
让现有 SQLAlchemy models 能在本机 MySQL 8.0 上通过 Alembic 创建带完整备注的 schema，但本任务不迁移数据、不切换 runtime。

## Chosen Technology
- SQLAlchemy 2.x ORM 作为 schema 事实源。
- `mysql+pymysql` 作为 MySQL dialect/driver。
- Alembic 管理 schema revision。
- InnoDB、`utf8mb4`、UTC 时间。

## Scope
- 允许修改：`backend/models/**`、`backend/settings/config.py`、`backend/requirements.txt`、`backend/database.py`。
- 允许新增：`backend/alembic.ini`、`backend/migrations/**`、数据库配置专项测试。
- 禁止修改：业务 router、前端、SQLite 数据、真实 `.env`。
- 本任务涉及 12 个 model 文件和 migration 文件，属于明确批准的跨文件 schema 工作，不得顺手重构 `store.py`。

## Dependencies
无。可与 T4-006 并行。

## Implementation Requirements
1. 数据库 URL 使用 SQLAlchemy URL API 或等价结构化构建，密码中含特殊字符时仍正确。
2. `REVID_USE_SQLITE=true` 时保持现有 SQLite 行为；false 时构建 MySQL engine。
3. MySQL engine 配置 `pool_pre_ping` 和适合本地长连接的 `pool_recycle`，数值从 settings 读取。
4. 所有 table 设置 table comment；所有 mapped column 设置 column comment。
5. MySQL table options 使用 InnoDB 和 `utf8mb4`。
6. Alembic `target_metadata` 指向 `Base.metadata`；创建首个人工审查过的 baseline revision。
7. 不使用 `Base.metadata.create_all()` 代替后续 migration。

## Acceptance Criteria
- [ ] `alembic upgrade head` 可在空 MySQL `revid_db` 创建完整 schema。
- [ ] `alembic downgrade base` 在专用测试库中可回退；不得对用户现有库执行 destructive 验证。
- [ ] SQLAlchemy Inspector 能读取每张表和每个字段的 comment。
- [ ] SQLite 现有 97 tests 继续通过。
- [ ] requirements 明确包含兼容的 PyMySQL 和 Alembic 版本范围。
- [ ] 未读取、打印或提交真实数据库密码。

## Verification Commands
```powershell
cd backend
python -m compileall .
python -m unittest discover -s tests -p "test_*.py"
alembic current
alembic upgrade head
```

## Manual Acceptance
Executor 通过 Navicat 打开测试 schema，抽查 `users`、`projects`、`canvas_nodes`、`assets`、`quota_ledger`：engine、charset、表备注和字段备注均可见，并在报告中记录检查结果，不附带凭据截图。

## Deliverables
- 代码与 migration 文件。
- `ai/tasks/doing/TASK-T4-001-PLAN.md`
- `ai/tasks/doing/TASK-T4-001-PROGRESS.md`
- `ai/reports/REPORT-T4-001.md`

## Codex Prompt
先阅读 `AGENTS.md`、`ai/state/CURRENT.md`、ADR-001、ADR-002 和本任务。编码前创建 PLAN/PROGRESS。仅完成 MySQL engine、model comments 和 Alembic baseline，不迁移数据、不切换 runtime。运行全部验证并在 REPORT 中列出 revision、表数量、备注检查和风险。

