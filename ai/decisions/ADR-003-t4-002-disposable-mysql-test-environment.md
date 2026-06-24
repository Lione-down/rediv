# ADR-003: T4-002 使用专用 disposable MySQL 测试环境

## 状态

Accepted — 2026-06-23，由 Human User 授权，Codex PMC 记录。

## 背景

T4-002 必须验证 SQLite → MySQL 的 execute、幂等、冲突、FK、rollback 和 12-table consistency。Hermes Worker 无权读取项目 `.env`，现有 `.env` 又指向用户正在使用的 `revid_db`，不能作为自动化测试目标。

## 决策

1. 允许 T4-002 Executor 创建和销毁唯一命名的专用数据库：`revid_test_t4_002`。
2. 明确允许的 destructive operations 仅为：
   - `CREATE DATABASE revid_test_t4_002`；
   - 对该数据库执行 Alembic schema setup、测试数据写入与校验；
   - `DROP DATABASE revid_test_t4_002`，仅用于测试前清理残留或测试后回收。
3. 禁止对 `revid_db` 或任何其他数据库执行 DROP、TRUNCATE、DELETE、downgrade、reset 或迁移测试写入。
4. Hermes runtime 通过 secret/environment 注入 `REVID_TEST_MYSQL_ADMIN_URL`。该值不得写入仓库、任务正文、日志、报告或命令回显。
5. 若 secret 缺失、连接身份无 CREATE/DROP DATABASE 权限，或无法确认当前 database name，Executor 必须返回 BLOCKED；禁止回退读取 `.env`、猜测密码或使用 `revid_db`。
6. 测试代码从 admin URL 安全构造 test database URL；报告只记录 host 可达性、数据库固定名称、测试数量和结果，不记录 username、password 或完整 URL。

## 成功标准

- 测试开始前断言目标 database name 严格等于 `revid_test_t4_002`。
- Alembic 在 test database 建立 12 张表及备注。
- execute、second-run idempotency、same-PK conflict、FK orphan、partial rollback、missing source、source immutability 和 12-table consistency 全部实际执行，不得 skip。
- 测试完成后确认 `revid_db` 未发生写入，且 test database 按 fixture 策略完成清理。
- Reviewer 独立复跑后再交 PMC；不得因本 ADR 自动解锁 T4-003。

## 后果

- 优点：可以完成真实 MySQL 端到端验证，同时隔离用户数据。
- 成本：Hermes 运行环境需要单独配置一个具备有限建库权限的 secret。
- 风险：误选数据库会造成破坏，因此 database name 精确断言是不可跳过的 hard gate。

