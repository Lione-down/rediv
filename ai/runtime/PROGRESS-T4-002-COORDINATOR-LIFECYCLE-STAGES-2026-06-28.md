# T4-002 Coordinator Lifecycle Stages Progress

## Status

`COMPLETE`

## Completed

- [x] Fresh read Queue、status、Coordinator/Executor cards、runs/logs 和 revision `-18` artifacts。
- [x] 确认初始 Coordinator 按 canonical Queue 正确只创建 Executor；Supervisor card body 的“+ Reviewer”文案冲突但未生效。
- [x] 确认 REPORT、PLAN、PROGRESS 存在，Independent REVIEW 缺失。
- [x] 确认 Executor 提前创建 HANDOFF，属于 ownership/scope drift，不能作为 post-review canonical evidence。
- [x] 定义三段短生命周期 stage design。

## Completed implementation

- [x] 添加 RED regression tests，再实现 action-specific runtime policy selection。
- [x] 更新 `revid-pm` config/SOUL，为三个 lifecycle actions 配置 exact allowlist。
- [x] Targeted suite：95 passed，2 deselected；compile passed。
- [x] Fresh policy probe：DISPATCH/REVIEW_DISPATCH 各 8 tools；HANDOFF 7 tools；unknown action 无 policy。
- [x] Gateway clean restart，PID 6068。
- [x] 写 PMC lifecycle-gap review。
- [x] 更新 Task/CURRENT/ROADMAP/progress，并最后发布 review-dispatch Queue stage。
