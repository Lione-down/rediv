# PMC REVIEW — T4-010 Revision 41r7 Partial Status Remediation

## Verdict

`PMC_STATE_CONFLICT — PARTIAL REMEDIATION / TERMINAL PASS STATE STILL NOT CANONICAL`

T4-010 的业务结论保持 `PMC_PASS`。Queue 保持 terminal、non-executable；不发布新 revision，不创建或操作 card。

## Changed Evidence

- Hermes execution status SHA256 从上一 PMC cursor `E96712A112B5CE6695B512A31B376440880ADAA84406D212ECE0ED833D027D29` 变为 `B393F751DD17C3AD6087FB77ADE31BB8F697562FC699264B423FF9B3BED32B62`。
- `Last updated` 已改为实际写入前的 `2026-07-06T20:37:45+08:00`，不再是上一轮发现的 future timestamp。
- rev41r7 exact `ACK_TERMINAL_VERDICT_AND_STOP — COMPLETE`、verdict `PMC_PASS`、fingerprint `NONE`、Task SHA256 与 Queue SHA256 均继续保持正确。
- `PMC Action Required = NO`、`Human Decision Candidate = NO`；没有新的执行授权或 Human escalation gate。

## Remaining Conflict

1. current `State` 仍为 `PMC_BLOCKED — NOT EXECUTABLE / TERMINAL RECONCILIATION COMPLETE`，与 Queue/PMC verdict `PMC_PASS` 冲突；`Queue Status` 也仍错误写成 BLOCKED。
2. status 有 `162` 行 Markdown table row 以 `||` 开头。项目 reconciler 的 `validate_document_structure()` 只接受单一 `|` 前缀，因此文档仍不满足 canonical structure。
3. `ai/runtime/reconcile-hermes-execution-status.py` 仍把 `TERMINAL_EXECUTION_STATE` 硬编码为 `PMC_BLOCKED`，并在 Queue verdict 不是 BLOCKED 时直接报 `reconciler only accepts a blocked non-executable Queue`。本轮 `--check` exit `2`；现有 targeted tests `10 passed` 只覆盖 BLOCKED contract，没有 `PMC_PASS` terminal regression。
4. rev41r3 仍同时记录 canonical Coordinator `t_7ab33875` 与 same-key adopted Coordinator `t_0cba51b5`；后者的 revision、parent、creator、created_at、terminal result 仍缺少项目内结构化 read-back 证据。

## Hermes Next Action Contract

### Target

- `ai/runtime/reconcile-hermes-execution-status.py`
- `ai/runtime/tests/test_reconcile_hermes_execution_status.py`
- `ai/automation/HERMES-EXECUTION-STATUS.md`
- Queue revision `phase4-wave3-workspace-shell-unit-b-rev41-final-handoff-2026-07-06-41r7`

### Required Changes

1. 读取 Queue reconciliation block 的 `PMC Verdict`，仅接受受支持的 terminal verdict；缺失或未知值 fail closed。
2. 对本 revision 派生并写入唯一 current state `PMC_PASS — NOT EXECUTABLE / TERMINAL RECONCILIATION COMPLETE`；`Queue Status` 同步为 `PMC_PASS — NOT EXECUTABLE / TERMINAL RECONCILIATION COMPLETE`。保留 BLOCKED Queue 的既有 BLOCKED 语义。
3. 新增 `PMC_PASS` terminal regression，证明第一次 `--apply` 写入 PASS state、第二次 `--apply` idempotent、随后 `--check` exit `0` 且输出 `STATUS_OK`；保留现有 BLOCKED regressions。
4. 将 status 全部 canonical table rows 从 `||` 改为单一 `|` 前缀；保持 fingerprint `NONE`、exact rev41r7 STOP confirmation、Task/Queue SHA256 与 `PMC Action Required = NO`。
5. 使用实际写入时的带时区 ISO-8601 timestamp；不得写 future timestamp。
6. 对 `t_7ab33875` 与 `t_0cba51b5` 做 Kanban 结构化 read-back，只回写可验证的 revision、idempotency key、parent、creator、created_at、terminal result 和 canonical/non-canonical 关系。

### Forbidden Actions

- 不创建、重派、retry、claim、promote、unblock、reparent、删除、归档或复用任何 T4-010 card。
- 不修改 Queue、Task、CURRENT、ROADMAP、REPORT、Independent REVIEW、HANDOFF、PMC REVIEW 或业务代码。
- 不读取、打印或复制 secret；不运行 browser、business tests 或 destructive command。

### Verification

```powershell
python -m pytest ai/runtime/tests/test_reconcile_hermes_execution_status.py -q
python ai/runtime/reconcile-hermes-execution-status.py --apply
python ai/runtime/reconcile-hermes-execution-status.py --check
git diff --check
```

完成证据必须包含：targeted tests PASS；`--check` exit `0` 且仅输出 `STATUS_OK`；status 中 `||`/`|||` 前缀行计数为 `0`；唯一 current state 与 Queue Status 均为 terminal `PMC_PASS`；fingerprint 唯一且为 `NONE`；rev41r7 exact STOP confirmation 唯一；Task/Queue SHA256 匹配；两个 rev41r3 Coordinator ID 的结构化核对结论可追溯。

Human decision required: `NO`。
