# Revid Delivery Reports

本目录保存已完成 Task 的交付证据。Direct Delivery 下，REPORT 由 Codex 在实现和所需验证全部完成后编写，不再依赖独立 Reviewer 或 HANDOFF。

## Naming

```text
REPORT-{TaskID}.md
```

历史报告可保留旧命名，不需要为统一格式重写。

## Required Content

每份新 REPORT 至少包含：

- Task ID 与最终状态。
- Outcome 和实际交付边界。
- Acceptance Criteria 逐项结果。
- Files Changed。
- Verification commands、证据类型和 summarized result。
- 未执行检查的原因、影响和 release condition。
- 风险、deferred 项和下一 dependency-ready Task。

## Evidence Labels

必须区分：

- unit
- mock
- integration
- real service
- browser
- manual acceptance

一种证据不能冒充另一种。例如 provider smoke 不能替代业务 route persistence，mock browser flow 不能替代 real MySQL browser acceptance。

## Completion Rule

只有以下事实一致时才能写 `DONE / PASS`：

1. Task 全部非 deferred AC 和 Hard Gates 通过。
2. 实现、migration、tests 和文档处于同一 contract。
3. `PROGRESS.md` 的 Remaining 不再包含该 Task 必须项。
4. `CURRENT.md` 与 `ROADMAP.md` 已同步。
5. scoped staged diff 已完成安全检查和 fresh self-review。

历史 PMC、Hermes、runtime 和 scheduled reports 只作历史证据，不是当前任务流入口。
