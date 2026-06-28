# PMC Plan — T4-002 Revision 19 Runtime Diagnostic Review

## Objective

核对 Unit C1 revision `-18` 的最终验收状态，审查 Unit C2 revision `-19` 新增 runtime diagnostic，并为 Hermes runtime owner 定义可验证的修复与解阻条件。

## Scope

- 只读核对 Unit C1 Task、REPORT、Independent REVIEW、canonical HANDOFF 与 PMC PASS。
- 只读核对 revision `-19` card `t_b493a47f`、run `#113`、worker log、profile agent log、dispatcher source 与 smoke `t_20945c04` / run `#102`。
- 写入 PMC REVIEW，并同步 CURRENT、Queue hold 与 pitfalls。

## Non-goals

- 不修改 Hermes 安装代码、profile、Gateway、Kanban card 或 `HERMES-EXECUTION-STATUS.md`。
- 不发布 continuation revision，不重派或复用旧 card。
- 不修改业务代码、migration、tests，不访问数据库或 secret。

## Success Criteria

- Unit C1 的最终 verdict 有唯一、可引用的事实源。
- revision `-19` 的 failure mechanism 由直接日志与 source semantics 支撑，不把推测写成事实。
- remediation 包含明确实现边界、回归测试和 same-profile smoke gate。
- CURRENT 与 Queue 不再表述为“等待 fresh diagnostic”，而是准确反映 diagnostic 已审阅、等待 runtime remediation evidence。
- `git diff --check` 通过。
