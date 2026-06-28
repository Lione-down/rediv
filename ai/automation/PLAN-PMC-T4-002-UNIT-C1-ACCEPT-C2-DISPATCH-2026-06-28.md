# PMC Plan — T4-002 Unit C1 acceptance and Unit C2 dispatch

## Goal

完成 Unit C1 revision `-18` 最终验收，并在证据链通过后发布唯一的 Unit C2 revision `-19` executable Queue。

## Scope

1. 核对 Task、ADR-003、REPORT、Independent REVIEW、canonical HANDOFF、Git diff 与 Kanban card states。
2. 给出 Unit C1 `PMC_PASS` 或明确阻塞理由。
3. 若通过，更新 Unit C1、父 Task、CURRENT 与 ROADMAP。
4. 创建 Unit C2 bounded Task，仅执行 dry-run、full migration、second-run idempotency、source immutability 四项现有真实 MySQL tests。
5. 最后发布 Unit C2 revision `-19` Queue，并运行 `git diff --check`。

## Non-goals

- 不修改业务代码、migration、tests 或 Hermes execution status。
- 不创建、claim、promote、unblock、retry 任何 Kanban card。
- 不读取或输出 secret，不在 PMC 本地重跑 CREATE/DROP test database 的测试。
- 不执行 Unit C3、Unit D/E、T4-003 或 T4-010。

## Success Criteria

- Unit C1 verdict 与 REPORT/REVIEW/HANDOFF、实际 diff 和 card state 一致。
- Unit C2 Task 的 Scope、Allowed Files、Hard Gates、test selectors 和 profiles 完整。
- CURRENT、ROADMAP、父 Task、Unit Task 和 Queue 指向同一 revision `-19`。
- Queue 只有一个 active APPROVED revision，旧 failure fingerprints 全部继承。
- `git diff --check` 通过。
