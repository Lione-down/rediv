# PMC Plan — T4-002 Final Attempt Infrastructure Block

## Goal

审计 revision `phase4-wave2-final-rework-2026-06-25-08` 的 terminal execution event，判定是否具备验收、继续执行或阻塞条件，并保持 Task、CURRENT、ROADMAP 与 Queue 一致。

## Scope

- 只读核对 Queue、execution status、Task、ADR、revision `-08` PLAN/PROGRESS、allowed-file diff 与可安全运行的验证。
- 写入 PMC REVIEW、Task、CURRENT、ROADMAP 与最后写入的非 executable Queue revision。
- 保留并显式继承 infrastructure 与 business failure fingerprints。

## Non-goals

- 不修改 migration script、tests 或其他业务代码。
- 不修改 Hermes execution status、Executor PLAN/PROGRESS/REPORT、Independent REVIEW、HANDOFF 或 Kanban。
- 不执行 CREATE/DROP DATABASE 或任何 destructive verification。
- 不创建 attempt 2，不通过新 revision 清零 attempt ordinal 或 failure fingerprint。

## Decision Criteria

1. revision `-08` execution chain 已处于 terminal blocked，且 process retry 已耗尽。
2. 当前不存在 REPORT、Independent REVIEW 或 HANDOFF，不能进入 PMC acceptance。
3. partial diff 的静态声明不能代替真实 MySQL 验证；已发现的可复现语义缺口必须保留为后续修复条件。
4. 相同 runtime failure 再次出现时保持 infrastructure blocked；只有新的 runtime health / sustained-run 证据才允许 PMC 考虑 attempt 1 continuation。

## Verification

- 两个业务 Python 文件 AST parse。
- `git status --short`、`git diff --stat`、`git diff --name-only`、`git rev-parse HEAD`。
- source validation 顺序与 cleanup failure test binding 的静态语义检查。
- Queue/Task/CURRENT/ROADMAP/review 路径一致性。
- strict UTF-8 与 `git diff --check`。
