# Revid Review Records

`ai/reviews/` 保存历史审查证据。自 2026-07-10 起，Revid 使用 Codex Direct Delivery，不再创建 Reviewer、HANDOFF 或 Hermes runtime reconciliation。

## Current Review Contract

每个 bounded unit 在提交前由 Codex 对实际 diff 做 fresh self-review，至少覆盖：

- Task Scope、Acceptance Criteria 和 Non-Goals。
- API、schema、migration 和兼容性边界。
- security、credential、secret 和敏感路径。
- error path、rollback 边界和 failure semantics。
- tests 的真实语义与证据类型。
- UI 可访问性、responsive 和 browser evidence，若适用。
- staged path ownership 与 dirty remainder。

审查结论写入 active PROGRESS；Task 完成证据写入 REPORT。发现 blocker 时，必须在 PROGRESS 和 CURRENT 中写清解除条件。

## Historical Files

现有 `REVIEW-*`、Reviewer、HANDOFF 和 reconciliation 文件不得删除、改写或恢复为 active workflow。只有在 active 文档精确引用它们以解决事实冲突时才读取。
