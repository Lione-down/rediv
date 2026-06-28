# T4-002 Unit C2 Revision 19 — PMC Runtime Fix Report Review

## Verdict

`PMC_RUNTIME_DIAGNOSTIC_INSUFFICIENT — STILL_INFRA_BLOCKED`

新增 `REPORT-RUNTIME-FIX-2026-06-28.md` 是分析报告，不是 remediation evidence。报告明确声明没有修改文件，也没有提供 post-fix tests 或 smokes；revision `-19` 保持 terminal infrastructure blocked，不发布 continuation。

## Findings

1. 报告没有 runtime diff、commit/hash、fresh regression command/result、Gateway restart evidence 或 post-fix card/run，因此未满足上一份 PMC escalation review 的解阻条件。
2. run `#113` 的已证事实仍是：worker 在约 5 秒内产生 plain-text response 后退出，没有写 terminal transition；dispatcher 在后续 reconciliation 将其记录为 `pid not alive`。
3. “`_spawn_handles` 中存在对应 Popen 且 `proc.poll()` 返回 `None`”没有直接 instrumentation、log 或 test 证据。报告后文也承认 handle 缺失、PID 不一致和 timing 均未排除，因此不能把 `proc.poll()` 失效写成已定位根因。
4. `psutil.Process(pid).exit_code()` 不能作为当前可执行方案；进程退出且没有保留可等待 handle 时，单凭 PID 通常无法可靠恢复 exit code。Windows 方案必须围绕受控 Popen handle 的 `wait()`/watcher、exit registry 和 deterministic terminal finalization 设计并验证。
5. 报告结论 `STILL_INFRA_BLOCKED` 与当前 Queue hold 一致；它不授权重派、旧 card 复用、attempt 增加或 fingerprint 清零。

## Required Runtime Owner Evidence

1. 实现 worker lifecycle finalizer：task 仍为 running 时，无论 plain text、invalid tool、provider failure、clean/nonzero exit，都必须写明确 terminal outcome；不得自动 complete。
2. 在 spawn 后由 retained Popen handle 的 watcher 调用 `wait()` 并原子写入 exit registry；Windows path 不得依赖事后仅凭 PID 猜 exit code。
3. 增加并执行 Windows regression tests，覆盖 clean/no-transition、nonzero、invalid-tool partial、rate-limit 与正常 `kanban_complete`。
4. 用全新 isolated cards 完成 3 次连续 `DISPATCH_ONLY` success smoke 和 1 次 negative smoke；negative path 必须快速得到 `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION`，不能退化为下一 tick 的 `pid not alive`。
5. 新报告必须附 sanitized runtime diff、tests、card/run evidence，并给出 `READY_FOR_CONTINUATION` 或 `STILL_INFRA_BLOCKED`。

## Human Decision

`NO`。这是 Hermes runtime implementation 与验证问题，不涉及产品方向、secret、付费资源或不可逆操作。

