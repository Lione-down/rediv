# REVIEW — T4-002 Unit C3 Revision 30 Authorization

## Verdict

`PMC_CONTINUATION_APPROVED — WAITING_FOR_HERMES_ACK`

Revision: `phase4-wave2-unit-c3-ac4-failure-cleanup-2026-07-01-30`

## Authorization Basis

Human Owner 于 2026-07-01 在 revision `-29` terminal `PMC_BLOCKED` 后明确批准新的 bounded correction revision。该授权覆盖一个 fresh Dispatcher/Executor chain，不改变产品、schema、ADR-003、database identity 或 destructive-operation contract。

## Evidence Reviewed

- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `ai/automation/HERMES-AUTO-QUEUE.md`
- `ai/automation/HERMES-EXECUTION-STATUS.md`
- `ai/tasks/todo/TASK-T4-002-UNIT-C3-REV29.md`
- `ai/reports/REPORT-T4-002-UNIT-C3-REV29.md`
- `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV29-BLOCKED-2026-07-01.md`
- actual `backend/tests/test_migration_tool.py` AC4 and regression diff

## Decision

发布 revision `-30`，仅允许修正 AC4 failure-safe cleanup 与绑定 regression。Revision `-29` 保持 terminal；其 cards、runs、artifacts 与 keys 不得 ACK、dispatch、retry、claim、promote、unblock、reparent、delete 或 reuse。

Revision `-30` 必须满足：

1. real AC4 与 non-MySQL regression 调用同一个 cleanup helper/lifecycle；
2. validator/assertion/resource-close failure 后仍执行 orphan deletion、删除验证与 FK restoration；
3. regression 观察 deletion-equivalent 与 FK-restoration-equivalent state，不接受独立模拟的 `try/finally` 或仅 mocked `close()`；
4. cleanup failure 可见，且不得被 primary failure 静默覆盖；
5. exact five real-MySQL selectors 无 skip/mock substitution 全部通过；
6. 只修改 `backend/tests/test_migration_tool.py` 并生成 revision `-30` PLAN/PROGRESS/REPORT。

## Lifecycle Boundary

本授权只到 `UNIT_C3_AC4_FAILURE_CLEANUP_REPORT_READY_REV30`。不授权 Independent Reviewer、HANDOFF、下一 revision、T4-003、T4-010 或其他业务修改。REPORT_READY 后必须停下等待 Codex PMC source/diff audit。

Human Decision Required: `NO`（授权已取得）。
