# PMC Plan — T4-002 Unit C2 Revision 20 Continuation

## Goal

在 revision `-19` terminal chain 不可复用、Hermes worker finalization remediation 已通过 PMC 验收的前提下，发布一个新的 bounded Unit C2 continuation revision。

## Scope

1. 核对 revision `-19` 已 terminal，且没有 active T4-002 execution chain。
2. 记录 `PMC_CONTINUATION_APPROVED`，继承全部历史 failure fingerprints。
3. 创建 revision `-20` Task，仅授权原 Unit C2 四个真实 MySQL selectors。
4. 同步 parent Task、CURRENT、ROADMAP，并最后发布唯一 APPROVED Queue revision。
5. 运行 `git diff --check` 与治理文档一致性检查。

## Non-goals

- 不修改业务代码、migration、tests 或 Executor artifacts。
- 不修改 `HERMES-EXECUTION-STATUS.md`。
- 不创建、claim、promote、unblock、retry 或复用任何 Hermes card。
- 不读取 secret，不访问任何数据库。

## Success Criteria

- revision `-20` Task、项目状态与 Queue 的 Scope、profile、budget、hard gates 一致。
- Queue 只有一个 executable `APPROVED` revision，revision `-19` 明确保持 terminal historical chain。
- business attempt 仍为 `1`，`REV19_COORDINATOR_CRASH` 与全部历史 fingerprints 均被继承。
- `git diff --check` 通过。
