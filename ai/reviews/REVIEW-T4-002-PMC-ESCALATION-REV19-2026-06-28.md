# T4-002 Unit C2 Revision 19 — PMC Escalation Review

## Verdict

`PMC_RUNTIME_ESCALATION_REJECTED — REMEDIATION_NOT_EXECUTED`

Hermes 新建的 `ESCALATION-T4-002-REV19-WORKER-CRASH-2026-06-28.md` 没有执行上一轮 PMC 要求的 runtime remediation，也没有提供 fresh regression/smoke evidence。Revision `-19` 继续 terminal infrastructure blocked，不发布 continuation。

## Findings

1. escalation 中的 `94 tests + 3 positive smokes + 1 negative smoke` 是 revision `-18` 前的 thin-dispatcher policy 修复证据，不覆盖本轮新定位的 `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION` 与 `WINDOWS_WORKER_EXIT_STATUS_LOST`。
2. 没有新的 Hermes runtime patch、diff、test command/result、Gateway restart evidence 或 post-fix card/run。
3. “所有 crash 恰好 60 秒，因此是 health-check timeout”不成立。Direct profile log 证明 run `#113` 在约 5 秒内完成一次正常 API `text_response` 并执行 CLI cleanup；60 秒是下一次 dispatcher reconciliation interval。
4. `step_key=null`、`summary=null` 不等于 worker 没有输出。Worker log 和 profile agent log 已记录 session `20260628_061722_e572ce`、API call 与 plain-text response。
5. escalation 声称 smoke `t_20945c04` 使用 diagnostic board；direct `kanban show` 证明该 card 实际位于 `revid` board。其 worker log 显示 exact policy 拒绝非法工具后 partial exit，但没有写 terminal transition。
6. Card body、board serialization、OOM、segfault 和 job object 仍无直接证据，不得作为 continuation 依据。

## Required Next Action for Hermes Runtime Owner

必须实现而不是再次总结：

1. 在 Windows path 保留 detached worker 的 Popen return code，或使用 daemon watcher 写入跨平台 exit registry；不得依赖 Windows no-op 的 `os.waitpid`。
2. Worker 在 `HERMES_KANBAN_TASK` 存在但 task 仍为 running 时退出，必须确定性 `kanban_block` 为 `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION`；禁止自动 complete。
3. plain-text response、invalid-tool partial、provider failure、clean exit、nonzero exit、rate limit 必须写入可区分的 structured outcome。
4. 新增 Windows regression tests，并提供 fresh test command/result。
5. 使用全新的 isolated cards 完成 3 次连续 exact `DISPATCH_ONLY` success smoke，以及 1 次 plain-text/invalid-tool negative smoke。Negative smoke 必须立即得到明确 protocol blocked，不能等待下一 60 秒 tick 后出现 `pid not alive`。
6. 输出新的 remediation report，结论只能为 `READY_FOR_CONTINUATION` 或 `STILL_INFRA_BLOCKED`，并附 runtime diff、tests、card/run JSON 与 sanitized logs。

旧 `t_b493a47f`、`t_20945c04` 和历史 smoke 不得复用。不得增加 attempt、提高 budget 或清零 fingerprint。

## Human Decision

`NO`。这是 Hermes runtime implementation issue，不是产品、secret、付费资源或不可逆操作决策。

