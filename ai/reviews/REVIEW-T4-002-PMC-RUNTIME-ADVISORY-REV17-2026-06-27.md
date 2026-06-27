# T4-002 PMC Runtime Advisory — Unit C1 Revision -17

## Verdict

`PMC_RUNTIME_ADVISORY — REV17_COORDINATOR_RETRY_EXHAUSTED`

这不是 business REWORK，也不是 HANDOFF 最终验收。Unit C1 revision `phase4-wave2-unit-c1-fixture-preflight-2026-06-27-17` 在 Executor dispatch 前发生 runtime timeout，且没有 PLAN、PROGRESS、REPORT、Independent REVIEW 或 HANDOFF，因此没有可供 PMC 验收的业务证据。

## Blocking Facts

| Field | Value |
|---|---|
| Task | `T4-002` / `UNIT-C1` |
| Queue Revision | `phase4-wave2-unit-c1-fixture-preflight-2026-06-27-17` |
| Execution State Read | `INFRASTRUCTURE_BLOCKED_REV17` |
| Coordinator Card | `t_3e1f6a06` |
| Run | `#101` |
| Failure | Coordinator 在 120s timeout；process retry `1/1` exhausted；未 dispatch Executor |
| Executor / PLAN / PROGRESS / REPORT | missing |
| Independent REVIEW | missing |
| HANDOFF | missing |
| Evidence Paths | `ai/automation/HERMES-EXECUTION-STATUS.md`、`ai/automation/HERMES-AUTO-QUEUE.md`、Kanban card `t_3e1f6a06` run `#101` |

新增且不得通过 revision 变化清零的 failure fingerprint：

```text
REV17_COORDINATOR_TIMEOUT: t_3e1f6a06 timed out at 120s before Executor dispatch (run #101)
REV17_COORDINATOR_RETRY_EXHAUSTED: process retry consumed 1/1, gave_up with failures=1, effective_limit=1
```

该 failure 与 revision `-16` 的 pre-dispatch timeout 模式重复。当前没有证据证明问题来自 Unit C1 业务测试或 ADR-003 database 操作，因为 Executor 尚未创建。

## Prohibitions

- 不为 revision `-17` 创建第二个 Coordinator，不复用相同 idempotency key。
- 不 reuse、claim、promote、unblock 或 retry `t_3e1f6a06` 及任何旧 card。
- 不自动发布 revision `-18`，不把本事件归类为 business REWORK 或 attempt 2。
- 不修改业务代码、migration、tests、frontend、backend、Executor artifacts、Independent REVIEW、HANDOFF、Hermes Kanban 或 `HERMES-EXECUTION-STATUS.md`。
- 不运行 destructive tests；不读取、输出、复制、推测或持久化任何 secret。
- ADR-003 的 destructive authorization 未被本 advisory 扩大；PMC 不触碰 `revid_test_t4_002`、`revid_db` 或其他数据库。

## Runtime Owner Diagnostics Required

Hermes runtime owner 应针对 revision `-17`、card `t_3e1f6a06`、run `#101` 收集 fresh diagnostics：

- process exit code、timeout source 与实际应用的 120s budget；
- 不含 secret 的 stdout/stderr 尾部，以及 timeout 时 worker stack/trace；
- 同时段 Gateway、dispatcher、profile runtime 日志与 resource/capacity limits；
- Coordinator 在 Queue parse、Task read、idempotency lookup、profile resolution 或 Executor creation 的最后进度点；
- process retry decision 依据，以及为何未创建 Executor；
- revision `-17` 是否存在隐藏或平行的 Executor、Reviewer、HANDOFF chain；
- revision `-16` 与 `-17` 重复 pre-dispatch timeout 的共同 failure point。

可选 non-destructive proof：使用同一 `revid-pm` profile 执行不读取 secret、不访问数据库、不修改业务文件的 sustained-run/smoke，证明 dispatch path 能稳定完成。该 proof 不得创建或推进本 Task 的业务 card。

## Expected Runtime Owner Output

输出以下一个结论并附 evidence path：

- `READY_FOR_CONTINUATION`：明确重复 timeout 的原因及已验证的修复/规避条件；
- `STILL_INFRA_BLOCKED`：指出阻塞 subsystem、owner 和下一项 runtime action；
- `NEEDS_HUMAN_DECISION`：仅限需要付费资源、真实 secret、外部账号、新 destructive authorization 或重大 contract 决策。

## PMC Unblock Conditions

PMC 仅在看到 fresh runtime health evidence 后考虑 continuation；不得用新 revision 清零旧 fingerprint。至少需要证明：

1. `t_3e1f6a06` 已 terminal，revision `-17` 没有 active/hidden parallel chain；
2. revision `-16` 与 `-17` 重复 pre-dispatch timeout 的 failure point 已定位；
3. proposed continuation 的 dispatch budget、payload 或 runtime mechanism 有 fresh proof，不会原样重复 failure；
4. 所有历史 business/runtime fingerprints 继续继承；
5. 下一 work unit 仍可独立验证并严格遵守 ADR-003。

在满足这些条件前，T4-002 Unit C1 保持 `PMC_BLOCKED — INFRASTRUCTURE`，Queue 不提供 executable revision。Human Decision Required：`NO`。
