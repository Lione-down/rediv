# Revid Dispatcher Role and T4-002 Revision 25 Progress

- [x] 审计 rev24 timeout、现有 `revid-pm` contract、launcher 与 runtime exact policy。
- [x] Human Owner 批准拆分 Dispatcher 角色与发布 rev25。
- [x] 新增项目 `revid-dispatcher` SOUL 模板和部署映射。
- [x] 扩展 launcher assignee contract 并补充 tests。
- [x] 创建并收窄实际 Hermes `revid-dispatcher` profile。
- [x] 发布 rev25 Task 与 Queue，更新 CURRENT、ROADMAP、Supervisor 和 operating model。
- [x] 完成 targeted tests、profile audit 和文档一致性检查。

## Verification

- launcher regression：`5 passed in 0.08s`。
- 项目 SOUL 与实际 profile SOUL：SHA-256 一致。
- effective CLI toolsets：`file,kanban`；唯一 action policy：`DISPATCH_ONLY`。
- exact tools：`read_file` 与七个 Kanban lifecycle tools；memory、orchestrator、curator 均关闭。
- rev25 launcher dry-run：assignee `revid-dispatcher`，standalone `Action: DISPATCH_ONLY` 存在。
- `git diff --check`：通过，仅有现有 LF/CRLF 提示。
- Git 敏感文件检查：仅跟踪 `.env.example` 与 `backend/.env.example`。

## Result

`COMPLETE — REV25 APPROVED QUEUE READY; no rev25 Kanban card was created by PMC.`
