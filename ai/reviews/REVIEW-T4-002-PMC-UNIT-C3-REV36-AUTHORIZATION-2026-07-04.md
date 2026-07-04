# PMC Review: T4-002 Unit C3 Revision 36 Authorization

## Verdict

`AUTHORIZED — FRESH BOUNDED REMEDIATION / QUEUE PUBLICATION DEFERRED`

Human Owner 于 2026-07-04 明确授权 T4-002 Unit C3 新的 bounded remediation，并要求继承全部 fingerprints 与安全 Hard Gates。PMC 已将授权固化为 `ai/tasks/todo/TASK-T4-002-UNIT-C3-REV36.md`。

## Scope Decision

- 唯一 business file：`backend/tests/test_migration_tool.py`。
- 只修复 rev30 已确认的 FK restoration observation、failure-safe restore 和 multi-failure visibility。
- 不修改 migration implementation、schema/API、frontend、runtime 或其他 AC scope。
- 一个 business attempt；最多一次 process retry；REPORT_READY 后停止。

## Queue Decision

当前 `HERMES-AUTO-QUEUE.md` 仍持有 T4-010 revision 35 的唯一 terminal reconciliation signal。Hermes status 已 canonical `STATUS_OK`，但 rev35 fresh diagnostic 尚未生成，`Runtime Owner State = ACKNOWLEDGED`、diagnostic path `NONE`。

因此 PMC 本轮不覆盖 Queue、不创建第二条 active chain。Revision 36 Task 已 ready，且被指定为 rev35 diagnostic/PMC decision 收口后的下一优先 Queue。该等待不撤销 Human authorization。

## Publication Preconditions

发布 revision 36 Queue 前必须同时满足：

1. rev35 fresh diagnostic 已生成并由 PMC 处理；
2. rev35 terminal chain 无 active worker，Queue signal 可安全归档为 historical；
3. runtime deploy、`ROLE_CONTRACTS_OK` 与 deterministic status gate 通过；
4. `backend/tests/test_migration_tool.py` 没有未知 ownership diff；
5. revision 36 Task path/hash、profile、budget、idempotency 和 Stop After 可精确发布。

## Human Decision

授权已完成，无需再次询问 Human Owner。PMC 必须在 preconditions 满足后直接发布，不得再次让该 Task 静默闲置。
