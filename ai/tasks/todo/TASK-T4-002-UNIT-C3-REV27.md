# Task: T4-002 Unit C3 — Disposable MySQL Conflict and Integrity Verification

## Execution Identity

- Parent Task: `T4-002`
- Work Unit: `UNIT-C3`
- Queue Revision: `phase4-wave2-unit-c3-integrity-verification-2026-07-01-27`
- Business Attempt: `1 continuation`（不是 attempt 2）
- Executor: `revid-backend`
- Reviewer: `revid-reviewer`（仅后续 lifecycle continuation）
- Status: `APPROVED — WAITING_FOR_HERMES_ACK`

## Objective

在 ADR-003 的 disposable MySQL 边界内，只执行现有测试，证明 same-PK conflict、FK orphan、partial rollback、12-table consistency 和 cleanup failure visibility 的真实行为。Unit C2 已 PMC PASS，本 revision 不修改实现。

## Scope

只执行以下现有 selectors：

- `TestMigrationTool::test_ac4_fk_orphan_detected`
- `TestMigrationTool::test_ac6_consistency_report`
- `TestMigrationTool::test_ac10_conflict_nonzero_exit`
- `TestMigrationTool::test_ac11_partial_rollback`
- `TestMigrationTool::test_ac12_cleanup_failure_visible`

测试 class lifecycle 仅可创建、使用并删除 `revid_test_t4_002`。

## Non-goals

- 不修改业务代码、tests、migration、schema、API 或 frontend。
- 不重复 Unit C1/C2 tests，不执行 Unit D/E、T4-003 或 T4-010。
- 不创建 Independent REVIEW、HANDOFF、REWORK 或额外 lifecycle card。
- 不读取 `.env`，不输出 credential，不接触 `revid_db` 或其他数据库。

## Allowed Files

Executor 只允许创建：

- `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV27-PLAN.md`
- `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV27-PROGRESS.md`
- `ai/reports/REPORT-T4-002-UNIT-C3-REV27.md`

以下业务文件为 read-only：

- `backend/scripts/migrate_sqlite_to_mysql.py`
- `backend/tests/test_migration_tool.py`

任一业务文件出现未知 ownership 修改即停止并 BLOCKED。

## Dispatcher Contract

Supervisor 通过 `ai/runtime/create-hermes-coordinator.py` 创建且只创建一个 fresh `revid-dispatcher` card：

- Standalone Action: `DISPATCH_ONLY`
- Revision: `phase4-wave2-unit-c3-integrity-verification-2026-07-01-27`
- Task path: `ai/tasks/todo/TASK-T4-002-UNIT-C3-REV27.md`
- Dispatch idempotency: `revid:phase4-wave2-unit-c3-integrity-verification-2026-07-01-27:T4-002:dispatch`
- Max runtime: `120s`; `max_retries=2` 表示 initial attempt 加最多一次 process retry
- Executor profile: `revid-backend`

Dispatcher 原子创建且只创建一个 Executor child：

- Idempotency: `revid:phase4-wave2-unit-c3-integrity-verification-2026-07-01-27:T4-002:execute:0`
- Parent: 当前 Dispatcher card
- Max runtime: `1800s`; `max_retries=2`
- Action: `IMPLEMENT_AND_TEST_ONLY`

Dispatcher 必须 read-back 校验 child assignee、parent、revision、body、runtime 和 idempotency，随后立即完成；禁止运行 tests、访问数据库、写 artifacts、等待 Executor、创建 Reviewer/HANDOFF 或复用旧 card。

## Hard Gates

1. Supervisor 在 ACK/create 前运行 project-owned runtime deploy 与 `ROLE_CONTRACTS_OK` verifier。
2. 只从 runtime environment 读取 `REVID_TEST_MYSQL_ADMIN_URL`；不得写入或回显完整 URL、username、password 或 secret。
3. Destructive operations 仅限 `CREATE DATABASE revid_test_t4_002`、该库内 test writes 和 `DROP DATABASE revid_test_t4_002`。
4. 测试前后必须确认 database identity 精确为 `revid_test_t4_002`；禁止访问 `revid_db`。
5. secret 缺失、权限不足、identity 不明、cleanup 失败、skip、MySQL mock substitution 或业务文件 ownership 不明时立即 BLOCKED。
6. 禁止 claim、promote、unblock、retry、reparent、删除或复用任何历史 T4-002 card。
7. REPORT 必须记录 exact commands、exit codes、pass/fail/skip counts、database identity、cleanup result、mock semantics 和 unverified items；不得重复 Unit C2 REPORT 的 cleanup wording defect。

## Required Verification

按以下顺序从项目 backend virtual environment 运行：

```powershell
python -m py_compile backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py
python -m pytest backend/tests/test_migration_tool.py::TestMigrationTool::test_ac4_fk_orphan_detected backend/tests/test_migration_tool.py::TestMigrationTool::test_ac6_consistency_report backend/tests/test_migration_tool.py::TestMigrationTool::test_ac10_conflict_nonzero_exit backend/tests/test_migration_tool.py::TestMigrationTool::test_ac11_partial_rollback backend/tests/test_migration_tool.py::TestMigrationTool::test_ac12_cleanup_failure_visible -q -p no:cacheprovider
git diff --check -- backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py
```

## Acceptance Criteria

- 5 个 selectors 全部真实执行并通过，`0` failed、`0` skipped；MySQL 行为不得用 mock 替代。
- FK orphan 与 same-PK different-value 均产生明确失败语义，且不静默覆盖既有数据。
- partial rollback 实际制造 mid-batch failure，并证明该 batch 无部分提交。
- consistency report 覆盖 12 张表的 source/target count 与 checksum 语义。
- cleanup failure 可见；正常 teardown 明确完成 `revid_test_t4_002` 清理。
- business Allowed Files diff 为空；无 secret 泄露、用户数据库写入或 Scope Drift。
- PLAN、PROGRESS、REPORT 属于 revision `-27` / Unit C3 / attempt 1 continuation。

## Failure Fingerprint Inheritance

继承 T4-002 截至 revision `-26r2` 的全部历史 business/runtime fingerprints。`AC3_STALE_SAME_DUPLICATE_INSERT` 已在 Unit C2 remediated，但不得通过本 revision 删除历史记录。

## Stop Condition

只生成 Unit C3 PLAN、PROGRESS、REPORT，并在 `UNIT_C3_REPORT_READY_REV27` 停止。PMC 将检查 REPORT、实际 read-only business diff 与 runtime evidence，再决定是否发布独立 `REVIEW_DISPATCH_ONLY` lifecycle continuation。

