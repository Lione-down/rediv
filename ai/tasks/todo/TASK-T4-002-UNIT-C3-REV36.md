# TASK-T4-002-UNIT-C3-REV36 — Failure-Safe Cleanup Lifecycle Remediation

## Status

`SUPERSEDED BEFORE ACK — PRESERVED FOR LATER REPUBLICATION`

Human Owner 于 2026-07-04 最新指令将 T4-010 Unit B runtime recovery 与 publication 设为当前优先目标。Rev36 尚未被 Hermes ACK，且没有 Dispatcher/Executor card 或 active worker，因此本 revision 在执行前安全 supersede；Task、授权、fingerprints 与 Hard Gates 全部保留，未来重新发布必须使用 fresh revision/keys，不得复用 Rev36。

## Planned Queue Revision

`phase4-wave2-unit-c3-failure-lifecycle-remediation-2026-07-04-36`

## Authorization

Human Owner 于 2026-07-04 明确授权 T4-002 Unit C3 新的 bounded remediation，并要求继承全部 failure fingerprints 与安全 Hard Gates。Revision `-27` 至 `-30` 保持 terminal evidence，不得复用。

## Objective

修复 revision `-30` 的三个 Hard Gate 缺口：让 real AC4 与 non-MySQL regressions 调用同一 failure-safe cleanup lifecycle；在 DELETE、verification、resource close 或 primary body 失败时仍尝试恢复 FK checks；并完整保留 primary、close、delete、verification 与 restore failures。

## Scope

- 仅修改 `backend/tests/test_migration_tool.py` 中 AC4 cleanup lifecycle、对应 non-MySQL regressions 和最小 supporting test helper。
- 将 cleanup orchestration 提取为单一 lifecycle，真实 SQLAlchemy cleanup 与 non-MySQL recorder/fake operations 必须调用同一 orchestration implementation。
- real AC4 继续证明 target-only orphan detection、删除验证和 FK restoration。
- 重新运行五个 ADR-003 real-MySQL Unit C3 selectors，证明 AC6/AC10/AC11/AC12 无回归。

## Non-goals

- 不修改 `backend/scripts/migrate_sqlite_to_mysql.py`、schema、Alembic、models、API、frontend 或 Hermes runtime。
- 不改变 destination FK validation、same-PK conflict、rollback、consistency或 disposable database contract。
- 不重构其他 migration tests、shared fixture architecture、Unit C1/C2、Unit D/E、T4-003 或 T4-010。
- 不读取 `.env`，不接触 `revid_db` 或任何非 `revid_test_t4_002` database。
- 不创建 Independent REVIEW、HANDOFF 或后续 revision。

## Allowed Files

Executor 可修改：

- `backend/tests/test_migration_tool.py`

Executor 可创建：

- `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV36-PLAN.md`
- `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV36-PROGRESS.md`
- `ai/reports/REPORT-T4-002-UNIT-C3-REV36.md`

其他文件只读。未知 ownership 修改或改写 revision `-27` 至 `-30` artifacts 立即 `BLOCKED`。

## Implementation Constraints

1. cleanup lifecycle 必须在 orphan insert 成功后注册；migration、validation、assertion、resource close、DELETE 或 verification failure 均不得跳过 FK restoration attempt。
2. FK disable 成功后，restore 必须位于 lifecycle 的 `finally` 或等价保证路径中；DELETE/verification 抛错不能阻止 restore attempt。
3. real AC4 与所有 non-MySQL cleanup regressions 必须调用同一个 orchestration implementation；禁止在 regression 中复制独立 try/finally 模板。
4. non-MySQL regression 必须通过 recorder/fake operations 实际观察 ordered events，包括 FK disable、delete、verify 和 FK restore；不得以 dialect skip、source-text、AST 或“未抛异常”代替状态观察。
5. primary、resource-close、delete、verification 与 FK-restore failures 必须用 `ExceptionGroup`、明确 chaining 或等价结构全部保留；禁止 `except Exception: pass`。
6. 新增 exact regressions：
   - `test_cleanup_lifecycle_restores_fk_when_delete_fails`
   - `test_cleanup_lifecycle_preserves_primary_close_and_restore_failures`
   - 更新 `test_ac4_cleanup_runs_when_body_fails` 以断言真实 ordered cleanup events。
7. 不顺带重构 migration architecture 或其他 AC tests。

