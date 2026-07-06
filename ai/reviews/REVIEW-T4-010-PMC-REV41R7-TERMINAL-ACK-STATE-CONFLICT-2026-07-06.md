# PMC REVIEW — T4-010 Revision 41r7 Terminal ACK State Conflict

## Verdict

`PMC_STATE_CONFLICT — TERMINAL ACK RECEIVED / STATUS SEMANTICS STILL INCONSISTENT`

T4-010 的业务结论保持 `PMC_PASS`，Queue 保持 terminal、non-executable。

## Changed Evidence

- Hermes execution status SHA256 从上一 PMC cursor `830518FA5CAC946D7E6AB662E10187C25EA25003A16E093940BF5BEAA3F486D0` 变为 `E96712A112B5CE6695B512A31B376440880ADAA84406D212ECE0ED833D027D29`。
- rev41r7 已出现 exact `ACK_TERMINAL_VERDICT_AND_STOP — COMPLETE`，明确携带同 revision、verdict `PMC_PASS` 与 failure fingerprint `NONE`。
- current failure fingerprint 已规范为 `NONE`；Task SHA256 `4E97A0736276BAD64F04E771B5C535C43A2AE37B5D0BA917A1C09FA1F1B80917` 与 Queue SHA256 `E415F45BA9798C2A119D6FA01E757E0235283190831C6CDBB3F9036E48C49061` 均与实际文件一致。
- `PMC Action Required = NO`、`Human Decision Candidate = NO`，未出现新的执行授权或 Human escalation gate。

## Remaining Conflict

- current `State` 仍写成 `PMC_BLOCKED — NOT EXECUTABLE / TERMINAL RECONCILIATION COMPLETE`，与同一 status 的 `PMC_PASS` ACK、PMC 最终验收、CURRENT、ROADMAP 和 Task terminal 状态冲突。`BLOCKED` 不能作为已通过 Task 的 canonical current verdict。
- status 的 `Last updated` 与 `Last Transition` 均为 `2026-07-06T20:30:00+08:00`，晚于本轮实际读取时间 `2026-07-06T20:05:07+08:00`，不能作为可信的 checkpoint ordering 证据。
- status 同时把 rev41r3 canonical Coordinator 记为 `t_7ab33875`，又把 `t_0cba51b5` 记为同 idempotency key 的 adopted Coordinator；现有项目证据没有解释两个 ID 的唯一关系，因此 historical accounting 仍不可核对。
- 在 current state 与 `PMC_PASS` 对齐、双 Coordinator accounting 可核对前，Queue 顶部唯一 `PMC Reconciliation Required: YES` signal 继续保留，不发布新 revision 或 card。

## Required Hermes Action

### Target

- Runtime reconciler：`ai/runtime/reconcile-hermes-execution-status.py`。
- Regression tests：`ai/runtime/tests/test_reconcile_hermes_execution_status.py`。
- Hermes-owned status：`ai/automation/HERMES-EXECUTION-STATUS.md`。
- Queue revision：`phase4-wave3-workspace-shell-unit-b-rev41-final-handoff-2026-07-06-41r7`。

### Observed Problem

1. Reconciler 将 `TERMINAL_EXECUTION_STATE` 硬编码为 `PMC_BLOCKED — NOT EXECUTABLE / TERMINAL RECONCILIATION COMPLETE`，并在 terminal stop 分支无条件写入；它没有读取 Queue reconciliation block 的 `PMC Verdict: PMC_PASS`。因此 `--apply` 会把已 PASS Task 写成 BLOCKED。
2. status 的 current `State` 已被写成上述错误值，而同一文件的 ACK 明确为 `Verdict: PMC_PASS`、`Failure Fingerprint: NONE`。
3. status 中新增 canonical rows 使用 `|||` 前缀；`validate_document_structure()` 明确拒绝该格式。
4. status 的 `Last updated` 与 `Last Transition` 为未来时间 `2026-07-06T20:30:00+08:00`。
5. rev41r3 同时记录 canonical Coordinator `t_7ab33875` 与 same-key adopted Coordinator `t_0cba51b5`，缺少两者关系的结构化证据。

### Required Changes

1. 在 `expected_contract()` 中读取并返回 Queue reconciliation block 的 `PMC Verdict`；缺失或不在支持的 terminal verdict enum 时 fail closed。
2. 将 terminal execution state 改为由 verdict 派生：本 revision 必须得到 `PMC_PASS — NOT EXECUTABLE / TERMINAL RECONCILIATION COMPLETE`；`PMC_BLOCKED` Queue 仍必须得到原 BLOCKED state，不能回归。
3. 新增一个 `PMC_PASS` terminal fixture/regression，证明 `--apply` 写入 PASS state，第二次 `--apply` 为 idempotent，随后 `--check` 输出 `STATUS_OK`；保留现有 BLOCKED regression。
4. 由 Hermes Supervisor 使用修复后的 reconciler 更新 status，并把所有 `|||` canonical rows 恢复为单一合法 Markdown table row 前缀 `|`。`State` 写为上述 PASS terminal state；`Failure Fingerprint` 和 `Current Failure Fingerprint` 保持 `NONE`；rev41r7 reconciliation 保持 `ACK_TERMINAL_VERDICT_AND_STOP — COMPLETE`。
5. `Last updated` 与 `Last Transition` 必须使用实际写入时的带时区 ISO-8601 timestamp，不能晚于写入动作的系统时间。
6. 从 Kanban 结构化 read-back 核对 `t_0cba51b5` 与 `t_7ab33875` 的 revision、idempotency key、parent、creator、created_at 与 terminal result。只保留可验证事实；若两者是重复/错误记录，明确标记 canonical ID 与非 canonical ID 的来源，不得声称未验证的 adoption。

### Forbidden Actions

- 不创建、重派、retry、claim、promote、unblock、reparent、删除、归档或复用任何 T4-010 card。
- 不修改 Queue、Task、CURRENT、ROADMAP、REPORT、Independent REVIEW、HANDOFF、PMC REVIEW 或业务代码。
- 不读取、打印或复制 secret；不运行 browser、business tests 或 destructive command。

### Verification

在项目根目录依次运行：

```powershell
python -m pytest ai/runtime/tests/test_reconcile_hermes_execution_status.py -q
python ai/runtime/reconcile-hermes-execution-status.py --apply
python ai/runtime/reconcile-hermes-execution-status.py --check
git diff --check
```

预期：targeted tests 全部通过；`--check` exit `0` 且只输出 `STATUS_OK`；status 全文件不存在以 `|||`、`||||` 或 `|||||` 开头的行；current `State` 唯一且为 terminal `PMC_PASS`；current fingerprint 唯一且为 `NONE`；rev41r7 exact STOP confirmation 唯一；Task/Queue SHA256 与实际文件一致。

### Completion Evidence / Done Condition

Hermes 必须在 `HERMES-EXECUTION-STATUS.md` 回写：真实 update/transition timestamp、修正后的唯一 current state、fingerprint `NONE`、exact STOP confirmation、真实 Task/Queue SHA256、targeted test 结果、reconciler `STATUS_OK`，以及两个 rev41r3 Coordinator ID 的结构化核对结论。只有这些字段同时满足且没有新 card/activity，PMC 才关闭 Queue reconciliation signal。

Human decision required: `NO`。
