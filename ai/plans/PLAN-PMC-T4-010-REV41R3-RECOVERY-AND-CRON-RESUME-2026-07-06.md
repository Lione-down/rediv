# Plan: T4-010 Revision 41r3 Recovery and Hermes Cron Resume

## Objective

收口 revision 41r3 的旧 Reviewer timeout，确认 deadline-aware finalization 修复仍部署有效，发布一个 fresh bounded review-only continuation，并恢复 Revid Hermes Scheduled Supervisor cron，使下一轮从新 revision 正常推进。

## Root Cause

Revision 41r3 Reviewer run #173 在 1800 秒 hard limit 内执行了 77 次串行 model API call，API latency 累计 1620.9 秒；旧 runtime 没有 soft deadline、verification-call cap 或提前 REVIEW checkpoint，导致 hard kill 前未写 Independent REVIEW verdict。当前 cron 上报的是该旧终态，不是新的 Reviewer timeout。

## Scope

- 复验 installed Hermes 的 Reviewer deadline/finalization 修复、role contracts 与 cron/Gateway health。
- 记录 rev41r3 terminal closure，不复用旧 cards/runs/keys。
- 创建 fresh `T4-010-UNIT-B-REV41R4` review lifecycle Task。
- 更新 CURRENT、ROADMAP、PMC REVIEW 与 HERMES-AUTO-QUEUE，最后发布唯一 executable Queue revision。
- 恢复 cron job `72a21342a164`，验证 scheduler/job 状态。

## Non-goals

- 不修改业务代码、revision 41 REPORT/evidence 或 acceptance criteria。
- 不修改 Hermes-owned `HERMES-EXECUTION-STATUS.md`。
- 不 retry、unblock、claim、promote、reparent 或复用 rev41r3 cards。
- 不创建或操作 Hermes Kanban card；下一轮由 Scheduled Supervisor 消费新 Queue。

## Success Criteria

1. Deadline/finalization targeted tests、project runtime tests、role verifier 与 patch classifier 通过。
2. rev41r3 保持 terminal，fingerprint `REV41R3_REVIEWER_TIMEOUT_WITHOUT_REVIEW` 被新 revision 继承。
3. 仅一个 fresh review-only Queue 为 executable，Task/revision/profile/keys/Stop After 一致。
4. 新 revision 使用 fresh Coordinator/Reviewer/HANDOFF keys，禁止旧 card reuse 与 business writes。
5. `git diff --check` 通过，Independent REVIEW/HANDOFF 在 dispatch 前不存在。
6. Revid cron job 恢复为 active，schedule 保持 `15,45 * * * *`；不在本轮手工触发 card 创建。

## Rollback

若 runtime 验证、Queue consistency 或 cron health 任一失败，保持 cron paused/non-dispatch，Queue 不发布 executable revision，并记录准确 blocker。若 Queue 已发布但 cron resume 失败，Queue 保留等待恢复，不手工创建 card。

## Runtime Calibration Amendment — Revision 41r4 Evidence

Fresh rev41r4 Reviewer run #175 proved the original no-verdict timeout fixed: provisional REVIEW was written at 03:22 and the card terminalized BLOCKED at 397 秒. It also proved the `24` verification-call cap is under-calibrated for the real scope: static/build/hash verification plus one viewport consumed the full cap, leaving 920x900、375x812 and zero-request browser proof incomplete.

The bounded correction is to raise the Reviewer verification cap from `24` to `48` while retaining the independent 1200-second soft deadline and 600-second finalization reserve. The next continuation is restricted to the missing browser verification and final review consolidation; completed static/build/hash checks need not be repeated except for freshness guards.

## HANDOFF Hash Capability Amendment — Revision 41r5 Evidence

Rev41r5 Reviewer completed PASS in 524 秒, but dependent HANDOFF run #178 failed closed because its contract requires real REPORT/REVIEW SHA256 while `HANDOFF_ONLY` forbids `terminal` and exposes no dedicated hash tool.

Add a read-only `file_sha256(path)` tool that accepts only regular files within the task workspace and applies the existing Hermes read-block guard. Authorize it only for `revid-pm / HANDOFF_ONLY`; keep `terminal`, process, browser, network and arbitrary code forbidden. Verify with path-boundary and digest regressions before a fresh HANDOFF-only continuation.
