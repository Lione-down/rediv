# TASK-T4-002-UNIT-C3-REV43 — Shared Cleanup Lifecycle Correction

## Status

`IMPLEMENTED — REAL MYSQL VERIFICATION BLOCKED / DIRECT FAST-PATH REPORT WRITTEN`

Human Owner 于 2026-07-07 明确要求快速推进 T4-002。PMC 将此视为 fresh authorization，用于发布一次严格 bounded remediation，修复 revision 42 的 shared cleanup lifecycle 与 failure grouping Hard Gate failures。

Hermes 已 ACK rev43 并完成 Dispatcher `t_fb444a42`，但 Executor `t_af88d96e` run `#189` blocked with `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION` before writing `ai/reports/REPORT-T4-002-UNIT-C3-REV43.md`。Formal runtime advisory: `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV43-2026-07-07.md`。

Hermes 随后产出 `ai/reports/DIAGNOSTIC-T4-002-REV43-RUNTIME-HEALTH-2026-07-07.md`，verdict 为 `STILL_INFRA_BLOCKED`。PMC 审查：`ai/reviews/REVIEW-T4-002-PMC-RUNTIME-DIAGNOSTIC-REV43-2026-07-07.md`。

Human Owner 随后要求快速推进，PMC 直接完成 bounded rev43 Allowed File 修复并写入 `ai/reports/REPORT-T4-002-UNIT-C3-REV43.md`。当前代码实现与 non-MySQL regressions 已通过；五个 real-MySQL selectors 已按原命令尝试，但当前进程缺少 `REVID_TEST_MYSQL_ADMIN_URL`，按 Hard Gate fail-closed。

Hermes-owned status 已将 rev43 保持为唯一 Active Queue，并把 rev42 改为 Historical Queue；`## PMC Attention` section 与 terminal Action wording 也已 canonical。Fresh deterministic verification 返回 `STATUS_OK`。禁止猜测或输出 secret、触碰 `revid_db`、创建 Reviewer/HANDOFF 或发布 continuation；下一步是读取项目 `.env` 加载 `REVID_TEST_MYSQL_ADMIN_URL` 后复跑五个 real-MySQL selectors。

Human Owner 于 2026-07-07 进一步明确：若 Hermes 缺少的是 env 授权，则授权读取项目本地 `.env`，仅用于加载 `REVID_TEST_MYSQL_ADMIN_URL` 并执行本 Task 的 five-selector real-MySQL verification。该授权不允许输出、hash、持久化或推断 credential，不允许触碰 `revid_db`，也不允许创建 card、Reviewer、HANDOFF 或 continuation。正式记录：`ai/reviews/REVIEW-T4-002-PMC-REV43-REAL-MYSQL-ENV-AUTHORIZATION-2026-07-07.md`。

## Queue Revision

`phase4-wave2-unit-c3-shared-cleanup-lifecycle-correction-2026-07-07-43`

## Objective

修复 rev42 PMC 审查指出的五个验收缺口，使 Unit C3 cleanup lifecycle 的 real AC4 与 non-MySQL regressions 真正调用同一 orchestration implementation，并证明 delete、verify、FK restore、primary body 与 resource close failures 都被保留为可识别异常证据。

## Scope

- 仅修改 `backend/tests/test_migration_tool.py`。
- 只修复 `_run_cleanup_lifecycle()`、`_cleanup_orphan_and_restore_fk()`、real AC4 cleanup assertion、以及 Unit C3 cleanup regressions。
- 允许添加最小 supporting helper，但 helper 必须服务于同一 cleanup lifecycle，不得另起一套 parallel implementation。

## Non-goals

- 不修改 `backend/scripts/migrate_sqlite_to_mysql.py`、schema、Alembic、models、API、frontend 或 Hermes runtime。
- 不改变 Unit C1/C2、migration core semantics、destination FK validation、rollback、consistency 或 disposable database contract。
- 除读取项目本地 `.env` 以加载 `REVID_TEST_MYSQL_ADMIN_URL` 外，不读取其他 secret 文件；不接触 `revid_db` 或任何非 `revid_test_t4_002` database。
- 不创建 Independent REVIEW、HANDOFF 或后续 revision。

