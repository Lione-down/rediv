# Revid Executor Compatibility Prompt

该文件仅用于兼容旧 Task 引用，不再定义一个通用“Codex Executor”角色。

Revid 当前执行角色必须二选一：

- Backend、Database、Migration、External API：使用 `ai/prompts/hermes-revid-backend-soul.md`。
- Frontend、UI、Canvas：使用 `ai/prompts/hermes-revid-frontend-soul.md`。

共同规则：

1. 只执行 Human Owner/Codex PMC 批准并由 `revid-pm` 派发的一个 Task。
2. 读取 `AGENTS.md`、`REVID-MULTI-AGENT-OPERATING-MODEL.md`、CURRENT、Task、ADR 和目标 diff。
3. 编码前为当前 revision/attempt 创建独立 PLAN 与 PROGRESS。
4. 只修改 Allowed Files，不扩展 Scope、不改变 AC/contract、不混入无关重构。
5. 完成真实验证并创建当前 attempt 的 REPORT。
6. Executor 不创建 Reviewer/返工卡，不自行 PASS，不移动 Task 到 done，不领取下一 Task。

Task 未明确指定 Backend 或 Frontend profile 时，停止并交 Codex PMC 修正，不得自行猜测。

*最后更新：2026-06-24*
