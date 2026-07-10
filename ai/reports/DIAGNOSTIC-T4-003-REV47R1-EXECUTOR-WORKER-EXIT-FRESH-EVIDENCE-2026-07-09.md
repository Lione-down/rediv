# DIAGNOSTIC-T4-003-REV47R1-EXECUTOR-WORKER-EXIT-FRESH-EVIDENCE-2026-07-09

## 结论

`STILL_INFRA_BLOCKED`

## 范围

- Queue revision: `phase4-wave2-t4-003-mysql-runtime-cutover-remediation-2026-07-09-47r1`
- Task: `T4-003`
- Coordinator: `t_50707802`, run `#208`
- Executor: `t_dfaef3d8`, run `#209`
- Failure fingerprint: `REV47R1_EXECUTOR_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION_NO_REPORT`
- 本轮 fresh diagnostic 时间：`2026-07-09T23:16:49+08:00`

## 新采集的非 secret 运行证据

### 1. deterministic gate 与状态一致性

- `python ai/runtime/reconcile-hermes-execution-status.py --check` 首次返回 `STATUS_MISMATCH`，仅包含两个可 apply 差异：
  - `Task SHA256`: `FAE13FDD921F5B9BE5D0F221F1A573D219F7661720163E67AB344DE703D18E25` → `4BF65DBC3714FAD6634F407463AB7A8A6104C21FC2C2A6F36D65F04DAB3B086A`
  - `Queue SHA256`: `2B51065217089CA0874502F86258DE532D4BA0CC64BBBD6E551BA1E10D1C07AA` → `34E337808B9DABB6445066B9222C4D41A73CC3C4672162C6781F2209952107E0`
- 按 deterministic gate 只执行一次 `python ai/runtime/reconcile-hermes-execution-status.py --apply`，随后再次 `--check` 返回 `STATUS_OK`。
- 这只修正 Hermes-owned status 的 Task/Queue hash；未修改 Queue、Task、业务代码或 Kanban。

### 2. Queue 与 PMC diagnostic review hash 复核

- `ai/automation/HERMES-AUTO-QUEUE.md` 的 canonical `## Active Wave` table 标记：
  - Revision: `phase4-wave2-t4-003-mysql-runtime-cutover-remediation-2026-07-09-47r1`
  - Status: `BLOCKED - NOT EXECUTABLE`
  - Action: `NONE — terminal evidence only`
  - Runtime Diagnostic SLA: `SATISFIED - diagnostic verdict STILL_INFRA_BLOCKED`
- SHA256 复核：
  - `ai/reviews/REVIEW-T4-003-PMC-RUNTIME-DIAGNOSTIC-REV47R1-2026-07-09.md` = `0DBD1FFA6E9A13A6EAE7BE9ED147817FA0CE4E773915B9B95DECE23C77305F1D`
  - `ai/reports/DIAGNOSTIC-T4-003-REV47R1-EXECUTOR-WORKER-EXIT-2026-07-09.md` = `C0A5744B17F43FE502DE3C3CCB683EC049F8CE0DB1E2D8B4184104917EFCFC1F`
  - `ai/automation/HERMES-AUTO-QUEUE.md` = `34E337808B9DABB6445066B9222C4D41A73CC3C4672162C6781F2209952107E0`
  - `ai/tasks/todo/TASK-T4-003.md` = `4BF65DBC3714FAD6634F407463AB7A8A6104C21FC2C2A6F36D65F04DAB3B086A`

### 3. Kanban card 与 run 证据

`hermes kanban --board revid show t_dfaef3d8` 与 `runs t_dfaef3d8 --json` 显示：

- Executor card `t_dfaef3d8` 状态为 `blocked`。
- parent 为 `t_50707802`。
- run `#209`：
  - profile: `revid-backend`
  - status/outcome: `blocked`
  - started_at: `1783605908`
  - ended_at: `1783607061`
  - duration: `1153s`
  - summary: `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION: worker returned without calling kanban_complete or kanban_block`
  - error: `null`
  - metadata: `null`
  - worker_pid in runs JSON: `null`
- `show` events 记录 run `#209` 曾 spawn `pid 33476`，但 `ps -W | grep -E '33476|PID'` 只返回表头，未发现该 PID 仍在运行。

`hermes kanban --board revid show t_50707802` 与 `runs t_50707802 --json` 显示：

- Coordinator `t_50707802` 状态为 `done`。
- run `#208` completed，duration `106s`。
- result/summary: `DISPATCH_COMPLETE: child created and parent committed atomically`。
- metadata: `{ "atomic_dispatch": true, "child_id": "t_dfaef3d8" }`。

### 4. 新发现的实际 Executor session 与日志

旧 diagnostic 写的 `Executor session: 20260709_220308_cac36d` 实际对应 `revid-dispatcher` Coordinator session。fresh evidence 显示真正的 `revid-backend` Executor session 是：

`20260709_220509_df101b`

证据：

- `C:/Users/mkd/AppData/Local/hermes/kanban/boards/revid/logs/t_dfaef3d8.log` 行 281-285：
  - `Resume this session with: hermes --resume 20260709_220509_df101b -p revid-backend`
  - `Session: 20260709_220509_df101b`
