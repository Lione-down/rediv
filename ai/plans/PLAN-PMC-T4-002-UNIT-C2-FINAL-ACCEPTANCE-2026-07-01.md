# PMC Plan — T4-002 Unit C2 Final Acceptance

## Objective

对 revision `-26` / lifecycle `-26r2` 执行最终验收，并在通过后发布下一个可独立验证的 Unit C3 bounded Task。

## Evidence and Success Criteria

1. 核对 Task、ADR-003、PLAN、PROGRESS、REPORT、Independent REVIEW、HANDOFF 与 execution status 属于同一 business revision / lifecycle continuation。
2. 核对实际 business commit 与 Allowed Files，确认 AC3 remediation 未越界。
3. 执行 fresh `py_compile`、4 个 scoped unit selectors 与 `git diff --check`；真实 MySQL 复跑仅在当前 PMC runtime 注入授权环境时执行。
4. 仅当 Reviewer 已独立完成真实 MySQL AC1/AC2/AC3/AC5、0 skip/0 mock、cleanup hard-fail 和安全检查时给出 `PMC_PASS`。
5. Unit C2 PASS 后不把 T4-002 误标为完成；创建只覆盖 conflict、FK orphan、partial rollback、consistency、cleanup visibility 的 Unit C3 Task，并最后发布唯一 Active Queue。

## Non-goals

- 不修改业务代码、migration、tests 或 Hermes execution status。
- 不复用 revision `-26` / `-26r1` / `-26r2` cards 或 idempotency keys。
- 不解锁 T4-003、T4-010、Unit D 或 Unit E。

