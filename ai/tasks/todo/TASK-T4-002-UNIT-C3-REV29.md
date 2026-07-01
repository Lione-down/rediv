# TASK-T4-002-UNIT-C3-REV29 — AC4 Failure-Safe Cleanup Correction

## Status

`TERMINAL — PMC_BLOCKED`

## Revision

`phase4-wave2-unit-c3-ac4-cleanup-correction-2026-07-01-29`

## Authorization

Human Owner 于 2026-07-01 明确要求将 revision `-28` 的未通过验收结果退回 Hermes 返工。Codex PMC 据此批准一个新的 bounded correction revision。Revision `-28` 保持 terminal `PMC_BLOCKED`，其 cards、runs、artifacts 与 idempotency keys 只作为证据，不得复用。

## Objective

修正 AC4 orphan test 的 failure-safe cleanup，使 insert、migration、validation、assertion、resource disposal 与 orphan deletion 位于可证明的外层 `try/finally` 生命周期中，并用不访问 MySQL 的 targeted regression 证明 validator/assertion failure 时 cleanup 仍执行。

## Scope

- 仅修改 `backend/tests/test_migration_tool.py` 中 AC4 cleanup 生命周期。
- 允许增加一个最小、单用途 helper，使 failure-path cleanup 可以被无 MySQL regression 直接验证。
- 增加 `TestUnitC3CleanupRegression::test_ac4_cleanup_runs_when_body_fails` 或语义等价的明确 selector。
- 重新运行五个 ADR-003 real-MySQL Unit C3 selectors，确认 revision `-28` 的其余修复没有回归。

## Non-goals

- 不修改 migration implementation、schema、Alembic、models、API、frontend 或 Hermes runtime。
- 不改变 destination FK validation、same-PK conflict、rollback、consistency 或 cleanup contract。
- 不执行 Unit C1/C2、Unit D/E、T4-003 或 T4-010。
- 不读取 `.env`，不接触 `revid_db` 或任何非 `revid_test_t4_002` database。
- 不创建 Independent REVIEW、HANDOFF 或下一 revision。

## Allowed Files

Executor 可修改：

- `backend/tests/test_migration_tool.py`

Executor 可创建：

- `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV29-PLAN.md`
- `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV29-PROGRESS.md`
- `ai/reports/REPORT-T4-002-UNIT-C3-REV29.md`

`backend/scripts/migrate_sqlite_to_mysql.py` 与其他业务文件必须 read-only。未知 ownership 修改或改写 revision `-27`/`-28` artifacts 立即 `BLOCKED`。

## Implementation Constraints

1. AC4 orphan insert 后的 migration、validation、assertion、reader/writer/engine disposal 与 orphan deletion 必须由同一外层 `try/finally` 生命周期保护。
2. cleanup 必须在 body 正常返回、validator 抛错、assertion failure 和 resource-close failure 路径上被调用；cleanup 自身失败不得被吞掉。
3. orphan deletion 后必须验证 `q-orphan` 不存在，并恢复 `FOREIGN_KEY_CHECKS=1`。
4. targeted regression 不得访问 MySQL，不得只做 source-text/AST assertion；必须执行 failure path 并观察 cleanup callable/state。
5. 删除无证明作用的 `orphan_cleaned_up` 变量，或将其变为实际 assertion evidence；不得保留误导性 dead state。
6. 不顺带重构 migration architecture 或其他测试 lifecycle。

## Hard Gates

1. Supervisor 在 ACK/create 前运行 project-owned runtime deploy 与 `ROLE_CONTRACTS_OK` verifier。
2. Real MySQL tests 只从 runtime environment 读取 `REVID_TEST_MYSQL_ADMIN_URL`；不得写入或回显完整 URL、username、password 或 secret。
3. Destructive operations 仅限 `CREATE DATABASE revid_test_t4_002`、该库内 test writes 和 `DROP DATABASE revid_test_t4_002`；每次 destructive operation 前必须确认 identity。
4. secret 缺失、权限不足、identity 不明、cleanup/recreation 失败、skip、MySQL mock substitution 或 ownership 冲突立即 `BLOCKED`。
5. 禁止 claim、promote、unblock、retry、reparent、删除或复用 revision `-27`/`-28` 及历史 T4-002 cards。
6. Dispatcher max runtime `120s`；Executor max runtime `1800s`；`max_retries=2` 表示 initial run 加最多一次 process retry。
7. REPORT 必须记录 exact commands、exit codes、pass/fail/skip/error counts、targeted regression failure-path evidence、database identity、normal/failure cleanup result、mock semantics、business diff 和 unverified items。

## Dispatcher Contract

