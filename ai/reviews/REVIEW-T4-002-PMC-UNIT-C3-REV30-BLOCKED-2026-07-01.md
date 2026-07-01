# REVIEW-T4-002-PMC-UNIT-C3-REV30-BLOCKED

## Verdict

`PMC_BLOCKED`

Revision `phase4-wave2-unit-c3-ac4-failure-cleanup-2026-07-01-30` 不得进入 Independent Review lifecycle。当前 Queue 必须保持不可执行，不得复用 revision `-30` 的 cards、runs、artifacts 或 idempotency keys。

## Evidence Chain

- Task：`ai/tasks/todo/TASK-T4-002-UNIT-C3-REV30.md`
- PLAN：`ai/tasks/doing/TASK-T4-002-UNIT-C3-REV30-PLAN.md`
- PROGRESS：`ai/tasks/doing/TASK-T4-002-UNIT-C3-REV30-PROGRESS.md`
- REPORT：`ai/reports/REPORT-T4-002-UNIT-C3-REV30.md`
- Coordinator：`t_4481c79d`，DONE
- Executor：`t_c65b3597`，DONE，run `#140`
- Execution state read：`REPORT_READY`
- Business diff：`backend/tests/test_migration_tool.py`

## Fresh PMC Verification

使用 `backend/.venv/Scripts/python.exe` 执行：

```text
python -m py_compile backend/tests/test_migration_tool.py
exit 0

python -m pytest backend/tests/test_migration_tool.py::TestUnitC3CleanupRegression::test_ac4_cleanup_runs_when_body_fails -q -p no:cacheprovider
1 passed in 0.24s, exit 0

git diff --check -- backend/tests/test_migration_tool.py
exit 0
```

PMC 未读取或输出 secret，未重复运行需要 disposable MySQL credential 的 destructive selectors。Executor REPORT 已记录 real-MySQL selectors `5 passed`，但 passing count 不能替代 Hard Gate 语义审计。

## Blocking Findings

### 1. FK restoration-equivalent state 未被 regression 观察

`_cleanup_orphan_and_restore_fk()` 对 SQLite 直接跳过 `SET FOREIGN_KEY_CHECKS=0/1`。non-MySQL regression 因此只执行并验证 DELETE；它没有创建、改变或断言任何 FK-restoration-equivalent state。测试末尾新建并立即 dispose 一个无关的空 SQLite engine，也没有验证 cleanup 后状态。

这违反 Implementation Constraint 4 与 Acceptance Criteria 1。REPORT 中“helper executed without error proves FK-restoration-equivalent state”的结论不成立。

### 2. helper 本身不是 failure-safe FK restoration lifecycle

helper 顺序执行 `SET FOREIGN_KEY_CHECKS=0 -> DELETE -> SET FOREIGN_KEY_CHECKS=1`，但没有内部 `try/finally`。若 DELETE 或其前后的 connection operation 抛错，`FOREIGN_KEY_CHECKS=1` 不会执行。该实现不能保证 cleanup failure path 在退出前恢复 FK checks。

这违反 Objective、Implementation Constraint 2/5 与 Acceptance Criteria 2/3。

### 3. resource-close failure 被静默吞掉

real AC4 与 regression 对 `val_writer.close()`、`writer.close()`、`reader.close()` 均使用 `except Exception: pass`。Task 明确要求 resource close failure 不得静默吞掉，且 cleanup lifecycle 必须覆盖该 failure。当前实现既隐藏 close failure，也无法用 chaining/grouping 同时暴露 primary、close 与 cleanup failure。

这违反 Implementation Constraint 1/5 与 Acceptance Criteria 2/3。

## Failure Fingerprint

`REV30_FK_RESTORATION_UNPROVEN_AND_CLEANUP_FAILURES_NOT_PRESERVED`

该 fingerprint 继承 revision `-27` 至 `-29` 的全部 business/runtime fingerprints；revision、card 或 runtime 变化不得清零。

## Required Resolution

- real AC4 与 non-MySQL regression 继续调用同一个 cleanup lifecycle。
- cleanup lifecycle 必须用明确的 `try/finally` 或等价结构保证 FK restoration 在 DELETE、verification 或 resource-close failure 后仍被尝试。
- non-MySQL regression 必须实际观察 FK-restoration-equivalent state，不能通过 dialect skip 或“未抛异常”推断。
- primary、resource-close、delete、verification 与 FK-restore failures 必须通过 ExceptionGroup、chaining 或等价结构保留，禁止 `except Exception: pass`。
- 增加直接覆盖 cleanup 自身 failure path 的 non-MySQL assertions，再运行完整五个 real-MySQL selectors。

Revision `-30` 的 Attempt Policy 明确禁止进一步 automatic business rework，因此本 verdict 不发布 replacement revision。该技术结论不涉及产品方向、schema/API contract、付费资源、secret 或不可逆授权，`Human Decision Required = NO`。

