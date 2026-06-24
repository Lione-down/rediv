# PMC Controller Automation 治理变更计划

## 目标

将 Codex automation 从只读 Advisor 调整为可写的 Project Master Controller，由其审查 Hermes 证据、维护项目事实源并发布 Queue；Hermes Scheduled Supervisor 继续负责调度和监督四个 profiles。

## 范围

- 更新 Codex PMC automation 模板的权限、工作流和输出约定。
- 为 T4-002 记录正式 PMC 返工结论并发布 Human-approved 人工返工 Queue。
- 为 T4-006 补齐正式 PMC PASS 文档并完成 doing/done 收口。
- 统一 CURRENT、ROADMAP 中 T4-010 的状态；仅解除依赖，不自动授权执行。
- 同步 pitfalls 规则变更记录。

## 非目标

- 不修改业务代码。
- 不创建或修改 Hermes Kanban 卡片。
- 不配置或读取 secret。
- 不直接调度 Backend、Frontend 或 Reviewer profile。
- 不启动 T4-010。

## 风险与约束

- 项目工作树存在大量既有未提交内容；只修改明确列出的治理文档。
- PMC automation 只能通过共享项目文档与 Hermes 通信。
- 项目内 prompt 是 Desktop automation 的人工同步模板；修改模板不会自动更新 Desktop 中的真实定时任务。
- T4-002 destructive integration tests 必须等待 Hermes runtime 注入 `REVID_TEST_MYSQL_ADMIN_URL`。

## 验收标准

1. PMC automation 模板明确允许维护 CURRENT、ROADMAP、Task、ADR、PMC REVIEW 和 Queue，同时禁止修改业务代码与 Kanban。
2. Active Queue 只包含 T4-002，版本唯一、Human-approved、返工范围和 Hard Gates 完整。
3. T4-006 的 Task、PLAN、PROGRESS 位于 done，且存在正式 PMC PASS review。
4. T4-010 在 ROADMAP 中为依赖已满足但待批准，CURRENT 不再同时声明 blocked 与解除 blocked。
5. T4-002 正式 PMC review 明确证据链问题、返工要求和停止条件。
6. `git diff` 只包含本次预期治理文件及用户已有修改，不触碰业务代码。