Supervisor 通过 `ai/runtime/create-hermes-coordinator.py` 创建且只创建一个 fresh `revid-dispatcher` card：

- Standalone Action: `DISPATCH_ONLY`
- Revision: `phase4-wave2-unit-c3-ac4-cleanup-correction-2026-07-01-29`
- Task path: `ai/tasks/todo/TASK-T4-002-UNIT-C3-REV29.md`
- Dispatch idempotency: `revid:phase4-wave2-unit-c3-ac4-cleanup-correction-2026-07-01-29:T4-002:dispatch`
- Max runtime: `120s`; `max_retries=2`
- Executor profile: `revid-backend`

Dispatcher 原子创建且只创建一个 Executor child：

- Action: `IMPLEMENT_AND_TEST_ONLY`
- Idempotency: `revid:phase4-wave2-unit-c3-ac4-cleanup-correction-2026-07-01-29:T4-002:execute:0`
- Parent: 当前 Dispatcher card
- Max runtime: `1800s`; `max_retries=2`

Dispatcher 必须 read-back 校验 child assignee、parent、revision、body、runtime 和 idempotency，随后立即完成；禁止运行 tests、访问数据库、写 artifacts、等待 Executor、创建 Reviewer/HANDOFF 或复用旧 card。

## Required Verification

从项目 backend virtual environment 按顺序运行：

```powershell
python -m py_compile backend/tests/test_migration_tool.py
python -m pytest backend/tests/test_migration_tool.py::TestUnitC3CleanupRegression::test_ac4_cleanup_runs_when_body_fails -q -p no:cacheprovider
python -m pytest backend/tests/test_migration_tool.py::TestMigrationTool::test_ac4_fk_orphan_detected backend/tests/test_migration_tool.py::TestMigrationTool::test_ac6_consistency_report backend/tests/test_migration_tool.py::TestMigrationTool::test_ac10_conflict_nonzero_exit backend/tests/test_migration_tool.py::TestMigrationTool::test_ac11_partial_rollback backend/tests/test_migration_tool.py::TestMigrationTool::test_ac12_cleanup_failure_visible -q -p no:cacheprovider
git diff --check -- backend/tests/test_migration_tool.py
```

如采用语义等价但不同名称的 non-MySQL selector，PLAN 必须在编码前记录最终 exact selector，PROGRESS 与 REPORT 必须使用同一 selector；不得用静态检查替代执行。

## Acceptance Criteria

- non-MySQL targeted regression 实际触发 body/validator/assertion failure，并证明 cleanup 在 exception 传播前执行。
- AC4 的外层 `try/finally` 覆盖 orphan insert 后的 migration、validation、assertion、resource close/dispose 和 deletion。
- 五个 Unit C3 real-MySQL selectors 在同一次有序执行中 `5 passed`、`0 failed`、`0 skipped`、`0 errors`。
- AC4 继续证明 target-only orphan 被捕获，message 包含 `quotas`、FK column 和 `nonexistent-user`，结束后 `q-orphan` 不存在。
- AC6、AC10、AC11、AC12 semantics 不回归。
- 仅 Allowed Files 发生本 revision 修改；无 secret 泄露、未授权数据库访问或 Scope Drift。
- PLAN、PROGRESS、REPORT 属于 revision `-29`，且准确区分 non-MySQL regression 与 real-MySQL integration evidence。

## Failure Fingerprint Inheritance

继承 T4-002 截至 revision `-28` 的全部 business/runtime fingerprints，并包含：

- `UNIT_C3_REV27_DESTINATION_FK_AND_TEST_ISOLATION_FAILURE`
- `REV28_AC4_CLEANUP_NOT_FAILURE_SAFE`

Revision、card 或 runtime 变化不得清零 fingerprint。

## Stop Condition

只生成 revision `-29` PLAN、PROGRESS、REPORT，并在 `UNIT_C3_AC4_CLEANUP_REPORT_READY_REV29` 停止。REPORT passing 后由 PMC 决定是否发布独立 `REVIEW_DISPATCH_ONLY` lifecycle continuation；不得自行创建 Reviewer、HANDOFF 或下一 Task。

## PMC Final Review

Revision `-29` 已在 `REPORT_READY` 接受 PMC source/diff 审计，结论为 `PMC_BLOCKED`：orphan deletion 仍位于主 `try` body 的 assertion 之后，failure path 的 `finally` 只关闭资源而不删除 orphan；新增 non-MySQL regression 只观察 mocked `close()`，未绑定实际 AC4 cleanup 生命周期或 deletion state。正式证据：`ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV29-BLOCKED-2026-07-01.md`。不得进入 Independent Review/HANDOFF，不得复用或重试 revision `-29` chain。
