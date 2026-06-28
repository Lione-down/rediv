# Task: T4-002 Unit C1 — runtime-enforced disposable MySQL fixture preflight

## Execution Identity

- Parent Task: `T4-002`
- Work Unit: `UNIT-C1`
- Queue Revision: `phase4-wave2-unit-c1-runtime-enforced-2026-06-28-18`
- Business Attempt: `1 continuation`（不是 attempt 2）
- Executor: `revid-backend`
- Reviewer: `revid-reviewer`
- Status: `PMC_PASS — 2026-06-28`
- PMC Final Review: `ai/reviews/REVIEW-T4-002-PMC-UNIT-C1-REV18-PASS-2026-06-28.md`

## Objective

在 ADR-003 边界内完成最小真实 MySQL preflight：证明专用测试库连接、精确 database identity、Alembic 12-table schema 创建和 cleanup 可用，为后续 Unit C2/C3 提供执行前提。

## Coordinator Lifecycle Contract

- Coordinator card body 必须包含精确标记：`Action: DISPATCH_ONLY`。
- Coordinator profile：`revid-pm`；max runtime：120s。
- Runtime exact allowlist：`read_file`、`kanban_show`、`kanban_create`、`kanban_link`、`kanban_complete`、`kanban_block`、`kanban_comment`、`kanban_heartbeat`。
- Coordinator 只创建一个 `revid-backend` Executor child，验证真实 card ID、parent、assignee、revision 后立即完成。
- Coordinator 禁止运行 tests、访问数据库、写项目 artifacts、创建 Reviewer/HANDOFF 或等待 Executor。
- 缺少 exact action marker、tool policy 未生效或出现非 allowlist tool 时立即 infrastructure blocked。

REPORT_READY 后使用独立 continuation stage：

- `Action: REVIEW_DISPATCH_ONLY`：只读取 Executor/REPORT，创建一个 `revid-reviewer` card，以及一个依赖 Reviewer 的 `revid-pm` `HANDOFF_ONLY` card，然后立即完成。
- `Action: HANDOFF_ONLY`：仅在 Reviewer PASS 后写 canonical post-review HANDOFF；非 PASS 时 block，不得伪造 HANDOFF_READY。

## Scope

只执行现有 integration tests：

- `TestMigrationTool::test_ac8_structured_url_and_identity`
- `TestMigrationTool::test_ac9_alembic_creates_schema`

允许测试 fixture 在一次 test class lifecycle 内创建、使用并删除唯一数据库 `revid_test_t4_002`。

## Non-goals

- 不修改业务代码、migration 或 tests。
- 不执行 full migration、dry-run、second-run、conflict、rollback 或 consistency tests。
- 不执行 Unit C2/C3、Unit D/E、T4-003 或 T4-010。
- 不读取 `.env`，不使用 fallback credential，不接触 `revid_db` 或其他数据库。

## Allowed Files

Executor 只允许创建：

- `ai/tasks/doing/TASK-T4-002-UNIT-C1-REV18-PLAN.md`
- `ai/tasks/doing/TASK-T4-002-UNIT-C1-REV18-PROGRESS.md`
- `ai/reports/REPORT-T4-002-UNIT-C1-REV18.md`

Independent Reviewer 只允许创建：

- `ai/reviews/REVIEW-T4-002-UNIT-C1-REV18.md`

Post-review `HANDOFF_ONLY` Coordinator 只允许创建：

- `ai/handoffs/HANDOFF-T4-002-UNIT-C1-REV18-POST-REVIEW.md`

Executor 提前创建的 `ai/handoffs/HANDOFF-T4-002-UNIT-C1-REV18.md` 超出 Allowed Files，且发生在 Independent Review 前；保留为历史证据，但不得作为 canonical HANDOFF 或 PMC 验收依据。

`backend/scripts/migrate_sqlite_to_mysql.py` 与 `backend/tests/test_migration_tool.py` 本 revision 为 read-only。

## Hard Gates

1. 只从 runtime environment 读取 `REVID_TEST_MYSQL_ADMIN_URL`；不得输出完整 URL、username、password 或 secret。
2. destructive operation 仅限 `CREATE DATABASE revid_test_t4_002` 与 `DROP DATABASE revid_test_t4_002`。
3. 执行前后必须证明 database name 精确为 `revid_test_t4_002`。
4. schema 必须由 Alembic `upgrade head` 创建，并证明 12 张 application tables 存在。
5. secret 缺失、权限不足、identity 不明、cleanup 失败或存在未知 active chain 时立即 `BLOCKED`。
6. 禁止复用、claim、promote、unblock 或 retry 任何旧 T4-002 card。
7. Executor max runtime：1800s；不得由 Coordinator budget 覆盖 Executor work。

## Verification

```powershell
python -m py_compile backend/scripts/migrate_sqlite_to_mysql.py
python -m py_compile backend/tests/test_migration_tool.py
python -m pytest backend/tests/test_migration_tool.py::TestMigrationTool::test_ac8_structured_url_and_identity backend/tests/test_migration_tool.py::TestMigrationTool::test_ac9_alembic_creates_schema -q -p no:cacheprovider
git diff --check -- backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py
```

## Acceptance Criteria

- 两个指定 tests 均实际执行且通过，不得 skip、mock MySQL 或替换为静态检查。
- test database identity、Alembic 12-table schema 与 cleanup 结果在 REPORT 中明确记录。
- REPORT、Independent REVIEW、HANDOFF 均属于 revision `-18` / Unit C1 / attempt 1 continuation。
- allowed business file diff 为空，无 secret 泄露，无用户数据库写入。

## Failure Fingerprint Inheritance

继承 T4-002 截至 revision `-17` 的全部 business/runtime fingerprints，并新增继承：

- `REV17_COORDINATOR_TIMEOUT`
- `REV17_COORDINATOR_RETRY_EXHAUSTED`
- `COORDINATOR_ROLE_COLLAPSE`
- `THIN_DISPATCHER_REMEDIATION_GATE_FAILED`

Runtime fix evidence：`ai/reviews/REVIEW-T4-002-PMC-THIN-DISPATCHER-RUNTIME-FIX-PASS-2026-06-28.md`。新 revision 不得清零历史 fingerprint。

## Stop Condition

生成 Unit C1 REPORT、Independent REVIEW 与 canonical post-review `UNIT_C1_HANDOFF_READY_REV18` 后停止，等待 Codex PMC 最终验收。

## Final Acceptance

Unit C1 revision `-18` 已由 Codex PMC 最终验收通过。后续只允许按独立 Queue 执行 Unit C2；不得重复 dispatch revision `-18` 或 `-18r1`。