## Hard Gates

1. Supervisor 在 ACK/create 前运行 project-owned runtime deploy、`ROLE_CONTRACTS_OK` 和 deterministic status gate。
2. Real MySQL tests 只从 runtime environment 读取 `REVID_TEST_MYSQL_ADMIN_URL`；不得写入或回显 URL、username、password 或 secret。
3. Destructive operations 仅限 identity-confirmed `revid_test_t4_002` 的 CREATE/test writes/DROP；禁止触碰 `revid_db`。
4. secret 缺失、权限不足、identity 不明、cleanup/recreation 失败、skip、MySQL mock substitution 或 ownership 冲突立即 `BLOCKED`。
5. 禁止 claim、promote、unblock、retry、reparent、删除或复用 revisions `-27` 至 `-30` 及所有历史 T4-002 cards/keys。
6. Dispatcher max runtime `120s`；Executor max runtime `1800s`；最多一次 process retry；本授权只包含一个 business attempt。
7. REPORT 必须记录 exact commands、exit codes、pass/fail/skip/error counts、ordered cleanup events、failure grouping、database identity、mock semantics、business diff 和 unverified items，且不得包含 secret。

## Required Verification

按顺序执行：

```powershell
python -m py_compile backend/tests/test_migration_tool.py
python -m pytest backend/tests/test_migration_tool.py::TestUnitC3CleanupRegression::test_ac4_cleanup_runs_when_body_fails backend/tests/test_migration_tool.py::TestUnitC3CleanupRegression::test_cleanup_lifecycle_restores_fk_when_delete_fails backend/tests/test_migration_tool.py::TestUnitC3CleanupRegression::test_cleanup_lifecycle_preserves_primary_close_and_restore_failures -q -p no:cacheprovider
python -m pytest backend/tests/test_migration_tool.py::TestMigrationTool::test_ac4_fk_orphan_detected backend/tests/test_migration_tool.py::TestMigrationTool::test_ac6_consistency_report backend/tests/test_migration_tool.py::TestMigrationTool::test_ac10_conflict_nonzero_exit backend/tests/test_migration_tool.py::TestMigrationTool::test_ac11_partial_rollback backend/tests/test_migration_tool.py::TestMigrationTool::test_ac12_cleanup_failure_visible -q -p no:cacheprovider
git diff --check -- backend/tests/test_migration_tool.py
```

## Acceptance Criteria

- ordered non-MySQL evidence实际观察 `fk_disable -> delete -> verify -> fk_restore`，并证明 delete/verify failure 后仍尝试 restore。
- primary body、resource close 与 FK restore 同时失败时，三类 failure 均可在同一 exception structure 中识别。
- real AC4 在任一 post-insert failure path 后删除并验证 `q-orphan` 不存在，且 FK checks 已恢复。
- 五个 real-MySQL selectors 同一次有序执行为 `5 passed / 0 failed / 0 skipped / 0 errors`。
- AC4 message 继续包含 `quotas`、FK column 与 `nonexistent-user`；AC6/AC10/AC11/AC12 semantics 不回归。
- 仅 Allowed Files 发生本 revision 修改；无 secret 泄露、未授权数据库访问或 Scope Drift。
- PLAN、PROGRESS、REPORT 属于 revision `-36`，并准确区分 non-MySQL evidence 与 real-MySQL evidence。

## Failure Fingerprint Inheritance

继承 T4-002 revision `-30` 的完整 fingerprint chain，至少包括：

- `UNIT_C3_REV27_DESTINATION_FK_AND_TEST_ISOLATION_FAILURE`
- `REV28_AC4_CLEANUP_NOT_FAILURE_SAFE`
- `REV29_AC4_ORPHAN_DELETION_STILL_NOT_FAILURE_SAFE_AND_REGRESSION_NOT_BOUND`
- `REV30_FK_RESTORATION_UNPROVEN_AND_CLEANUP_FAILURES_NOT_PRESERVED`

Revision、card、runtime 或 passing test count 均不得清零 fingerprints。

## Stop Condition

只生成 revision `-36` PLAN、PROGRESS、business diff 与 REPORT，并停止于 `UNIT_C3_FAILURE_LIFECYCLE_REPORT_READY_REV36`。由 PMC 决定 Independent Review continuation；不得自行创建 Reviewer、HANDOFF 或下一 Task。
