# Progress — Hermes Next Cron Contract Clarification

## Status

`COMPLETE`

## Completed Work

- [x] 审计 Hermes 错误结论与 canonical scheduled prompt，确认根因包含错误规则：旧 prompt 对所有 reconciler exit `2` 一律禁止 status 修改，形成 malformed input 无法修复的循环。
- [x] 确认 Queue 唯一 Active Wave 为 rev41r7 terminal reconciliation；T4-002 rev36 Task 为 `SUPERSEDED BEFORE ACK`，不得执行。
- [x] 新增 `ai/automation/HERMES-NEXT-CRON-CONTRACT.md`，提供 Authority、Preconditions、Exact Steps、Branch Table、Forbidden Actions、Verification、Completion Evidence 和 Stop Condition。
- [x] 更新 `ai/prompts/hermes-scheduled-supervisor.md`：只认唯一 Active Wave table；next-cron contract revision 必须匹配；status-input 结构错误允许修复 Hermes-owned status，但所有 exit `2` 继续禁止 Kanban/业务推进。
- [x] 更新 `ai/automation/REVID-MULTI-AGENT-OPERATING-MODEL.md`，固化未来 cron contract 的必填格式与 precedence。
- [x] 更新 Queue 顶部入口、CURRENT 和 rev41r7 PMC review，消除旧 action contract 与新 runbook 的冲突。

## Verification

- Canonical Hermes prompt: `411` lines，低于 500 行建议上限。
- Current next-cron contract: `142` lines。
- `Step -1`、contract path、malformed-status repair branch、known `PMC_PASS` compatibility branch 均存在。
- Queue、CURRENT 和 contract 均明确 rev36 superseded、禁止 ACK/dispatch、未来必须 fresh revision/keys。
- `git diff --check`: exit `0`。
- 未修改 `HERMES-EXECUTION-STATUS.md`、Kanban、Gateway、card、业务代码、runtime implementation、Task、REPORT、Independent REVIEW 或 HANDOFF。

## Result

计划文档的 Acceptance Criteria 已全部满足。下一轮 Hermes cron 的唯一任务是 rev41r7 terminal status reconciliation；完成后停止并交回 PMC，不得自行选择或执行 T4-002 rev36。
