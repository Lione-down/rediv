# PMC Plan — T4-002 Revision -07 Blocked Review

## Goal

审计 revision `phase4-wave2-recovery-dispatch-2026-06-24-07` 的终止执行链与 partial diff，决定 T4-002 是否进入唯一 business REWORK attempt 1，并保持项目事实源一致。

## Scope

- 只读核对 Queue、execution status、Task、ADR、PLAN、PROGRESS、runtime event、业务 diff 与可安全运行的验证。
- 写入 PMC REVIEW、Task、CURRENT、ROADMAP 与最后写入的 Queue revision。
- 保留并显式继承 revision `-07` 的 infrastructure failure fingerprint。

## Non-goals

- 不修改 migration script、tests 或其他业务代码。
- 不修改 Hermes execution status、Executor PLAN/PROGRESS/REPORT、Independent REVIEW、HANDOFF 或 Kanban。
- 不执行 CREATE/DROP DATABASE 或任何 destructive verification。

## Decision Criteria

1. 旧 execution chain 已处于终态，且不存在 REPORT、Independent REVIEW 或 HANDOFF。
2. partial diff 的缺陷可在既有 Scope/AC 内修复，不需要改变产品或重大 contract。
3. attempt 1 必须是本 Task 的最后一次 business REWORK；不得通过新 revision 清零旧 failure fingerprint。
4. 新 Queue 必须使用新 idempotency key，并明确 runtime 与测试语义 Hard Gates。

## Verification

- 两个业务 Python 文件 AST parse。
- secret 仅做 presence check，不读取值。
- missing-secret 专项测试入口的安全执行语义检查。
- Queue/Task/CURRENT/ROADMAP/review 路径一致性。
- UTF-8、`git diff --check` 与最终 evidence cursor。

