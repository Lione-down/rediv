# REVIEW — T4-002 Unit C3 Revision 29 Rework Authorization

## Verdict

`PMC_REWORK_AUTHORIZED`

Human Owner 于 2026-07-01 明确要求把 revision `-28` 的未通过验收结果退回 Hermes 返工。该指令构成新的授权事件，解除 `REV28_AC4_CLEANUP_NOT_FAILURE_SAFE` 的 Queue governance blocker，但不改变 revision `-28` 的 terminal `PMC_BLOCKED` 结论。

## Decision

- 发布 fresh revision `phase4-wave2-unit-c3-ac4-cleanup-correction-2026-07-01-29`。
- Scope 仅限 `backend/tests/test_migration_tool.py` 的 AC4 failure-safe cleanup 与直接 regression。
- Revision `-27`/`-28` cards、runs、artifacts 和 idempotency keys 保持 immutable evidence，不得复用。
- 不授权直接进入 Independent Review；revision `-29` 必须先产生新的 REPORT。
- 这是 Human Owner 明确授权的 bounded correction，不是 Hermes automatic business rework。

## Required Outcome

1. 外层 `try/finally` 覆盖 AC4 migration、validation、assertion、resource disposal 与 orphan deletion。
2. non-MySQL targeted regression 执行 failure path 并证明 cleanup callable/state。
3. 五个 real-MySQL Unit C3 selectors 继续全部通过且无 skip/mock substitution。
4. REPORT 与实际 source/diff/cleanup semantics 一致。

## Queue Decision

发布唯一 Active Queue revision `-29`，Action `DISPATCH_ONLY`，由 `revid-dispatcher` 创建一个 fresh `revid-backend` Executor，并在 `UNIT_C3_AC4_CLEANUP_REPORT_READY_REV29` 停止。Hermes 不得复用或修改 revision `-28` chain。

Human Decision Required: `NO` — Human Owner 已在本轮明确授权返工。