## Allowed Files

Executor 可修改：

- `backend/tests/test_migration_tool.py`

Executor 可创建：

- `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV43-PLAN.md`
- `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV43-PROGRESS.md`
- `ai/reports/REPORT-T4-002-UNIT-C3-REV43.md`

其他文件只读。未知 ownership 修改、历史 card/key 操作、或改写 rev27-rev30/rev42 artifacts 立即 `BLOCKED`。

## Required Fixes

1. `_run_cleanup_lifecycle()` 的 multi-failure path 必须构造合法 `ExceptionGroup`：`ExceptionGroup.exceptions` 只能包含 exception instances，不能包含 `(label, exc)` tuple。
2. 每个 grouped failure 必须保留可识别 label 与原始 exception cause/context，例如 `Cleanup delete failed`、`Cleanup verify failed`、`Cleanup fk_restore failed`。
3. `test_cleanup_lifecycle_restores_fk_when_delete_fails` 必须调用 `_run_cleanup_lifecycle()` 或 `_cleanup_orphan_and_restore_fk()`，通过 fake engine/connection 注入 DELETE failure；禁止手工复制 lifecycle 步骤或手工 append `fk_restore`。
4. `test_cleanup_lifecycle_preserves_primary_close_and_restore_failures` 必须通过实际 cleanup orchestration 或唯一 wrapper 注入 primary body、resource close 与 FK restore failures；禁止手工创建三个 `RuntimeError` 后直接塞入 `ExceptionGroup`。
5. real AC4 必须断言 recorder 中的 MySQL ordered events，至少证明 `fk_disable -> delete -> verify -> fk_restore` 被同一 helper 观察到。
6. resource close failures 不得继续被 `except Exception: pass` 静默丢弃；若 primary body、close、delete、verify 或 restore 同时失败，REPORT 和 regression 必须证明这些 failure 在同一 exception structure 中可识别。

## Hard Gates

1. Supervisor 在 ACK/create 前运行 project-owned runtime deploy、`ROLE_CONTRACTS_OK` 和 active-queue structural read-back；terminal-only status reconciler 不适用于 executable Queue。
2. Real MySQL tests 已获 Human Owner 授权，可读取项目本地 `.env` 以加载 `REVID_TEST_MYSQL_ADMIN_URL`；不得写入、回显、hash、持久化或推断 URL、username、password 或 secret。
3. Destructive operations 仅限 identity-confirmed `revid_test_t4_002` 的 CREATE/test writes/DROP；禁止触碰 `revid_db`。
4. secret 缺失、权限不足、identity 不明、cleanup/recreation 失败、skip、MySQL mock substitution 或 ownership 冲突立即 `BLOCKED`。
5. 禁止 claim、promote、unblock、retry、reparent、删除或复用 revisions `-27` 至 `-30`、`-36`、`-42` 及所有历史 T4-002 cards/keys。
6. Dispatcher max runtime `120s`；Executor max runtime `1800s`；最多一次 process retry；本授权只包含一个 business attempt。
7. REPORT 必须记录 exact commands、exit codes、pass/fail/skip/error counts、ordered cleanup events、failure grouping evidence、database identity、mock/fake semantics、business diff 和 unverified items，且不得包含 secret。

## Required Verification

按顺序执行：

```powershell
python -m py_compile backend/tests/test_migration_tool.py
python -m pytest backend/tests/test_migration_tool.py::TestUnitC3CleanupRegression::test_ac4_cleanup_runs_when_body_fails backend/tests/test_migration_tool.py::TestUnitC3CleanupRegression::test_cleanup_lifecycle_restores_fk_when_delete_fails backend/tests/test_migration_tool.py::TestUnitC3CleanupRegression::test_cleanup_lifecycle_preserves_primary_close_and_restore_failures -q -p no:cacheprovider
python -m pytest backend/tests/test_migration_tool.py::TestMigrationTool::test_ac4_fk_orphan_detected backend/tests/test_migration_tool.py::TestMigrationTool::test_ac6_consistency_report backend/tests/test_migration_tool.py::TestMigrationTool::test_ac10_conflict_nonzero_exit backend/tests/test_migration_tool.py::TestMigrationTool::test_ac11_partial_rollback backend/tests/test_migration_tool.py::TestMigrationTool::test_ac12_cleanup_failure_visible -q -p no:cacheprovider
git diff --check -- backend/tests/test_migration_tool.py
```

