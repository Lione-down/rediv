# TASK-T4-002-UNIT-C3-REV30 — Bound AC4 Failure Cleanup

## Status

`APPROVED — WAITING_FOR_HERMES_ACK`

## Revision

`phase4-wave2-unit-c3-ac4-failure-cleanup-2026-07-01-30`

## Authorization

Human Owner 于 2026-07-01 明确批准发布新的 bounded correction revision。Revision `-29` 保持 terminal `PMC_BLOCKED`，其 cards、runs、artifacts 与 idempotency keys 只作为证据，不得复用。

## Objective

让 AC4 real-MySQL test 与 non-MySQL injected-failure regression 调用同一个 failure-safe cleanup lifecycle，使 orphan insert 成功后，无论 migration、validation、assertion 或 resource close 是否失败，都执行 orphan 删除、验证删除结果并恢复 `FOREIGN_KEY_CHECKS=1`。

## Scope

- 仅修改 `backend/tests/test_migration_tool.py` 中 AC4 cleanup lifecycle 与对应 non-MySQL regression。
- 提取一个最小、单用途 cleanup helper/lifecycle；real AC4 test 与 regression 必须直接调用同一实现。
- regression 必须注入 body/validator failure，并观察 deletion-equivalent state 与 FK-restoration-equivalent state。
- 重新运行五个 ADR-003 real-MySQL Unit C3 selectors，确认 revision `-28` 的其余修复没有回归。

## Non-goals

- 不修改 migration implementation、schema、Alembic、models、API、frontend 或 Hermes runtime。
- 不改变 destination FK validation、same-PK conflict、rollback、consistency 或 disposable database contract。
- 不重构其他 migration tests 或 shared fixture architecture。
- 不执行 Unit C1/C2、Unit D/E、T4-003 或 T4-010。
- 不读取 `.env`，不接触 `revid_db` 或任何非 `revid_test_t4_002` database。
- 不创建 Independent REVIEW、HANDOFF 或下一 revision。

## Allowed Files

Executor 可修改：

- `backend/tests/test_migration_tool.py`

Executor 可创建：

- `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV30-PLAN.md`
- `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV30-PROGRESS.md`
- `ai/reports/REPORT-T4-002-UNIT-C3-REV30.md`

`backend/scripts/migrate_sqlite_to_mysql.py` 与其他业务文件必须 read-only。未知 ownership 修改、改写 revision `-27`/`-28`/`-29` artifacts 或修改 AC4 以外无关测试立即 `BLOCKED`。

## Implementation Constraints

1. orphan insert 成功后必须注册/进入 cleanup lifecycle；后续 migration、validation、assertion 或 resource close 抛错均不得绕过 cleanup。
2. cleanup 必须删除 `q-orphan`、验证该 row 不存在，并在退出前恢复 `FOREIGN_KEY_CHECKS=1`；不得把删除留在 normal-path 主 `try` body。
3. real AC4 test 与 non-MySQL regression 必须调用同一 helper/lifecycle。禁止在 regression 中复制一个独立 `try/finally` 模板来模拟行为。
4. non-MySQL regression 不得访问 MySQL，不得只做 source-text/AST assertion，不得仅观察 `close()`；必须执行 injected-failure path 并观察 deletion-equivalent 与 FK-restoration-equivalent state。
5. resource close、orphan deletion或 FK restoration 的失败不得静默吞掉。若 primary body failure 与 cleanup failure 同时发生，必须通过明确的 chaining/grouping 保留并暴露 cleanup failure，不得报告成功。
6. 不顺带重构 migration architecture、其他 AC tests 或 disposable database fixture。

## Hard Gates

