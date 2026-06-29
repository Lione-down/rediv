# PLAN — T4-002 Revision 23 Supervisor Body Transport Fix

## Objective

修复 Hermes Scheduled Supervisor 在 MSYS Bash terminal 中错误嵌套 PowerShell、随后降级为 `--body "@TASK"` 的 transport contract 缺陷，并以 fresh revision `-24` 重新发布原 rev23 AC3 remediation scope。

## Root-Cause Hypothesis

Cron session `cron_72a21342a164_20260629_094502` 的原始 tool calls 证明：Supervisor 使用 Bash double-quoted `powershell -Command`，Bash 在 PowerShell 启动前展开 `$hermesExe`、`$env` 和 `$body`；命令失败后，Supervisor 显式执行只含 `--body "@...REV23.md"` 的 fallback。CLI 未截断完整 body，因为完整 body 从未传入 create。

## Scope

- 修正 `ai/prompts/hermes-scheduled-supervisor.md` 的 Windows/MSYS transport instructions。
- 增加 project-owned regression guard，验证 prompt 不允许 task-reference-only fallback，并验证 Bash→PowerShell→Windows argv 可保留 multiline marker。
- 写 PMC runtime review，收口 revision `-23` 为 terminal infrastructure failure。
- 创建 revision `-24` Task，保持 rev23 business Scope/AC 不变，仅使用 fresh revision/idempotency。
- 同步 parent Task、CURRENT、ROADMAP、Queue；Queue 最后写入。

## Non-goals

- 不删除、archive、unblock、retry 或复用 card `t_1dea37a2`。
- 不修改 `HERMES-EXECUTION-STATUS.md`、Kanban DB、业务代码、migration 或 tests。
- 不读取或输出 secret，不触碰业务数据库。
- 不修改 Hermes CLI parser；现有 parser 和 direct PowerShell argv baseline 已证明可保留 multiline body。

## Success Criteria

1. Root cause is backed by raw cron session tool-call evidence and lower-layer parser/argv probes.
2. Supervisor prompt uses a Bash-safe PowerShell invocation or equivalent file transport and forbids any task-reference-only fallback.
3. Regression guard fails if the prompt reintroduces `--body "@TASK"` fallback or unsafe double-quoted nested PowerShell.
4. Fixed transport probe preserves `Action: DISPATCH_ONLY` as a standalone line.
5. Revision `-23` is terminal; revision `-24` is the sole executable Queue with inherited fingerprints and fresh keys.
6. `git diff --check` passes and business-file diff remains empty.
