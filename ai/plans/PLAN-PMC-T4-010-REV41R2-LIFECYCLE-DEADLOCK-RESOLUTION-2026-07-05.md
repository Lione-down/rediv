# PMC Plan — T4-010 Rev41r2 Lifecycle Deadlock Resolution

## Goal

解除 rev41r1 的 circular runtime gate，以一个 fresh、bounded、可失败关闭的 `REVIEW_DISPATCH_ONLY` continuation 同时验证已部署的 `revid-pm` policy，并继续 revision 41 的 Independent Review/HANDOFF lifecycle。

## Root Cause

rev41r1 的 Resume Condition 要求 fresh same-profile child-creation proof，但 diagnostic 明确只有 PMC 先授权 fresh lifecycle chain 才能生成该 proof；两者互相依赖，导致 Queue 永久 terminal。

## Scope

- 创建 lifecycle-only Task `T4-010-UNIT-B-REV41R2`。
- 记录 PMC deadlock-resolution review。
- 更新 CURRENT、ROADMAP 和 revision 41 Task 状态。
- 最后发布唯一 executable rev41r2 Queue。

## Non-goals

- 不修改业务代码、migration、tests 或 Executor artifacts。
- 不修改 `HERMES-EXECUTION-STATUS.md`。
- 不复用、retry、claim、promote 或 unblock rev41r1 card。
- 不清零 `REV41R1_REVID_PM_SEARCH_FILES_TOOL_BOUNDARY_VIOLATION`。

## Success Criteria

1. rev41r2 使用 fresh revision、Task 和 idempotency keys，并继承 rev41r1 fingerprint。
2. 只授权一个 `revid-pm / REVIEW_DISPATCH_ONLY` Coordinator 创建一个 Reviewer 和一个依赖 Reviewer PASS 的 HANDOFF stage。
3. 任一 policy、card contract、Reviewer 或 HANDOFF gate 失败即 terminal BLOCKED，不自动 retry 为新 revision。
4. Queue/Task/CURRENT/ROADMAP 一致，且 `git diff --check` 通过。

## Progress

- [x] 根因与现有 evidence cursor 已确认。
- [x] 创建 PMC review 与 rev41r2 Task。
- [x] 更新 CURRENT、ROADMAP 和 revision 41 Task。
- [x] 发布 rev41r2 Queue。
- [x] 运行 read-back、role-contract regression 与 diff preflight（8 passed、ROLE_CONTRACTS_OK、diff check exit 0）。
