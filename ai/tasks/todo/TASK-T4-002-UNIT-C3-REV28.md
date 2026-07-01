# TASK-T4-002-UNIT-C3-REV28 — Integrity and Test-Isolation Remediation

## Status

`PMC_BLOCKED — REPORT_READY evidence rejected; not executable`

PMC closure: `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV28-BLOCKED-2026-07-01.md`。Executor 的五项 selectors 自报通过，但 AC4 orphan cleanup 仍位于 failure-producing assertion 之后，未满足本 Task 的 failure-safe cleanup constraint。Revision `-28` cards/keys 为 terminal evidence，不得复用；在新的 bounded correction authorization 发布前不得进入 Independent Review lifecycle。

## Revision

`phase4-wave2-unit-c3-integrity-remediation-2026-07-01-28`

## Authorization

Revision `-27` completed its read-only verification and is terminal `PMC_REWORK` with fingerprint `UNIT_C3_REV27_DESTINATION_FK_AND_TEST_ISOLATION_FAILURE`. This revision is the single PMC-authorized business REWORK continuation. It changes scope from verification-only to bounded remediation, uses fresh cards and idempotency keys, and inherits every historical T4-002 fingerprint.

## Objective

修复 destination FK orphan 检测以及 Unit C3 的数据库隔离、patch target 和资源释放缺陷，使五个既有 real-MySQL selectors 在同一次有序执行中全部通过，并保持 migration conflict、rollback、report 和 cleanup semantics 不回归。

## Scope

- 在 `backend/scripts/migrate_sqlite_to_mysql.py` 中让 FK orphan validation 检查 MySQL target child rows 的 FK values，而不是只检查 SQLite source values。
- 在 `backend/tests/test_migration_tool.py` 中修复 AC4/AC6/AC10/AC12 的 deterministic setup/cleanup、有效 patch binding 和 SQLite/SQLAlchemy resource disposal。
- 只补充直接覆盖上述缺陷所需的最小 regression assertions/helpers。
- 运行 targeted non-destructive tests 与五个 ADR-003 disposable-MySQL Unit C3 selectors。

## Non-goals

- 不修改 schema、Alembic migration、models、API、frontend 或 Hermes runtime。
- 不改变 same-PK different-value fail-closed policy，不引入 silent overwrite、`INSERT IGNORE`、broad upsert 或 exception swallowing。
- 不执行 Unit C1/C2、Unit D/E、T4-003 或 T4-010。
- 不读取 `.env`，不接触 `revid_db` 或任何非 `revid_test_t4_002` database。
- 不创建 Independent REVIEW、HANDOFF、REWORK 或后续 lifecycle card。

## Allowed Files

Executor 可修改：

- `backend/scripts/migrate_sqlite_to_mysql.py`
- `backend/tests/test_migration_tool.py`

Executor 可创建：

- `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV28-PLAN.md`
- `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV28-PROGRESS.md`
- `ai/reports/REPORT-T4-002-UNIT-C3-REV28.md`

任何其他业务文件修改、未知 ownership 修改或 revision `-27` artifact 改写均立即 `BLOCKED`。

## Implementation Constraints

1. FK validation 必须从 target child table 读取非空 FK values，再与 target parent table referenced IDs 比较；不得把 source-only values 当作 destination integrity proof。
2. FK orphan error 必须至少包含 child table、FK column、orphan count 和一个 offending value，例如 `nonexistent-user`。
3. AC4 cleanup 必须在 assertion 或 migration failure 时仍执行；AC6 不得继承 AC4 residue。
4. AC10 必须显式建立 clean target state 后预置 same-PK/different-value row；失败必须来自 migration conflict path，而不是 arrange 阶段的 duplicate INSERT。
5. AC12 必须 patch 当前实际 module object/local binding，证明 injected cleanup failure 原样传播，并在 `finally` 恢复 disposable database state。
6. 所有 SQLite readers/connections、SQLAlchemy engines/connections 必须在 temp directory 删除前关闭；不得通过忽略 `PermissionError` 伪造通过。
7. 修复保持最小范围，不顺带重构 migration architecture 或全部测试 lifecycle。

## Hard Gates

1. Supervisor 在 ACK/create 前运行 project-owned runtime deploy 与 `ROLE_CONTRACTS_OK` verifier。
2. Real MySQL tests 只从 runtime environment 读取 `REVID_TEST_MYSQL_ADMIN_URL`；不得写入或回显完整 URL、username、password 或 secret。
3. Destructive operations 仅限 `CREATE DATABASE revid_test_t4_002`、该库内 test writes 和 `DROP DATABASE revid_test_t4_002`；每次 destructive operation 前必须确认 identity。
4. secret 缺失、权限不足、identity 不明、cleanup/recreation 失败、skip、MySQL mock substitution 或文件 ownership 冲突立即 `BLOCKED`。
5. 禁止 claim、promote、unblock、retry、reparent、删除或复用 revision `-27` 及任何历史 T4-002 card。
6. Dispatcher max runtime `120s`；Executor max runtime `1800s`；`max_retries=2` 表示 initial attempt 加最多一次 process retry。
7. REPORT 必须记录 exact commands、exit codes、pass/fail/skip/error counts、database identity、normal/failure cleanup result、mock semantics、business diff 和 unverified items。

