# Progress: T4-010 Revision 41r3 Recovery and Hermes Cron Resume

## Status

`COMPLETE`

## Checklist

- [x] 读取 CURRENT、ROADMAP、Queue、Hermes status、rev41r3 Task/runtime remediation evidence。
- [x] 确认用户看到的是旧 run #173 terminal timeout，不是新 execution chain。
- [ ] 复验 installed runtime deadline/finalization、role contracts、patch 与 Gateway health。
- [ ] 核对 cron job、Kanban board 与旧 chain terminal 状态。
- [ ] 创建 rev41r4 Task 与 PMC continuation authorization。
- [ ] 更新 CURRENT、ROADMAP、Queue，发布唯一 fresh executable revision。
- [ ] 运行 consistency、artifact absence 与 `git diff --check` 验证。
- [x] 恢复 cron job并 read-back active 状态。

## Revision 41r4 Runtime Evidence

- [x] cron resumed active; 03:15 Supervisor run consumed rev41r4 Queue.
- [x] Coordinator `t_f2f5ea0d` run #174 completed in 107s with exact fresh children.
- [x] Reviewer `t_eb522d66` run #175 wrote provisional REVIEW before expensive checks.
- [x] Reviewer terminalized BLOCKED in 397s instead of timing out without REVIEW.
- [x] New bounded fingerprint: `REV41R4_MISSING_VIEWPORT_920X900_AND_375X812_BROWSER_VERIFICATION`.
- [ ] Calibrate verification cap from 24 to 48 with RED/GREEN regression while preserving soft deadline.
- [ ] Regenerate/deploy durable patch and verify Gateway/runtime contracts.
- [ ] Publish fresh browser-only review continuation and verify next cron consumption.

## Revision 41r5 Evidence

- [x] Reviewer `t_26fc11ff` run #177 completed PASS in 524s with both missing viewports, zero-request and NButton console evidence.
- [x] HANDOFF `t_b4e90e51` run #178 failed closed: `ROLE_BOUNDARY_VIOLATION: terminal` while attempting required SHA256 verification.
- [ ] Add workspace-bounded read-only `file_sha256` with RED/GREEN tests.
- [ ] Add `file_sha256` only to `HANDOFF_ONLY` policy; keep terminal forbidden.
- [ ] Deploy/verify patch, restart Gateway, publish fresh HANDOFF-only closure and verify artifact.
- [x] `file_sha256` deployed and verified; rev41r6 Reviewer `t_39e56326` PASS_REATTESTED.
- [x] rev41r6 HANDOFF `t_48326964` exposed missing read-only `search_files` policy with terminal still forbidden.
- [x] Add bounded `search_files` to HANDOFF_ONLY, deploy, and complete fresh rev41r7 HANDOFF closure.
- [x] rev41r7 Reviewer PASS_REATTESTED, HANDOFF run #184 completed HANDOFF_READY.
- [x] PMC fresh build/diff/hash/line-count verification passed; T4-010 PMC PASS.
