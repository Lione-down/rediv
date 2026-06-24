# PMC Controller Automation 治理变更进度

## 2026-06-24

- [x] 审计现有 PMC automation、Hermes supervisor、Queue、CURRENT、ROADMAP 和当前任务证据。
- [x] 确认目标架构：Codex automation 负责 PMC 决策与项目文档写入；Hermes automation 负责 Queue 调度和四个 profiles 监督。
- [x] 更新 PMC automation 模板。
- [x] 写入 T4-002、T4-006 正式 PMC review。
- [x] 更新 Queue、CURRENT、ROADMAP。
- [x] 收口 T4-006 doing/done 文件。
- [x] 同步 pitfalls 并完成一致性复核。

## 验证结果

- Queue revision、Approved By、Task path：PASS。
- Active Queue 不包含 T4-006：PASS。
- `ai/tasks/doing` 当前文件数为 0：PASS。
- T4-002 Task、ADR、PMC REVIEW 及 T4-006 done 文档路径：全部存在。
- 旧“只读 PMC Advisor”“交互式 Codex PMC”与 T4-010 stale blocker 文案：无残留。
- UTF-8 replacement character 检查：PASS。
- `git diff --check`：PASS。

## 完成状态

计划内治理变更已完成。项目内 automation 模板需要一次性同步到 Codex Desktop 的真实定时任务；项目文件本身不会自动改变 Desktop automation 配置。
