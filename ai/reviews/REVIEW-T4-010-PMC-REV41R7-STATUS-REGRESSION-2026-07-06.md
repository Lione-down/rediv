# PMC REVIEW — T4-010 Revision 41r7 Status Regression

## Verdict

`PMC_STATE_CONFLICT — TERMINAL PASS STATUS REGRESSED / STOP ACK NOT CANONICAL`

T4-010 的业务结论保持 `PMC_PASS`。Queue 保持 terminal、non-executable；不发布新 revision，不创建或操作任何 card。

## Changed Evidence

- Hermes execution status SHA256 从上一 PMC cursor `B393F751DD17C3AD6087FB77ADE31BB8F697562FC699264B423FF9B3BED32B62` 变为 `3C4053C571EF7C9E014BD4E7955D733FFAEAA1C69C44985B9D4E3B837290D861`。
- status 当前写入 `State = PMC_PASS — ARCHIVED / NO FURTHER ACTION`、fingerprint `NONE`，且 Task SHA256 `4E97A0736276BAD64F04E771B5C535C43A2AE37B5D0BA917A1C09FA1F1B80917` 与 Queue SHA256 `E415F45BA9798C2A119D6FA01E757E0235283190831C6CDBB3F9036E48C49061` 匹配真实文件。
- `PMC Action Required = NO`；没有新的 business evidence、执行授权或 Human escalation gate。

## Conflict

1. 本轮实际读取时间为 `2026-07-06T23:42:25+08:00`，但 `Last updated` 与 `Last Transition` 均为未来时间 `2026-07-07T09:00:00+08:00`，不能作为可信 ordering evidence。
2. status 共 `139` 行，其中 `100` 行 Markdown table row 以非法 `|||` 开头。项目 reconciler 因 line 7 malformed row fail-closed，`--check` exit `2`。
3. Queue 要求同 revision/fingerprint 的 `ACK_TERMINAL_VERDICT_AND_STOP`；status 没有 `PMC Verdict Confirmation` 字段，`Rev41r7 Reconciliation` 只写 `PMC_PASS — ARCHIVED`，不满足 exact STOP ACK contract。
4. current state 文案未使用既定 canonical value `PMC_PASS — NOT EXECUTABLE / TERMINAL RECONCILIATION COMPLETE`。虽然语义方向正确，但不能替代结构化、可验证的 terminal reconciliation。

## Hermes Next Action Contract

### Target

- `ai/runtime/reconcile-hermes-execution-status.py`
- `ai/runtime/tests/test_reconcile_hermes_execution_status.py`
- `ai/automation/HERMES-EXECUTION-STATUS.md`
- Queue revision `phase4-wave3-workspace-shell-unit-b-rev41-final-handoff-2026-07-06-41r7`

### Required

1. 保留 verified Task/Queue SHA256、fingerprint `NONE`、`PMC Action Required = NO` 和所有 rev41r7 evidence paths/card IDs。
2. 将全部 table rows 规范为单一 `|` 前缀；canonical fields 每项只出现一次。
3. 使用实际写入时的带时区 ISO-8601 timestamp，不得写 future timestamp。
4. 写入唯一 current `State` 与 `Queue Status`：`PMC_PASS — NOT EXECUTABLE / TERMINAL RECONCILIATION COMPLETE`。
5. 写入唯一 `PMC Verdict Confirmation = ACK_TERMINAL_VERDICT_AND_STOP`，并将 `Rev41r7 Reconciliation` 规范为 `ACK_TERMINAL_VERDICT_AND_STOP — COMPLETE`。
6. 补充 `PMC_PASS` terminal regression，证明 first apply、idempotent second apply、final check `STATUS_OK`；保留 BLOCKED regressions。

### Forbidden

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

完成条件：tests PASS；final `--check` exit `0` 且输出 `STATUS_OK`；非法多 pipe row 计数为 `0`；唯一 terminal PASS state、Queue Status、fingerprint `NONE`、真实 hashes 与 exact STOP confirmation 全部匹配。

Human decision required: `NO`。
