# Plan — Hermes Next Cron Contract Clarification

## Objective

消除 Hermes Scheduled Supervisor 对 Active Wave、terminal reconciliation、validator exit code 和 status ownership 的歧义，为下一轮 cron 提供唯一、逐步、可验证的操作合同，并把同一格式固化为后续 Queue 的治理要求。

## Scope

- 新增 PMC-owned `HERMES-NEXT-CRON-CONTRACT.md`，明确当前 revision、允许动作、禁止动作、逐步命令、分支与完成证据。
- 更新 canonical Hermes scheduled prompt，使其先解析唯一 `## Active Wave`，再读取 next-cron contract；历史 prose 不得覆盖 Active Wave table。
- 修正 `STATUS_RECONCILIATION_ERROR` 语义：它禁止 Kanban/业务推进，但不禁止 Hermes 修复其 owned status；结构错误必须先结构修复再复查。
- 在 Queue 和 CURRENT 中记录当前合同入口与事实结论。
- 在 operating model 中固化未来 next-cron contract 的必填字段和 precedence。

## Non-goals

- 不修改 `HERMES-EXECUTION-STATUS.md`、Kanban、Gateway、card、业务代码、runtime implementation、Task、REPORT、Independent REVIEW 或 HANDOFF。
- 不 ACK、dispatch 或复用已 supersede 的 T4-002 rev36。
- 不在本任务发布新的 executable Queue revision。

## Risks

- 当前 reconciler hard-code 只接受 `PMC_BLOCKED` Queue；即使 status 结构修复，`PMC_PASS` Queue 仍可能返回已知 compatibility error。
- Hermes 若把历史 Queue 文本当作 Active Wave，可能错误 dispatch rev36；合同必须显式禁止。
- 手工 status 修复可能产生重复字段；必须以唯一字段计数和完整 read-back 收尾。

## Acceptance Criteria

1. 下一轮合同只允许处理 rev41r7 terminal status，不允许任何 card action。
2. 合同明确合法 Markdown table row 使用单个 leading `|`。
3. 合同明确 exit `2` 的分类处理和已知 `PMC_PASS` reconciler limitation，不再形成“validator 失败所以禁止修复 validator 输入”的循环。
4. Canonical prompt 强制只认唯一 Active Wave table，并把 superseded revision 排除在 executable 候选之外。
5. 后续合同模板包含 Authority、Preconditions、Exact Steps、Branch Table、Forbidden Actions、Verification、Completion Evidence、Stop Condition。
6. `git diff --check` 通过；所有新增/修改文件为 UTF-8。
