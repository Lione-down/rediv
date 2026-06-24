# ADR-001: 本地 MySQL 8.0 作为 Revid 主数据库

## 状态

Accepted — 用户于 2026-06-21 明确要求。

## 背景

Revid 当前使用 SQLite 持久化。用户已在本机运行 MySQL 8.0，并希望通过 Navicat 直接查看项目、节点、额度、资产和生成结果，因此 MySQL 不是面向规模的预优化，而是本地数据可观测需求。

## 决策

- MySQL 8.0 `revid_db` 成为本地正常运行时的主数据库。
- SQLite 保留为测试数据库和首次迁移的只读数据源。
- SQLAlchemy 2.x model metadata 是 schema 事实源。
- 使用 PyMySQL 连接 MySQL，使用 Alembic 管理 schema revision。
- 使用独立 ETL 脚本迁移数据，不转换 `sqlite_master` DDL。
- 表使用 InnoDB、`utf8mb4`，每张表和每个字段必须有备注。
- migration 与 runtime 使用环境变量读取凭据，不在仓库保存真实密码。

## 后果

- 优点：Navicat 可直接检查数据；后续 schema 变更可追踪；更接近长期部署方式。
- 代价：需要维护 migration、MySQL integration tests 和回滚流程。
- 风险：SQLite/MySQL 在 JSON、timezone、boolean 和约束行为上存在差异，必须通过专项测试验证。

## 回滚

保留 `revid.db` 备份并恢复 `REVID_USE_SQLITE=true`。MySQL schema 或数据的删除不属于自动回滚范围，执行前必须获得用户确认。

