# T4-002 Unit C2 Revision 20 — PMC Runtime Advisory

## Verdict

`PMC_RUNTIME_ADVISORY — REV20 TERMINAL, REMEDIATION_REQUIRED`

Revision `phase4-wave2-unit-c2-migration-core-continuation-2026-06-28-20` 不可继续执行，也不发布 revision `-21`。Coordinator `t_1617a921` 的失败发生在 Executor dispatch 前，属于 Hermes Supervisor → worker-policy handoff defect，不是 Unit C2 业务实现失败。

## Root Cause

根因是 Supervisor 创建的 revision `-20` Coordinator card body 只有 Task 文件引用，没有 Queue 要求的独立 `Action: DISPATCH_ONLY` marker；`hermes_cli/kanban_db.py::_resolve_worker_allowed_tools()` 只扫描 card body，不跟随 `@Task.md` 引用，因此返回 `None` 并静默退化为 unrestricted `revid-pm` tool surface。

## Evidence

| Field | Evidence |
|---|---|
| Revision | `phase4-wave2-unit-c2-migration-core-continuation-2026-06-28-20` |
| Coordinator | `t_1617a921` |
| Run | `#114` |
| Runtime result | `timed_out` at 121s, limit 120s, process retry `1/1` exhausted |
| Card body | 仅 `@D:/works/codexWorks/project_revid/ai/tasks/todo/TASK-T4-002-UNIT-C2-REV20.md`；缺少 standalone `Action:` |
| Children | 空；Executor 未创建 |
| Worker log | 执行了 `git status`、`hermes profile list`、`ls` 等 DISPATCH_ONLY allowlist 外工具 |
| Policy source | `_resolve_worker_allowed_tools()` 只遍历 `(task_body or "").splitlines()` 并匹配 key 精确等于 `Action`；无匹配时返回 `None` |
| Profile config | `DISPATCH_ONLY` exact allowlist 存在；本次未被选中，而不是配置缺失 |
| Business evidence | Unit C2 PLAN、PROGRESS、REPORT、Independent REVIEW、HANDOFF 均不存在；四个 selectors 未执行 |

另有治理状态冲突：Hermes cron output 声称已把 execution status 更新到 revision `-20`，但项目中的 `HERMES-EXECUTION-STATUS.md` 仍停留在 revision `-19`。直接 card/run evidence 优先证明 rev20 已 terminal；该 Hermes-owned 文件必须由 Supervisor 自行 reconcile，PMC 不代写。

## Decision

1. **不增加 Coordinator budget。** Revision `-18` 的 compliant dispatch 在 120s 内完成；本次 121s 是 unrestricted exploration 消耗预算。提高到 300s 只会延长错误模式，不能恢复 role boundary。
2. **不继续拆 Unit C2。** 失败发生在 Executor 创建前，与 four-selector business scope 大小无关。
3. **不发布 revision `-21`。** 同一 failure shape 在 protocol handoff 未修复前继续发布只会消耗新 idempotency key。

## Runtime Remediation Required

Hermes runtime owner 必须完成以下三层修复：

1. **Supervisor body contract**：创建 Coordinator 时，card body 必须直接包含 standalone `Action: DISPATCH_ONLY`、revision、Task path、Executor profile、Stop After 与 idempotency；`@Task.md` 只能作为附加引用，不能替代 action marker。
2. **Runtime fail-closed**：`revid-pm`/Coordinator 命中已配置 `worker_tool_policies`，但 card body 缺少或包含未知 standalone action 时，必须在 spawn 前以稳定 fingerprint（例如 `MISSING_WORKER_ACTION_MARKER`）block；禁止回退 unrestricted tools。
3. **Regression and runtime proof**：增加 reference-only card body 的 regression test，证明旧路径会被 fail-closed；再用与 Scheduled Supervisor 相同的 body builder 和 board 路径完成 fresh positive dispatch smoke，验证 exposed tools 仅为 exact allowlist、只创建一个 inert child、Coordinator 在 120s 内 terminal。

期望 runtime owner 输出：`READY_FOR_CONTINUATION` 或 `STILL_INFRA_BLOCKED`，附 source diff、targeted tests、实际 card/run/log evidence。新证据必须继承 `REV20_MISSING_ACTION_POLICY_BYPASS` 与此前全部 fingerprints。

## Prohibited Actions

- 不复用、claim、promote、unblock 或 retry `t_1617a921`。
- 不通过提高 timeout、缩短 Task 文本或新 revision 绕过 action-policy gate。
- 不修改业务代码、migration、tests、Executor artifacts 或 `HERMES-EXECUTION-STATUS.md`。
- 不读取、使用、复制或输出 secret。

## Security Note

本轮诊断读取 profile config 时，工具输出意外包含了一个 credential 值。该值未被使用，也不在本文件复述。由于它已进入诊断 transcript，Human Owner 应轮换对应 credential，并在恢复 Hermes worker 前确认旧值失效。

## PMC Unblock Condition

只有同时看到 fail-closed regression、fresh Scheduled Supervisor body-path smoke、Hermes execution status reconciliation、credential rotation confirmation，且不存在 active duplicate chain 后，PMC 才考虑新的 bounded continuation。
