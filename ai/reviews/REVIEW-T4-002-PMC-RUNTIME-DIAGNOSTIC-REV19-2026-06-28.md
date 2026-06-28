# T4-002 Unit C2 Revision 19 — PMC Runtime Diagnostic Review

## Verdict

`PMC_RUNTIME_DIAGNOSTIC_REVIEW — STILL_INFRA_BLOCKED`

Unit C1 revision `-18` 已经 `PMC_PASS`，不需要再次验收。Unit C2 revision `-19` 不发布 continuation；新增 diagnostic 的 blocked 结论正确，但其“进程内部异常/60 秒 health-check timeout/card body”根因判断没有被直接证据支持。

## Unit C1 Final Acceptance Recheck

- PMC PASS：`ai/reviews/REVIEW-T4-002-PMC-UNIT-C1-REV18-PASS-2026-06-28.md`
- REPORT SHA-256：`23179EEB348C9DA72ECAB942F219F4FEB05EF5E5B74E43D626EDC3F2E2B5B071`
- Independent REVIEW SHA-256：`760CF8B3CE66BEF75DC68006C458AFFC82DD2CC7DCEB59C4D463C008B57D6034`
- canonical HANDOFF SHA-256：`38790AFF54675DAE2F42B04DE847ECACA62B7383C34CD32E79982E65424B3959`

以上证据 hash 未变化。Hermes execution status 中 `awaiting Codex PMC final acceptance` 是过期的 Hermes-owned 行，不重新打开已通过的验收。

## Fresh Direct Evidence

### Revision 19 run #113

- Card：`t_b493a47f`，无 child；Executor 从未创建。
- Kanban events：claimed → spawned PID `30648` → heartbeat → 60 秒后 `crashed` / `gave_up`。
- worker log 不是空白：Hermes 初始化完成，生成 session `20260628_061722_e572ce`，运行约 5 秒，0 次 tool call。
- profile agent log 证明 API call #1 正常完成：`finish_reason=stop`、`text_response`、response length `246`；随后 CLI 正常 cleanup。
- 因此当前证据更符合“模型只返回普通文本，worker 未调用 `kanban_complete` / `kanban_block` 后退出”，不支持 Python 初始化失败、segfault、OOM 或 card serialization failure。

### Smoke run #102

- Card `t_20945c04` 实际位于 `revid` board，不在 `revid-runtime-diagnostic` board。
- worker log 证明 exact tool policy 生效：`read_file` 与 `terminal` 被判为 unknown tool；三次 invalid tool call 后以 partial 停止。
- 该 worker 同样没有写 terminal Kanban transition，下一 dispatcher tick 才被记为 `pid not alive`。

### Windows exit-classification gap

安装 runtime source 的行为可解释错误分类：

- `_default_spawn` 返回 PID 后丢弃 `subprocess.Popen` handle。
- `_recent_worker_exits` 只由 `reap_worker_zombies()` 填充。
- `reap_worker_zombies()` 在 Windows 明确 no-op。
- 因而 Windows 上 `_classify_worker_exit(pid)` 无法获得 worker return code，通常只能得到 `unknown`，随后生成泛化的 `pid N not alive`。
- 恰好 60 秒来自 `kanban.dispatch_interval_seconds = 60` 的下一轮 liveness reconciliation，不是已经证明的 worker health-check timeout。

## Root Cause Classification

当前是两个相连的 runtime 缺陷：

1. `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION`：Kanban worker 在 task 仍为 running 时，以普通文本、partial 或其他非 lifecycle 结果结束，CLI 没有确保写入 `kanban_complete` / `kanban_block`。
2. `WINDOWS_WORKER_EXIT_STATUS_LOST`：dispatcher 在 Windows 丢失 Popen return code，把 clean/nonzero/partial exit 统一降级成 `pid not alive`，导致诊断信息错误且要等下一 60 秒 tick。

这不是 Unit C2 业务代码、MySQL test、Coordinator budget 或 card body 长度问题。

## Required Runtime Remediation

Hermes runtime owner 应完成以下最小修复：

1. 跨平台保留 worker exit result：持有 Popen handle 或启动 daemon watcher，记录 PID、return code、ended_at；Windows 不得依赖 `os.waitpid`。
2. 当 `HERMES_KANBAN_TASK` 存在且 worker 将退出，但 task 仍为 running 时，必须执行确定性收口：
   - 可以先发送一次明确 lifecycle finalize nudge；
   - 若仍未 transition，则自动 `kanban_block` 为 `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION`；
   - 禁止自动 `complete`，禁止把普通文本当作成功。
3. invalid-tool retry exhaustion、plain-text response、provider error 和 nonzero exit 必须写入结构化 run outcome；日志与 metadata 不得包含 secret。
4. `detect_crashed_workers` 必须区分 clean protocol violation、nonzero exit、rate limit、signal/forced termination 与 genuinely unknown exit。

## Verification Gate

修复报告必须包含：

- Windows 回归测试：clean exit/no transition、nonzero exit、invalid-tool partial、rate-limit、正常 `kanban_complete`。
- direct unit tests 证明 return code 在 Windows path 可被 classifier 读取。
- isolated board 上同 profile、同 exact `DISPATCH_ONLY` policy 连续 3 次成功 dispatch，每次只创建一个预期 child，并在 120 秒内 terminal。
- 1 次 negative smoke：模型返回普通文本或非法工具时，card 必须立即明确 blocked/protocol-violation，不得等待 60 秒后变成 `pid not alive`。
- fresh Gateway/dispatcher log、card/run JSON、worker log 和 test command/result；不得复用 `t_b493a47f`、`t_20945c04` 或旧 revision card。

## Queue Decision

- revision `-19` 继续 terminal，禁止重派、claim、promote、unblock 或 retry。
- 不增加 Coordinator budget，不通过新 revision 清零 fingerprint。
- 只有 runtime owner 输出 `READY_FOR_CONTINUATION` 且满足上述 verification gate，PMC 才考虑新的 bounded continuation revision。
- Human Decision Required：`NO`。

