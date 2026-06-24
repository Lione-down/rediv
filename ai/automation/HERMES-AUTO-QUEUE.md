# Hermes Automatic Queue

该文件是 Hermes scheduled mode 的任务授权白名单。只有 Human User 或 Codex Project Master Controller 明确批准的波次才能写为 `APPROVED`。

## Active Wave

| Field | Value |
|---|---|
| Revision | `phase4-wave2-blocked-2026-06-24-02` |
| Status | `BLOCKED` |
| Approved By | `Codex Project Master Controller` |
| Execution Mode | `scheduled` |
| Stop After | `No dispatch` |

## Tasks

| Task ID | Project Task File | Executor Profile | Parallel Group | Review Profile | Action |
|---|---|---|---|---|---|
| — | — | — | — | — | 当前无可执行 Task；禁止创建 Coordinator、Executor 或 Reviewer 卡 |

## Blocked Entry

- T4-002 的 Human-approved revision `phase4-wave2-manual-rework-2026-06-24-01` 保留为一次人工 REWORK 授权，但未进入 Executor attempt。
- Hermes runtime 未设置 `REVID_TEST_MYSQL_ADMIN_URL`，不满足 ADR-003 Hard Gate。
- 旧 Coordinator `t_64d6db92` 已错误完成；禁止复用该 card 或 revision-based idempotency key。
- 解除条件：Hermes 提供 secret readiness 证据后，由 Codex PMC 发布全新的 APPROVED Queue revision；本 BLOCKED revision 不授权执行。

## Manual Rework Authorization

- `phase4-wave2-manual-rework-2026-06-24-01` 是 Human User 对重复 failure fingerprint 的一次性人工返工授权，不属于自动 REWORK。
- 旧 revision、旧 card、旧 REPORT、旧 REVIEW 和旧 HANDOFF 不得作为本轮完成证据。
- 本轮 attempt 必须使用新的 idempotency key，并生成全新的 PLAN、PROGRESS、REPORT、REVIEW 和 HANDOFF。
- 再次出现相同 failure fingerprint 时直接 BLOCKED，等待 Codex PMC；不得继续自动返工。
- 本次调度未创建 Executor attempt，因此未消耗 Human User 批准的人工 REWORK 次数。

## T4-002 Safety Gates

- Human User 与 Codex PMC 已明确授权创建和销毁唯一专用数据库 `revid_test_t4_002`；完整边界见 `ai/decisions/ADR-003-t4-002-disposable-mysql-test-environment.md`。
- Hermes runtime 必须通过 secret/environment 注入 `REVID_TEST_MYSQL_ADMIN_URL`；Worker 不读取项目 `.env`，不得在卡片或报告中记录 secret。
- 测试代码只允许读取 `REVID_TEST_MYSQL_ADMIN_URL`；禁止回退 `REVID_MYSQL_URL`、`REVID_DB_*`、`MYSQL_ROOT_PASSWORD`、硬编码密码或其他 database。
- 允许 `CREATE DATABASE` / `DROP DATABASE` 的对象仅限精确名称 `revid_test_t4_002`。执行前必须读取 metadata 并断言目标名；禁止 wildcard、前缀匹配或 fallback database。
- target URL 必须使用 SQLAlchemy structured URL API 构造，禁止 regex 或字符串替换 credentials/database path。
- test schema 必须通过 Alembic `upgrade head` 创建，禁止 fixture 手写 12-table DDL。
- cleanup 失败必须形成失败或 BLOCKED 证据，不得静默吞异常。
- CLI 默认 dry-run，只有显式 `--execute` 才允许写入 MySQL。
- 禁止删除、覆盖或修改原始 `revid.db`；禁止 drop、truncate、reset 或清库。
- 在用户现有 MySQL 数据上执行写迁移前，必须先报告 dry-run 摘要；自动测试应使用隔离数据源/目标。
- 不得打印、复制或写入 credentials、完整 connection URL、token、raw profile。
- 迁移必须幂等；row count、主键、外键、关键 JSON 与 quota 校验失败时返回非零 exit code。
- integration tests 禁止硬编码绝对路径；必须使用专用 disposable MySQL test database，不得写用户现有 `revid_db`。
- 覆盖 execute、second-run、same-PK conflict、FK orphan、partial rollback、12-table consistency；missing-source test 不得因缺密码而 skip。
- rollback test 必须实际制造 batch 中途失败并验证未发生部分提交；test name 或成功路径不能代替 rollback 证据。
- 若 secret 缺失、权限不足或 database identity 无法证明，标记 BLOCKED；禁止回退到 `.env` 或 `revid_db`。

## Shared Authorization Rules

- 后续新 APPROVED revision 只能包含 T4-002，database migration 和 destructive verification 必须串行。
- 发现目标文件存在未知归属 diff 时标记 BLOCKED；无关用户文件只记录风险，不扩大 scope。
- 使用 queue revision + Task ID 作为 idempotency key，不重复创建 running/review card。
- 历史 scheduled 卡 `t_ae07d489` 已过时，应标记 cancelled/obsolete，不得复用。
- Reviewer PASS 后等待 Codex PMC 最终验收，不自动流转到 done，不自动启动 T4-003/T4-010。
- 需要 scope 变更、secret、destructive operation、外部服务或用户决策时停止并记录。

## Future Completion Gate

- T4-002 具备后续新 APPROVED revision 的最新 PLAN、PROGRESS、REPORT。
- T4-002 具有该 revision 的独立 Reviewer 结论；REWORK 必须完成后再复审。
- 测试、安全门、未验证项、风险和 rollback 行为证据已记录。
- 无 secret 泄露、越权修改或未确认的不可逆操作。

完成后生成新的 PMC handoff 并停止，不自动领取后续任务。

*最后更新：2026-06-24 09:00 +08:00*
