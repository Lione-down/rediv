# PMC REVIEW — T4-010 Rev41r7 Partial State Correction

## Verdict

`PMC_STATE_CONFLICT — CURRENT STATE CORRECTED / TERMINAL RECONCILIATION STILL NON-CANONICAL`

T4-010 的业务结论继续为 `PMC_PASS`。本轮没有新的业务执行、Reviewer 或 HANDOFF 工作授权。

下一轮唯一操作合同现为 `ai/automation/HERMES-NEXT-CRON-CONTRACT.md`；其逐步 contract supersede 本文件下方较早的概括性 `Hermes Next Action`，verdict 与 evidence cursor 不变。

## Evidence Cursor

- Queue revision: `phase4-wave3-workspace-shell-unit-b-rev41-final-handoff-2026-07-06-41r7`.
- Queue SHA256: `E415F45BA9798C2A119D6FA01E757E0235283190831C6CDBB3F9036E48C49061`.
- Hermes status SHA256: `EF435EC8232EB2036E8F6D1A0BE41E57CE880543F1E9F90BEEE0F47A43DAC56A`.
- Task SHA256: `4E97A0736276BAD64F04E771B5C535C43A2AE37B5D0BA917A1C09FA1F1B80917`.
- REPORT / REVIEW / HANDOFF SHA256: `D482244B45122A96967126980D5D24EB27A0FA57E1466B505AFD26F887080842` / `A49D65633B805F8CF699F081654D118FBC9E13810314643B5C9DFC07684EC2C5` / `C595DFF2FB58D157C41D9927DCE4C3BCEDBC5907A30F2A311042ABB6E7EBBF76`.
- PMC PASS review SHA256: `FD871F40490A2210703794B5C16C2450B873B332BE62877C72C8ECB7AEE99D10`.

## Findings

Hermes status 已把 current `State`、current failure fingerprint、Task/Queue hashes 和 `PMC Action Required` 改为与 `PMC_PASS` 一致的方向。这关闭了上一轮 current-state 仍写成 `PMC_BLOCKED` 的冲突。

Terminal reconciliation 仍未闭环：

1. 139 行 status 中有 100 行以非法 `|||` 开头，没有有效 Markdown table row。
2. rev41r7 没有精确的 `ACK_TERMINAL_VERDICT_AND_STOP — COMPLETE` reconciliation value，也没有唯一 `PMC Verdict Confirmation = ACK_TERMINAL_VERDICT_AND_STOP` 字段。
3. `Last updated = 2026-07-07T10:30:00+08:00` 与 `Last Transition = 2026-07-07T09:00:00+08:00` 均晚于本轮实际读取时间 `2026-07-07T00:02:49+08:00`，不能作为可信 ordering evidence。
4. Project reconciler `--check` 因第 7 行 malformed table fail-closed，exit `2`。
5. Queue 仍保留唯一 current rev41r7 reconciliation signal，状态为 `PMC_PASS — NOT EXECUTABLE / AWAITING TERMINAL ACK`；因此不得把 `PMC Action Required = NO` 当作 terminal ACK 已完成。

## Hermes Next Action

### Target

- `ai/automation/HERMES-EXECUTION-STATUS.md`
- Revision `phase4-wave3-workspace-shell-unit-b-rev41-final-handoff-2026-07-06-41r7`
- Queue fingerprint `NONE`

### Observed Problem

Hermes-owned status 的业务状态值已接近正确，但 Markdown 结构、可信时间戳和 rev41r7 exact STOP confirmation 仍不满足 Queue reconciliation contract。

### Required Changes

1. 仅由 Hermes Supervisor 重写其 owned status，使所有 canonical table row 使用单个 leading `|` 的有效多行 Markdown table。
2. 使用实际写入时间更新 `Last updated`；`Last Transition` 必须反映可验证的真实 transition，禁止 future timestamp。
3. 保持 current revision、Task path、card IDs、REPORT/REVIEW/HANDOFF paths、Task/Queue hashes、`State = PMC_PASS — ARCHIVED / NO FURTHER ACTION`、fingerprint `NONE` 和 `PMC Action Required = NO`。
4. 写入唯一 `PMC Verdict Confirmation = ACK_TERMINAL_VERDICT_AND_STOP`。
5. 将 rev41r7 reconciliation 写为精确值 `ACK_TERMINAL_VERDICT_AND_STOP — COMPLETE`，并保持 Queue non-executable。
6. 若 reconciler 在结构修复后仍只接受 `PMC_BLOCKED` terminal Queue，按 `HERMES-NEXT-CRON-CONTRACT.md` 将其分类为已知 compatibility limitation；Hermes 不修改 runtime code，也不得通过把 Queue 或 current state 降级为 `PMC_BLOCKED` 来绕过校验。

### Forbidden Actions

- 不创建、retry、claim、promote、unblock、reparent、删除或复用任何 Hermes card。
- 不修改 Queue、CURRENT、ROADMAP、Task、REPORT、Independent REVIEW、HANDOFF、业务代码或 evidence。
- 不发布新 revision，不清零或改写历史 failure fingerprint，不读取或输出 secret。

### Verification

在 status 写入后运行：

```powershell
D:/works/codexWorks/project_revid/backend/.venv/Scripts/python.exe ai/runtime/reconcile-hermes-execution-status.py --check
git diff --check
```

并结构化检查：status 中非法 `|||` / `||` row 数为 `0`；rev41r7 exact STOP reconciliation、`PMC Verdict Confirmation`、current revision、fingerprint、Task/Queue hashes 各唯一且一致；时间戳不晚于实际写入时间。

### Completion Evidence

Hermes status 必须回写实际 SHA256、命令 exit code、唯一字段检查结果和真实写入时间。若需 bounded reconciler remediation，同时提供 regression test path 与通过结果。

### Done Condition

status Markdown 结构有效，rev41r7 同 revision/fingerprint 的 exact STOP confirmation 唯一存在，Queue 保持 terminal/non-executable，且没有新 card 或业务 diff。`--check` 应优先达到 exit `0`；若唯一剩余错误是已知 `reconciler only accepts a blocked non-executable Queue`，必须保留正确 `PMC_PASS` 并以 `PMC Action Required = YES / QUEUE_DECISION` 交回 PMC，不得形成循环等待。

## Human Decision

`NO`。这是 Hermes control-plane status reconciliation，不是产品、schema、secret、付费资源或不可逆操作决策。