1. Supervisor 在 ACK/create 前运行 project-owned runtime deploy 与 `ROLE_CONTRACTS_OK` verifier。
2. Real MySQL tests 只从 runtime environment 读取 `REVID_TEST_MYSQL_ADMIN_URL`；不得写入或回显完整 URL、username、password 或 secret。
3. Destructive operations 仅限 `CREATE DATABASE revid_test_t4_002`、该库内 test writes 和 `DROP DATABASE revid_test_t4_002`；每次 destructive operation 前必须确认 identity。
4. secret 缺失、权限不足、identity 不明、cleanup/recreation 失败、skip、MySQL mock substitution 或 ownership 冲突立即 `BLOCKED`。
5. 禁止 claim、promote、unblock、retry、reparent、删除或复用 revision `-27`/`-28`/`-29` 及历史 T4-002 cards。
6. Dispatcher max runtime `120s`；Executor max runtime `1800s`；`max_retries=2` 表示 initial run 加最多一次 process retry。
7. REPORT 必须记录 exact commands、exit codes、pass/fail/skip/error counts、injected failure、deletion-equivalent state、FK restoration、cleanup failure visibility、database identity、mock semantics、business diff 和 unverified items。

## Dispatcher Contract

Supervisor 通过 `ai/runtime/create-hermes-coordinator.py` 创建且只创建一个 fresh `revid-dispatcher` card：

- Standalone Action: `DISPATCH_ONLY`
- Revision: `phase4-wave2-unit-c3-ac4-failure-cleanup-2026-07-01-30`
- Task path: `ai/tasks/todo/TASK-T4-002-UNIT-C3-REV30.md`
- Dispatch idempotency: `revid:phase4-wave2-unit-c3-ac4-failure-cleanup-2026-07-01-30:T4-002:dispatch`
- Max runtime: `120s`; `max_retries=2`
- Executor profile: `revid-backend`

Dispatcher 原子创建且只创建一个 Executor child：

- Action: `IMPLEMENT_AND_TEST_ONLY`
- Idempotency: `revid:phase4-wave2-unit-c3-ac4-failure-cleanup-2026-07-01-30:T4-002:execute:0`
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

如 non-MySQL selector 改名，PLAN 必须在编码前记录最终 exact selector，PROGRESS 与 REPORT 必须使用同一 selector；不得用静态检查替代执行。

## Acceptance Criteria

- injected validator/assertion failure 传播前，同一 cleanup implementation 已执行 deletion-equivalent action 与 FK-restoration-equivalent action。
- real AC4 的 failure-safe cleanup 在 orphan insert 后覆盖 migration、validation、assertion、resource close、orphan deletion、deletion verification 与 FK restoration。
- cleanup failure 不被吞掉；primary failure 与 cleanup failure 同时发生时，证据能识别 cleanup failure。
- 五个 Unit C3 real-MySQL selectors 在同一次有序执行中 `5 passed`、`0 failed`、`0 skipped`、`0 errors`。
- AC4 继续证明 target-only orphan 被捕获，message 包含 `quotas`、FK column 和 `nonexistent-user`，结束后 `q-orphan` 不存在且 FK checks 已恢复。
- AC6、AC10、AC11、AC12 semantics 不回归。
- 仅 Allowed Files 发生本 revision 修改；无 secret 泄露、未授权数据库访问或 Scope Drift。
- PLAN、PROGRESS、REPORT 属于 revision `-30`，并准确区分 non-MySQL injected-failure evidence 与 real-MySQL integration evidence。

## Failure Fingerprint Inheritance

继承 T4-002 截至 revision `-29` 的全部 business/runtime fingerprints，并包含：

- `UNIT_C3_REV27_DESTINATION_FK_AND_TEST_ISOLATION_FAILURE`
- `REV28_AC4_CLEANUP_NOT_FAILURE_SAFE`
- `REV29_AC4_ORPHAN_DELETION_STILL_NOT_FAILURE_SAFE_AND_REGRESSION_NOT_BOUND`

Revision、card 或 runtime 变化不得清零 fingerprint。

## Stop Condition

只生成 revision `-30` PLAN、PROGRESS、REPORT，并在 `UNIT_C3_AC4_FAILURE_CLEANUP_REPORT_READY_REV30` 停止。REPORT passing 后由 PMC 决定是否发布独立 `REVIEW_DISPATCH_ONLY` lifecycle continuation；不得自行创建 Reviewer、HANDOFF 或下一 Task。