## Dispatcher Contract

Supervisor 通过 `ai/runtime/create-hermes-coordinator.py` 创建且只创建一个 fresh `revid-dispatcher` card：

- Standalone Action: `DISPATCH_ONLY`
- Revision: `phase4-wave2-unit-c3-integrity-remediation-2026-07-01-28`
- Task path: `ai/tasks/todo/TASK-T4-002-UNIT-C3-REV28.md`
- Dispatch idempotency: `revid:phase4-wave2-unit-c3-integrity-remediation-2026-07-01-28:T4-002:dispatch`
- Max runtime: `120s`; `max_retries=2`
- Executor profile: `revid-backend`

Dispatcher 原子创建且只创建一个 Executor child：

- Idempotency: `revid:phase4-wave2-unit-c3-integrity-remediation-2026-07-01-28:T4-002:execute:0`
- Parent: 当前 Dispatcher card
- Max runtime: `1800s`; `max_retries=2`
- Action: `IMPLEMENT_AND_TEST_ONLY`

Dispatcher 必须 read-back 校验 child assignee、parent、revision、body、runtime 和 idempotency，随后立即完成；禁止运行 tests、访问数据库、写 artifacts、等待 Executor、创建 Reviewer/HANDOFF 或复用旧 card。

## Required Verification

从项目 backend virtual environment 按顺序运行：

```powershell
python -m py_compile backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py
python -m pytest backend/tests/test_migration_tool.py::TestMigrationTool::test_ac4_fk_orphan_detected backend/tests/test_migration_tool.py::TestMigrationTool::test_ac6_consistency_report backend/tests/test_migration_tool.py::TestMigrationTool::test_ac10_conflict_nonzero_exit backend/tests/test_migration_tool.py::TestMigrationTool::test_ac11_partial_rollback backend/tests/test_migration_tool.py::TestMigrationTool::test_ac12_cleanup_failure_visible -q -p no:cacheprovider
git diff --check -- backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py
```

如新增了不访问 MySQL 的 direct regression selector，必须在 real-MySQL command 前单独运行并在 REPORT 记录 exact selector；不得替代上面的五项集成验证。

## Acceptance Criteria

- 五个 Unit C3 selectors 在同一次有序 real-MySQL 执行中 `5 passed`、`0 failed`、`0 skipped`、`0 errors`。
- AC4 明确证明 target-only FK orphan 被 destination integrity validation 捕获，message 包含 `quotas`、FK column 和 `nonexistent-user`。
- AC6 覆盖 12 张表的 source/target count 与 checksum semantics，且不依赖前序残留数据。
- AC10 的 non-zero exit 明确来自 same-PK different-value migration conflict，既有 target value 保持不变。
- AC11 继续证明 mid-batch failure 后无 partial commit。
- AC12 同时证明正常 cleanup 实际删除数据库、injected cleanup failure 可见、后续数据库恢复/最终 teardown 成功。
- Windows temp directory cleanup 无 file-lock error；所有 created engines/readers/connections 均有 deterministic disposal。
- 仅 Allowed Files 发生本 revision 修改；无 secret 泄露、未授权数据库访问或 Scope Drift。
- PLAN、PROGRESS、REPORT 属于 revision `-28` / Unit C3 / 单次 PMC-authorized business REWORK continuation。

## Failure Fingerprint Inheritance

继承 T4-002 截至 revision `-27` 的全部 business/runtime fingerprints，并新增：

- `UNIT_C3_REV27_DESTINATION_FK_AND_TEST_ISOLATION_FAILURE`
- `AC4_DESTINATION_ORPHAN_NOT_INSPECTED`
- `UNIT_C3_SHARED_DB_STATE_CONTAMINATION`
- `AC12_INVALID_PATCH_TARGET`
- `UNIT_C3_SQLITE_HANDLE_LEAK`

Revision 变化不得清零任何 fingerprint。

## Stop Condition

只生成 Unit C3 revision `-28` PLAN、PROGRESS、REPORT，并在 `UNIT_C3_REMEDIATION_REPORT_READY_REV28` 停止。REPORT passing 后由 PMC 决定是否发布独立 `REVIEW_DISPATCH_ONLY` lifecycle continuation；失败或证据不足时必须返回 PMC，不得自行创建 Reviewer、HANDOFF 或下一 Task。
