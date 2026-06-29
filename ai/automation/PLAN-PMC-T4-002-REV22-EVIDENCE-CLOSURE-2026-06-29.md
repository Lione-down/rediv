# PLAN — T4-002 Revision 22 Evidence Closure and AC3 Remediation Dispatch

## Objective

收口 revision `-22` 的失败验证证据，解除 `REPORT_READY` 治理死锁，并发布一个只修复 AC3 stale-same duplicate INSERT 的有界 revision `-23`。

## Scope

- 写入 revision `-22` PMC REWORK review。
- 将 revision `-22` Task 标记为 terminal evidence，不再复用其 chain。
- 创建 revision `-23` AC3 remediation Task。
- 同步 parent Task、CURRENT、ROADMAP 与 PMC automation 模板。
- 最后发布 revision `-23` 为唯一 executable Queue。

## Non-goals

- 不修改业务代码、migration 或 tests。
- 不修改 `HERMES-EXECUTION-STATUS.md`。
- 不创建、claim、promote、unblock 或重试 Kanban card。
- 不执行数据库测试，不读取或输出 secret。
- 不进入 Unit C3、Unit D/E 或 T4-003。

## Success Criteria

1. Revision `-22` 明确记录 `PMC_REWORK` 与稳定 failure fingerprint。
2. Revision `-23` 只允许修复 stale-same INSERT 过滤及对应测试，Scope/AC/Allowed Files/Hard Gates 完整。
3. CURRENT、ROADMAP、parent Task、Queue 对 revision `-23` 状态一致。
4. Queue 只有一个 active revision，并继承全部历史 fingerprints。
5. PMC automation 对失败的 `REPORT_READY` 执行 queue decision，而不是永久只读等待。
6. `git diff --check` 通过。

## Write Order

PMC REVIEW → rev22/rev23 Task → parent Task → CURRENT/ROADMAP → PMC automation template → Queue → verification。
