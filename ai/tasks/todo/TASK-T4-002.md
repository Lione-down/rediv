# Task: SQLite → MySQL 数据迁移工具

## Task ID
T4-002

## Current Attempt

- Human-approved Revision：`phase4-wave2-manual-rework-2026-06-24-01`
- Governance Revision：`phase4-wave2-blocked-2026-06-24-02`
- Status：`BLOCKED — NOT DISPATCHED`
- Approved By：Human User
- PMC Review：`ai/reviews/REVIEW-T4-002-PMC-2026-06-24.md`
- Blocking Review：`ai/reviews/REVIEW-T4-002-PMC-BLOCKED-2026-06-24.md`
- Safety Decision：`ai/decisions/ADR-003-t4-002-disposable-mysql-test-environment.md`

本轮是重复 failure fingerprint 后的一次性人工返工授权。该授权仍有效，但 Hermes 未成功派发 Executor，且运行时缺少专用 secret，因此当前未进入新的 Executor attempt。旧 PLAN、PROGRESS、REPORT、REVIEW、HANDOFF 仅作历史证据，不得作为本轮完成证明。

## Current Blockers

1. Hermes runtime 未设置 `REVID_TEST_MYSQL_ADMIN_URL`；缺失时不得执行 CREATE/DROP 或连接替代数据库。
2. revision `phase4-wave2-manual-rework-2026-06-24-01` 的 Coordinator idempotency key 已被错误完成，不能复用。
3. 解除后必须由 Codex PMC 发布全新的 APPROVED Queue revision，Hermes 才能派发新的 Executor attempt。

## Phase
Phase 4A — MySQL 主数据库

## Category
Backend / Data Migration

## Priority
P0

## Assigned To
Backend Executor

## Objective
提供可 dry-run、可重复执行、可验证的 ETL 工具，将 `revid.db` 的现有数据迁移到由 Alembic 创建的 MySQL schema。

## Chosen Technology
- Python CLI script。
- SQLAlchemy Session/Core 做结构化读取和写入。
- Alembic 只负责 schema；ETL 只负责 data。

## Scope
- 允许新增：`scripts/migrate_sqlite_to_mysql.py`、迁移专项测试和纯计数/校验报告模板。
- 必要时允许修改：`backend/models/**` 中已确认的跨数据库类型兼容问题。
- 禁止修改：前端、业务 API、原始 `revid.db`、MySQL credentials。

## Dependencies
T4-001 已审查通过，MySQL schema 已由 Alembic 创建。

## Implementation Requirements
1. CLI 默认 dry-run；只有显式 `--execute` 才写入 MySQL。
2. source path 和 target connection 从参数/env 读取；密码不得出现在命令输出。
3. 按 foreign key 依赖顺序迁移；每批使用 transaction。
4. 使用主键 upsert/存在性检查实现幂等，重复执行不得重复额度流水或资产。
5. 校验每表 row count、主键集合、外键孤儿、关键 JSON 和 quota 数值。
6. 输出只包含表名、数量、checksum、耗时和错误摘要，不输出 raw_profile、token 或 secret。
7. 任何校验失败返回非零 exit code，且不得切换 runtime。

## Acceptance Criteria
- [ ] dry-run 不改变 MySQL 数据。
- [ ] 在临时 SQLite/MySQL 测试数据上完整迁移成功。
- [ ] 连续执行两次后 row count 和业务值保持不变。
- [ ] 人为制造外键孤儿或重复冲突时脚本失败并给出具体表名。
- [ ] 用户的原始 `revid.db` 未被覆盖或删除。
- [ ] 迁移报告证明 SQLite/MySQL 的 12 张表数据一致。
- [ ] fixture 只接受 `REVID_TEST_MYSQL_ADMIN_URL`；secret 缺失时明确 BLOCKED，无 credential fallback。
- [ ] 使用 structured URL API，并在 CREATE/DROP 前后证明 database identity 精确为 `revid_test_t4_002`。
- [ ] 测试 schema 由 Alembic `upgrade head` 创建，不手写 12-table DDL。
- [ ] same-PK different-value conflict 实际触发 non-zero exit，且既有数据未被静默覆盖。
- [ ] partial rollback 测试实际制造 batch 中途失败，并证明该 batch 没有部分提交。
- [ ] cleanup 失败可见且会导致失败或 BLOCKED，不静默吞异常。

## Verification Commands
```powershell
python scripts/migrate_sqlite_to_mysql.py --dry-run
python scripts/migrate_sqlite_to_mysql.py --execute
cd backend
python -m unittest discover -s tests -p "test_*migration*.py"
```

## Manual Acceptance
使用 Navicat 对比 SQLite 源数据摘要和 MySQL 中 users、quotas、quota_ledger、projects、canvas_nodes、assets 的记录数量和关键值。

## Deliverables
- 迁移 CLI 与测试。
- `ai/tasks/doing/TASK-T4-002-PLAN.md`
- `ai/tasks/doing/TASK-T4-002-PROGRESS.md`
- `ai/reports/REPORT-T4-002.md`
- 本 revision 的全新 Independent REVIEW 与 HANDOFF；文件内容必须明确 revision、attempt 和 failure fingerprint。

## Codex Prompt
先读取 T4-001 报告及 Alembic revision。禁止解析 `sqlite_master` 后字符串替换 DDL；使用 SQLAlchemy 做 data ETL。编码前创建 PLAN/PROGRESS，完成 dry-run、execute、幂等和一致性测试后提交 REPORT。不得删除或覆盖任何数据库。
