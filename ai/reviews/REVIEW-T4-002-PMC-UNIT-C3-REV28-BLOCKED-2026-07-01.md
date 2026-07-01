# REVIEW — T4-002 Unit C3 Revision 28 PMC BLOCKED

## Verdict

`PMC_BLOCKED`

Revision `phase4-wave2-unit-c3-integrity-remediation-2026-07-01-28` 不得进入 Independent Review lifecycle。Executor 的五项 real-MySQL selectors 自报 `5 passed`，但源码审计确认 AC4 cleanup 仍不满足 Task 的明确 hard gate；当前 Queue 又明确禁止进一步 automatic business rework，因此本轮不发布 replacement revision。

## Evidence Cursor

- Queue revision: `phase4-wave2-unit-c3-integrity-remediation-2026-07-01-28`
- Execution state: `REPORT_READY`
- Dispatcher: `t_d11673a6`，terminal `DONE`
- Executor: `t_670af729`，terminal `DONE`，run `#136`
- REPORT: `ai/reports/REPORT-T4-002-UNIT-C3-REV28.md`
- Independent REVIEW: missing as expected at this stage
- HANDOFF: missing as expected at this stage
- Prior fingerprint: `UNIT_C3_REV27_DESTINATION_FK_AND_TEST_ISOLATION_FAILURE`
- New fingerprint: `REV28_AC4_CLEANUP_NOT_FAILURE_SAFE`

## Blocking Finding

`backend/tests/test_migration_tool.py::test_ac4_fk_orphan_detected` 在执行 validator、关闭 reader/writer 并完成 `self.assertTrue(orphan_found, ...)` 之后，才进入删除 `q-orphan` 的 cleanup block。若 migration、validation、resource close 或 assertion 任一环节失败，控制流不会到达该 cleanup block，orphan residue 会保留在 disposable database。

这直接违反：

- Task Implementation Constraint 3：AC4 cleanup 必须在 assertion 或 migration failure 时仍执行；
- Task Acceptance Criteria：测试隔离与 deterministic cleanup 必须成立；
- ADR-003：disposable database 必须按 fixture 策略完成清理；
- REPORT 中“cleanup runs regardless of assertion outcome”的声明与实际源码不一致。

此外，变量 `orphan_cleaned_up` 仅被赋值、从未用于证明 cleanup，不能构成 failure-path evidence。

## Scope and Verification

- 实际业务 diff 仅涉及两个 Allowed Files。
- Fresh PMC `py_compile`: PASS。
- Fresh PMC scoped `git diff --check`: PASS。
- 未重复运行 CREATE/DROP-capable real-MySQL tests：已存在确定性的源码级 hard-gate failure，重复 destructive verification 不能证明 exception-path cleanup。
- 未发现 Independent REVIEW 或 HANDOFF；不得将 Executor PASS 等同于 PMC PASS。
- 未读取、打印或复制 secret。

## Ownership and Unblock Condition

Owner: `Codex PMC queue governance`。

解除条件：

1. 明确授权一个新的 bounded business correction attempt；不得复用 revision `-28` cards 或 idempotency keys。
2. 新 Task 必须要求 AC4 的 insert、migration、validation、assertion 与 orphan deletion 由外层 `try/finally` 覆盖，并保证 reader/writer/engine 在 failure path 全部 deterministic close/dispose。
3. 增加一个不会访问真实 MySQL 的 targeted regression，证明 validator/assertion failure 时 cleanup callable 仍被执行；该 selector 不能替代五项 real-MySQL verification。
4. 新 REPORT 必须准确记录 failure-path cleanup evidence，之后才允许发布 `REVIEW_DISPATCH_ONLY`。

在解除条件满足前，Queue 为 `BLOCKED / NOT EXECUTABLE`；不重派、不 retry、不 claim/promote/unblock/reparent，不创建 Reviewer/HANDOFF，也不升级为 Human Owner 产品决策。