- `C:/Users/mkd/AppData/Local/hermes/profiles/revid-backend/logs/agent.log` 从行 11715 开始记录该 session：
  - `2026-07-09 22:05:12,657` conversation turn: `work kanban task t_dfaef3d8`
  - `2026-07-09 22:06:11,122` session snapshot created: `session=0c8d42315fb6`, cwd=`D:\works\codexWorks\project_revid`
  - `2026-07-09 22:11:30,567` provider API call failed once，HTTP 500 upstream error，随后 retry 成功
  - `2026-07-09 22:22:00,111` terminal command failed: `/usr/bin/bash: line 3: ../.venv/Scripts/python.exe: No such file or directory`, exit `127`
  - `2026-07-09 22:23:09,485` terminal command returned test errors，输出开头为 `EEEEEEEEEEEEEE`，错误行指向 `tests.test_mysql_runtime_cutover.TestEngineReferenceFixRev47R1...`
  - `2026-07-09 22:24:21,047` API call #34 completed
  - `2026-07-09 22:24:21,084` conversation loop: `Empty follow-up after tool calls — using prior turn content as final response`
  - `2026-07-09 22:24:21,087` turn ended: `reason=fallback_prior_turn_content`, `api_calls=34/90`, `tool_turns=33`, `response_len=50`, session=`20260709_220509_df101b`
  - `2026-07-09 22:24:21,327` CLI cleanup called memory shutdown

### 5. stdout/stderr、stack、exit/finalization 可见性

- Kanban card log `t_dfaef3d8.log` 保留了工具摘要与 diff 片段，但不包含完整 stdout/stderr tail 或完整 test traceback。
- `C:/Users/mkd/AppData/Local/hermes/profiles/revid-backend/logs/errors.log` 仅保留截断后的 terminal error 摘要；第 659 行的 unittest failure 内容在日志中被截断。
- 未发现以 `20260709_220509_df101b` 命名的独立 transcript 文件。
- 本轮可以确认 finalization 相关事实：agent loop 在最后一次 API call 后遇到 `Empty follow-up after tool calls`，使用 prior turn content 作为 final response，进程 cleanup 正常执行；但 Worker 没有调用 `kanban_complete` 或 `kanban_block`，因此 Gateway 将 run 标为 `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION`。
- 精确 OS process exit code 未在 Kanban runs JSON、card log、profile agent log 或 errors.log 中暴露；可见 run outcome 仍是 Kanban 层 `blocked`。

### 6. Executor artifact 与 REPORT 状态

- `ai/tasks/doing/TASK-T4-003-REV47R1-PLAN.md` 存在，mtime 为 `2026-07-09 22:15:58 +0800`。
- `ai/tasks/doing/TASK-T4-003-REV47R1-PROGRESS.md` 存在，mtime 为 `2026-07-09 22:17:11 +0800`。
- `ai/reports/REPORT-T4-003-REV47R1.md` 不存在。
- `t_dfaef3d8.log` 显示 Executor 已修改 `backend/database.py`、`backend/tests/test_mysql_runtime_cutover.py` 以及 PLAN/PROGRESS，但未到 REPORT 写入阶段。
- `git status --short` 当前显示这些项目事实源和 runtime evidence 文件存在未提交变化；本 diagnostic 不改变业务代码，不回滚、不清理、不修改 Executor 产物。

## 诊断判断

1. Coordinator dispatch path 已证明正常：`t_50707802` 完成 atomic dispatch，并创建唯一 Executor child `t_dfaef3d8`。
2. Executor session 现已定位为 `20260709_220509_df101b`，旧 diagnostic 中把 Coordinator session 当作 Executor session 是证据缺口。
3. Executor 并非无日志退出；profile agent log 证明它进行了 34 次 API call、33 轮 tool turns，执行到测试阶段，并在最后一次工具调用后出现 `Empty follow-up after tool calls` / `fallback_prior_turn_content`。
4. 根因仍未完全闭环：可见 finalization path 没有把 final response 转为 `kanban_block` 或 `kanban_complete`；Kanban 仍只能记录泛化的 `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION`。
5. 仍缺少完整 stdout/stderr tail、完整 unittest traceback、精确 OS process exit code、完整 session transcript tail 和明确 finalization trace。因此当前证据不足以证明 safe continuation path 已恢复。
6. `REPORT-T4-003-REV47R1.md` 缺失，rev47r1 不能进入 `REPORT_READY`、Independent Review、HANDOFF、PMC PASS、T4-004 或 T4-005。

## Required Fix / 下一步建议

- 保持 rev47r1 terminal/non-executable；不要 redispatch、retry、claim、promote、unblock、reparent、delete、archive 或复用 `t_50707802` / `t_dfaef3d8`。
- Hermes runtime owner 需要修复或增强 worker finalization/output capture：当 agent loop 出现 `Empty follow-up after tool calls` / `fallback_prior_turn_content` 时，应产生可诊断的 terminal block 或保留足够的 transcript/stdout/stderr/exit evidence，而不是只落到泛化 no-terminal-transition。
- 若 PMC 未来授权 fresh continuation，必须继承 `REV47R1_EXECUTOR_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION_NO_REPORT`，且必须先证明 finalization/exit handling 可返回明确 terminal transition。

## 禁止动作确认

本轮未 redispatch rev47r1，未 claim/promote/unblock/retry/reparent/delete/archive `t_50707802` 或 `t_dfaef3d8`，未创建 Reviewer/HANDOFF，未修改业务代码、Task、Queue、CURRENT、ROADMAP、PMC REVIEW、Executor REPORT、Independent REVIEW 或 HANDOFF，未读取 `.env`，未输出 secret，未执行 destructive `revid_db` 操作。
