# T4-002 Revision 19 — PMC Hermes Worker Finalization Fix Review

## Verdict

`PMC_RUNTIME_FIX_PASS — READY_FOR_CONTINUATION`

PMC 已独立证伪 `Popen.poll()` 假设、定位实际 `chat -q` finalization 缺口、实施 regression-first 修复，并完成 source/tests/runtime evidence chain。Hermes runtime health gate 通过。

## Acceptance

- worker clean/plain-text exit 不再留下 silent `running` card。
- task 已 terminal 时不二次改写。
- abnormal exits 有 retained-handle waiter 与 cross-platform registry。
- 3 个 fresh same-profile positive cards 完成并各创建一个 child。
- fresh negative card 在进程内直接 block 为 `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION`，没有 `pid not alive`。
- Gateway 已重启并加载修复；Revid cron 保持 paused。

## Boundary

本 verdict 不复活 revision `-19`，不授权旧 card retry，也不等于 Unit C2 business PASS。后续必须由 PMC 发布继承全部 fingerprints 的新 bounded continuation revision。

## Human Decision

`NO`。Runtime implementation 已在现有技术边界内解决。