## Acceptance Criteria

- Non-MySQL delete-failure regression calls the same cleanup lifecycle and proves FK restore is attempted after DELETE failure without manual lifecycle copying.
- Multi-failure regression proves primary body, resource close and FK restore failures are visible in one valid exception structure produced by the cleanup path or its single wrapper.
- Fresh in-memory fake-engine probe equivalent to the rev42 PMC probe no longer returns `ValueError: Item 0 of second argument (exceptions) is not an exception`.
- Real AC4 asserts full MySQL ordered cleanup events and verifies `q-orphan` is gone after cleanup.
- Five real-MySQL selectors pass in one ordered run with `5 passed / 0 failed / 0 skipped / 0 errors`.
- AC4 message continues to include `quotas`, FK column and `nonexistent-user`; AC6/AC10/AC11/AC12 semantics do not regress.
- Only Allowed Files change; no secret leakage, unauthorized DB access, Scope Drift, Reviewer/HANDOFF, or historical card reuse.

## Failure Fingerprint Inheritance

Rev43 inherits the complete Unit C3 failure chain, including:

- `UNIT_C3_REV27_DESTINATION_FK_AND_TEST_ISOLATION_FAILURE`
- `REV28_AC4_CLEANUP_NOT_FAILURE_SAFE`
- `REV29_AC4_ORPHAN_DELETION_STILL_NOT_FAILURE_SAFE_AND_REGRESSION_NOT_BOUND`
- `REV30_FK_RESTORATION_UNPROVEN_AND_CLEANUP_FAILURES_NOT_PRESERVED`
- `REV42_REGRESSIONS_BYPASS_SHARED_LIFECYCLE_AND_FAILURE_GROUPING_INVALID`

Revision、card、runtime、priority override 或 passing test count 均不得清零 fingerprints。

## Dispatcher Contract

Supervisor 仅通过 project launcher 创建一个 fresh `revid-dispatcher` card：

- Action：`DISPATCH_ONLY`
- Revision：`phase4-wave2-unit-c3-shared-cleanup-lifecycle-correction-2026-07-07-43`
- Task ID：`T4-002`
- Task path：`ai/tasks/todo/TASK-T4-002-UNIT-C3-REV43.md`
- Dispatcher idempotency：`revid:phase4-wave2-unit-c3-shared-cleanup-lifecycle-correction-2026-07-07-43:T4-002:dispatch`
- Executor profile：`revid-backend`
- Dispatcher runtime：`120s`

Dispatcher 原子创建且只创建一个 child：

- Action：`IMPLEMENT_AND_TEST_ONLY`
- Parent：当前 Dispatcher card
- Idempotency：`revid:phase4-wave2-unit-c3-shared-cleanup-lifecycle-correction-2026-07-07-43:T4-002:execute:0`
- Runtime：`1800s`
- Max retries：`2`，即 initial run 加最多一次 process retry

Dispatcher 必须 read-back 校验 assignee、parent、revision、body、runtime、retry 与 idempotency 后立即完成。禁止运行 tests、访问数据库、写 artifacts、等待 Executor 或创建 Reviewer/HANDOFF。

## Stop Condition

只生成 revision `-43` PLAN、PROGRESS、business diff 与 REPORT，并停止于 `UNIT_C3_SHARED_CLEANUP_LIFECYCLE_REPORT_READY_REV43`。由 PMC 决定 Independent Review continuation；不得自行创建 Reviewer、HANDOFF 或下一 Task。
